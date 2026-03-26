const db = require('./src/config/database');

async function debugListings() {
    try {
        console.log('Debugging Active Listings...');
        const now = new Date();
        console.log('JS Time:', now.toISOString());
        console.log('JS Locale Time:', now.toLocaleString());

        const [rows] = await db.execute(`
            SELECT 
                listing_id, 
                title, 
                expires_at, 
                IF(expires_at > NOW(), 'VALID', 'EXPIRED') as db_check,
                IF(expires_at > ?, 'VALID', 'EXPIRED') as js_param_check,
                UNIX_TIMESTAMP(expires_at) as expiry_ts,
                UNIX_TIMESTAMP(?) as current_ts
            FROM room_listings 
            WHERE status = 'active'
            LIMIT 5
        `, [now, now]);

        console.table(rows);
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

debugListings();
