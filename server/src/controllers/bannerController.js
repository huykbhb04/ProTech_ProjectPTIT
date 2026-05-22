const db = require('../config/database');

exports.createBannerRequest = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const landlordId = req.user.user_id;
        const { listing_id, type, image_url, duration_days } = req.body;

        if (!listing_id || !image_url) {
            throw new Error('Vui lòng chọn tin đăng và chọn ảnh Banner.');
        }

        if (!duration_days || duration_days < 1) {
            throw new Error('Số ngày chạy quảng cáo phải lớn hơn 0.');
        }

        // Lấy giá price_per_day từ bảng premium_services (dựa trên type truyền lên tương ứng với badge_type)
        const [services] = await connection.query('SELECT price_per_day FROM premium_services WHERE badge_type = ? AND is_active = 1', [type]);
        
        if (services.length === 0) {
            throw new Error('Dịch vụ quảng cáo này hiện không khả dụng.');
        }
        
        const pricePerDay = parseFloat(services[0].price_per_day);
        const fee_paid = pricePerDay * duration_days;

        // Kiểm tra số dư
        const [users] = await connection.query('SELECT wallet_balance FROM users WHERE user_id = ? FOR UPDATE', [landlordId]);
        const walletBalance = users[0].wallet_balance;

        if (walletBalance < fee_paid) {
            throw new Error('Số dư ví không đủ để thanh toán!');
        }

        // Trừ tiền
        await connection.query('UPDATE users SET wallet_balance = wallet_balance - ? WHERE user_id = ?', [fee_paid, landlordId]);

        // Tạo Request
        await connection.query(
            `INSERT INTO banner_requests (landlord_id, listing_id, type, image_url, fee_paid, duration_days, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [landlordId, listing_id, type, image_url, fee_paid, duration_days]
        );

        // Lưu Payment Record (vào listing_payments table)
        await connection.query(
            `INSERT INTO listing_payments (user_id, listing_id, amount, payment_method, payment_type, status) 
             VALUES (?, ?, ?, 'wallet', 'banner_ad', 'completed')`,
            [landlordId, listing_id, fee_paid]
        );

        await connection.commit();
        res.json({ message: 'Đăng ký Banner thành công. Vui lòng chờ Admin duyệt!', fee_paid });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ message: error.message });
    } finally {
        connection.release();
    }
};

exports.getMyBannerRequests = async (req, res) => {
    try {
        const landlordId = req.user.user_id;
        const [rows] = await db.query(`
            SELECT br.*, rl.title as listing_title
            FROM banner_requests br
            LEFT JOIN room_listings rl ON br.listing_id = rl.listing_id
            WHERE br.landlord_id = ?
            ORDER BY br.created_at DESC
        `, [landlordId]);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.updateBannerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, display_style, priority } = req.body;

        // Calculate end_date if status is active
        let end_date = null;
        if (status === 'active') {
            const [request] = await db.query('SELECT duration_days FROM banner_requests WHERE request_id = ?', [id]);
            if (request[0]) {
                end_date = new Date();
                end_date.setDate(end_date.getDate() + request[0].duration_days);
            }
        }

        await db.query(
            'UPDATE banner_requests SET status = ?, end_date = ?, display_style = ?, priority = ? WHERE request_id = ?', 
            [status, end_date, display_style || 'default', priority || 0, id]
        );
        res.json({ message: 'Cập nhật trạng thái banner thành công.' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.getActiveBanners = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT br.*, rl.title as listing_title, rl.room_id, r.room_number, b.name as building_name, b.address_full
            FROM banner_requests br
            LEFT JOIN room_listings rl ON br.listing_id = rl.listing_id
            LEFT JOIN rooms r ON rl.room_id = r.room_id
            LEFT JOIN buildings b ON r.building_id = b.building_id
            WHERE br.status = 'active' AND (br.end_date IS NULL OR br.end_date > NOW())
            ORDER BY br.priority DESC, br.created_at DESC
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.deleteBannerRequest = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM banner_requests WHERE request_id = ?', [id]);
        res.json({ message: 'Xóa yêu cầu banner thành công.' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
