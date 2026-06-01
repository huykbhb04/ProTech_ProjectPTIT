const db = require('../src/config/database');

const seedData = async () => {
    try {
        console.log("Starting to seed test tenant contracts and bills...");

        // 1. Update roles of test users to 'tenant'
        await db.execute("UPDATE users SET role = 'tenant' WHERE user_id IN (46, 47)");
        console.log("Updated users 46 & 47 to 'tenant' role.");

        // 2. Clean up any existing contracts and bills for these test users
        // Get contract IDs first
        const [contracts] = await db.execute("SELECT contract_id FROM contracts WHERE tenant_id IN (46, 47)");
        const contractIds = contracts.map(c => c.contract_id);
        
        if (contractIds.length > 0) {
            const placeholders = contractIds.map(() => '?').join(',');
            await db.execute(`DELETE FROM bills WHERE contract_id IN (${placeholders})`, contractIds);
            await db.execute(`DELETE FROM contracts WHERE contract_id IN (${placeholders})`, contractIds);
            console.log(`Cleaned up ${contractIds.length} existing contracts and their bills.`);
        }

        // 3. Mark rooms 127 and 128 as 'occupied'
        await db.execute("UPDATE rooms SET status = 'occupied' WHERE room_id IN (127, 128)");
        console.log("Set room 127 & 128 status to 'occupied'.");

        const contractContent = JSON.stringify({
            terms: [
                "Bên B có trách nhiệm thanh toán tiền thuê đúng hạn.",
                "Bên B phải giữ gìn vệ sinh chung và bảo quản tài sản trong phòng.",
                "Không được nuôi động vật gây ồn ào hoặc mất vệ sinh.",
                "Báo trước 30 ngày nếu muốn chấm dứt hợp đồng trước thời hạn.",
                "Tiền cọc sẽ được hoàn trả sau khi trừ các chi phí sửa chữa hư hại (nếu có)."
            ]
        });
        const serviceCommitments = JSON.stringify({
            electricity: { price: 3500 },
            water: { price: 20000 }
        });
        const additionalServices = JSON.stringify({
            internet: 100000,
            garbage: 50000
        });

        // 4. Create Contract A for User 46 (Room 127)
        const [resA] = await db.execute(`
            INSERT INTO contracts (
                tenant_id, landlord_id, room_id, start_date, end_date, 
                deposit_amount, monthly_price, status, contract_content, 
                service_commitments, additional_services, terms_accepted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
            46, 40, 127, '2026-01-01', '2027-01-01', 
            3500000.00, 3500000.00, 'active', contractContent,
            serviceCommitments, additionalServices
        ]);
        const contractAId = resA.insertId;
        console.log(`Created active contract A (ID: ${contractAId}) for user 46 (Room 127).`);

        // 5. Create Contract B for User 47 (Room 128)
        const [resB] = await db.execute(`
            INSERT INTO contracts (
                tenant_id, landlord_id, room_id, start_date, end_date, 
                deposit_amount, monthly_price, status, contract_content, 
                service_commitments, additional_services, terms_accepted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
            47, 40, 128, '2026-01-01', '2027-01-01', 
            3550000.00, 3550000.00, 'active', contractContent,
            serviceCommitments, additionalServices
        ]);
        const contractBId = resB.insertId;
        console.log(`Created active contract B (ID: ${contractBId}) for user 47 (Room 128).`);

        // 6. Create Bills for Contract A (Room 127, User 46)
        // Bill A1: May 2026 (Paid)
        await db.execute(`
            INSERT INTO bills (
                contract_id, room_id, billing_month, 
                electricity_old, electricity_new, electricity_consumption, electricity_amount,
                water_old, water_new, water_consumption, water_amount,
                room_rent, service_fees, discount, total_amount, status, due_date, paid_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            contractAId, 127, '2026-05-01',
            100, 220, 120, 420000.00,
            50, 58, 8, 160000.00,
            3500000.00, additionalServices, 0.00, 4230000.00, 'paid', '2026-05-10', '2026-05-09 10:00:00'
        ]);

        // Bill A2: June 2026 (Confirmed/Unpaid)
        await db.execute(`
            INSERT INTO bills (
                contract_id, room_id, billing_month, 
                electricity_old, electricity_new, electricity_consumption, electricity_amount,
                water_old, water_new, water_consumption, water_amount,
                room_rent, service_fees, discount, total_amount, status, due_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            contractAId, 127, '2026-06-01',
            220, 350, 130, 455000.00,
            58, 68, 10, 200000.00,
            3500000.00, additionalServices, 0.00, 4305000.00, 'confirmed', '2026-06-10'
        ]);
        console.log("Seeded 2 bills for user 46 (Room 127).");

        // 7. Create Bills for Contract B (Room 128, User 47)
        // Bill B1: May 2026 (Paid)
        await db.execute(`
            INSERT INTO bills (
                contract_id, room_id, billing_month, 
                electricity_old, electricity_new, electricity_consumption, electricity_amount,
                water_old, water_new, water_consumption, water_amount,
                room_rent, service_fees, discount, total_amount, status, due_date, paid_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            contractBId, 128, '2026-05-01',
            150, 250, 100, 350000.00,
            40, 47, 7, 140000.00,
            3550000.00, additionalServices, 0.00, 4190000.00, 'paid', '2026-05-10', '2026-05-09 11:00:00'
        ]);

        // Bill B2: June 2026 (Confirmed/Unpaid)
        await db.execute(`
            INSERT INTO bills (
                contract_id, room_id, billing_month, 
                electricity_old, electricity_new, electricity_consumption, electricity_amount,
                water_old, water_new, water_consumption, water_amount,
                room_rent, service_fees, discount, total_amount, status, due_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            contractBId, 128, '2026-06-01',
            250, 370, 120, 420000.00,
            47, 56, 9, 180000.00,
            3550000.00, additionalServices, 0.00, 4300000.00, 'confirmed', '2026-06-10'
        ]);
        console.log("Seeded 2 bills for user 47 (Room 128).");

        console.log("Successfully seeded test data!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedData();
