const db = require('../config/database');

class Monetization {
    // 1. Packages
    static async getAllPackages() {
        const [rows] = await db.execute('SELECT * FROM listing_packages WHERE is_active = TRUE');
        return rows;
    }

    static async getPackageById(packageId) {
        const [rows] = await db.execute('SELECT * FROM listing_packages WHERE package_id = ?', [packageId]);
        return rows[0];
    }

    // 2. Premium Services
    static async getAllPremiumServices() {
        const [rows] = await db.execute('SELECT * FROM premium_services WHERE is_active = TRUE');
        return rows;
    }

    static async getPremiumServiceById(serviceId) {
        const [rows] = await db.execute('SELECT * FROM premium_services WHERE service_id = ?', [serviceId]);
        return rows[0];
    }

    // 3. Wallet Balance
    static async getWalletBalance(userId) {
        const [rows] = await db.execute('SELECT wallet_balance FROM users WHERE user_id = ?', [userId]);
        return rows[0] ? rows[0].wallet_balance : 0;
    }

    static async updateWalletBalance(userId, amount) {
        await db.execute('UPDATE users SET wallet_balance = wallet_balance + ? WHERE user_id = ?', [amount, userId]);
    }

    // 4. Payments & Transactions
    static async createPayment(data) {
        const { userId, listingId, amount, paymentMethod, paymentType, referenceId, transactionRef, status } = data;
        const [result] = await db.execute(
            `INSERT INTO listing_payments 
            (user_id, listing_id, amount, payment_method, payment_type, reference_id, transaction_ref, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, listingId || null, amount, paymentMethod, paymentType, referenceId || null, transactionRef || null, status || 'pending']
        );
        return result.insertId;
    }

    static async updatePaymentStatus(paymentId, status, transactionRef = null) {
        let query = 'UPDATE listing_payments SET status = ?';
        let params = [status];
        if (transactionRef) {
            query += ', transaction_ref = ?';
            params.push(transactionRef);
        }
        query += ' WHERE payment_id = ?';
        params.push(paymentId);
        await db.execute(query, params);
    }

    static async getPaymentHistory(userId) {
        const [rows] = await db.execute(
            `SELECT p.*, COALESCE(l.title, CONCAT('Listing #', p.listing_id)) AS listing_title
            FROM listing_payments p
            LEFT JOIN room_listings l ON p.listing_id = l.listing_id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC`,
            [userId]
        );
        return rows;
    }

    static async getPaymentHistoryPaginated(userId, { page = 1, limit = 10 } = {}) {
        const offset = (page - 1) * limit;

        const [countRows] = await db.execute(
            'SELECT COUNT(*) as total FROM listing_payments WHERE user_id = ?',
            [userId]
        );
        const total = countRows[0]?.total || 0;

        const [rows] = await db.execute(
            `SELECT p.*, COALESCE(l.title, CONCAT('Listing #', p.listing_id)) AS listing_title
            FROM listing_payments p
            LEFT JOIN room_listings l ON p.listing_id = l.listing_id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        return {
            history: rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // 5. Apply Monetization to Listing
    static async applyPackageToListing(listingId, packageId, expiresAt) {
        await db.execute(
            'UPDATE room_listings SET package_id = ?, expires_at = ?, status = "active" WHERE listing_id = ?',
            [packageId, expiresAt, listingId]
        );
    }

    static async applyPremiumServiceToListing(listingId, serviceId, premiumUntil) {
        await db.execute(
            'UPDATE room_listings SET premium_service_id = ?, premium_until = ? WHERE listing_id = ?',
            [serviceId, premiumUntil, listingId]
        );
    }
}

module.exports = Monetization;
