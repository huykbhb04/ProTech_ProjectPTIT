const db = require('./src/config/database');

async function checkData() {
    // Check categories
    const [categories] = await db.query('SELECT * FROM categories ORDER BY parent_id, display_order');
    console.log('=== CATEGORIES ===');
    console.table(categories);

    // Check listings with their categories
    const [listings] = await db.query(`
        SELECT l.room_id, l.title, l.category_id, c.name as category_name, c.parent_id
        FROM room_listings l
        LEFT JOIN categories c ON l.category_id = c.category_id
        LIMIT 20
    `);
    console.log('\n=== LISTINGS (first 20) ===');
    console.table(listings);

    // Count listings without category
    const [noCat] = await db.query('SELECT COUNT(*) as cnt FROM room_listings WHERE category_id IS NULL OR category_id = 0');
    console.log('\n=== LISTINGS WITHOUT CATEGORY ===');
    console.log('Count:', noCat[0].cnt);

    await db.end();
}

checkData().catch(console.error);
