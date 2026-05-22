const db = require('../config/database');

exports.getAdminOverview = async (req, res) => {
    try {
        // 1. Total Users
        const [userCount] = await db.execute('SELECT COUNT(*) as total FROM users');

        // 2. Count completed listing packages
        const [packageCount] = await db.execute(
            "SELECT COUNT(*) as total FROM listing_payments WHERE payment_type = 'package' AND status = 'completed'"
        );

        // 3. Count completed premium services & banner ads
        const [serviceCount] = await db.execute(
            "SELECT COUNT(*) as total FROM listing_payments WHERE payment_type IN ('premium_service', 'banner_ad') AND status = 'completed'"
        );

        // 4. Total Revenue = Monetization + Booking Commissions
        const [monetizationRevenue] = await db.execute(
            "SELECT SUM(amount) as total FROM listing_payments WHERE status = 'completed'"
        );

        const [commissionRevenue] = await db.execute(
            "SELECT SUM(commission_amount) as total FROM bookings WHERE deposit_amount > 0 AND status = 'confirmed'"
        );

        const totalRevenue = (parseFloat(monetizationRevenue[0].total) || 0) + (parseFloat(commissionRevenue[0].total) || 0);

        // 5. Recent Transactions (System-wide: Monetization + Booking Deposits) - limited preview
        const [monetizationTxs] = await db.execute(`
            SELECT
                p.payment_id as id,
                p.amount as amount,
                0 as commission_amount,
                p.payment_type as type,
                p.status,
                p.created_at,
                u.full_name,
                u.role,
                l.title as detail,
                'monetization' as source
            FROM listing_payments p
            JOIN users u ON p.user_id = u.user_id
            LEFT JOIN room_listings l ON p.listing_id = l.listing_id
            ORDER BY p.created_at DESC
            LIMIT 10
        `);

        const [bookingTxs] = await db.execute(`
            SELECT
                b.booking_id as id,
                b.deposit_amount as amount,
                b.commission_amount as commission_amount,
                'booking_deposit' as type,
                b.status,
                b.created_at,
                u.full_name,
                'tenant' as role,
                CONCAT('Phòng ', r.room_number, ' - ', bl.name) as detail,
                'booking' as source
            FROM bookings b
            JOIN users u ON b.tenant_id = u.user_id
            JOIN rooms r ON b.room_id = r.room_id
            JOIN buildings bl ON r.building_id = bl.building_id
            WHERE b.deposit_amount > 0
            ORDER BY b.created_at DESC
            LIMIT 10
        `);

        const allTransactions = [...monetizationTxs, ...bookingTxs]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10);

        res.json({
            stats: {
                totalUsers: userCount[0].total,
                totalPackages: packageCount[0].total,
                totalServices: serviceCount[0].total,
                totalRevenue: totalRevenue
            },
            recentTransactions: allTransactions
        });
    } catch (error) {
        console.error('Error fetching admin statistics:', error);
        res.status(500).json({ message: 'Lỗi tải thống kê hệ thống', error: error.message });
    }
};

