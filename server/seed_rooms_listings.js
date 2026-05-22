require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./src/config/database');

const IMAGE_BANK = {
  hostel: [
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  ],
  apartment: [
    'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
  ],
  house: [
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  ],
};

const LISTING_PHOTOS = [
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
];

const landlords = [
  { name: 'Nguyễn Minh Tuấn', email: 'tuannm@landlord.com', phone: '0901111001', wallet: 500000, bank: 'Vietcombank' },
  { name: 'Trần Thị Hoa', email: 'hoatt@landlord.com', phone: '0901111002', wallet: 300000, bank: 'MB Bank' },
  { name: 'Lê Văn Phúc', email: 'phucvl@landlord.com', phone: '0901111003', wallet: 750000, bank: 'Techcombank' },
  { name: 'Phạm Thị Lan', email: 'lanpt@landlord.com', phone: '0901111004', wallet: 200000, bank: 'ACB' },
  { name: 'Vũ Đình Hùng', email: 'hungvd@landlord.com', phone: '0901111005', wallet: 600000, bank: 'BIDV' },
];

const buildings = [
  { landlord: 0, name: 'Ký túc xá Minh Tuấn', address: '12 Lê Lợi, Quận 1, TP.HCM', type: 'hostel', floors: 4, security: 8, flood: 'none', coords: { lat: 10.7756, lng: 106.7019 } },
  { landlord: 0, name: 'Chung cư mini Central House', address: '45 Nguyễn Thị Minh Khai, Quận 3, TP.HCM', type: 'apartment', floors: 6, security: 9, flood: 'none', coords: { lat: 10.7835, lng: 106.6924 } },
  { landlord: 1, name: 'Nhà trọ Thu Hoa', address: '78 Đinh Tiên Hoàng, Bình Thạnh, TP.HCM', type: 'hostel', floors: 3, security: 7, flood: 'low', coords: { lat: 10.8021, lng: 106.7138 } },
  { landlord: 2, name: 'Khu trọ Phúc An', address: '99 Cộng Hòa, Tân Bình, TP.HCM', type: 'hostel', floors: 5, security: 8, flood: 'none', coords: { lat: 10.7982, lng: 106.6652 } },
  { landlord: 2, name: 'Phúc Bình Residence', address: '201 Hoàng Văn Thụ, Phú Nhuận, TP.HCM', type: 'apartment', floors: 8, security: 9, flood: 'none', coords: { lat: 10.7979, lng: 106.6760 } },
  { landlord: 3, name: 'Dãy trọ Cô Lan', address: '33 Nguyễn Kiệm, Gò Vấp, TP.HCM', type: 'hostel', floors: 3, security: 6, flood: 'low', coords: { lat: 10.8265, lng: 106.6892 } },
  { landlord: 4, name: 'Hùng Studio House', address: '55 Phổ Quang, Tân Bình, TP.HCM', type: 'apartment', floors: 10, security: 9, flood: 'none', coords: { lat: 10.8012, lng: 106.6581 } },
  { landlord: 4, name: 'Nhà nguyên căn Quận 10', address: '17 Ba Tháng Hai, Quận 10, TP.HCM', type: 'house', floors: 2, security: 7, flood: 'none', coords: { lat: 10.7731, lng: 106.6678 } },
];

