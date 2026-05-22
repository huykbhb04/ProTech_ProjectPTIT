const db = require('../config/database');

class Statistics {
    static async getLandlordOverview(landlordId) {
        // 1. Total Revenue (all-time paid bills)
        const revenueQuery = `
            SELECT SUM(total_amount) as totalRevenue
            FROM bills b
            JOIN rooms r ON b.room_id = r.room_id
            JOIN buildings bld ON r.building_id = bld.building_id
            WHERE bld.landlord_id = ? AND b.status = 'paid'
        `;
        const [revenueRows] = await db.execute(revenueQuery, [landlordId]);
        const totalRevenue = revenueRows[0].totalRevenue || 0;

        // 2. Occupancy Rate
        const occupancyQuery = `
            SELECT 
                COUNT(*) as totalRooms,
                SUM(CASE WHEN r.status = 'occupied' THEN 1 ELSE 0 END) as occupiedRooms
            FROM rooms r
            JOIN buildings b ON r.building_id = b.building_id
            WHERE b.landlord_id = ?
        `;
        const [occupancyRows] = await db.execute(occupancyQuery, [landlordId]);
        const { totalRooms, occupiedRooms } = occupancyRows[0];
        const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
        const vacantRooms = totalRooms - occupiedRooms;

        // 3. Total Tenants (unique tenants with active contracts)
        const tenantQuery = `
            SELECT COUNT(DISTINCT c.tenant_id) as totalTenants
            FROM contracts c
            JOIN rooms r ON c.room_id = r.room_id
            JOIN buildings b ON r.building_id = b.building_id
            WHERE b.landlord_id = ? AND c.status = 'active'
        `;
        const [tenantRows] = await db.execute(tenantQuery, [landlordId]);
        const totalTenants = tenantRows[0].totalTenants || 0;

        // 4. Maintenance Requests
        const maintenanceQuery = `
            SELECT 
                COUNT(*) as openRequests,
                SUM(CASE WHEN mr.ai_severity = 'emergency' THEN 1 ELSE 0 END) as urgentRequests
            FROM maintenance_requests mr
            JOIN rooms r ON mr.room_id = r.room_id
            JOIN buildings b ON r.building_id = b.building_id
            WHERE b.landlord_id = ? AND mr.status = 'open'
        `;
        const [maintenanceRows] = await db.execute(maintenanceQuery, [landlordId]);
        const openRequests = maintenanceRows[0].openRequests || 0;
        const urgentRequests = maintenanceRows[0].urgentRequests || 0;

        // 5. Recent Activity (Revenue trend - last 6 months)
        const trendQuery = `
            SELECT 
                DATE_FORMAT(paid_at, '%Y-%m') as month,
                SUM(total_amount) as amount
            FROM bills b
            JOIN rooms r ON b.room_id = r.room_id
            JOIN buildings bld ON r.building_id = bld.building_id
            WHERE bld.landlord_id = ? AND b.status = 'paid' AND b.paid_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY month
            ORDER BY month ASC
        `;
        const [trendRows] = await db.execute(trendQuery, [landlordId]);

        return {
            stats: {
                totalRevenue,
                occupancyRate,
                vacantRooms,
                totalTenants,
                openRequests,
                urgentRequests,
                totalRooms
            },
            revenueTrend: trendRows
        };
    }
}

module.exports = Statistics;
