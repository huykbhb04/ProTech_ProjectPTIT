const db = require('../config/database');

// --- THEME ---
exports.getTheme = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM theme_settings WHERE is_active = 1 ORDER BY id DESC LIMIT 1');
        res.json(rows[0] || {
            active_layout: 'modern',
            primary_color: '#000000',
            secondary_color: '#ffffff',
            grid_columns: 3,
            sidebar_layout: 'both',
            primary_font: 'Inter',
            card_style: 'minimal',
            banner_effect: 'fade',
            listings_per_page: 12
        });
    } catch (e) {
        res.status(500).json({ message: 'Error', error: e.message });
    }
};

exports.updateTheme = async (req, res) => {
    try {
        const { 
            active_layout, primary_color, secondary_color, 
            grid_columns, sidebar_layout, primary_font,
            card_style, banner_effect, listings_per_page
        } = req.body;

        await db.query('UPDATE theme_settings SET is_active = 0'); // Deactivate old ones
        
        await db.query(
            `INSERT INTO theme_settings 
            (active_layout, primary_color, secondary_color, grid_columns, sidebar_layout, primary_font, card_style, banner_effect, listings_per_page, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`, 
            [
                active_layout || 'modern', 
                primary_color || '#000000', 
                secondary_color || '#ffffff',
                grid_columns || 3,
                sidebar_layout || 'both',
                primary_font || 'Inter',
                card_style || 'minimal',
                banner_effect || 'fade',
                listings_per_page || 12
            ]
        );
        res.json({ message: 'Cập nhật cấu hình giao diện thành công!' });
    } catch (e) {
        res.status(500).json({ message: 'Error', error: e.message });
    }
};

// --- SEO ---
exports.getAllSeo = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM seo_configs');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ message: 'Error', error: e.message });
    }
};

exports.updateSeo = async (req, res) => {
    try {
        const { id, route_path, meta_title, meta_description, keywords } = req.body;
        if (id) {
            await db.query('UPDATE seo_configs SET route_path=?, meta_title=?, meta_description=?, keywords=? WHERE id=?', 
                [route_path, meta_title, meta_description, keywords, id]);
        } else {
            await db.query('INSERT INTO seo_configs (route_path, meta_title, meta_description, keywords) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE meta_title=VALUES(meta_title), meta_description=VALUES(meta_description), keywords=VALUES(keywords)',
                [route_path, meta_title, meta_description, keywords]);
        }
        res.json({ message: 'Cập nhật SEO thành công!' });
    } catch (e) {
        res.status(500).json({ message: 'Error', error: e.message });
    }
};

// --- BANNER ADMIN ---
exports.getBannerRequests = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                br.*,
                u.full_name as landlord_name,
                u.email as landlord_email,
                u.phone_number as landlord_phone,
                u.avatar_url as landlord_avatar,
                rl.title as listing_title,
                rl.rent_price,
                rl.description as listing_description,
                rl.status as listing_status,
                rl.room_id,
                r.room_number,
                b.name as building_name,
                b.address_full as building_address,
                b.building_id
            FROM banner_requests br
            JOIN users u ON br.landlord_id = u.user_id
            LEFT JOIN room_listings rl ON br.listing_id = rl.listing_id
            LEFT JOIN rooms r ON rl.room_id = r.room_id
            LEFT JOIN buildings b ON r.building_id = b.building_id
            ORDER BY br.created_at DESC
        `);
        res.json(rows);
    } catch (e) {
        console.error('Error fetching banner requests:', e);
        res.status(500).json({ message: 'Error', error: e.message });
    }
};

exports.updateBannerStatus = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const { status, display_style, priority } = req.body; // 'active' or 'rejected'

        console.log(`📢 updateBannerStatus called - ID: ${id}, Status: ${status}, Style: ${display_style}, Priority: ${priority}`);

        const [requests] = await connection.query('SELECT * FROM banner_requests WHERE request_id = ? FOR UPDATE', [id]);
        const bannerReq = requests[0];
        
        if (!bannerReq) throw new Error('Không tìm thấy banner');

        let endDate = bannerReq.end_date;
        if (status === 'active' && bannerReq.status === 'pending') {
            endDate = new Date();
            endDate.setDate(endDate.getDate() + bannerReq.duration_days);
        }

        // Apply Refund if moving from pending -> rejected
        if (status === 'rejected' && bannerReq.status === 'pending') {
            await connection.query('UPDATE users SET wallet_balance = wallet_balance + ? WHERE user_id = ?', [bannerReq.fee_paid, bannerReq.landlord_id]);
        }

        await connection.query(
            `UPDATE banner_requests 
             SET status = ?, end_date = ?, display_style = ?, priority = ? 
             WHERE request_id = ?`, 
            [status, endDate, display_style || bannerReq.display_style || 'default', priority !== undefined ? priority : bannerReq.priority, id]
        );

        await connection.commit();
        console.log(`✅ Banner ${id} updated to status: ${status}`);
        res.json({ message: 'Cập nhật trạng thái Banner thành công!' });
    } catch (e) {
        await connection.rollback();
        console.error('❌ Error updating banner:', e);
        res.status(500).json({ message: e.message });
    } finally {
        connection.release();
    }
};

exports.deleteBannerRequest = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM banner_requests WHERE request_id = ?', [id]);
        res.json({ message: 'Xóa yêu cầu quảng cáo thành công' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: e.message });
    }
};

// --- LISTING DETAILS FOR ADMIN ---
exports.getListingDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [listings] = await db.query(`
            SELECT 
                rl.*,
                rl.status as listing_status,
                r.room_number,
                r.area as room_area,
                r.floor,
                r.images as room_images,
                r.amenities as room_amenities,
                b.building_id,
                b.name as building_name,
                b.address_full as building_address,
                b.type as building_type,
                b.total_rooms,
                u.user_id as landlord_id,
                u.full_name as landlord_name,
                u.email as landlord_email,
                u.phone_number as landlord_phone,
                u.avatar_url as landlord_avatar,
                u.created_at as landlord_created_at
            FROM room_listings rl
            JOIN rooms r ON rl.room_id = r.room_id
            JOIN buildings b ON r.building_id = b.building_id
            JOIN users u ON b.landlord_id = u.user_id
            WHERE rl.listing_id = ?
        `, [id]);
        
        if (listings.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tin đăng' });
        }
        
        const listing = listings[0];
        
        // Get listing statistics
        const [stats] = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM bookings WHERE listing_id = ? AND status = 'confirmed') as total_bookings,
                (SELECT COUNT(*) FROM bookings WHERE listing_id = ? AND status = 'completed') as completed_bookings,
                (SELECT COUNT(*) FROM saved_listings WHERE listing_id = ?) as saved_count
        `, [id, id, id]);
        
        // Get listing images
        let images = listing.room_images;
        if (typeof images === 'string') {
            try {
                images = JSON.parse(images);
            } catch (e) {
                images = images.split(',').filter(img => img.trim());
            }
        }
        
        // Get amenities
        let amenities = listing.room_amenities;
        if (typeof amenities === 'string') {
            try {
                amenities = JSON.parse(amenities);
            } catch (e) {
                amenities = [];
            }
        }
        
        res.json({
            ...listing,
            images: images || [],
            amenities: amenities || [],
            statistics: stats[0] || { total_bookings: 0, completed_bookings: 0, saved_count: 0 }
        });
    } catch (e) {
        console.error('Error fetching listing details:', e);
        res.status(500).json({ message: 'Lỗi khi lấy thông tin tin đăng', error: e.message });
    }
};

