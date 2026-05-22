const db = require('./src/config/database');

async function setupCategories() {
    console.log('=== BƯỚC 1: Cập nhật cấu trúc danh mục cha-con ===\n');

    // Cập nhật parent_id cho các danh mục con
    const categoryUpdates = [
        // Các loại phòng trọ -> con của "Cho thuê phòng trọ" (id=1)
        { id: 7, parent_id: 1 },  // Phòng trọ sinh viên -> con của Cho thuê phòng trọ
        { id: 10, parent_id: 1 }, // Phòng trọ cao cấp -> con của Cho thuê phòng trọ
        { id: 13, parent_id: 1 }, // Phòng cho couples -> con của Cho thuê phòng trọ
        { id: 14, parent_id: 1 }, // Phòng có gác lửng -> con của Cho thuê phòng trọ
        { id: 15, parent_id: 1 }, // Phòng không chung chủ -> con của Cho thuê phòng trọ
        { id: 16, parent_id: 1 }, // Phòng có ban công -> con của Cho thuê phòng trọ

        // Căn hộ -> con của "Căn hộ" (id=2)
        { id: 8, parent_id: 2 },  // Chung cư mini -> con của Căn hộ
        { id: 12, parent_id: 2 }, // Căn hộ dịch vụ -> con của Căn hộ

        // Ở ghép
        { id: 9, parent_id: 5 },  // Ký túc xá -> con của Ở ghép (id=5)
        { id: 11, parent_id: 5 }, // Quán trọ -> con của Ở ghép (id=5)
    ];

    for (const cat of categoryUpdates) {
        await db.query('UPDATE categories SET parent_id = ? WHERE category_id = ?', [cat.parent_id, cat.id]);
        console.log(`✅ Đã cập nhật category ${cat.id} -> parent_id = ${cat.parent_id}`);
    }

    console.log('\n=== BƯỚC 2: Xem lại cấu trúc danh mục ===\n');

    const [categories] = await db.query('SELECT * FROM categories ORDER BY parent_id, display_order');
    console.table(categories);

    console.log('\n=== BƯỚC 3: Cập nhật danh mục cho các phòng ===\n');

    // Phân tích title và gán category phù hợp
    const updateQueries = [
        // Căn hộ, căn hộ mini, căn hộ dịch vụ -> Căn hộ (id=2)
        { keyword: 'Căn hộ mini', category_id: 8 },    // Chung cư mini (sub của Căn hộ)
        { keyword: 'căn hộ dịch vụ', category_id: 12 }, // Căn hộ dịch vụ (sub của Căn hộ)
        { keyword: 'chung cư mini', category_id: 8 },

        // Phòng có gác lửng -> id=14
        { keyword: 'gác lửng', category_id: 14 },

        // Phòng cho couples/vợ chồng -> id=13
        { keyword: 'couple', category_id: 13 },
        { keyword: 'vợ chồng', category_id: 13 },

        // Phòng có ban công -> id=16
        { keyword: 'ban công', category_id: 16 },

        // Phòng không chung chủ -> id=15
        { keyword: 'không chung chủ', category_id: 15 },

        // Phòng trọ cao cấp -> id=10
        { keyword: 'cao cấp', category_id: 10 },

        // Phòng trọ sinh viên -> id=7
        { keyword: 'sinh viên', category_id: 7 },

        // Studio -> Căn hộ (id=2) vì studio thường là mini apartment
        { keyword: 'studio', category_id: 8 }, // Studio -> Chung cư mini
    ];

    // Lấy tất cả listings để phân tích
    const [listings] = await db.query('SELECT room_id, title FROM room_listings');
    console.log(`Tổng số phòng: ${listings.length}`);

    let updatedCount = 0;
    for (const listing of listings) {
        const title = listing.title.toLowerCase();

        for (const query of updateQueries) {
            if (title.includes(query.keyword.toLowerCase())) {
                await db.query('UPDATE room_listings SET category_id = ? WHERE room_id = ?', [query.category_id, listing.room_id]);
                console.log(`  📝 "${listing.title}" -> category ${query.category_id}`);
                updatedCount++;
                break;
            }
        }
    }

    console.log(`\n✅ Đã cập nhật ${updatedCount} phòng`);

    console.log('\n=== BƯỚC 4: Thống kê phân bổ ===\n');

    const [stats] = await db.query(`
        SELECT c.category_id, c.name, c.parent_id, p.name as parent_name, COUNT(l.room_id) as count
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.category_id
        LEFT JOIN room_listings l ON l.category_id = c.category_id
        WHERE c.is_active = 1
        GROUP BY c.category_id
        ORDER BY c.parent_id, c.display_order
    `);
    console.table(stats);

    await db.end();
    console.log('\n✅ Hoàn tất!');
}

setupCategories().catch(console.error);
