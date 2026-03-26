const db = require('./src/config/database');

const sql = `
CREATE TABLE IF NOT EXISTS room_listings (
    listing_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    rent_price DECIMAL(12,2),
    deposit_amount DECIMAL(12,2),
    status ENUM('active', 'paused', 'closed') DEFAULT 'active',
    is_featured BOOLEAN DEFAULT FALSE,
    views INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE
);
`;

async function fix() {
    try {
        console.log('Creating room_listings table...');
        await db.execute(sql);
        console.log('Table created successfully!');

        console.log('Verifying table existence...');
        const [rows] = await db.execute('DESCRIBE room_listings');
        console.log('Verification Success:', rows);

        process.exit(0);
    } catch (err) {
        console.error('FIX FAILED:', err);
        process.exit(1);
    }
}

fix();