// ===== PAGINATED TRANSACTIONS LIST =====
exports.getTransactions = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            type = '',
            status = '',
            sortBy = 'created_at',
            sortOrder = 'DESC',
            search = '',
            dateFrom = '',
            dateTo = '',
        } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;

        const validSortCols = ['created_at', 'amount', 'type', 'status', 'full_name'];
        const sortCol = validSortCols.includes(sortBy) ? sortBy : 'created_at';
        const sortDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // ── Sort expression for the outer subquery ──
        const outerSort = sortCol === 'full_name' ? 'full_name'
            : sortCol === 'type' ? 'type'
            : sortCol === 'status' ? 'status'
            : sortCol === 'amount' ? 'amount'
            : 'created_at';

        // ── Case 1: Filter by booking_deposit only → query bookings table only ──
        if (type === 'booking_deposit') {
            const cond = [];
            const params = [];

            cond.push('b.deposit_amount > 0');
            if (status) { cond.push('b.status = ?'); params.push(status); }
            if (search.trim()) { cond.push('u.full_name LIKE ?'); params.push(`%${search.trim()}%`); }
            if (dateFrom) { cond.push('b.created_at >= ?'); params.push(dateFrom); }
            if (dateTo) { cond.push('b.created_at <= ?'); params.push(`${dateTo} 23:59:59`); }

            const whereStr = cond.length ? `WHERE ${cond.join(' AND ')}` : '';

            const [countRows] = await db.execute(
                `SELECT COUNT(*) as total FROM bookings b
                 JOIN users u ON b.tenant_id = u.user_id
                 JOIN rooms r ON b.room_id = r.room_id
                 JOIN buildings bl ON r.building_id = bl.building_id
                 ${whereStr}`,
                params
            );
            const total = countRows[0]?.total || 0;

            const [rows] = await db.execute(
                `SELECT b.booking_id as id, b.deposit_amount as amount, b.commission_amount,
                        'booking_deposit' as type, b.status, b.created_at,
                        u.full_name, 'tenant' as role,
                        CONCAT('Phòng ', r.room_number, ' - ', bl.name) as detail, 'booking' as source
                 FROM bookings b
                 JOIN users u ON b.tenant_id = u.user_id
                 JOIN rooms r ON b.room_id = r.room_id
                 JOIN buildings bl ON r.building_id = bl.building_id
                 ${whereStr}
                 ORDER BY ${sortCol === 'amount' ? 'b.deposit_amount' : sortCol === 'status' ? 'b.status' : 'b.created_at'} ${sortDir}
                 LIMIT ${limitNum} OFFSET ${offset}`,
                params
            );

            const totalPages = Math.ceil(total / limitNum);
            return res.json({
                transactions: rows,
                pagination: { page: pageNum, limit: limitNum, total, totalPages, hasNext: pageNum < totalPages, hasPrev: pageNum > 1 }
            });
        }

        // ── Case 2: Monetization types (or all/no type) + optional status ──
        // When status filter is set, also include bookings; otherwise bookings only show when no type selected
        const includeBookings = !!status || !type;

        const monCond = [];
        const monParams = [];

        if (type) { monCond.push('p.payment_type = ?'); monParams.push(type); }
        if (status) { monCond.push('p.status = ?'); monParams.push(status); }
        if (search.trim()) { monCond.push('u.full_name LIKE ?'); monParams.push(`%${search.trim()}%`); }
        if (dateFrom) { monCond.push('p.created_at >= ?'); monParams.push(dateFrom); }
        if (dateTo) { monCond.push('p.created_at <= ?'); monParams.push(`${dateTo} 23:59:59`); }

        const monWhere = monCond.length ? `WHERE ${monCond.join(' AND ')}` : '';

        // ── Count ──
        let countSql;
        let countParams;

        if (includeBookings) {
            const bookCond = ['b.deposit_amount > 0'];
            const bookParams = [];
            if (status) { bookCond.push('b.status = ?'); bookParams.push(status); }
            if (search.trim()) { bookCond.push('u.full_name LIKE ?'); bookParams.push(`%${search.trim()}%`); }
            if (dateFrom) { bookCond.push('b.created_at >= ?'); bookParams.push(dateFrom); }
            if (dateTo) { bookCond.push('b.created_at <= ?'); bookParams.push(`${dateTo} 23:59:59`); }
            const bookWhere = bookCond.length ? `WHERE ${bookCond.join(' AND ')}` : '';

            countSql = `SELECT COUNT(*) as total FROM (
                            SELECT p.payment_id FROM listing_payments p
                            JOIN users u ON p.user_id = u.user_id ${monWhere}
                            UNION ALL
                            SELECT b.booking_id FROM bookings b
                            JOIN users u ON b.tenant_id = u.user_id
                            JOIN rooms r ON b.room_id = r.room_id
                            JOIN buildings bl ON r.building_id = bl.building_id
                            ${bookWhere}
                        ) AS tx_count`;
            countParams = [...monParams, ...bookParams];
        } else {
            countSql = `SELECT COUNT(*) as total FROM listing_payments p
                        JOIN users u ON p.user_id = u.user_id ${monWhere}`;
            countParams = monParams;
        }

        const [countRows] = await db.execute(countSql, countParams);
        const total = countRows[0]?.total || 0;

        // ── Data ──
        let dataSql;
        let dataParams;

        const sortExpr = sortCol === 'full_name' ? 'full_name'
            : sortCol === 'amount' ? 'amount'
            : sortCol === 'status' ? 'status'
            : sortCol === 'type' ? 'type'
            : 'created_at';

        if (includeBookings) {
            const bookCond = ['b.deposit_amount > 0'];
            const bookParams = [];
            if (status) { bookCond.push('b.status = ?'); bookParams.push(status); }
            if (search.trim()) { bookCond.push('u.full_name LIKE ?'); bookParams.push(`%${search.trim()}%`); }
            if (dateFrom) { bookCond.push('b.created_at >= ?'); bookParams.push(dateFrom); }
            if (dateTo) { bookCond.push('b.created_at <= ?'); bookParams.push(`${dateTo} 23:59:59`); }
            const bookWhere = bookCond.length ? `WHERE ${bookCond.join(' AND ')}` : '';

            dataSql = `SELECT * FROM (
                            SELECT p.payment_id as id, p.amount, 0 as commission_amount,
                                   p.payment_type as type, p.status, p.created_at,
                                   u.full_name, u.role, l.title as detail, 'monetization' as source
                            FROM listing_payments p
                            JOIN users u ON p.user_id = u.user_id
                            LEFT JOIN room_listings l ON p.listing_id = l.listing_id
                            ${monWhere}
                            UNION ALL
                            SELECT b.booking_id as id, b.deposit_amount as amount, b.commission_amount,
                                   'booking_deposit' as type, b.status, b.created_at,
                                   u.full_name, 'tenant' as role,
                                   CONCAT('Phòng ', r.room_number, ' - ', bl.name) as detail, 'booking' as source
                            FROM bookings b
                            JOIN users u ON b.tenant_id = u.user_id
                            JOIN rooms r ON b.room_id = r.room_id
                            JOIN buildings bl ON r.building_id = bl.building_id
                            ${bookWhere}
                        ) AS tx
                        ORDER BY ${sortExpr} ${sortDir}
                        LIMIT ${limitNum} OFFSET ${offset}`;
            dataParams = [...monParams, ...bookParams];
        } else {
            dataSql = `SELECT p.payment_id as id, p.amount, 0 as commission_amount,
                              p.payment_type as type, p.status, p.created_at,
                              u.full_name, u.role, l.title as detail, 'monetization' as source
                       FROM listing_payments p
                       JOIN users u ON p.user_id = u.user_id
                       LEFT JOIN room_listings l ON p.listing_id = l.listing_id
                       ${monWhere}
                       ORDER BY ${sortCol === 'full_name' ? 'u.full_name' : sortCol === 'amount' ? 'p.amount' : sortCol === 'status' ? 'p.status' : sortCol === 'type' ? 'p.payment_type' : 'p.created_at'} ${sortDir}
                       LIMIT ${limitNum} OFFSET ${offset}`;
            dataParams = monParams;
        }

        const [rows] = await db.execute(dataSql, dataParams);

        const totalPages = Math.ceil(total / limitNum);
        res.json({
            transactions: rows,
            pagination: { page: pageNum, limit: limitNum, total, totalPages, hasNext: pageNum < totalPages, hasPrev: pageNum > 1 }
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Lỗi tải danh sách giao dịch', error: error.message });
    }
};
