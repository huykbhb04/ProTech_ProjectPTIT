const db = require('./src/config/database');
const bcrypt = require('bcrypt');

async function seed() {
    try {
        console.log('--- Bắt đầu tạo dữ liệu mẫu ---');

        // 1. Tạo Landlord (Nếu chưa có)
        const [landlords] = await db.execute('SELECT user_id FROM users WHERE email = ?', ['landlord@demo.com']);
        let landlordId;
        if (landlords.length === 0) {
            const hash = await bcrypt.hash('123456', 10);
            const [res] = await db.execute(
                'INSERT INTO users (full_name, email, password_hash, role, phone_number) VALUES (?, ?, ?, ?, ?)',
                ['Landlord Demo', 'landlord@demo.com', hash, 'landlord', '0987654321']
            );
            landlordId = res.insertId;
            console.log('Vừa tạo Landlord ID:', landlordId);
        } else {
            landlordId = landlords[0].user_id;
            console.log('Landlord đã tồn tại ID:', landlordId);
        }

        // 2. Tạo Tòa nhà
        const [buildingRes] = await db.execute(
            'INSERT INTO buildings (landlord_id, name, address_full, type, description, total_floors) VALUES (?, ?, ?, ?, ?, ?)',
            [landlordId, 'Tòa nhà Demo Luxury', '123 Đường ABC, Quận 1, TP.HCM', 'apartment', 'Khu chung cư cao cấp cho demo', 10]
        );
        const buildingId = buildingRes.insertId;
        console.log('Đã tạo Tòa nhà ID:', buildingId);

        // 3. Tạo Phòng (Occupied)
        const [roomRes] = await db.execute(
            'INSERT INTO rooms (building_id, room_number, floor, area, base_price, status, description, amenities) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [buildingId, '999', 9, 35.5, 5500000, 'occupied', 'Phòng demo có đầy đủ nội thất', JSON.stringify(['Wifi', 'Điều hòa', 'Tủ lạnh'])]
        );
        const roomId = roomRes.insertId;
        console.log('Đã tạo Phòng ID:', roomId);

        // 4. Tạo Tenant (Khách thuê)
        const [tenants] = await db.execute('SELECT user_id FROM users WHERE email = ?', ['tenant@demo.com']);
        let tenantId;
        if (tenants.length === 0) {
            const hash = await bcrypt.hash('123456', 10);
            const [res] = await db.execute(
                'INSERT INTO users (full_name, email, password_hash, role, phone_number, avatar_url) VALUES (?, ?, ?, ?, ?, ?)',
                ['Nguyễn Văn A (Demo)', 'tenant@demo.com', hash, 'tenant', '0912345678', 'https://i.pravatar.cc/150?u=tenant@demo.com']
            );
            tenantId = res.insertId;
            console.log('Đã tạo Tenant ID:', tenantId);
        } else {
            tenantId = tenants[0].user_id;
            console.log('Tenant đã tồn tại ID:', tenantId);
        }

        // 5. Tạo Cấu hình giá Dịch vụ
        await db.execute('INSERT INTO utility_configs (landlord_id, type, name, price) VALUES (?, ?, ?, ?)', [landlordId, 'electricity', 'Điện dân dụng', 3500.00]);
        await db.execute('INSERT INTO utility_configs (landlord_id, type, name, price) VALUES (?, ?, ?, ?)', [landlordId, 'water', 'Nước sạch', 18000.00]);
        console.log('Đã tạo Utility Configs');

        // 6. Tạo Hợp đồng
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(startDate.getFullYear() + 1);

        const defaultTerms = {
            terms: [
                "Bên B có trách nhiệm thanh toán tiền thuê đúng hạn.",
                "Bên B phải giữ gìn vệ sinh chung và bảo quản tài sản trong phòng.",
                "Không được nuôi động vật gây ồn ào hoặc mất vệ sinh.",
                "Báo trước 30 ngày nếu muốn chấm dứt hợp đồng trước thời hạn.",
                "Tiền cọc sẽ được hoàn trả sau khi trừ các chi phí sửa chữa hư hại (nếu có)."
            ]
        };

        await db.execute(
            'INSERT INTO contracts (tenant_id, room_id, start_date, end_date, deposit_amount, monthly_price, status, contract_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [tenantId, roomId, startDate, endDate, 11000000, 5500000, 'active', JSON.stringify(defaultTerms)]
        );
        console.log('Đã tạo Hợp đồng Active');

        // 7. Tạo Chỉ số Điện Nước (Lần cuối)
        await db.execute(
            'INSERT INTO service_readings (room_id, record_date, service_type, old_index, new_index) VALUES (?, ?, ?, ?, ?)',
            [roomId, new Date(), 'electricity', 1000, 1050]
        );
        await db.execute(
            'INSERT INTO service_readings (room_id, record_date, service_type, old_index, new_index) VALUES (?, ?, ?, ?, ?)',
            [roomId, new Date(), 'water', 200, 210]
        );
        console.log('Đã tạo Service Readings');

        // 8. Tạo Tài sản (Assets)
        await db.execute(
            'INSERT INTO room_assets (room_id, item_name, condition_status, last_check_date) VALUES (?, ?, ?, ?)',
            [roomId, 'Máy lạnh Daikin', 'good', new Date('2025-12-01')]
        );
        await db.execute(
            'INSERT INTO room_assets (room_id, item_name, condition_status, last_check_date) VALUES (?, ?, ?, ?)',
            [roomId, 'Tủ lạnh Samsung 200L', 'new', new Date('2026-01-05')]
        );
        await db.execute(
            'INSERT INTO room_assets (room_id, item_name, condition_status) VALUES (?, ?, ?)',
            [roomId, 'Giường gỗ sồi', 'good']
        );
        console.log('Đã tạo Room Assets');

        // 9. Tạo Yêu cầu Sửa chữa (Maintenance)
        await db.execute(
            'INSERT INTO maintenance_requests (room_id, tenant_id, issue_description, ai_severity, status) VALUES (?, ?, ?, ?, ?)',
            [roomId, tenantId, 'Vòi nước bị rò rỉ nhẹ ở bồn rửa mặt', 'low', 'open']
        );
        console.log('Đã tạo Maintenance Request');

        console.log('--- HOÀN TẤT SEED DỮ LIỆU ---');
        process.exit(0);

    } catch (error) {
        console.error('Lỗi khi seed dữ liệu:', error);
        process.exit(1);
    }
}

seed();
