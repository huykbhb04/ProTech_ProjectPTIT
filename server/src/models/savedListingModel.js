const db = require('../config/database');

class SavedListing {
    static async toggle(userId, listingId) {
        // Check if already saved
        const [existing] = await db.execute(
            'SELECT * FROM saved_listings WHERE user_id = ? AND listing_id = ?',
            [userId, listingId]
        );

        if (existing.length > 0) {
            // Remove
            await db.execute(
                'DELETE FROM saved_listings WHERE user_id = ? AND listing_id = ?',
                [userId, listingId]
            );
            return { saved: false };
        } else {
            // Add
            await db.execute(
                'INSERT INTO saved_listings (user_id, listing_id) VALUES (?, ?)',
                [userId, listingId]
            );
            return { saved: true };
        }
    }

    static async getByUserId(userId) {
        const query = `
            SELECT rl.*, b.name as building_name, b.address_full as building_address, 
            b.coordinates, b.security_rating, b.flood_risk, b.type as building_type,
            r.room_number, r.area, r.amenities, r.images,
            (SELECT COUNT(*) FROM saved_listings WHERE listing_id = rl.listing_id AND user_id = ?) as is_saved
            FROM saved_listings sl
            JOIN room_listings rl ON sl.listing_id = rl.listing_id
            JOIN rooms r ON rl.room_id = r.room_id
            JOIN buildings b ON r.building_id = b.building_id
            WHERE sl.user_id = ?
            ORDER BY sl.created_at DESC
        `;
        const [rows] = await db.execute(query, [userId, userId]);

        // Parse JSON fields
        return rows.map(row => ({
            ...row,
            amenities: typeof row.amenities === 'string' ? JSON.parse(row.amenities) : row.amenities,
            images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images,
            coordinates: typeof row.coordinates === 'string' ? JSON.parse(row.coordinates) : row.coordinates
        }));
    }

    static async getSavedIds(userId) {
        const [rows] = await db.execute(
            'SELECT listing_id FROM saved_listings WHERE user_id = ?',
            [userId]
        );
        return rows.map(row => row.listing_id);
    }
}

module.exports = SavedListing;
