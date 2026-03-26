const db = require('./src/config/database');

async function migrate() {
    try {
        console.log('Starting migration...');

        // Add max_occupants column if not exists
        try {
            await db.execute(`
                ALTER TABLE room_listings 
                ADD COLUMN max_occupants INT DEFAULT 1;
            `);
            console.log('Added max_occupants column.');
        } catch (e) {
            console.log('max_occupants column may already exist:', e.message);
        }

        // Add allow_pets column if not exists
        try {
            await db.execute(`
                ALTER TABLE room_listings 
                ADD COLUMN allow_pets BOOLEAN DEFAULT FALSE;
            `);
            console.log('Added allow_pets column.');
        } catch (e) {
            console.log('allow_pets column may already exist:', e.message);
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
