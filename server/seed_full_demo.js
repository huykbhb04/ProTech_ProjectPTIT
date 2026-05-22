const db = require('./src/config/database');
const bcrypt = require('bcrypt');

async function seed() {
    try {
        console.log('=== Bắt đầu seed dữ liệu demo ===');
        const hash = await bcrypt.hash('123456', 10);

        // ─── 1. LANDLORDS (5 chủ trọ) ───────────────────────────────────────
        const landlordData = [
            ['Nguyễn Minh Tuấn', 'tuannm@landlord.com', '0901111001', 500000],
            ['Trần Thị Hoa',     'hoatt@landlord.com',  '0901111002', 300000],
            ['Lê Văn Phúc',      'phucvl@landlord.com', '0901111003', 750000],
            ['Phạm Thị Lan',     'lanpt@landlord.com',  '0901111004', 200000],
            ['Vũ Đình Hùng',     'hungvd@landlord.com', '0901111005', 600000],
        ];
        const landlordIds = [];
        for (const [name, email, phone, wallet] of landlordData) {
            const [ex] = await db.execute('SELECT user_id FROM users WHERE email=?', [email]);
            if (ex.length) { landlordIds.push(ex[0].user_id); continue; }
            const [r] = await db.execute(
                `INSERT INTO users (full_name,email,password_hash,role,phone_number,wallet_balance,is_verified,bank_name,bank_account_number,bank_account_name)
                 VALUES (?,?,?,'landlord',?,?,1,'Vietcombank','1234567890',?)`,
                [name, email, hash, phone, wallet, name]
            );
            landlordIds.push(r.insertId);
            console.log('+ Landlord:', name, 'ID:', r.insertId);
        }

        // ─── 2. TENANTS (15 người thuê) ─────────────────────────────────────
        const tenantData = [
            ['Nguyễn Văn An',    'an.nv@tenant.com',    '0912000001'],
            ['Trần Thị Bình',    'binh.tt@tenant.com',  '0912000002'],
            ['Lê Hoàng Cường',   'cuong.lh@tenant.com', '0912000003'],
            ['Phạm Thị Dung',    'dung.pt@tenant.com',  '0912000004'],
            ['Võ Minh Đức',      'duc.vm@tenant.com',   '0912000005'],
            ['Nguyễn Thị Ém',    'em.nt@tenant.com',    '0912000006'],
            ['Trần Văn Phong',   'phong.tv@tenant.com', '0912000007'],
            ['Lê Thị Giang',     'giang.lt@tenant.com', '0912000008'],
            ['Phạm Văn Hậu',     'hau.pv@tenant.com',   '0912000009'],
            ['Vũ Thị Hoa',       'hoa.vt@tenant.com',   '0912000010'],
            ['Nguyễn Đình Khoa', 'khoa.nd@tenant.com',  '0912000011'],
            ['Trần Thị Lan',     'lan.ttr@tenant.com',  '0912000012'],
            ['Lê Văn Minh',      'minh.lv@tenant.com',  '0912000013'],
            ['Phạm Thị Ngọc',    'ngoc.pt@tenant.com',  '0912000014'],
            ['Võ Văn Phát',      'phat.vv@tenant.com',  '0912000015'],
        ];
        const tenantIds = [];
        for (const [name, email, phone] of tenantData) {
            const [ex] = await db.execute('SELECT user_id FROM users WHERE email=?', [email]);
            if (ex.length) { tenantIds.push(ex[0].user_id); continue; }
            const [r] = await db.execute(
                `INSERT INTO users (full_name,email,password_hash,role,phone_number,is_verified,reputation_score)
                 VALUES (?,?,?,'tenant',?,1,?)`,
                [name, email, hash, phone, 85 + Math.floor(Math.random() * 15)]
            );
            tenantIds.push(r.insertId);
            console.log('+ Tenant:', name, 'ID:', r.insertId);
        }

        // ─── 3. BUILDINGS (8 tòa nhà) ───────────────────────────────────────
        // landlordIds: [0]=Tuấn [1]=Hoa [2]=Phúc [3]=Lan [4]=Hùng
        const buildingData = [
            [0, 'Nhà trọ Minh Tuấn',    '12 Lê Lợi, Quận 1, TP.HCM',               '{"lat":10.7756,"lng":106.7019}', 'hostel',    4,  8, 'none'],
            [0, 'Chung cư mini Quận 3',  '45 Nguyễn Thị Minh Khai, Quận 3, TP.HCM', '{"lat":10.7835,"lng":106.6924}', 'apartment', 6,  9, 'none'],
            [1, 'Phòng trọ Thu Hoa',     '78 Đinh Tiên Hoàng, Bình Thạnh, TP.HCM',  '{"lat":10.8021,"lng":106.7138}', 'hostel',    3,  7, 'low'],
            [2, 'Nhà trọ Phúc An',       '99 Cộng Hòa, Tân Bình, TP.HCM',           '{"lat":10.7982,"lng":106.6652}', 'hostel',    5,  8, 'none'],
            [2, 'Căn hộ Phúc Bình',      '201 Hoàng Văn Thụ, Phú Nhuận, TP.HCM',   '{"lat":10.7979,"lng":106.6760}', 'apartment', 8,  9, 'none'],
            [3, 'Nhà trọ Cô Lan',        '33 Nguyễn Kiệm, Gò Vấp, TP.HCM',         '{"lat":10.8265,"lng":106.6892}', 'hostel',    3,  6, 'low'],
            [4, 'Cao ốc Studio Hùng',    '55 Phổ Quang, Tân Bình, TP.HCM',          '{"lat":10.8012,"lng":106.6581}', 'apartment', 10, 9, 'none'],
            [4, 'Nhà nguyên căn Quận 10','17 Ba Tháng Hai, Quận 10, TP.HCM',        '{"lat":10.7731,"lng":106.6678}', 'house',     2,  7, 'none'],
        ];
        const buildingIds = [];
        for (const [li, name, addr, coords, type, floors, sec, flood] of buildingData) {
            const [r] = await db.execute(
                `INSERT INTO buildings (landlord_id,name,address_full,coordinates,type,total_floors,security_rating,flood_risk,description)
                 VALUES (?,?,?,?,?,?,?,?,?)`,
                [landlordIds[li], name, addr, coords, type, floors, sec, flood,
                 `Khu trọ ${type === 'apartment' ? 'căn hộ cao cấp' : 'nhà trọ'} tại ${addr.split(',')[1]?.trim() || 'TP.HCM'}, an ninh tốt, gần trung tâm.`]
            );
            buildingIds.push(r.insertId);
            console.log('+ Building:', name, 'ID:', r.insertId);
        }

        // ─── 4. ROOMS (30 phòng) ─────────────────────────────────────────────
        // format: [buildingIdx, roomNum, floor, area, basePrice, elecPrice, waterPrice, svcPrice, status, amenities]
        const roomData = [
            // Nhà trọ Minh Tuấn (bld 0) - 5 phòng
            [0,'101',1,22,3500000,3800,18000,100000,'available',['WiFi','Quạt trần','WC riêng']],
            [0,'102',1,22,3500000,3800,18000,100000,'available',['WiFi','Quạt trần','WC riêng']],
            [0,'201',2,25,4000000,3800,18000,100000,'occupied', ['WiFi','Điều hòa','WC riêng','Ban công']],
            [0,'202',2,25,4000000,3800,18000,100000,'available',['WiFi','Điều hòa','WC riêng']],
            [0,'301',3,28,4500000,3800,18000,100000,'available',['WiFi','Điều hòa','WC riêng','Tủ lạnh','Ban công']],
            // Chung cư mini Quận 3 (bld 1) - 5 phòng
            [1,'A01',1,35,7000000,3500,20000,200000,'occupied', ['WiFi','Điều hòa','Bếp','Tủ lạnh','WC riêng','Bãi xe']],
            [1,'A02',1,35,7000000,3500,20000,200000,'available',['WiFi','Điều hòa','Bếp','Tủ lạnh','WC riêng','Bãi xe']],
            [1,'B01',2,40,8000000,3500,20000,200000,'occupied', ['WiFi','Điều hòa','Bếp','Tủ lạnh','WC riêng','Máy giặt']],
            [1,'B02',2,42,8500000,3500,20000,200000,'available',['WiFi','Điều hòa','Bếp','Tủ lạnh','WC riêng','Máy giặt']],
            [1,'C01',3,50,10000000,3500,20000,200000,'available',['WiFi','Điều hòa','Bếp','Tủ lạnh','WC riêng','Máy giặt','Ban công rộng']],
            // Phòng trọ Thu Hoa (bld 2) - 4 phòng
            [2,'P1',1,18,2800000,4000,15000,80000,'available',['WiFi','Quạt trần','WC chung']],
            [2,'P2',1,18,2800000,4000,15000,80000,'available',['WiFi','Quạt trần','WC chung']],
            [2,'P3',2,20,3200000,4000,15000,80000,'occupied', ['WiFi','Điều hòa','WC riêng']],
            [2,'P4',2,20,3200000,4000,15000,80000,'available',['WiFi','Điều hòa','WC riêng']],
            // Nhà trọ Phúc An (bld 3) - 4 phòng
            [3,'101',1,24,4200000,3600,17000,120000,'available',['WiFi','Điều hòa','WC riêng','Tủ lạnh']],
            [3,'102',1,24,4200000,3600,17000,120000,'occupied', ['WiFi','Điều hòa','WC riêng','Tủ lạnh']],
            [3,'201',2,26,4600000,3600,17000,120000,'available',['WiFi','Điều hòa','WC riêng','Tủ lạnh','Ban công']],
            [3,'202',2,26,4600000,3600,17000,120000,'available',['WiFi','Điều hòa','WC riêng','Tủ lạnh','Ban công']],
            // Căn hộ Phúc Bình (bld 4) - 4 phòng
            [4,'501',5,55,12000000,3500,22000,300000,'occupied', ['WiFi','2 Điều hòa','Bếp','Tủ lạnh','Máy giặt','Smart TV','Ban công']],
            [4,'502',5,55,12000000,3500,22000,300000,'available',['WiFi','2 Điều hòa','Bếp','Tủ lạnh','Máy giặt','Smart TV']],
            [4,'601',6,60,13500000,3500,22000,300000,'available',['WiFi','2 Điều hòa','Bếp','Tủ lạnh','Máy giặt','Smart TV','Ban công lớn']],
            [4,'701',7,65,15000000,3500,22000,300000,'available',['WiFi','2 Điều hòa','Bếp','Tủ lạnh','Máy giặt','Smart TV','View đẹp']],
            // Nhà trọ Cô Lan (bld 5) - 3 phòng
            [5,'01',1,16,2500000,4200,16000,70000,'available',['WiFi','Quạt','WC chung']],
            [5,'02',1,16,2500000,4200,16000,70000,'occupied', ['WiFi','Quạt','WC chung']],
            [5,'03',2,18,2800000,4200,16000,70000,'available',['WiFi','Điều hòa','WC riêng']],
            // Cao ốc Studio Hùng (bld 6) - 3 phòng
            [6,'S01',1,30,6500000,3500,20000,180000,'occupied', ['WiFi','Điều hòa','Bếp','Tủ lạnh','WC riêng','Bảo vệ 24/7']],
            [6,'S02',2,30,6500000,3500,20000,180000,'available',['WiFi','Điều hòa','Bếp','Tủ lạnh','WC riêng','Bảo vệ 24/7']],
            [6,'S03',3,32,7000000,3500,20000,180000,'available',['WiFi','Điều hòa','Bếp','Tủ lạnh','WC riêng','Bảo vệ 24/7','Gym']],
            // Nhà nguyên căn Quận 10 (bld 7) - 2 phòng
            [7,'T1',1,80,18000000,3500,22000,500000,'available',['WiFi','3 Điều hòa','Bếp','Tủ lạnh','Máy giặt','Sân vườn','Chỗ đỗ ô tô']],
            [7,'T2',2,60,14000000,3500,22000,400000,'available',['WiFi','2 Điều hòa','Bếp','Tủ lạnh','Máy giặt']],
        ];

        const roomIds = [];
        for (const [bi, num, floor, area, price, elec, water, svc, status, amen] of roomData) {
            const [r] = await db.execute(
                `INSERT INTO rooms (building_id,room_number,floor,area,base_price,electricity_price,water_price,service_price,status,amenities,description,health_score)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
                [buildingIds[bi], num, floor, area, price, elec, water, svc, status,
                 JSON.stringify(amen),
                 `Phòng ${num} diện tích ${area}m², đầy đủ nội thất ${amen.includes('Điều hòa') ? ', có điều hòa' : ''}.`,
                 90 + Math.floor(Math.random() * 10)]
            );
            roomIds.push(r.insertId);
        }
        console.log('+ Created', roomIds.length, 'rooms');

        // ─── 5. UTILITY CONFIGS cho mỗi landlord ────────────────────────────
        for (const lid of landlordIds) {
            // Điện bậc thang 3 mức
            await db.execute(
                `INSERT INTO utility_configs (landlord_id,type,name,from_index,to_index,price) VALUES (?,?,?,?,?,?)`,
                [lid,'electricity','Điện bậc 1 (0-50 kWh)',0,50,3858]
            );
            await db.execute(
                `INSERT INTO utility_configs (landlord_id,type,name,from_index,to_index,price) VALUES (?,?,?,?,?,?)`,
                [lid,'electricity','Điện bậc 2 (51-100 kWh)',51,100,4102]
            );
            await db.execute(
                `INSERT INTO utility_configs (landlord_id,type,name,from_index,to_index,price) VALUES (?,?,?,?,?,?)`,
                [lid,'electricity','Điện bậc 3 (>100 kWh)',101,null,5004]
            );
            // Nước phẳng
            await db.execute(
                `INSERT INTO utility_configs (landlord_id,type,name,price) VALUES (?,?,?,?)`,
                [lid,'water','Nước sinh hoạt',18000]
            );
        }
        console.log('+ Created utility_configs for', landlordIds.length, 'landlords');

        // ─── 6. ROOM LISTINGS (chỉ available rooms) ──────────────────────────
        const listingTitles = [
            'Phòng trọ sạch sẽ thoáng mát, gần trung tâm',
            'Phòng cho thuê đầy đủ nội thất, an ninh tốt',
            'Căn hộ mini tiện nghi cao cấp, view đẹp',
            'Phòng studio giá rẻ gần ĐH, tiện ích đầy đủ',
            'Phòng rộng rãi sáng sủa, có ban công',
            'Căn hộ dịch vụ cao cấp, có bảo vệ 24/7',
            'Phòng trọ yên tĩnh, phù hợp sinh viên/nhân viên',
            'Chung cư mini mới xây, nội thất cơ bản',
            'Phòng có gác lửng, thiết kế hiện đại',
            'Căn hộ studio full nội thất, không gian thoáng',
        ];
        const listingIds = [];
        let titleIdx = 0;
        for (let i = 0; i < roomIds.length; i++) {
            const [rInfo] = await db.execute(
                'SELECT base_price,status,area,electricity_price,water_price,service_price,amenities FROM rooms WHERE room_id=?',
                [roomIds[i]]
            );
            const rm = rInfo[0];
            if (rm.status === 'occupied') continue;
            const deposit = rm.base_price * 2;
            const title = listingTitles[titleIdx % listingTitles.length];
            titleIdx++;
            const expires = new Date();
            expires.setDate(expires.getDate() + 30);
            const [lr] = await db.execute(
                `INSERT INTO room_listings (room_id,title,description,rent_price,deposit_amount,status,is_featured,views,expires_at,electricity_price,water_price,service_price,amenities,max_occupants)
                 VALUES (?,?,?,?,?,'active',?,?,?,?,?,?,?,?)`,
                [roomIds[i], title,
                 `Cho thuê phòng ${rm.area}m². ${title}. Giá chỉ ${rm.base_price.toLocaleString()}đ/tháng.`,
                 rm.base_price, deposit,
                 Math.random() > 0.7 ? 1 : 0,
                 Math.floor(Math.random() * 200 + 10),
                 expires,
                 rm.electricity_price, rm.water_price, rm.service_price,
                 rm.amenities, 2]
            );
            listingIds.push(lr.insertId);
        }
        console.log('+ Created', listingIds.length, 'listings');

        // ─── 7. ROOM ASSETS cho các phòng occupied ──────────────────────────
        const assetSets = [
            ['Máy lạnh Daikin 1.5HP','Tủ lạnh mini','Giường đơn','Bàn học','Tủ quần áo'],
            ['Điều hòa Panasonic','Tủ lạnh Samsung 200L','Giường đôi','Bàn ăn','Tủ quần áo 3 cánh','Máy nước nóng'],
            ['Máy lạnh Carrier','Bàn + Ghế','Giường đơn','Kệ để đồ'],
        ];
        let setIdx = 0;
        for (let i = 0; i < roomIds.length; i++) {
            const [rInfo] = await db.execute('SELECT status FROM rooms WHERE room_id=?', [roomIds[i]]);
            if (rInfo[0].status !== 'occupied') continue;
            const assets = assetSets[setIdx % assetSets.length];
            setIdx++;
            for (const item of assets) {
                const cond = ['new','good','good'][Math.floor(Math.random()*3)];
                await db.execute(
                    `INSERT INTO room_assets (room_id,item_name,condition_status,last_check_date) VALUES (?,?,?,?)`,
                    [roomIds[i], item, cond, '2026-01-01']
                );
            }
        }
        console.log('+ Created room_assets for occupied rooms');

        // ─── 8. SERVICE READINGS cho phòng occupied ─────────────────────────
        for (let i = 0; i < roomIds.length; i++) {
            const [rInfo] = await db.execute('SELECT status FROM rooms WHERE room_id=?', [roomIds[i]]);
            if (rInfo[0].status !== 'occupied') continue;
            const baseE = 1000 + i * 50;
            const baseW = 200 + i * 10;
            await db.execute(
                `INSERT INTO service_readings (room_id,record_date,service_type,old_index,new_index,source) VALUES (?,?,?,?,?,?)`,
                [roomIds[i],'2026-04-01','electricity', baseE, baseE+65,'manual']
            );
            await db.execute(
                `INSERT INTO service_readings (room_id,record_date,service_type,old_index,new_index,source) VALUES (?,?,?,?,?,?)`,
                [roomIds[i],'2026-04-01','water', baseW, baseW+12,'manual']
            );
            await db.execute(
                `INSERT INTO service_readings (room_id,record_date,service_type,old_index,new_index,source) VALUES (?,?,?,?,?,?)`,
                [roomIds[i],'2026-05-01','electricity', baseE+65, baseE+130,'manual']
            );
            await db.execute(
                `INSERT INTO service_readings (room_id,record_date,service_type,old_index,new_index,source) VALUES (?,?,?,?,?,?)`,
                [roomIds[i],'2026-05-01','water', baseW+12, baseW+25,'manual']
            );
        }
        console.log('+ Created service_readings');

        // ─── 9. REVIEWS ─────────────────────────────────────────────────────
        const reviewComments = [
            'Phòng sạch sẽ, chủ nhà dễ tính, giá hợp lý.',
            'Vị trí thuận tiện, gần siêu thị và trường học.',
            'Điều hòa mạnh, phòng mát, điện không quá cao.',
            'Chủ trọ rất tốt bụng, hay hỗ trợ khi cần.',
            'An ninh khu vực tốt, cổng có khóa mã số.',
            'Hơi ồn một chút do gần đường lớn nhưng chấp nhận được.',
        ];
        let tenantIdx = 0;
        for (let i = 0; i < roomIds.length && tenantIdx < tenantIds.length; i++) {
            const [rInfo] = await db.execute('SELECT status FROM rooms WHERE room_id=?', [roomIds[i]]);
            if (rInfo[0].status !== 'occupied') continue;
            const rating = 3 + Math.floor(Math.random() * 3); // 3-5
            await db.execute(
                `INSERT INTO reviews (room_id,tenant_id,rating,comment,is_verified_tenant) VALUES (?,?,?,?,1)`,
                [roomIds[i], tenantIds[tenantIdx % tenantIds.length],
                 rating, reviewComments[Math.floor(Math.random()*reviewComments.length)]]
            );
            tenantIdx++;
        }
        console.log('+ Created reviews');

        // ─── 10. ROOMMATE PROFILES (8 tenant) ───────────────────────────────
        const lifestyles = [
            {gender_pref:'any',smoker:0,pet:0,noise_tolerance:2,sleep_schedule:'night_owl',study_work:'student'},
            {gender_pref:'female',smoker:0,pet:1,noise_tolerance:1,sleep_schedule:'early_bird',study_work:'office'},
            {gender_pref:'male',smoker:0,pet:0,noise_tolerance:3,sleep_schedule:'flexible',study_work:'student'},
            {gender_pref:'any',smoker:0,pet:0,noise_tolerance:2,sleep_schedule:'early_bird',study_work:'office'},
            {gender_pref:'female',smoker:0,pet:1,noise_tolerance:2,sleep_schedule:'night_owl',study_work:'student'},
            {gender_pref:'male',smoker:1,pet:0,noise_tolerance:3,sleep_schedule:'flexible',study_work:'freelance'},
            {gender_pref:'any',smoker:0,pet:0,noise_tolerance:1,sleep_schedule:'early_bird',study_work:'office'},
            {gender_pref:'any',smoker:0,pet:0,noise_tolerance:2,sleep_schedule:'flexible',study_work:'student'},
        ];
        for (let i = 0; i < 8 && i < tenantIds.length; i++) {
            await db.execute(
                `INSERT INTO roommate_profiles (user_id,budget_min,budget_max,lifestyle_vector,status) VALUES (?,?,?,?,?)`,
                [tenantIds[i],
                 2000000 + i*200000,
                 5000000 + i*300000,
                 JSON.stringify(lifestyles[i]),
                 'active']
            );
        }
        console.log('+ Created roommate_profiles');

        // ─── SUMMARY ────────────────────────────────────────────────────────
        console.log('\n=== SEED HOÀN TẤT ===');
        console.log(`Landlords : ${landlordIds.length}`);
        console.log(`Tenants   : ${tenantIds.length}`);
        console.log(`Buildings : ${buildingIds.length}`);
        console.log(`Rooms     : ${roomIds.length}`);
        console.log(`Listings  : ${listingIds.length}`);
        process.exit(0);
    } catch(e) {
        console.error('Lỗi seed:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
}

seed();
