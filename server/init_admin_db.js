require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
    const pool = mysql.createPool({ 
        host: process.env.DB_HOST, 
        user: process.env.DB_USER, 
        password: process.env.DB_PASSWORD, 
        database: process.env.DB_NAME, 
        multipleStatements: true 
    });

    const query = `
        CREATE TABLE IF NOT EXISTS banner_requests ( 
            request_id INT AUTO_INCREMENT PRIMARY KEY, 
            landlord_id INT NOT NULL, 
            listing_id INT NULL, 
            type ENUM('home_banner', 'highlight_sidebar') DEFAULT 'home_banner', 
            image_url VARCHAR(255) NOT NULL, 
            fee_paid DECIMAL(10,2) DEFAULT 0, 
            duration_days INT DEFAULT 7, 
            start_date DATETIME NULL, 
            end_date DATETIME NULL, 
            status ENUM('pending', 'active', 'rejected', 'expired') DEFAULT 'pending', 
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
            FOREIGN KEY (landlord_id) REFERENCES users(user_id) ON DELETE CASCADE, 
            FOREIGN KEY (listing_id) REFERENCES room_listings(listing_id) ON DELETE SET NULL 
        );

        CREATE TABLE IF NOT EXISTS seo_configs ( 
            id INT AUTO_INCREMENT PRIMARY KEY, 
            route_path VARCHAR(255) UNIQUE NOT NULL, 
            meta_title VARCHAR(255) NOT NULL, 
            meta_description TEXT, 
            keywords TEXT, 
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
        );

        CREATE TABLE IF NOT EXISTS theme_settings ( 
            id INT AUTO_INCREMENT PRIMARY KEY, 
            name VARCHAR(50) DEFAULT 'default', 
            active_layout ENUM('modern', 'classic', 'minimal') DEFAULT 'modern', 
            primary_color VARCHAR(20) DEFAULT '#4f46e5', 
            secondary_color VARCHAR(20) DEFAULT '#f3f4f6', 
            is_active BOOLEAN DEFAULT TRUE, 
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
        );
    `;
    
    try { 
        await pool.query(query); 
        console.log('Database tables created successfully.'); 
        process.exit(0); 
    } catch(e) { 
        console.error('Error:', e); 
        process.exit(1); 
    }
}
run();
