const db = require('./src/config/database');

async function fix() {
    console.log('--- FINAL DATABASE FIX ---');
    console.log('Target Database:', process.env.DB_NAME || 'init_schema');

    try {
        // 1. Fix notifications table
        console.log('Checking notifications table...');
        const [notifCols] = await db.execute('SHOW COLUMNS FROM notifications');

        if (!notifCols.find(c => c.Field === 'created_at')) {
            console.log('Adding missing created_at column to notifications...');
            await db.execute('ALTER TABLE notifications ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
        } else {
            console.log('created_at column already exists in notifications.');
        }

        console.log('Updating notifications type enum...');
        await db.execute("ALTER TABLE notifications MODIFY COLUMN type ENUM('bill', 'alert', 'system', 'booking') NOT NULL");

        // 2. Fix bookings table
        console.log('Ensuring bookings table structure is correct...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS bookings (
                booking_id INT AUTO_INCREMENT PRIMARY KEY,
                room_id INT NOT NULL,
                tenant_id INT NOT NULL,
                booking_date DATE NOT NULL,
                booking_time TIME NOT NULL,
                status ENUM('pending', 'confirmed', 'rejected', 'cancelled') DEFAULT 'pending',
                lead_person_name VARCHAR(100),
                lead_person_phone VARCHAR(15),
                landlord_notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
                FOREIGN KEY (tenant_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        `);

        console.log('--- Database fix completed successfully! ---');
        process.exit(0);
    } catch (e) {
        console.error('Error fixing database:', e.message);
        process.exit(1);
    }
}

fix();
