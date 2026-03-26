const db = require('./src/config/database');

async function migrate() {
    const connection = await db.getConnection();

    try {
        console.log('🚀 Starting Billing System Migration...\n');

        await connection.beginTransaction();

        // Read migration file
        const fs = require('fs');
        const migrationSQL = fs.readFileSync('./database/create_billing_system.sql', 'utf8');

        // Split by semicolon and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`Executing statement ${i + 1}/${statements.length}...`);

            try {
                await connection.query(statement);
                console.log('✅ Success\n');
            } catch (err) {
                // Some statements might fail if already exists, that's ok
                if (err.code === 'ER_TABLE_EXISTS_ERROR' ||
                    err.code === 'ER_DUP_FIELDNAME' ||
                    err.message.includes('Duplicate column name')) {
                    console.log('⚠️  Already exists, skipping\n');
                } else {
                    throw err;
                }
            }
        }

        await connection.commit();

        console.log('\n✨ Migration completed successfully!');
        console.log('\nCreated/Updated:');
        console.log('  - bills table (with meter readings tracking)');
        console.log('  - bill_notifications table');
        console.log('  - users table (added bank info columns)');
        console.log('  - service_readings table (added bill_id reference)');

        process.exit(0);
    } catch (error) {
        await connection.rollback();
        console.error('\n❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        connection.release();
    }
}

migrate();
