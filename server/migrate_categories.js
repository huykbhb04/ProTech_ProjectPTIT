const mysql = require('mysql2/promise');
require('dotenv').config();

async function createCategoriesTable() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smartprop_db'
    });

    try {
        console.log('🔄 Checking categories table...');

        // Check if table exists
        const [tables] = await db.query('SHOW TABLES LIKE "categories"');
        
        if (tables.length === 0) {
            console.log('📦 Creating categories table...');
            
            await db.query(`
                CREATE TABLE categories (
                    category_id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    slug VARCHAR(100) NOT NULL UNIQUE,
                    description TEXT,
                    icon VARCHAR(50) DEFAULT 'folder',
                    color VARCHAR(20) DEFAULT '#6366f1',
                    parent_id INT DEFAULT NULL,
                    display_order INT DEFAULT 0,
                    is_active TINYINT(1) DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (parent_id) REFERENCES categories(category_id) ON DELETE SET NULL,
                    INDEX idx_slug (slug),
                    INDEX idx_parent (parent_id),
                    INDEX idx_active (is_active)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('✅ Categories table created successfully!');
        } else {
            console.log('ℹ️  Categories table already exists');
        }

        // Insert default categories
        const [count] = await db.query('SELECT COUNT(*) as cnt FROM categories');
        
        if (count[0].cnt === 0) {
            console.log('📝 Inserting default categories...');
            
            await db.query(`
                INSERT INTO categories (name, slug, description, icon, color, display_order) VALUES
                ('Cho thuê phòng trọ', 'phong-tro', 'Phòng trọ, nhà trọ cho thuê', 'home', '#6366f1', 1),
                ('Căn hộ', 'can-ho', 'Căn hộ chung cư cho thuê', 'building', '#8b5cf6', 2),
                ('Nhà nguyên căn', 'nha-nguyen-can', 'Nhà nguyên căn cho thuê', 'house', '#ec4899', 3),
                ('Mặt bằng kinh doanh', 'mat-bang', 'Mặt bằng, cửa hàng cho thuê', 'store', '#f59e0b', 4),
                ('Ở ghép', 'o-ghep', 'Chỗ ở ghép, giường tầng', 'users', '#10b981', 5),
                ('Homestay', 'homestay', 'Homestay ngắn hạn', 'heart', '#ef4444', 6)
            `);
            console.log('✅ Default categories inserted!');
        } else {
            console.log('ℹ️  Categories already have data');
        }

        console.log('\n📊 Current categories:');
        const [cats] = await db.query('SELECT category_id, name, slug, icon, color, is_active FROM categories ORDER BY display_order');
        cats.forEach(c => console.log(`  - [${c.category_id}] ${c.name} (${c.slug}) - ${c.is_active ? 'Active' : 'Inactive'}`));

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await db.end();
    }
}

createCategoriesTable();
