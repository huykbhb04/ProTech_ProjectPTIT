const db = require('../config/database');

class Booking {
    static async create(bookingData) {
        const { roomId, tenantId, bookingDate, bookingTime, type = 'viewing', depositAmount = 0, commissionRate = 0, commissionAmount = 0 } = bookingData;
        const query = `
            INSERT INTO bookings (room_id, tenant_id, type, deposit_amount, commission_rate, commission_amount, booking_date, booking_time, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `;
        const [result] = await db.execute(query, [roomId, tenantId, type, depositAmount, commissionRate, commissionAmount, bookingDate, bookingTime]);
        return result.insertId;
    }

    static async checkConflict(tenantId, bookingDate, bookingTime) {
        // Find bookings on the same day that are within +/- 15 minutes
        // We use TIMESTAMPDIFF or manual minute calculation logic
        // For simplicity and clarity in SQL:
        const query = `
            SELECT * FROM bookings 
            WHERE tenant_id = ? 
            AND booking_date = ? 
            AND status IN ('pending', 'confirmed')
            AND ABS(TIMESTAMPDIFF(MINUTE, CAST(CONCAT(booking_date, ' ', booking_time) AS DATETIME), CAST(CONCAT(?, ' ', ?) AS DATETIME))) < 15
        `;
        const [rows] = await db.execute(query, [tenantId, bookingDate, bookingDate, bookingTime]);
        return rows.length > 0;
    }

    static async hasExistingBooking(tenantId, roomId) {
        const query = `
            SELECT * FROM bookings 
            WHERE tenant_id = ? 
            AND room_id = ? 
            AND status IN ('pending', 'confirmed')
            LIMIT 1
        `;
        const [rows] = await db.execute(query, [tenantId, roomId]);
        return rows.length > 0;
    }

    static async getByLandlord(landlordId) {
        const query = `
            SELECT b.*, r.room_number, bl.name as building_name, u.full_name as tenant_name, u.phone_number as tenant_phone
            FROM bookings b
            JOIN rooms r ON b.room_id = r.room_id
            JOIN buildings bl ON r.building_id = bl.building_id
            JOIN users u ON b.tenant_id = u.user_id
            WHERE bl.landlord_id = ?
            ORDER BY b.created_at DESC
        `;
        const [rows] = await db.execute(query, [landlordId]);
        return rows;
    }

    static async getByTenant(tenantId) {
        const query = `
            SELECT b.*, r.room_number, bl.name as building_name, u.full_name as landlord_name
            FROM bookings b
            JOIN rooms r ON b.room_id = r.room_id
            JOIN buildings bl ON r.building_id = bl.building_id
            JOIN users u ON bl.landlord_id = u.user_id
            WHERE b.tenant_id = ?
            ORDER BY b.created_at DESC
        `;
        const [rows] = await db.execute(query, [tenantId]);
        return rows;
    }

    static async findById(bookingId) {
        const query = `
            SELECT b.*, r.room_number, r.base_price as room_price, bl.name as building_name, bl.landlord_id, b.tenant_id
            FROM bookings b
            JOIN rooms r ON b.room_id = r.room_id
            JOIN buildings bl ON r.building_id = bl.building_id
            WHERE b.booking_id = ?
        `;
        const [rows] = await db.execute(query, [bookingId]);
        return rows[0];
    }

    static async updatePaymentStatus(bookingId, status, connection = null) {
        const query = 'UPDATE bookings SET payment_status = ?, payment_date = NOW() WHERE booking_id = ?';
        const client = connection || db;
        const [result] = await client.execute(query, [status, bookingId]);
        return result.affectedRows > 0;
    }

    static async confirm(bookingId, leadInfo) {
        const { leadPersonName, leadPersonPhone, landlordNotes } = leadInfo;
        const query = `
            UPDATE bookings 
            SET status = 'confirmed', lead_person_name = ?, lead_person_phone = ?, landlord_notes = ?
            WHERE booking_id = ?
        `;
        const [result] = await db.execute(query, [leadPersonName, leadPersonPhone, landlordNotes, bookingId]);
        return result.affectedRows > 0;
    }

    static async updateStatus(bookingId, status) {
        const query = 'UPDATE bookings SET status = ? WHERE booking_id = ?';
        const [result] = await db.execute(query, [status, bookingId]);
        return result.affectedRows > 0;
    }
}

module.exports = Booking;
