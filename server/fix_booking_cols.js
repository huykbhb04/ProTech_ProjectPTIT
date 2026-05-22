const db = require('./src/config/database');

async function checkAndFix() {
    const [cols] = await db.execute('SHOW COLUMNS FROM bookings');
    console.log('ALL COLUMNS:', cols.map(c => c.Field));
    
    const required = ['payment_status', 'payment_date', 'deposit_amount', 'commission_rate', 'commission_amount', 'payout_status', 'payout_date'];
    const existing = cols.map(c => c.Field);
    
    const missing = required.filter(c => !existing.includes(c));
    console.log('MISSING:', missing);
    
    for (const col of missing) {
        let def;
        if (col === 'payment_status') def = "ENUM('pending','paid','failed') DEFAULT 'pending'";
        else if (col === 'payment_date') def = 'DATETIME';
        else if (col === 'payout_status') def = "ENUM('pending','paid') DEFAULT 'pending'";
        else if (col === 'payout_date') def = 'DATETIME';
        else if (col === 'deposit_amount') def = 'DECIMAL(15,2) DEFAULT 0';
        else if (col === 'commission_rate') def = 'DECIMAL(5,2) DEFAULT 0';
        else if (col === 'commission_amount') def = 'DECIMAL(15,2) DEFAULT 0';

        console.log('Adding column:', col, 'with type:', def);
        await db.execute('ALTER TABLE bookings ADD COLUMN ' + col + ' ' + def);
        console.log('Added:', col);
    }

    // Now check bookings status ENUM
    const statusRow = cols.find(c => c.Field === 'status');
    console.log('STATUS TYPE:', statusRow ? statusRow.Type : 'not found');
    
    // Try the actual confirm query on booking 2
    try {
        await db.execute('UPDATE bookings SET payment_status = "paid", payment_date = NOW(), status = "deposited" WHERE booking_id = 2');
        console.log('UPDATE SUCCESS!');
    } catch(e) {
        console.error('UPDATE FAILED:', e.message);
    }
    
    process.exit(0);
}

checkAndFix().catch(e => { console.error(e); process.exit(1); });
