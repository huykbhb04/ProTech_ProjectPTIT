const db = require('./src/config/database');

async function checkSchema() {
    try {
        const [rows] = await db.execute('DESCRIBE users');
        console.log('--- Users Table ---');
        rows.forEach(row => console.log(row.Field));

        console.log('\n--- Bills Table ---');
        const [billRows] = await db.execute('DESCRIBE bills');
        billRows.forEach(row => console.log(row.Field));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkSchema();
