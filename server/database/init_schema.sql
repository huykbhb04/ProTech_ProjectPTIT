-- Database Initialization Script for Smart PropTech Platform
-- Based on the 6 Group Specification provided by User

-- ========================================================
-- NHÓM 1: QUẢN LÝ NGƯỜI DÙNG & AI PROFILE (USER CORE)
-- ========================================================

-- 1. Users (Người dùng hệ thống)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15),
    role ENUM('admin', 'landlord', 'tenant', 'guest') DEFAULT 'guest',
    identity_card_number VARCHAR(20), -- AI OCR data
    avatar_url VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    date_of_birth DATE,
    address TEXT,
    reputation_score INT DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 1.1 Payment_Methods (Phương thức thanh toán)
CREATE TABLE IF NOT EXISTS payment_methods (
    method_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('bank', 'e-wallet') NOT NULL,
    provider VARCHAR(50),
    account_number VARCHAR(50),
    account_name VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 2. Roommate_Profiles (Hồ sơ tìm người ở ghép)
CREATE TABLE IF NOT EXISTS roommate_profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    budget_min DECIMAL(12,2),
    budget_max DECIMAL(12,2),
    lifestyle_vector JSON, -- Example: {"gender_pref": "male", "smoker": 0, "pet": 1, "noise_tolerance": 2}
    status ENUM('active', 'matched', 'hidden') DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. Roommate_Matches (Kết quả ghép đôi do AI tạo ra)
CREATE TABLE IF NOT EXISTS roommate_matches (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    user_a_id INT NOT NULL,
    user_b_id INT NOT NULL,
    compatibility_score FLOAT, -- 0.0 - 1.0
    ai_reasoning TEXT,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    FOREIGN KEY (user_a_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (user_b_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ========================================================
-- NHÓM 2: QUẢN LÝ TÀI SẢN & THỊ GIÁC MÁY TÍNH (PROPERTY & AI VISION)
-- ========================================================

-- 4. Buildings (Tòa nhà/Khu trọ)
CREATE TABLE IF NOT EXISTS buildings (
    building_id INT AUTO_INCREMENT PRIMARY KEY,
    landlord_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    address_full TEXT NOT NULL,
    coordinates JSON, -- {lat: 10.762, lng: 106.681}
    security_rating INT CHECK (security_rating BETWEEN 1 AND 10),
    flood_risk ENUM('none', 'low', 'high') DEFAULT 'none',
    type VARCHAR(50) DEFAULT 'apartment',
    description TEXT,
    total_floors INT DEFAULT 1,
    FOREIGN KEY (landlord_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 5. Rooms (Phòng trọ)
CREATE TABLE IF NOT EXISTS rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    building_id INT NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    area FLOAT NOT NULL,
    base_price DECIMAL(12,2) NOT NULL,
    status ENUM('available', 'occupied', 'maintenance', 'deposited') DEFAULT 'available',
    virtual_tour_url VARCHAR(255),
    health_score INT DEFAULT 100,
    floor INT DEFAULT 1,
    description TEXT,
    amenities JSON,
    images JSON,
    FOREIGN KEY (building_id) REFERENCES buildings(building_id) ON DELETE CASCADE
);

-- 6. Room_Assets (Tài sản trong phòng - AI Inventory)
CREATE TABLE IF NOT EXISTS room_assets (
    asset_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    item_name VARCHAR(50) NOT NULL,
    ai_label VARCHAR(50), -- YOLO label
    condition_status ENUM('new', 'good', 'damaged') DEFAULT 'good', -- NOTE: 'condition' is a reserved keyword in some SQL versions, using condition_status
    image_evidence_url VARCHAR(255),
    last_check_date DATE,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE
);

-- ========================================================
-- NHÓM 3: HỢP ĐỒNG & CHECK-IN (LEASING AUTOMATION)
-- ========================================================

-- 7. Contracts (Hợp đồng thuê)
CREATE TABLE IF NOT EXISTS contracts (
    contract_id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    room_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    deposit_amount DECIMAL(12,2),
    monthly_price DECIMAL(12,2),
    contract_pdf_url VARCHAR(255),
    status ENUM('draft', 'active', 'expired', 'terminated') DEFAULT 'draft',
    FOREIGN KEY (tenant_id) REFERENCES users(user_id),
    FOREIGN KEY (room_id) REFERENCES rooms(room_id)
);

-- 8. Check_In_Out_Logs (Biên bản bàn giao số)
CREATE TABLE IF NOT EXISTS check_in_out_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    contract_id INT NOT NULL,
    type ENUM('check_in', 'check_out') NOT NULL,
    asset_snapshot JSON, -- Backup asset state
    media_urls JSON, -- Image/video evidence
    is_confirmed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (contract_id) REFERENCES contracts(contract_id)
);

-- ========================================================
-- NHÓM 4: TÀI CHÍNH & TỰ ĐỘNG HÓA BILLING (FINANCE CORE)
-- ========================================================

-- 9. Utility_Configs (Cấu hình giá điện/nước bậc thang)
CREATE TABLE IF NOT EXISTS utility_configs (
    config_id INT AUTO_INCREMENT PRIMARY KEY,
    landlord_id INT NOT NULL,
    type ENUM('electricity', 'water') NOT NULL,
    name VARCHAR(255) NOT NULL,
    from_index INT DEFAULT 0,
    to_index INT, -- NULL means infinity
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (landlord_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 10. Service_Readings (Chỉ số điện nước hàng tháng)
CREATE TABLE IF NOT EXISTS service_readings (
    reading_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    record_date DATE NOT NULL,
    service_type ENUM('electricity', 'water') NOT NULL,
    old_index INT NOT NULL,
    new_index INT NOT NULL,
    source ENUM('manual', 'ai_ocr') DEFAULT 'manual',
    image_proof_url VARCHAR(255),
    ocr_confidence FLOAT,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id)
);

-- 11. Bills (Hóa đơn)
CREATE TABLE IF NOT EXISTS bills (
    bill_id INT AUTO_INCREMENT PRIMARY KEY,
    contract_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    amount_room DECIMAL(15,2) NOT NULL,
    amount_services DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    payment_qr_url VARCHAR(255),
    status ENUM('unpaid', 'paid', 'overdue') DEFAULT 'unpaid',
    FOREIGN KEY (contract_id) REFERENCES contracts(contract_id)
);

-- 12. Transactions (Lịch sử giao dịch ngân hàng)
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    gateway_ref_id VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    bank_code VARCHAR(50),
    payment_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('success', 'failed') DEFAULT 'success',
    FOREIGN KEY (bill_id) REFERENCES bills(bill_id)
);

-- ========================================================
-- NHÓM 5: HỖ TRỢ & BẢO TRÌ (SUPPORT & AI SENTIMENT)
-- ========================================================

-- 13. Maintenance_Requests (Yêu cầu sửa chữa)
CREATE TABLE IF NOT EXISTS maintenance_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    tenant_id INT NOT NULL,
    issue_description TEXT NOT NULL,
    images JSON,
    ai_severity ENUM('low', 'medium', 'high', 'emergency') DEFAULT 'medium',
    ai_sentiment_score FLOAT, -- -1.0 to 1.0
    status ENUM('open', 'in_progress', 'resolved') DEFAULT 'open',
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    FOREIGN KEY (tenant_id) REFERENCES users(user_id)
);

-- 14. Reviews (Đánh giá & AI tóm tắt)
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    tenant_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    ai_tags JSON,
    is_verified_tenant BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    FOREIGN KEY (tenant_id) REFERENCES users(user_id)
);

-- 15. Notifications (Thông báo)
CREATE TABLE IF NOT EXISTS notifications (
    noti_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    type ENUM('bill', 'alert', 'system') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ========================================================
-- NHÓM 6: AI MARKETING & THỊ TRƯỜNG (ADVANCED)
-- ========================================================

-- 16. Market_Insights (Dữ liệu thị trường cho Yield Management)
CREATE TABLE IF NOT EXISTS market_insights (
    insight_id INT AUTO_INCREMENT PRIMARY KEY,
    district VARCHAR(100) NOT NULL,
    avg_price DECIMAL(12,2),
    demand_level FLOAT,
    updated_at DATE
);

-- 17. Room_Listings (Tin đăng cho thuê)
CREATE TABLE IF NOT EXISTS room_listings (
    listing_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    rent_price DECIMAL(12,2),
    deposit_amount DECIMAL(12,2),
    status ENUM('active', 'paused', 'closed') DEFAULT 'active',
    is_featured BOOLEAN DEFAULT FALSE,
    views INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE
);

-- 17.1 Saved_Listings (Tin đăng đã lưu)
CREATE TABLE IF NOT EXISTS saved_listings (
    save_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    listing_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_listing (user_id, listing_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES room_listings(listing_id) ON DELETE CASCADE
);

-- 18. System_Configs (Cấu hình hệ thống chung)
CREATE TABLE IF NOT EXISTS system_configs (
    config_key VARCHAR(100) PRIMARY KEY, -- Renamed from 'key' to avoid SQL keyword conflict
    config_value TEXT
);
