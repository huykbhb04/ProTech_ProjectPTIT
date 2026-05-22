const db = require('./src/config/database');

async function testAPI() {
    // Simulate the new API structure
    const [categories] = await db.query(`
        SELECT
            c.category_id,
            c.name,
            c.slug,
            c.icon,
            c.color,
            c.description,
            c.parent_id,
            p.name as parent_name,
            (SELECT COUNT(*) FROM room_listings WHERE category_id = c.category_id AND status = 'active') as listing_count
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.category_id
        WHERE c.is_active = 1
        ORDER BY c.parent_id IS NULL DESC, c.display_order ASC, c.name ASC
    `);

    const mainCategories = categories.filter(c => c.parent_id === null);
    const subCategories = categories.filter(c => c.parent_id !== null);

    const structuredCategories = mainCategories.map(mainCat => ({
        ...mainCat,
        children: subCategories.filter(sub => sub.parent_id === mainCat.category_id)
    }));

    console.log('=== API Response Structure ===');
    console.log(JSON.stringify(structuredCategories, null, 2));

    await db.end();
}

testAPI().catch(console.error);