const roomData = [
  [0, '101', 1, 22, 3500000, 'available', ['WiFi', 'Quạt trần', 'WC riêng'], 'Sạch sẽ, thoáng, phù hợp sinh viên năm nhất.'],
  [0, '102', 1, 22, 3550000, 'available', ['WiFi', 'Quạt trần', 'WC riêng', 'Bãi xe'], 'Phòng tầng trệt, ra vào thuận tiện, có bãi xe riêng.'],
  [0, '201', 2, 25, 4200000, 'occupied', ['WiFi', 'Điều hòa', 'WC riêng', 'Ban công'], 'Phòng đang có khách ở, nội thất còn mới.'],
  [0, '202', 2, 25, 4100000, 'available', ['WiFi', 'Điều hòa', 'WC riêng'], 'Phòng yên tĩnh, thích hợp người đi làm.'],
  [0, '301', 3, 28, 4600000, 'available', ['WiFi', 'Điều hòa', 'WC riêng', 'Tủ lạnh'], 'Có ban công nhỏ, đón sáng tốt.'],

  [1, 'A01', 1, 35, 7000000, 'occupied', ['WiFi', 'Điều hòa', 'Bếp', 'Tủ lạnh', 'WC riêng', 'Bãi xe'], 'Căn hộ mini thiết kế gọn gàng, full nội thất cơ bản.'],
  [1, 'A02', 1, 35, 7200000, 'available', ['WiFi', 'Điều hòa', 'Bếp', 'Tủ lạnh', 'WC riêng', 'Bãi xe'], 'Cửa sổ lớn, sáng tự nhiên, an ninh tốt.'],
  [1, 'B01', 2, 40, 8200000, 'occupied', ['WiFi', 'Điều hòa', 'Bếp', 'Tủ lạnh', 'WC riêng', 'Máy giặt'], 'Phòng rộng, phù hợp cặp đôi hoặc người đi làm.'],
  [1, 'B02', 2, 42, 8600000, 'available', ['WiFi', 'Điều hòa', 'Bếp', 'Tủ lạnh', 'WC riêng', 'Máy giặt'], 'Có ban công và khu bếp riêng, tiện nấu ăn.'],
  [1, 'C01', 3, 50, 10500000, 'available', ['WiFi', 'Điều hòa', 'Bếp', 'Tủ lạnh', 'WC riêng', 'Máy giặt', 'Ban công rộng'], 'Không gian thoáng, phù hợp gia đình nhỏ.'],

  [2, 'P1', 1, 18, 2800000, 'available', ['WiFi', 'Quạt trần', 'WC chung'], 'Giá tốt, gần chợ và bến xe bus.'],
  [2, 'P2', 1, 18, 2850000, 'available', ['WiFi', 'Quạt trần', 'WC chung'], 'Phòng trống mới sơn, sạch sẽ.'],
  [2, 'P3', 2, 20, 3200000, 'occupied', ['WiFi', 'Điều hòa', 'WC riêng'], 'Phòng có khách thuê lâu dài, giữ gìn tốt.'],
  [2, 'P4', 2, 20, 3300000, 'available', ['WiFi', 'Điều hòa', 'WC riêng'], 'Có điều hòa, phù hợp người đi làm.'],

  [3, '101', 1, 24, 4200000, 'available', ['WiFi', 'Điều hòa', 'WC riêng', 'Tủ lạnh'], 'Phòng sạch, gần khu văn phòng.'],
  [3, '102', 1, 24, 4300000, 'occupied', ['WiFi', 'Điều hòa', 'WC riêng', 'Tủ lạnh'], 'Có khách ở ổn định, nội thất cơ bản đầy đủ.'],
  [3, '201', 2, 26, 4700000, 'available', ['WiFi', 'Điều hòa', 'WC riêng', 'Tủ lạnh', 'Ban công'], 'Ban công thoáng, phù hợp cặp đôi.'],
  [3, '202', 2, 26, 4800000, 'available', ['WiFi', 'Điều hòa', 'WC riêng', 'Tủ lạnh', 'Ban công'], 'Phòng mới sơn, sáng đẹp.'],

  [4, '501', 5, 55, 12000000, 'occupied', ['WiFi', '2 Điều hòa', 'Bếp', 'Tủ lạnh', 'Máy giặt', 'Smart TV', 'Ban công'], 'Căn hộ cao cấp, đầy đủ nội thất, view đẹp.'],
  [4, '502', 5, 55, 12200000, 'available', ['WiFi', '2 Điều hòa', 'Bếp', 'Tủ lạnh', 'Máy giặt', 'Smart TV'], 'Phù hợp gia đình nhỏ hoặc chuyên gia nước ngoài.'],
  [4, '601', 6, 60, 13500000, 'available', ['WiFi', '2 Điều hòa', 'Bếp', 'Tủ lạnh', 'Máy giặt', 'Smart TV', 'Ban công lớn'], 'Ban công rộng, có view thành phố.'],
  [4, '701', 7, 65, 15000000, 'available', ['WiFi', '2 Điều hòa', 'Bếp', 'Tủ lạnh', 'Máy giặt', 'Smart TV', 'View đẹp'], 'Căn góc yên tĩnh, full tiện nghi.'],

  [5, '01', 1, 16, 2500000, 'available', ['WiFi', 'Quạt', 'WC chung'], 'Phù hợp sinh viên, chi phí thấp.'],
  [5, '02', 1, 16, 2550000, 'occupied', ['WiFi', 'Quạt', 'WC chung'], 'Đang có khách thuê, phòng đơn giản sạch sẽ.'],
  [5, '03', 2, 18, 2800000, 'available', ['WiFi', 'Điều hòa', 'WC riêng'], 'Phòng nhỏ nhưng riêng tư, an ninh tốt.'],

  [6, 'S01', 1, 30, 6500000, 'occupied', ['WiFi', 'Điều hòa', 'Bếp', 'Tủ lạnh', 'WC riêng', 'Bảo vệ 24/7'], 'Studio tối giản, rất hợp người đi làm.'],
  [6, 'S02', 2, 30, 6500000, 'available', ['WiFi', 'Điều hòa', 'Bếp', 'Tủ lạnh', 'WC riêng', 'Bảo vệ 24/7'], 'Nội thất hiện đại, có bảo vệ tòa nhà.'],
  [6, 'S03', 3, 32, 7000000, 'available', ['WiFi', 'Điều hòa', 'Bếp', 'Tủ lạnh', 'WC riêng', 'Bảo vệ 24/7', 'Gym'], 'Có gym chung, phù hợp người trẻ năng động.'],

  [7, 'T1', 1, 80, 18000000, 'available', ['WiFi', '3 Điều hòa', 'Bếp', 'Tủ lạnh', 'Máy giặt', 'Sân vườn', 'Chỗ đỗ ô tô'], 'Nhà nguyên căn rộng, phù hợp gia đình nhiều thế hệ.'],
  [7, 'T2', 2, 60, 14000000, 'available', ['WiFi', '2 Điều hòa', 'Bếp', 'Tủ lạnh', 'Máy giặt'], 'Tầng trên yên tĩnh, có thể làm văn phòng nhỏ.'],
];

