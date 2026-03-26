const db = require('./src/config/database');
const bcrypt = require('bcrypt');

async function seedBillingTest() {
    try {
        console.log('--- Bắt đầu tạo dữ liệu test Billing System ---');

        // 1. Create Landlord with Bank Info
        const [landlords] = await db.execute('SELECT user_id FROM users WHERE email = ?', ['landlord_billing@test.com']);
        let landlordId;
        if (landlords.length === 0) {
            const hash = await bcrypt.hash('123456', 10);
            const [res] = await db.execute(
                `INSERT INTO users (full_name, email, password_hash, role, phone_number, bank_name, bank_account_number, bank_account_name) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                ['Chủ nhà Test Billing', 'landlord_billing@test.com', hash, 'landlord', '0999888777', 'MBBank', '9999888777', 'NGUYEN VAN CHU NHA']
            );
            landlordId = res.insertId;
            console.log('✅ Created Landlord:', landlordId);
        } else {
            landlordId = landlords[0].user_id;
            console.log('ℹ️ Landlord exists:', landlordId);
        }

        // 2. Create Building
        const [buildings] = await db.execute('SELECT building_id FROM buildings WHERE name = ?', ['Apartment Billing Test']);
        let buildingId;
        if (buildings.length === 0) {
            const [res] = await db.execute(
                'INSERT INTO buildings (landlord_id, name, address_full, type, description, total_floors) VALUES (?, ?, ?, ?, ?, ?)',
                [landlordId, 'Apartment Billing Test', '888 Test Street, HCM', 'apartment', 'Building for billing tests', 5]
            );
            buildingId = res.insertId;
            console.log('✅ Created Building:', buildingId);
        } else {
            buildingId = buildings[0].building_id;
            console.log('ℹ️ Building exists:', buildingId);
        }

        // 3. Create Contract & Utility Configs
        // Create Utility Configs for this landlord if not exist
        await db.execute('DELETE FROM utility_configs WHERE landlord_id = ?', [landlordId]);
        await db.execute('INSERT INTO utility_configs (landlord_id, type, name, price) VALUES (?, ?, ?, ?)', [landlordId, 'electricity', 'Điện', 3500]);
        await db.execute('INSERT INTO utility_configs (landlord_id, type, name, price) VALUES (?, ?, ?, ?)', [landlordId, 'water', 'Nước', 18000]);
        console.log('✅ Created Utility Configs');

        // 4. Create Tenant
        const [tenants] = await db.execute('SELECT user_id FROM users WHERE email = ?', ['tenant_billing@test.com']);
        let tenantId;
        if (tenants.length === 0) {
            const hash = await bcrypt.hash('123456', 10);
            const [res] = await db.execute(
                'INSERT INTO users (full_name, email, password_hash, role, phone_number) VALUES (?, ?, ?, ?, ?)',
                ['Nguyễn Văn Tenant', 'tenant_billing@test.com', hash, 'tenant', '0911222333']
            );
            tenantId = res.insertId;
            console.log('✅ Created Tenant:', tenantId);
        } else {
            tenantId = tenants[0].user_id;
            console.log('ℹ️ Tenant exists:', tenantId);
        }

        // 5. Create Room & Contract
        // We'll create a new room '101'
        let roomId;
        const [rooms] = await db.execute('SELECT room_id FROM rooms WHERE building_id = ? AND room_number = ?', [buildingId, '101']);

        if (rooms.length === 0) {
            const [res] = await db.execute(
                'INSERT INTO rooms (building_id, room_number, floor, area, base_price, status) VALUES (?, ?, ?, ?, ?, ?)',
                [buildingId, '101', 1, 30, 5000000, 'occupied']
            );
            roomId = res.insertId;
            console.log('✅ Created Room 101:', roomId);
        } else {
            roomId = rooms[0].room_id;
            // Update status to occupied just in case
            await db.execute("UPDATE rooms SET status = 'occupied' WHERE room_id = ?", [roomId]);
            console.log('ℹ️ Room 101 exists:', roomId);
        }

        // Check active contract
        const [contracts] = await db.execute('SELECT contract_id FROM contracts WHERE room_id = ? AND status = "active"', [roomId]);
        let contractId;

        if (contracts.length === 0) {
            const [res] = await db.execute(
                `INSERT INTO contracts (tenant_id, room_id, start_date, end_date, deposit_amount, monthly_price, status, handover_electricity_index, handover_water_index, handover_date) 
                 VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 10000000, 5000000, 'active', 1000, 500, CURDATE())`,
                [tenantId, roomId]
            );
            contractId = res.insertId;
            console.log('✅ Created Active Contract:', contractId);
        } else {
            contractId = contracts[0].contract_id;
            console.log('ℹ️ Active Contract exists:', contractId);
        }

        // 6. Create BILL for THIS MONTH (Pending)
        // Check if bill exists
        const month = new Date();
        month.setDate(1); // 1st of this month
        // Format YYYY-MM-DD
        const monthStr = month.toISOString().split('T')[0];

        const [bills] = await db.execute('SELECT bill_id FROM bills WHERE contract_id = ? AND billing_month = ?', [contractId, monthStr]);

        if (bills.length === 0) {
            // Need to insert bills
            const [res] = await db.execute(
                `INSERT INTO bills (contract_id, room_id, billing_month, due_date, room_rent, electricity_old, water_old, status)
                 VALUES (?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 5000000, 1000, 500, 'pending')`,
                [contractId, roomId, monthStr]
            );
            console.log('✅ Created Pending Bill:', res.insertId);
        } else {
            // Reset bill to pending and clear new readings for testing
            await db.execute(`
                UPDATE bills 
                SET status = 'pending', 
                    electricity_new = NULL, water_new = NULL, 
                    electricity_image_url = NULL, water_image_url = NULL,
                    payment_proof_url = NULL,
                    total_amount = 0
                WHERE bill_id = ?`,
                [bills[0].bill_id]
            );
            console.log('🔄 Reset Bill to Pending for testing:', bills[0].bill_id);
        }

        console.log('\n---------------------------------------------------');
        console.log('🎉 DỮ LIỆU TEST ĐÃ SẴN SÀNG!');
        console.log('👉 Tenant Login:  tenant_billing@test.com / 123456');
        console.log('👉 Landlord Login: landlord_billing@test.com / 123456');
        console.log('---------------------------------------------------');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding billing test data:', error);
        process.exit(1);
    }
}

seedBillingTest();
