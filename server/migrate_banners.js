const db = require('./src/config/database');
async function run() {
    try {
        await db.query(`ALTER TABLE banner_requests ADD COLUMN display_style VARCHAR(50) DEFAULT 'default' AFTER type`);
        await db.query(`ALTER TABLE banner_requests ADD COLUMN priority INT DEFAULT 0 AFTER display_style`);
        console.log('Migration successful: added display_style and priority');
    } catch (e) {
        console.log('Migration status:', e.message);
    } finally {
        process.exit(0);
    }
}
run();
