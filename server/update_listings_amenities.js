const db = require('./src/config/database');

async function migrate() {
    try {
        console.log('Adding amenities column to room_listings...');
        await db.execute('ALTER TABLE room_listings ADD COLUMN amenities JSON AFTER deposit_amount');
        console.log('Done!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
