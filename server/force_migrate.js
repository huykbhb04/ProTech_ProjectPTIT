const db = require('./src/config/database');
const fs = require('fs');

async function forceMigrate() {
    try {
        console.log('🚀 Force Migration Started...');

        // 0. Disable foreign key checks
        await db.execute('SET FOREIGN_KEY_CHECKS = 0');

        // 1. Drop bills table
        console.log('Dropping bills table...');
        try {
            await db.execute('DROP TABLE IF EXISTS bills');
        } catch (e) {
            console.error('Error dropping bills:', e.message);
        }

        // 2. Recreate bills table (Get content from file)
        const sql = fs.readFileSync('./database/create_billing_system.sql', 'utf8');

        // Extract CREATE TABLE bills statement
        // Easier: just replace split logic or run key parts manually
        // We know the file structure, let's just run the CREATE TABLE matching regex

        const createTableMatch = sql.match(/CREATE TABLE bills \([\s\S]*?\)(?: COMMENT='.*?')?;/);
        if (createTableMatch) {
            console.log('Recreating bills table...');
            await db.execute(createTableMatch[0]);
            console.log('✅ Bills table recreated');
        } else {
            console.error('❌ Could not find CREATE TABLE bills statement');
        }

        // 3. Alter Users table
        console.log('Altering users table...');
        const userCols = ['bank_name', 'bank_account_number', 'bank_account_name', 'auto_approve_bills'];
        for (const col of userCols) {
            try {
                // Check if exists
                const [rows] = await db.execute(`SHOW COLUMNS FROM users LIKE '${col}'`);
                if (rows.length === 0) {
                    let query = '';
                    if (col === 'bank_name') query = "ALTER TABLE users ADD COLUMN bank_name VARCHAR(100) AFTER phone_number";
                    if (col === 'bank_account_number') query = "ALTER TABLE users ADD COLUMN bank_account_number VARCHAR(50) AFTER bank_name";
                    if (col === 'bank_account_name') query = "ALTER TABLE users ADD COLUMN bank_account_name VARCHAR(255) AFTER bank_account_number";
                    if (col === 'auto_approve_bills') query = "ALTER TABLE users ADD COLUMN auto_approve_bills BOOLEAN DEFAULT FALSE";

                    if (query) {
                        await db.execute(query);
                        console.log(`✅ Added column ${col}`);
                    }
                } else {
                    console.log(`ℹ️ Column ${col} already exists`);
                }
            } catch (e) {
                console.error(`Error adding ${col}:`, e.message);
            }
        }

        // 4. Create bill_notifications
        console.log('Creating bill_notifications table...');
        try {
            const notiMatch = sql.match(/CREATE TABLE IF NOT EXISTS bill_notifications \([\s\S]*?\)(?: COMMENT='.*?')?;/);
            if (notiMatch) {
                await db.execute(notiMatch[0]);
                console.log('✅ Bill_notifications table checked/created');
            }
        } catch (e) {
            console.error('Error creating bill_notifications:', e.message);
        }

        console.log('✨ Force Migration Completed');
        process.exit(0);

    } catch (error) {
        console.error('Migration Fatal Error:', error);
        process.exit(1);
    }
}

forceMigrate();
