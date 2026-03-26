const db = require('./src/config/database');

async function migrate() {
    try {
        console.log('Adding utility price columns to room_listings table...');
        await db.execute('ALTER TABLE room_listings ADD COLUMN electricity_price DECIMAL(10,2) DEFAULT 0 AFTER deposit_amount');
        await db.execute('ALTER TABLE room_listings ADD COLUMN water_price DECIMAL(10,2) DEFAULT 0 AFTER electricity_price');
        await db.execute('ALTER TABLE room_listings ADD COLUMN service_price DECIMAL(10,2) DEFAULT 0 AFTER water_price');
        console.log('Done!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
