const db = require('./src/config/database');

async function checkTimezoneAndData() {
    try {
        console.log('--- Timezone Diagnosis ---');
        const [rows] = await db.execute('SELECT NOW() as db_now, CURTIME() as db_time, @@global.time_zone as global_tz, @@session.time_zone as session_tz');
        console.log('Database NOW():', rows[0].db_now);
        console.log('Database Timezone:', rows[0].session_tz);
        console.log('Server (JS) Date:', new Date());
        console.log('Server (JS) Local String:', new Date().toLocaleString());

        console.log('\n--- Expired Listings Check ---');
        // Fetch listings that MIGHT be expired but are marked active
        const [listings] = await db.execute(`
            SELECT listing_id, title, status, expires_at,
                   NOW() as db_current_time,
                   (expires_at > NOW()) as is_not_expired_db_check,
                   TIMESTAMPDIFF(MINUTE, NOW(), expires_at) as minutes_until_expiry
            FROM room_listings 
            WHERE status = 'active' 
            AND expires_at IS NOT NULL
            ORDER BY expires_at ASC
            LIMIT 5
        `);

        console.table(listings);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkTimezoneAndData();
