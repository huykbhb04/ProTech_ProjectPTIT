const db = require('../config/database');

class Listing {
    static async create(listingData) {
        const { room_id, title, description, rent_price, deposit_amount, electricity_price, water_price, service_price, amenities, package_id, expires_at, max_occupants, allow_pets } = listingData;
        const [result] = await db.execute(
            'INSERT INTO room_listings (room_id, title, description, rent_price, deposit_amount, electricity_price, water_price, service_price, amenities, package_id, expires_at, max_occupants, allow_pets, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [room_id, title, description, rent_price, deposit_amount, electricity_price || 0, water_price || 0, service_price || 0, JSON.stringify(amenities || {}), package_id || null, expires_at || null, max_occupants || 1, allow_pets ? 1 : 0, expires_at ? 'active' : 'paused']
        );
        return result.insertId;
    }

    static async getAllActive() {
        // Use UNIX timestamp (seconds) for absolute timezone safety
        const nowTs = Math.floor(Date.now() / 1000);

        // Query only active and non-expired listings, prioritizing premium ones
        const [rows] = await db.execute(`
            SELECT rl.*, r.room_number, r.area, r.images, r.amenities as room_amenities, 
                   b.name as building_name, b.address_full as address, b.type as type,
                   b.coordinates,
                   ps.badge_type as premium_badge
            FROM room_listings rl
            JOIN rooms r ON rl.room_id = r.room_id
            JOIN buildings b ON r.building_id = b.building_id
            LEFT JOIN premium_services ps ON rl.premium_service_id = ps.service_id
            WHERE rl.status = 'active' 
              AND (rl.expires_at IS NULL OR UNIX_TIMESTAMP(rl.expires_at) > ?)
              AND (rl.premium_until IS NULL OR UNIX_TIMESTAMP(rl.premium_until) > ? OR rl.premium_service_id IS NULL)
            ORDER BY 
              CASE WHEN rl.premium_until IS NOT NULL AND UNIX_TIMESTAMP(rl.premium_until) > ? THEN 1 ELSE 0 END DESC,
              rl.premium_service_id DESC, 
              rl.created_at DESC
        `, [nowTs, nowTs, nowTs]);

        // Debug: Log count
        console.log(`[getAllActive] Returned ${rows.length} active listings (Current UNIX TS: ${nowTs})`);

        return rows.map(r => ({
            ...r,
            amenities: r.amenities || r.room_amenities,
            coordinates: typeof r.coordinates === 'string' ? JSON.parse(r.coordinates) : r.coordinates,
            images: typeof r.images === 'string' ? JSON.parse(r.images) : r.images
        }));
    }

    static async getByLandlord(landlordId) {
        const [rows] = await db.execute(`
            SELECT rl.*, r.room_number, r.building_id, b.name as building_name
            FROM room_listings rl
            JOIN rooms r ON rl.room_id = r.room_id
            JOIN buildings b ON r.building_id = b.building_id
            WHERE b.landlord_id = ?
            ORDER BY rl.created_at DESC
        `, [landlordId]);
        return rows;
    }

    static async update(id, updateData) {
        const { title, description, rent_price, deposit_amount, electricity_price, water_price, service_price, status, amenities, package_id, expires_at, premium_service_id, premium_until, max_occupants, allow_pets } = updateData;
        await db.execute(
            `UPDATE room_listings SET 
                title = ?, description = ?, rent_price = ?, deposit_amount = ?, 
                electricity_price = ?, water_price = ?, service_price = ?, 
                status = ?, amenities = ?, package_id = ?, expires_at = ?,
                premium_service_id = ?, premium_until = ?, max_occupants = ?, allow_pets = ? 
            WHERE listing_id = ?`,
            [
                title, description, rent_price, deposit_amount,
                electricity_price || 0, water_price || 0, service_price || 0,
                status, JSON.stringify(amenities || {}),
                package_id || null, expires_at || null,
                premium_service_id || null, premium_until || null,
                max_occupants || 1, allow_pets ? 1 : 0,
                id
            ]
        );
    }

    static async delete(id) {
        await db.execute('DELETE FROM room_listings WHERE listing_id = ?', [id]);
    }

    static async getByRoomId(roomId) {
        const [rows] = await db.execute(`
            SELECT rl.*, r.room_number, r.area, r.images, r.amenities as room_amenities, 
                   b.name as building_name, b.address_full as address, b.type as type, b.landlord_id,
                   b.coordinates,
                   u.full_name as landlord_name, u.phone_number as landlord_phone, u.avatar_url as landlord_avatar
            FROM room_listings rl
            JOIN rooms r ON rl.room_id = r.room_id
            JOIN buildings b ON r.building_id = b.building_id
            JOIN users u ON b.landlord_id = u.user_id
            WHERE rl.room_id = ?
        `, [roomId]);

        if (rows[0]) {
            const r = rows[0];
            return {
                ...r,
                amenities: r.amenities || r.room_amenities,
                coordinates: typeof r.coordinates === 'string' ? JSON.parse(r.coordinates) : r.coordinates,
                images: typeof r.images === 'string' ? JSON.parse(r.images) : r.images
            };
        }
        return null;
    }
}

module.exports = Listing;
