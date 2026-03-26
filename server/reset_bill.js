const db = require('./src/config/database');

async function resetBill() {
    try {
        console.log('--- RESETTING BILL STATUS FOR TESTING ---');

        // 1. Find the most recent bill
        const [bills] = await db.execute('SELECT * FROM bills ORDER BY bill_id DESC LIMIT 1');
        if (bills.length === 0) {
            console.log('No bills found');
            return;
        }
        const billId = bills[0].bill_id;
        console.log(`Resetting Bill ID: ${billId}`);

        // 2. Reset status to 'confirmed' (Ready for payment)
        // Clear payment info
        const query = `
            UPDATE bills 
            SET status = 'confirmed',
                payment_proof_url = NULL,
                payment_method = NULL,
                payment_note = NULL,
                transaction_ref = NULL,
                paid_at = NULL,
                confirmed_by = NULL
            WHERE bill_id = ?
        `;

        await db.execute(query, [billId]);
        console.log('✅ Bill reset to CONFIRMED status. Payment info cleared.');

        process.exit(0);
    } catch (error) {
        console.error('Error resetting bill:', error);
        process.exit(1);
    }
}

resetBill();
