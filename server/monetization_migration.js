const db = require('./src/config/database');

async function migrate() {
    try {
        console.log('Starting monetization migration...');

        // 1. Create listing_packages table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS listing_packages (
                package_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                duration_days INT NOT NULL,
                price DECIMAL(12,2) NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE
            )
        `);
        console.log('Table listing_packages created or already exists.');

        // 2. Create premium_services table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS premium_services (
                service_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price_per_day DECIMAL(12,2) NOT NULL,
                badge_type VARCHAR(50),
                is_active BOOLEAN DEFAULT TRUE
            )
        `);
        console.log('Table premium_services created or already exists.');

        // 3. Create listing_payments table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS listing_payments (
                payment_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                listing_id INT,
                amount DECIMAL(15,2) NOT NULL,
                payment_method ENUM('vietqr', 'momo', 'wallet') DEFAULT 'vietqr',
                payment_type ENUM('package', 'premium_service', 'wallet_topup') NOT NULL,
                reference_id INT,
                status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
                transaction_ref VARCHAR(255),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id),
                FOREIGN KEY (listing_id) REFERENCES room_listings(listing_id)
            )
        `);
        console.log('Table listing_payments created or already exists.');

        // 4. Update room_listings table
        const [columns] = await db.execute('SHOW COLUMNS FROM room_listings');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('expires_at')) {
            await db.execute('ALTER TABLE room_listings ADD COLUMN expires_at DATETIME');
            console.log('Column expires_at added to room_listings.');
        }
        if (!columnNames.includes('package_id')) {
            await db.execute('ALTER TABLE room_listings ADD COLUMN package_id INT');
            await db.execute('ALTER TABLE room_listings ADD FOREIGN KEY (package_id) REFERENCES listing_packages(package_id)');
            console.log('Column package_id added to room_listings.');
        }
        if (!columnNames.includes('premium_until')) {
            await db.execute('ALTER TABLE room_listings ADD COLUMN premium_until DATETIME');
            console.log('Column premium_until added to room_listings.');
        }
        if (!columnNames.includes('premium_service_id')) {
            await db.execute('ALTER TABLE room_listings ADD COLUMN premium_service_id INT');
            await db.execute('ALTER TABLE room_listings ADD FOREIGN KEY (premium_service_id) REFERENCES premium_services(service_id)');
            console.log('Column premium_service_id added to room_listings.');
        }

        // 5. Update users table for wallet balance
        const [userColumns] = await db.execute('SHOW COLUMNS FROM users');
        const userColumnNames = userColumns.map(c => c.Field);
        if (!userColumnNames.includes('wallet_balance')) {
            await db.execute('ALTER TABLE users ADD COLUMN wallet_balance DECIMAL(15,2) DEFAULT 0.00');
            console.log('Column wallet_balance added to users.');
        }

        // 6. Seed initial data
        const [packages] = await db.execute('SELECT COUNT(*) as count FROM listing_packages');
        if (packages[0].count === 0) {
            await db.execute(`
                INSERT INTO listing_packages (name, duration_days, price, description) VALUES
                ('Gói Cơ bản (30 ngày)', 30, 50000, 'Hiển thị tin đăng trong 30 ngày'),
                ('Gói Tiết kiệm (90 ngày)', 90, 135000, 'Hiển thị tin đăng trong 90 ngày (tiết kiệm 10%)'),
                ('Gói Dài hạn (180 ngày)', 180, 250000, 'Hiển thị tin đăng trong 180 ngày (tiết kiệm 20%)')
            `);
            console.log('Initial listing packages seeded.');
        }

        const [services] = await db.execute('SELECT COUNT(*) as count FROM premium_services');
        if (services[0].count === 0) {
            await db.execute(`
                INSERT INTO premium_services (name, description, price_per_day, badge_type) VALUES
                ('Tin Nổi bật (Featured)', 'Gắn huy hiệu nổi bật và khung viền màu sắc', 5000, 'featured'),
                ('Đẩy tin Top (Top Ranking)', 'Luôn nằm ở trang đầu tiên trong kết quả tìm kiếm', 10000, 'top_rank'),
                ('Combo Super VIP', 'Bao gồm cả Tin nổi bật và Đẩy tin Top', 12000, 'super_vip')
            `);
            console.log('Initial premium services seeded.');
        }

        console.log('Monetization migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
