const db = require('./src/config/database');

async function addColumns() {
    try {
        console.log('--- ADDING COLUMNS TO ROOMS TABLE ---');

        // Check if columns exist first to avoid error (optional but good practice, or just try catch)
        try {
            await db.execute('ALTER TABLE rooms ADD COLUMN next_cleaning_date DATE DEFAULT NULL');
            console.log('Added next_cleaning_date');
        } catch (e) {
            console.log('next_cleaning_date might already exist or error:', e.message);
        }

        try {
            await db.execute('ALTER TABLE rooms ADD COLUMN next_maintenance_date DATE DEFAULT NULL');
            console.log('Added next_maintenance_date');
        } catch (e) {
            console.log('next_maintenance_date might already exist or error:', e.message);
        }

        console.log('✅ Schema update completed.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    }
}

addColumns();
