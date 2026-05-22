const db = require('../config/database');

class Property {
    // --- Building Operations ---
    static async createBuilding(data) {
        const { landlordId, name, address, type, description, totalFloors, coordinates } = data;
        const query = `
      INSERT INTO buildings (landlord_id, name, address_full, type, description, total_floors, coordinates)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
        const [result] = await db.execute(query, [
            landlordId,
            name,
            address, // We keep the variable name 'address' but map it to 'address_full' column
            type || 'apartment',
            description || null,
            totalFloors || 1,
            coordinates ? JSON.stringify(coordinates) : null
        ]);
        return result.insertId;
    }

    static async getBuildingsByLandlord(landlordId) {
        const query = `
            SELECT 
                b.building_id,
                b.landlord_id,
                b.name,
                b.address_full as address,
                b.type,
                b.description,
                b.total_floors,
                b.coordinates,
                COUNT(r.room_id) as room_count,
                SUM(CASE WHEN r.status = 'available' THEN 1 ELSE 0 END) as available_count,
                SUM(CASE WHEN r.status = 'occupied' THEN 1 ELSE 0 END) as occupied_count,
                SUM(CASE WHEN r.status = 'deposited' THEN 1 ELSE 0 END) as deposited_count,
                SUM(CASE WHEN r.status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_count
            FROM buildings b
            LEFT JOIN rooms r ON b.building_id = r.building_id
            WHERE b.landlord_id = ?
            GROUP BY b.building_id, b.landlord_id, b.name, b.address_full, b.type, b.description, b.total_floors, b.coordinates
            ORDER BY b.building_id DESC
        `;
        const [rows] = await db.execute(query, [landlordId]);
        return rows.map(r => ({
            ...r,
            room_count: Number(r.room_count || 0),
            available_count: Number(r.available_count || 0),
            occupied_count: Number(r.occupied_count || 0),
            deposited_count: Number(r.deposited_count || 0),
            maintenance_count: Number(r.maintenance_count || 0),
            coordinates: typeof r.coordinates === 'string' ? JSON.parse(r.coordinates) : r.coordinates
        }));
    }

    static async getBuildingById(id) {
        const query = `
            SELECT 
                b.building_id,
                b.landlord_id,
                b.name,
                b.address_full as address,
                b.type,
                b.description,
                b.total_floors,
                b.coordinates,
                COUNT(r.room_id) as room_count,
                SUM(CASE WHEN r.status = 'available' THEN 1 ELSE 0 END) as available_count,
                SUM(CASE WHEN r.status = 'occupied' THEN 1 ELSE 0 END) as occupied_count,
                SUM(CASE WHEN r.status = 'deposited' THEN 1 ELSE 0 END) as deposited_count,
                SUM(CASE WHEN r.status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_count
            FROM buildings b
            LEFT JOIN rooms r ON b.building_id = r.building_id
            WHERE b.building_id = ?
            GROUP BY b.building_id, b.landlord_id, b.name, b.address_full, b.type, b.description, b.total_floors, b.coordinates
        `;
        const [rows] = await db.execute(query, [id]);
        if (rows.length === 0) return null;
        const building = rows[0];
        if (building.coordinates && typeof building.coordinates === 'string') {
            try {
                building.coordinates = JSON.parse(building.coordinates);
            } catch (e) {
                // Keep as string if parse fails
            }
        }
        building.room_count = Number(building.room_count || 0);
        building.available_count = Number(building.available_count || 0);
        building.occupied_count = Number(building.occupied_count || 0);
        building.deposited_count = Number(building.deposited_count || 0);
        building.maintenance_count = Number(building.maintenance_count || 0);
        return building;
    }

    static async getBuildingStatistics(buildingId) {
        const statsQuery = `
            SELECT 
                COUNT(*) as totalRooms,
                SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as availableRooms,
                SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupiedRooms,
                SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenanceRooms,
                SUM(CASE WHEN status = 'deposited' THEN 1 ELSE 0 END) as depositedRooms,
                SUM(base_price) as totalPotentialRent,
                SUM(CASE WHEN status = 'occupied' THEN base_price ELSE 0 END) as currentRent
            FROM rooms
            WHERE building_id = ?
        `;
        const [stats] = await db.execute(statsQuery, [buildingId]);
        return {
            totalRooms: Number(stats[0]?.totalRooms || 0),
            availableRooms: Number(stats[0]?.availableRooms || 0),
            occupiedRooms: Number(stats[0]?.occupiedRooms || 0),
            maintenanceRooms: Number(stats[0]?.maintenanceRooms || 0),
            depositedRooms: Number(stats[0]?.depositedRooms || 0),
            totalPotentialRent: Number(stats[0]?.totalPotentialRent || 0),
            currentRent: Number(stats[0]?.currentRent || 0)
        };
    }

    static async getRoomById(id) {
        const query = 'SELECT * FROM rooms WHERE room_id = ?';
        const [rows] = await db.execute(query, [id]);
        return rows[0];
    }

    // --- Room Operations ---
    static async createRoom(data) {
        const { buildingId, roomNumber, floor, area, basePrice, electricityPrice, waterPrice, servicePrice, description, amenities, images } = data;
        const query = `
      INSERT INTO rooms (building_id, room_number, floor, area, base_price, electricity_price, water_price, service_price, description, amenities, images, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
    `;
        const [result] = await db.execute(query, [
            buildingId,
            roomNumber,
            floor || 1,
            area,
            basePrice,
            electricityPrice || 0,
            waterPrice || 0,
            servicePrice || 0,
            description || null,
            JSON.stringify(amenities || {}),
            JSON.stringify(images || [])
        ]);
        return result.insertId;
    }

    static async getRoomsByBuilding(buildingId) {
        const query = `
            SELECT r.*, b.name as building_name, b.address_full as address
            FROM rooms r
            JOIN buildings b ON r.building_id = b.building_id
            WHERE r.building_id = ?
        `;
        const [rows] = await db.execute(query, [buildingId]);
        return rows;
    }

    static async updateRoomStatus(roomId, status) {
        const query = 'UPDATE rooms SET status = ? WHERE room_id = ?';
        await db.execute(query, [status, roomId]);
    }

    static async getAvailableRoomsByLandlord(landlordId) {
        const query = `
            SELECT r.*, b.name as building_name, b.address_full as address
            FROM rooms r
            JOIN buildings b ON r.building_id = b.building_id
            WHERE b.landlord_id = ? AND r.status = 'available'
            ORDER BY b.name ASC, r.room_number ASC
        `;
        const [rows] = await db.execute(query, [landlordId]);
        return rows;
    }

    static async updateRoom(roomId, data) {
        const { roomNumber, floor, area, basePrice, electricityPrice, waterPrice, servicePrice, description, amenities, images, status } = data;
        let fields = [];
        let values = [];

        if (roomNumber !== undefined) { fields.push('room_number = ?'); values.push(roomNumber); }
        if (floor !== undefined) { fields.push('floor = ?'); values.push(floor); }
        if (area !== undefined) { fields.push('area = ?'); values.push(area); }
        if (basePrice !== undefined) { fields.push('base_price = ?'); values.push(basePrice); }
        if (electricityPrice !== undefined) { fields.push('electricity_price = ?'); values.push(electricityPrice); }
        if (waterPrice !== undefined) { fields.push('water_price = ?'); values.push(waterPrice); }
        if (servicePrice !== undefined) { fields.push('service_price = ?'); values.push(servicePrice); }
        if (description !== undefined) { fields.push('description = ?'); values.push(description); }
        if (amenities !== undefined) { fields.push('amenities = ?'); values.push(JSON.stringify(amenities)); }
        if (images !== undefined) { fields.push('images = ?'); values.push(JSON.stringify(images)); }
        if (status !== undefined) { fields.push('status = ?'); values.push(status); }

        if (fields.length === 0) return;

        values.push(roomId);
        const query = `UPDATE rooms SET ${fields.join(', ')} WHERE room_id = ?`;
        await db.execute(query, values);
    }

    static async deleteRoom(roomId) {
        const query = 'DELETE FROM rooms WHERE room_id = ?';
        await db.execute(query, [roomId]);
    }

    static async getRoomDetails(roomId) {
        // 1. Get Room Info + Building Info
        const roomQuery = `
            SELECT r.*, b.landlord_id, b.name as building_name, b.address_full 
            FROM rooms r 
            JOIN buildings b ON r.building_id = b.building_id 
            WHERE r.room_id = ?`;
        const [rooms] = await db.execute(roomQuery, [roomId]);
        if (rooms.length === 0) return null;
        const room = rooms[0];

        let details = { ...room };

        // 2. If Occupied, get Tenant & Contract Info
        // Note: checking for 'active' contract. If multiple, take latest start_date
        if (room.status === 'occupied') {
            const contractQuery = `
                SELECT c.*, u.full_name as tenant_name, u.phone_number as tenant_phone, u.email as tenant_email, u.avatar_url as tenant_avatar
                FROM contracts c
                JOIN users u ON c.tenant_id = u.user_id
                WHERE c.room_id = ? AND c.status = 'active'
                ORDER BY c.start_date DESC LIMIT 1
            `;
            const [contracts] = await db.execute(contractQuery, [roomId]);
            if (contracts.length > 0) {
                details.contract = contracts[0];
            }
        }

        // 3. Get Latest Readings
        // 3. Get Latest Readings from Bills
        const elecQuery = `
            SELECT electricity_new as new_index, electricity_consumption as consumption,
                   billing_month as record_date
            FROM bills 
            WHERE room_id = ? AND electricity_new IS NOT NULL 
            ORDER BY billing_month DESC LIMIT 1`;
        const [elec] = await db.execute(elecQuery, [roomId]);
        details.latest_electricity = elec[0] || { new_index: 0, consumption: 0 };

        const waterQuery = `
            SELECT water_new as new_index, water_consumption as consumption,
                   billing_month as record_date
            FROM bills 
            WHERE room_id = ? AND water_new IS NOT NULL 
            ORDER BY billing_month DESC LIMIT 1`;
        const [water] = await db.execute(waterQuery, [roomId]);
        details.latest_water = water[0] || { new_index: 0, consumption: 0 };

        // 4. Get Assets
        const assetQuery = `SELECT * FROM room_assets WHERE room_id = ?`;
        const [assets] = await db.execute(assetQuery, [roomId]);
        details.assets = assets;

        // 5. Get Service Prices
        const configQuery = `SELECT * FROM utility_configs WHERE landlord_id = ?`;
        const [configs] = await db.execute(configQuery, [room.landlord_id]);
        details.utility_configs = configs;

        // 6. Get Maintenance Requests (Active/Recent)
        const maintenanceQuery = `
            SELECT * FROM maintenance_requests 
            WHERE room_id = ? 
            ORDER BY status = 'open' DESC, request_id DESC 
            LIMIT 5`;
        const [maintenance] = await db.execute(maintenanceQuery, [roomId]);
        details.maintenance_requests = maintenance;

        return details;
    }
}

module.exports = Property;
