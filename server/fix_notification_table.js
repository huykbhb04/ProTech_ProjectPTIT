const db = require('./src/config/database');

async function fixNotificationTable() {
    console.log('--- Fixing Notifications Table ---');
    try {
        // 1. Add created_at if it doesn't exist
        const [columns] = await db.execute('SHOW COLUMNS FROM notifications');
        const hasCreatedAt = columns.some(col => col.Field === 'created_at');

        if (!hasCreatedAt) {
            console.log('Adding created_at column...');
            await db.execute('ALTER TABLE notifications ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
            console.log('Done: created_at column added.');
        } else {
            console.log('Skipped: created_at column already exists.');
        }

        // 2. Ensure type ENUM has 'booking'
        console.log('Updating notification types...');
        await db.execute("ALTER TABLE notifications MODIFY COLUMN type ENUM('bill', 'alert', 'system', 'booking') NOT NULL");
        console.log('Done: Notification types updated.');

        // 3. Ensure 'bookings' table exists
        console.log('Ensuring bookings table exists...');
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
        console.log('Done: Bookings table verified.');

        console.log('--- All fixes applied successfully! ---');
        process.exit(0);
    } catch (error) {
        console.error('Error applying fixes:', error);
        process.exit(1);
    }
}

fixNotificationTable();
