const db = require('../config/database');

class Listing {
    static async create(listingData) {
        const { room_id, title, description, category_id, rent_price, deposit_amount, electricity_price, water_price, service_price, amenities, package_id, expires_at, max_occupants, allow_pets } = listingData;
        const [result] = await db.execute(
            'INSERT INTO room_listings (room_id, title, description, category_id, rent_price, deposit_amount, electricity_price, water_price, service_price, amenities, package_id, expires_at, max_occupants, allow_pets, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [room_id, title, description, category_id || null, rent_price, deposit_amount, electricity_price || 0, water_price || 0, service_price || 0, JSON.stringify(amenities || {}), package_id || null, expires_at || null, max_occupants || 1, allow_pets ? 1 : 0, expires_at ? 'active' : 'paused']
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
                   ps.badge_type as premium_badge,
                   c.name as category_name, c.slug as category_slug, c.icon as category_icon, c.color as category_color
            FROM room_listings rl
            JOIN rooms r ON rl.room_id = r.room_id
            JOIN buildings b ON r.building_id = b.building_id
            LEFT JOIN premium_services ps ON rl.premium_service_id = ps.service_id
            LEFT JOIN categories c ON rl.category_id = c.category_id
            WHERE rl.status = 'active' 
              AND (rl.expires_at IS NULL OR rl.expires_at > NOW())
              AND (rl.premium_until IS NULL OR rl.premium_until > NOW() OR rl.premium_service_id IS NULL)
            ORDER BY 
              CASE WHEN rl.premium_until IS NOT NULL AND rl.premium_until > NOW() THEN 1 ELSE 0 END DESC,
              rl.premium_service_id DESC, 
              rl.created_at DESC
        `);

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
            SELECT rl.*, r.room_number, r.building_id, r.images, b.name as building_name,
                   c.name as category_name, c.slug as category_slug, c.icon as category_icon, c.color as category_color,
                   COALESCE(rl.views, 0) as views,
                   (SELECT COUNT(*) FROM bookings WHERE room_id = r.room_id AND status != 'cancelled') as booking_count,
                   (SELECT COUNT(*) FROM bookings WHERE room_id = r.room_id AND status = 'confirmed') as confirmed_count
            FROM room_listings rl
            JOIN rooms r ON rl.room_id = r.room_id
            JOIN buildings b ON r.building_id = b.building_id
            LEFT JOIN categories c ON rl.category_id = c.category_id
            WHERE b.landlord_id = ?
            ORDER BY rl.created_at DESC
        `, [landlordId]);
        return rows;
    }

    static async getByLandlordPaginated(landlordId, { page = 1, limit = 10, status = '', search = '' } = {}) {
        const offset = (page - 1) * limit;
        const conditions = ['b.landlord_id = ?'];
        const params = [landlordId];

        if (status) {
            conditions.push('rl.status = ?');
            params.push(status);
        }
        if (search.trim()) {
            conditions.push('(rl.title LIKE ? OR b.name LIKE ? OR r.room_number LIKE ?)');
            params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
        }

        const whereStr = `WHERE ${conditions.join(' AND ')}`;

        const [countRows] = await db.execute(
            `SELECT COUNT(*) as total FROM room_listings rl
             JOIN rooms r ON rl.room_id = r.room_id
             JOIN buildings b ON r.building_id = b.building_id
             ${whereStr}`,
            params
        );
        const total = countRows[0]?.total || 0;

        const [rows] = await db.execute(`
            SELECT rl.*, r.room_number, r.area, r.images, b.name as building_name, b.address_full as building_address,
                   c.name as category_name, c.slug as category_slug, c.icon as category_icon, c.color as category_color,
                   COALESCE(rl.views, 0) as views,
                   (SELECT COUNT(*) FROM bookings WHERE room_id = r.room_id AND status != 'cancelled') as booking_count,
                   (SELECT COUNT(*) FROM bookings WHERE room_id = r.room_id AND status = 'confirmed') as confirmed_count
            FROM room_listings rl
            JOIN rooms r ON rl.room_id = r.room_id
            JOIN buildings b ON r.building_id = b.building_id
            LEFT JOIN categories c ON rl.category_id = c.category_id
            ${whereStr}
            ORDER BY rl.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        return {
            listings: rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    static async update(id, updateData) {
        const { title, description, category_id, rent_price, deposit_amount, electricity_price, water_price, service_price, status, amenities, package_id, expires_at, premium_service_id, premium_until, max_occupants, allow_pets } = updateData;
        const fields = [];
        const values = [];

        if (title !== undefined) { fields.push('title = ?'); values.push(title); }
        if (description !== undefined) { fields.push('description = ?'); values.push(description); }
        if (category_id !== undefined) { fields.push('category_id = ?'); values.push(category_id || null); }
        if (rent_price !== undefined) { fields.push('rent_price = ?'); values.push(rent_price); }
        if (deposit_amount !== undefined) { fields.push('deposit_amount = ?'); values.push(deposit_amount); }
        if (electricity_price !== undefined) { fields.push('electricity_price = ?'); values.push(electricity_price || 0); }
        if (water_price !== undefined) { fields.push('water_price = ?'); values.push(water_price || 0); }
        if (service_price !== undefined) { fields.push('service_price = ?'); values.push(service_price || 0); }
        if (status !== undefined) { fields.push('status = ?'); values.push(status); }
        if (amenities !== undefined) { fields.push('amenities = ?'); values.push(JSON.stringify(amenities || {})); }
        if (package_id !== undefined) { fields.push('package_id = ?'); values.push(package_id || null); }
        if (expires_at !== undefined) { fields.push('expires_at = ?'); values.push(expires_at || null); }
        if (premium_service_id !== undefined) { fields.push('premium_service_id = ?'); values.push(premium_service_id || null); }
        if (premium_until !== undefined) { fields.push('premium_until = ?'); values.push(premium_until || null); }
        if (max_occupants !== undefined) { fields.push('max_occupants = ?'); values.push(max_occupants || 1); }
        if (allow_pets !== undefined) { fields.push('allow_pets = ?'); values.push(allow_pets ? 1 : 0); }

        if (fields.length === 0) return;

        values.push(id);
        await db.execute(`UPDATE room_listings SET ${fields.join(', ')} WHERE listing_id = ?`, values);
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

    static async incrementView(listingId) {
        await db.execute(
            'UPDATE room_listings SET views = COALESCE(views, 0) + 1 WHERE listing_id = ?',
            [listingId]
        );
    }
}

module.exports = Listing;
