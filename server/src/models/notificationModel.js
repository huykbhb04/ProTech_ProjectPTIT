const db = require('../config/database');

class Notification {
    static async create(userId, title, body, type) {
        const query = `
            INSERT INTO notifications (user_id, title, body, type, is_read)
            VALUES (?, ?, ?, ?, 0)
        `;
        const [result] = await db.execute(query, [userId, title, body, type]);
        return result.insertId;
    }

    static async getByUser(userId) {
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        `;
        const [rows] = await db.execute(query, [userId]);
        return rows;
    }

    static async markAsRead(notiId) {
        const query = 'UPDATE notifications SET is_read = 1 WHERE noti_id = ?';
        const [result] = await db.execute(query, [notiId]);
        return result.affectedRows > 0;
    }

    static async markAllAsRead(userId) {
        const query = 'UPDATE notifications SET is_read = 1 WHERE user_id = ?';
        const [result] = await db.execute(query, [userId]);
        return result.affectedRows > 0;
    }
}

module.exports = Notification;
