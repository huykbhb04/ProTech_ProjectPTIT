const db = require('../src/config/database');

async function migrate() {
    try {
        console.log('Starting migration: adding status column...');
        await db.execute("ALTER TABLE users ADD COLUMN status ENUM('active', 'blocked') DEFAULT 'active' AFTER role");
        console.log('Successfully added status column to users table');
    } catch (err) {
        if (err.code === 'ER_DUP_COLUMN') {
            console.log('Column status already exists');
        } else {
            console.error('Migration failed:', err.message);
        }
    } finally {
        process.exit(0);
    }
}

migrate();
