const db = require('./src/config/database');

async function migrate() {
    try {
        console.log('--- Bắt đầu nâng cấp bảng theme_settings ---');
        
        const alterQuery = `
            ALTER TABLE theme_settings
            ADD COLUMN IF NOT EXISTS grid_columns INT DEFAULT 3,
            ADD COLUMN IF NOT EXISTS sidebar_layout ENUM('left', 'right', 'both', 'none') DEFAULT 'both',
            ADD COLUMN IF NOT EXISTS primary_font VARCHAR(100) DEFAULT 'Inter',
            ADD COLUMN IF NOT EXISTS card_style ENUM('minimal', 'classic', 'glass') DEFAULT 'minimal',
            ADD COLUMN IF NOT EXISTS banner_effect ENUM('fade', 'slide', 'zoom') DEFAULT 'fade',
            ADD COLUMN IF NOT EXISTS listings_per_page INT DEFAULT 12
        `;
        
        await db.query(alterQuery);
        console.log('✅ Cập nhật theme_settings thành công!');
        
        // Cập nhật giá trị mặc định cho bản ghi đang hoạt động
        await db.query(`
            UPDATE theme_settings 
            SET grid_columns = 3, sidebar_layout = 'both', card_style = 'minimal'
            WHERE is_active = 1
        `);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi migration:', error.message);
        process.exit(1);
    }
}

migrate();