const DEFAULT_MONETIZATION_PRICING = {
    rows: [
        { id: 'vip_spotlight_5', label: '5 ngày', vipSpotlight: 60000, vip1: 50000, vip2: 25000, normal: 0 },
        { id: 'vip_spotlight_10', label: '10 ngày', vipSpotlight: 120000, vip1: 100000, vip2: 50000, normal: 0 },
        { id: 'vip_spotlight_15', label: '15 ngày', vipSpotlight: 180000, vip1: 150000, vip2: 75000, normal: 0 },
        { id: 'vip_spotlight_30', label: '30 ngày', vipSpotlight: 288000, vip1: 240000, vip2: 120000, normal: 0 },
        { id: 'push_listing', label: 'Giá đẩy tin', vipSpotlight: 0, vip1: 2000, vip2: 2000, normal: null },
        { id: 'auto_approve', label: 'Tự động duyệt', vipSpotlight: true, vip1: true, vip2: false, normal: false },
        { id: 'extend_days', label: 'Duy trì thêm', vipSpotlight: 10, vip1: 10, vip2: 10, normal: 0 },
        { id: 'call_button', label: 'Hiển thị nút gọi điện', vipSpotlight: true, vip1: true, vip2: true, normal: false },
    ]
};

const readConfigValue = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

// --- SYSTEM CONFIGS ---
exports.getSystemConfigs = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM system_configs');
        const configs = {};
        rows.forEach(r => configs[r.config_key] = readConfigValue(r.config_value));
        if (!configs.monetization_pricing) configs.monetization_pricing = DEFAULT_MONETIZATION_PRICING;
        res.json(configs);
    } catch (e) {
        res.status(500).json({ message: 'Error fetching configs', error: e.message });
    }
};

exports.updateSystemConfig = async (req, res) => {
    try {
        const { key, value } = req.body;
        await db.query(
            'INSERT INTO system_configs (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
            [key, typeof value === 'string' ? value : JSON.stringify(value), typeof value === 'string' ? value : JSON.stringify(value)]
        );
        res.json({ success: true, message: 'Updated successfully' });
    } catch (e) {
        res.status(500).json({ message: 'Error updating config', error: e.message });
    }
};

// --- BANNER PUBLIC ---
exports.getActiveBanners = async (req, res) => {
    try {
        // Log for debugging
        console.log('📢 getActiveBanners called - Querying banners with status active');
        
        // Sử dụng LEFT JOIN để đảm bảo lấy được thông tin banner dù thông tin Listing có trục trặc nhẹ
        // Thêm kiểm tra date chính xác hơn và sắp xếp theo độ ưu tiên (priority)
        const [rows] = await db.query(`
            SELECT br.*, 
                   rl.title as listing_title, 
                   rl.room_id, 
                   r.room_number, 
                   b.name as building_name, 
                   b.address_full
            FROM banner_requests br
            LEFT JOIN room_listings rl ON br.listing_id = rl.listing_id
            LEFT JOIN rooms r ON rl.room_id = r.room_id
            LEFT JOIN buildings b ON r.building_id = b.building_id
            WHERE br.status = 'active' 
              AND (br.end_date IS NULL OR br.end_date >= CURDATE())
            ORDER BY br.priority DESC, br.created_at DESC
        `);
        
        console.log(`📢 Found ${rows.length} active banners`);
        if (rows.length > 0) {
            console.log('Banner types:', rows.map(r => r.type));
        }
        
        res.json(rows);
    } catch (e) {
        console.error('Error in getActiveBanners:', e);
        res.status(500).json({ message: 'Error fetching banners', error: e.message });
    }
};
