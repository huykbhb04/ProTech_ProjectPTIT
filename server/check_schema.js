const db = require('./src/config/database');
async function checkSchema() {
    try {
        const [columns] = await db.query('SHOW COLUMNS FROM bookings');
        console.log(JSON.stringify(columns, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
checkSchema();
