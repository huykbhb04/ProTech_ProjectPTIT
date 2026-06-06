const db = require('../config/database');

class WalletTopup {
    static async create(data) {
        const { user_id, amount, payment_method, reference_code, bank_code, bank_account, bank_name, account_name, qr_code_url } = data;
        const [result] = await db.execute(
            `INSERT INTO wallet_topups
            (user_id, amount, payment_method, reference_code, bank_code, bank_account, bank_name, account_name, qr_code_url, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [user_id, amount, payment_method, reference_code, bank_code, bank_account, bank_name, account_name, qr_code_url]
        );
        return result.insertId;
    }

    static async findByReference(referenceCode) {
        const [rows] = await db.execute('SELECT * FROM wallet_topups WHERE reference_code = ?', [referenceCode]);
        return rows[0];
    }

    static async getById(id) {
        const [rows] = await db.execute('SELECT * FROM wallet_topups WHERE topup_id = ?', [id]);
        return rows[0];
    }

    static async getPending(limit = 50) {
        const [rows] = await db.execute(
            `SELECT * FROM wallet_topups
             WHERE status IN ('pending', 'matched')
             ORDER BY created_at ASC
             LIMIT ?`,
            [limit]
        );
        return rows;
    }

    static async markMatched(id, matchedBankRef, matchedDescription) {
        await db.execute(
            `UPDATE wallet_topups
             SET status = 'matched', matched_bank_ref = ?, matched_description = ?, matched_at = NOW()
             WHERE topup_id = ?`,
            [matchedBankRef, matchedDescription, id]
        );
    }

    static async markCredited(id) {
        await db.execute(
            `UPDATE wallet_topups
             SET status = 'credited', credited_at = NOW()
             WHERE topup_id = ?`,
            [id]
        );
    }

    static async markExpired(id) {
        await db.execute(
            `UPDATE wallet_topups
             SET status = 'expired'
             WHERE topup_id = ?`,
            [id]
        );
    }
}

module.exports = WalletTopup;
