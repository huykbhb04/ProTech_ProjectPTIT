const db = require('./src/config/database');

async function migrate() {
    try {
        console.log('Adding utility price columns to rooms table...');
        await db.execute('ALTER TABLE rooms ADD COLUMN electricity_price DECIMAL(10,2) DEFAULT 0 AFTER base_price');
        await db.execute('ALTER TABLE rooms ADD COLUMN water_price DECIMAL(10,2) DEFAULT 0 AFTER electricity_price');
        await db.execute('ALTER TABLE rooms ADD COLUMN service_price DECIMAL(10,2) DEFAULT 0 AFTER water_price');
        console.log('Done!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
