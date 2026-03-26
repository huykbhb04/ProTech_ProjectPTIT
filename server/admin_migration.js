const db = require('./src/config/database');
const bcrypt = require('bcrypt');

async function runAdminMigration() {
    const connection = await db.getConnection();

    try {
        console.log('Starting Admin Migration...\n');

        // 1. Update users table to support admin role
        console.log('1. Updating users table role ENUM...');
        await connection.execute(`
            ALTER TABLE users 
            MODIFY COLUMN role ENUM('landlord', 'tenant', 'admin') DEFAULT 'tenant'
        `);
        console.log('✓ Role ENUM updated successfully\n');

        // 2. Create demo admin account
        console.log('2. Creating demo admin account...');
        const adminEmail = 'admin@smartproptech.com';
        const adminPassword = 'admin123'; // Demo password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Check if admin already exists
        const [existingAdmin] = await connection.execute(
            'SELECT user_id FROM users WHERE email = ?',
            [adminEmail]
        );

        if (existingAdmin.length > 0) {
            console.log('⚠ Admin account already exists, updating password...');
            await connection.execute(
                'UPDATE users SET password_hash = ?, role = ? WHERE email = ?',
                [hashedPassword, 'admin', adminEmail]
            );
        } else {
            await connection.execute(`
                INSERT INTO users (email, password_hash, full_name, phone_number, role, wallet_balance, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `, [adminEmail, hashedPassword, 'Admin Demo', '0900000000', 'admin', 0]);
        }

        console.log('✓ Admin account created/updated successfully');
        console.log(`  Email: ${adminEmail}`);
        console.log(`  Password: ${adminPassword}`);
        console.log('');

        // 3. Verify monetization tables exist
        console.log('3. Verifying monetization tables...');
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME IN ('listing_packages', 'premium_services', 'listing_payments')
        `);

        const tableNames = tables.map(t => t.TABLE_NAME);
        console.log(`✓ Found tables: ${tableNames.join(', ')}\n`);

        if (tableNames.length !== 3) {
            console.log('⚠ Warning: Some monetization tables are missing. Run monetization_migration.js first.');
        }

        console.log('✅ Admin migration completed successfully!\n');
        console.log('You can now login with:');
        console.log(`  Email: ${adminEmail}`);
        console.log(`  Password: ${adminPassword}`);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        connection.release();
        process.exit(0);
    }
}

runAdminMigration();
