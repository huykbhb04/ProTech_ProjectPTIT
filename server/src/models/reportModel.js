const db = require('../config/database');

class ReportModel {
    // ===== LISTING REPORTS =====

    static async createReport(data) {
        const { listingId, reporterName, reporterPhone, reason, description, ipAddress } = data;
        const [result] = await db.execute(
            `INSERT INTO listing_reports (listing_id, reporter_name, reporter_phone, reason, description, ip_address, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [listingId, reporterName, reporterPhone, reason, description || null, ipAddress]
        );
        return result.insertId;
    }

    static async getRecentFraudReportsCount(listingId, hours = 2) {
        const query = `
            SELECT 
                COUNT(DISTINCT reporter_phone) as unique_phones,
                COUNT(DISTINCT ip_address) as unique_ips
            FROM listing_reports
            WHERE listing_id = ? 
              AND reason = 'fraud' 
              AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
        `;
        const [rows] = await db.execute(query, [listingId, hours]);
        return {
            uniquePhones: rows[0].unique_phones || 0,
            uniqueIps: rows[0].unique_ips || 0
        };
    }

    static async getAllReports(filters = {}) {
        let query = `
            SELECT lr.*, rl.title as listing_title, rl.status as listing_status, rl.status_reason as listing_status_reason,
                   r.room_number, b.name as building_name, b.address_full as address,
                   u.full_name as landlord_name, u.phone_number as landlord_phone, u.user_id as landlord_id,
                   (
                       SELECT COUNT(*) 
                       FROM listing_reports 
                       WHERE listing_id = lr.listing_id AND reason = 'fraud' AND status = 'pending'
                   ) as pending_fraud_count
            FROM listing_reports lr
            JOIN room_listings rl ON lr.listing_id = rl.listing_id
            JOIN rooms r ON rl.room_id = r.room_id
            JOIN buildings b ON r.building_id = b.building_id
            JOIN users u ON b.landlord_id = u.user_id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status) {
            query += ' AND lr.status = ?';
            params.push(filters.status);
        }

        if (filters.reason) {
            query += ' AND lr.reason = ?';
            params.push(filters.reason);
        }

        // Order: pending fraud reports first, then pending general reports, then resolved ones
        query += `
            ORDER BY 
              CASE 
                WHEN lr.status = 'pending' AND lr.reason = 'fraud' THEN 1 
                WHEN lr.status = 'pending' THEN 2 
                ELSE 3 
              END ASC,
              lr.created_at DESC
        `;

        const [rows] = await db.execute(query, params);
        return rows;
    }

    static async findReportById(reportId) {
        const query = `
            SELECT lr.*, rl.title as listing_title, rl.status as listing_status, rl.status_reason as listing_status_reason,
                   r.room_number, b.name as building_name, b.address_full as address,
                   u.full_name as landlord_name, u.phone_number as landlord_phone, u.email as landlord_email, u.user_id as landlord_id
            FROM listing_reports lr
            JOIN room_listings rl ON lr.listing_id = rl.listing_id
            JOIN rooms r ON rl.room_id = r.room_id
            JOIN buildings b ON r.building_id = b.building_id
            JOIN users u ON b.landlord_id = u.user_id
            WHERE lr.report_id = ?
        `;
        const [rows] = await db.execute(query, [reportId]);
        return rows[0];
    }

    static async updateReportStatus(reportId, status, adminNotes) {
        const query = 'UPDATE listing_reports SET status = ?, admin_notes = ? WHERE report_id = ?';
        const [result] = await db.execute(query, [status, adminNotes || null, reportId]);
        return result.affectedRows > 0;
    }

    static async updateAllReportsForListing(listingId, status, adminNotes) {
        const query = "UPDATE listing_reports SET status = ?, admin_notes = ? WHERE listing_id = ? AND status = 'pending'";
        const [result] = await db.execute(query, [status, adminNotes || null, listingId]);
        return result.affectedRows > 0;
    }

    // ===== LANDLORD DISPUTES =====

    static async createDispute(data) {
        const { listingId, landlordId, explanation, proofImages } = data;
        const [result] = await db.execute(
            `INSERT INTO listing_disputes (listing_id, landlord_id, explanation, proof_images, status) 
             VALUES (?, ?, ?, ?, 'pending')`,
            [listingId, landlordId, explanation, JSON.stringify(proofImages || [])]
        );
        return result.insertId;
    }

    static async getAllDisputes(filters = {}) {
        let query = `
            SELECT ld.*, rl.title as listing_title, rl.status as listing_status, rl.status_reason as listing_status_reason,
                   u.full_name as landlord_name, u.phone_number as landlord_phone, u.email as landlord_email
            FROM listing_disputes ld
            JOIN room_listings rl ON ld.listing_id = rl.listing_id
            JOIN users u ON ld.landlord_id = u.user_id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status) {
            query += ' AND ld.status = ?';
            params.push(filters.status);
        }

        query += `
            ORDER BY 
              CASE WHEN ld.status = 'pending' THEN 1 ELSE 2 END ASC,
              ld.created_at DESC
        `;

        const [rows] = await db.execute(query, params);
        return rows.map(r => ({
            ...r,
            proof_images: typeof r.proof_images === 'string' ? JSON.parse(r.proof_images) : (r.proof_images || [])
        }));
    }

    static async findDisputeById(disputeId) {
        const query = `
            SELECT ld.*, rl.title as listing_title, rl.status as listing_status, rl.status_reason as listing_status_reason,
                   u.full_name as landlord_name, u.phone_number as landlord_phone, u.email as landlord_email
            FROM listing_disputes ld
            JOIN room_listings rl ON ld.listing_id = rl.listing_id
            JOIN users u ON ld.landlord_id = u.user_id
            WHERE ld.dispute_id = ?
        `;
        const [rows] = await db.execute(query, [disputeId]);
        if (rows[0]) {
            const r = rows[0];
            return {
                ...r,
                proof_images: typeof r.proof_images === 'string' ? JSON.parse(r.proof_images) : (r.proof_images || [])
            };
        }
        return null;
    }

    static async updateDisputeStatus(disputeId, status, adminNotes) {
        const query = 'UPDATE listing_disputes SET status = ?, admin_notes = ? WHERE dispute_id = ?';
        const [result] = await db.execute(query, [status, adminNotes || null, disputeId]);
        return result.affectedRows > 0;
    }
}

module.exports = ReportModel;
