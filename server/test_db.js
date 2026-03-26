const db = require('./src/config/database');

async function test() {
    try {
        console.log('Testing connection...');
        const [rows] = await db.execute('SELECT 1');
        console.log('Connection OK:', rows);

        console.log('Checking room_listings table...');
        const [tableInfo] = await db.execute('DESCRIBE room_listings');
        console.log('Table Info:', tableInfo);

        console.log('Checking rooms table...');
        const [roomInfo] = await db.execute('DESCRIBE rooms');
        console.log('Room Info:', roomInfo);

        process.exit(0);
    } catch (err) {
        console.error('TEST FAILED:', err);
        process.exit(1);
    }
}

test();
