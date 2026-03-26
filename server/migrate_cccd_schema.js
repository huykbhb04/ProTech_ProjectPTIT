const db = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('Starting CCCD schema migration...\n');

        const sqlPath = path.join(__dirname, 'database', 'update_contract_cccd_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(s => s.trim());

        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.substring(0, 60) + '...');
                await db.execute(statement);
            }
        }

        console.log('\n✅ CCCD schema migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
