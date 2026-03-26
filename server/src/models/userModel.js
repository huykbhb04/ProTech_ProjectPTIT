const db = require('../config/database');

class User {
    static async create(userData) {
        const { fullName, email, passwordHash, phoneNumber, role, identityCardNumber } = userData;
        const query = `
      INSERT INTO users (full_name, email, password_hash, phone_number, role, identity_card_number)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
        const [result] = await db.execute(query, [
            fullName || null,
            email || null,
            passwordHash || null,
            phoneNumber || null,
            role || 'guest',
            identityCardNumber || null
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
}

module.exports = User;
