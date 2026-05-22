const db = require('../config/database');

class User {
    static async create(userData) {
        const { fullName, email, passwordHash, phoneNumber, role, identityCardNumber, status } = userData;
        const query = `
      INSERT INTO users (full_name, email, password_hash, phone_number, role, identity_card_number, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
        const [result] = await db.execute(query, [
            fullName || null,
            email || null,
            passwordHash || null,
            phoneNumber || null,
            role || 'guest',
            identityCardNumber || null,
            status || 'active'
        ]);
        return result.insertId;
    }

    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await db.execute(query, [email]);
        return rows[0];
    }

    static async findById(id) {
        const query = 'SELECT * FROM users WHERE user_id = ?';
        const [rows] = await db.execute(query, [id]);
        return rows[0];
    }

    static async updateProfile(userId, data) {
        const fields = [];
        const values = [];

        Object.keys(data).forEach(key => {
            if (['full_name', 'email', 'phone_number', 'date_of_birth', 'address', 'avatar_url', 'identity_card_number', 'is_verified'].includes(key)) {
                fields.push(`${key} = ?`);
                values.push(data[key]);
            }
        });

        if (fields.length === 0) return false;

        values.push(userId);
        const query = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
        const [result] = await db.execute(query, values);
        return result.affectedRows > 0;
    }

    static async getPaymentMethods(userId) {
        const query = 'SELECT * FROM payment_methods WHERE user_id = ? ORDER BY is_default DESC';
        const [rows] = await db.execute(query, [userId]);
        return rows;
    }

    static async addPaymentMethod(userId, data) {
        const { type, provider, account_number, account_name, is_default } = data;
        const query = `
            INSERT INTO payment_methods (user_id, type, provider, account_number, account_name, is_default)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [userId, type, provider, account_number, account_name, is_default ? 1 : 0]);
        return result.insertId;
    }

    static async deletePaymentMethod(userId, methodId) {
        const query = 'DELETE FROM payment_methods WHERE method_id = ? AND user_id = ?';
        const [result] = await db.execute(query, [methodId, userId]);
        return result.affectedRows > 0;
    }

    static async updateReputationScore(userId, scoreChange) {
        const query = 'UPDATE users SET reputation_score = reputation_score + ? WHERE user_id = ?';
        const [result] = await db.execute(query, [scoreChange, userId]);
        return result.affectedRows > 0;
    }

    // ===== ADMIN METHODS =====

    static async getAllUsers(filters = {}) {
        const { role, status, is_verified, search } = filters;
        let query = 'SELECT * FROM users WHERE 1=1';
        const params = [];

        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        if (is_verified !== undefined) {
            query += ' AND is_verified = ?';
            params.push(is_verified);
        }

        if (search) {
            query += ' AND (full_name LIKE ? OR email LIKE ? OR phone_number LIKE ?)';
            const searchVal = `%${search}%`;
            params.push(searchVal, searchVal, searchVal);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await db.execute(query, params);
        return rows;
    }

    static async adminUpdateUser(userId, data) {
        const fields = [];
        const values = [];

        const allowedFields = [
            'full_name', 'email', 'phone_number', 'role', 
            'identity_card_number', 'is_verified', 'status',
            'reputation_score', 'address', 'date_of_birth'
        ];

        Object.keys(data).forEach(key => {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(data[key]);
            }
        });

        if (fields.length === 0) return false;

        values.push(userId);
        const query = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
        const [result] = await db.execute(query, values);
        return result.affectedRows > 0;
    }

    static async updateStatus(userId, status) {
        const query = 'UPDATE users SET status = ? WHERE user_id = ?';
        const [result] = await db.execute(query, [status, userId]);
        return result.affectedRows > 0;
    }

    static async deleteUser(userId) {
        const query = 'DELETE FROM users WHERE user_id = ?';
        const [result] = await db.execute(query, [userId]);
        return result.affectedRows > 0;
    }
}

module.exports = User;