function pick(arr, index) {
  return arr[index % arr.length];
}

async function upsertLandlords(hash) {
  const ids = [];
  for (const landlord of landlords) {
    const [existing] = await db.execute('SELECT user_id FROM users WHERE email = ?', [landlord.email]);
    if (existing.length) {
      ids.push(existing[0].user_id);
      continue;
    }
    const [result] = await db.execute(
      `INSERT INTO users (full_name, email, password_hash, phone_number, role, wallet_balance, is_verified, reputation_score, avatar_url)
       VALUES (?, ?, ?, ?, 'landlord', ?, 1, ?, ?)` ,
      [
        landlord.name,
        landlord.email,
        hash,
        landlord.phone,
        landlord.wallet,
        90 + Math.floor(Math.random() * 10),
        `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(landlord.name)}`,
      ]
    );
    ids.push(result.insertId);
  }
  return ids;
}

async function cleanExistingSeedData() {
  await db.execute('SET FOREIGN_KEY_CHECKS = 0');
  await db.execute('DELETE FROM room_listings');
  await db.execute('DELETE FROM rooms');
  await db.execute('DELETE FROM buildings');
  await db.execute('DELETE FROM users WHERE email IN (?, ?, ?, ?, ?)', landlords.map(l => l.email));
  await db.execute('SET FOREIGN_KEY_CHECKS = 1');
}

async function run() {
  const hash = await bcrypt.hash('123456', 10);
  await cleanExistingSeedData();

  const landlordIds = await upsertLandlords(hash);
  const buildingIds = [];

  for (let i = 0; i < buildings.length; i++) {
    const b = buildings[i];
    const [result] = await db.execute(
      `INSERT INTO buildings (landlord_id, name, address_full, coordinates, security_rating, flood_risk, type, description, total_floors)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        landlordIds[b.landlord],
        b.name,
        b.address,
        JSON.stringify(b.coords),
        b.security,
        b.flood,
        b.type,
        `Khu ${b.type === 'apartment' ? 'căn hộ' : 'trọ'} thực tế tại ${b.address}. An ninh ổn định, phù hợp ${b.type === 'house' ? 'gia đình' : 'sinh viên và người đi làm'}.`,
        b.floors,
      ]
    );
    buildingIds.push(result.insertId);
  }

  const roomIds = [];
  for (let i = 0; i < roomData.length; i++) {
    const [buildingIndex, roomNumber, floor, area, price, status, amenities, description] = roomData[i];
    const building = buildings[buildingIndex];
    const buildingType = building.type;
    const roomImages = [
      pick(IMAGE_BANK[buildingType], i),
      pick(LISTING_PHOTOS, i + 1),
    ];
    const [result] = await db.execute(
      `INSERT INTO rooms (building_id, room_number, area, base_price, status, virtual_tour_url, health_score, floor, description, amenities, images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        buildingIds[buildingIndex],
        roomNumber,
        area,
        price,
        status,
        `https://example.com/tour/${buildingIndex}-${roomNumber}`,
        85 + (i % 15),
        floor,
        description,
        JSON.stringify(amenities),
        JSON.stringify(roomImages),
      ]
    );
    roomIds.push(result.insertId);
  }

  const listingTitles = [
    'Phòng trọ sạch sẽ, thoáng mát, gần trung tâm',
    'Phòng đầy đủ nội thất, an ninh tốt',
    'Căn hộ mini tiện nghi, phù hợp người đi làm',
    'Studio giá hợp lý, nội thất cơ bản',
    'Phòng có ban công, ánh sáng tự nhiên',
    'Căn hộ dịch vụ cao cấp, bảo vệ 24/7',
    'Phòng yên tĩnh, gần chợ và siêu thị',
    'Chung cư mini mới, nội thất đẹp',
  ];

  for (let i = 0; i < roomIds.length; i++) {
    const [roomRows] = await db.execute('SELECT * FROM rooms WHERE room_id = ?', [roomIds[i]]);
    const room = roomRows[0];
    if (!room || room.status !== 'available') continue;
    const building = buildings[roomData[i][0]];
    const title = `${pick(listingTitles, i)} - Phòng ${room.room_number}`;
    const deposit = Math.round(Number(room.base_price) * 2);
    const featured = i % 4 === 0 ? 1 : 0;
    await db.execute(
      `INSERT INTO room_listings (room_id, title, description, rent_price, deposit_amount, status, is_featured, views)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        roomIds[i],
        title,
        `Cho thuê ${room.area}m² tại ${building.name}. ${room.description}. Phù hợp ${room.area < 25 ? 'sinh viên hoặc người đi làm độc thân' : room.area < 45 ? 'cặp đôi hoặc người đi làm' : 'gia đình nhỏ'}.`,
        room.base_price,
        deposit,
        'active',
        featured,
        20 + i * 17,
      ]
    );
  }

  console.log('Seed rooms/listings completed.');
  process.exit(0);
}

run().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
