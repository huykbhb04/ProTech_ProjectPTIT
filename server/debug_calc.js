const fs = require('fs');
const db = require('./src/config/database');
const Bill = require('./src/models/billModel');

async function debug() {
    let log = '';
    const logIt = (msg, obj) => {
        const str = msg + (obj ? ' ' + JSON.stringify(obj, null, 2) : '');
        console.log(str);
        log += str + '\n';
    };

    try {
        logIt('--- DEBUGGING BILL CALCULATION ---');

        // 1. Find the most recent bill
        const [bills] = await db.execute('SELECT * FROM bills ORDER BY bill_id DESC LIMIT 1');
        if (bills.length === 0) {
            logIt('No bills found');
            fs.writeFileSync('debug_log.txt', log);
            return;
        }
        const bill = bills[0];
        logIt('Found Bill:', {
            id: bill.bill_id,
            room_rent: bill.room_rent,
            total_amount: bill.total_amount,
            contract_id: bill.contract_id
        });

        // 2. Run Calculation
        logIt('Running calculateTotalAmount...');
        const newTotal = await Bill.calculateTotalAmount(bill.bill_id);
        logIt('Calculation Function Returned:', newTotal);

        // 3. Check DB again
        const [updatedBills] = await db.execute('SELECT * FROM bills WHERE bill_id = ?', [bill.bill_id]);
        const updatedBill = updatedBills[0];
        logIt('Updated Bill in DB:', {
            id: updatedBill.bill_id,
            total_amount: updatedBill.total_amount,
            electricity_amount: updatedBill.electricity_amount,
            water_amount: updatedBill.water_amount
        });

        fs.writeFileSync('debug_log.txt', log);
        process.exit(0);
    } catch (error) {
        logIt('Debug Error:', error.message);
        logIt('Stack:', error.stack);
        fs.writeFileSync('debug_log.txt', log);
        process.exit(1);
    }
}

debug();
