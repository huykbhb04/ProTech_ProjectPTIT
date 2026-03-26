-- Migration: Create comprehensive billing system tables
-- Phase 1: Database Schema for Automated Billing

-- 1. Drop and recreate bills table with complete billing structure
DROP TABLE IF EXISTS bills;

CREATE TABLE bills (
    bill_id INT AUTO_INCREMENT PRIMARY KEY,
    contract_id INT NOT NULL,
    room_id INT NOT NULL,
    billing_month DATE NOT NULL COMMENT 'Tháng hóa đơn (YYYY-MM-01)',
    
    -- Utility readings (Electricity)
    electricity_old INT NOT NULL DEFAULT 0,
    electricity_new INT DEFAULT NULL,
    electricity_consumption INT DEFAULT NULL,
    electricity_amount DECIMAL(12,2) DEFAULT 0,
    electricity_image_url VARCHAR(500),
    electricity_ocr_confidence FLOAT,
    
    -- Utility readings (Water)
    water_old INT NOT NULL DEFAULT 0,
    water_new INT DEFAULT NULL,
    water_consumption INT DEFAULT NULL,
    water_amount DECIMAL(12,2) DEFAULT 0,
    water_image_url VARCHAR(500),
    water_ocr_confidence FLOAT,
    
    -- Amounts
    room_rent DECIMAL(12,2) NOT NULL,
    service_fees JSON COMMENT '{"wifi": 100000, "trash": 50000, ...}',
    discount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Status & tracking
    status ENUM('pending', 'confirmed', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    confirmed_at DATETIME,
    confirmed_by INT COMMENT 'Landlord user_id who confirmed',
    paid_at DATETIME,
    due_date DATE,
    
    -- Payment info
    payment_method ENUM('cash', 'transfer', 'qr') DEFAULT 'transfer',
    payment_proof_url VARCHAR(500),
    payment_note TEXT,
    transaction_ref VARCHAR(255),
    
    -- Metadata
    notes TEXT,
    is_auto_approved BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (contract_id) REFERENCES contracts(contract_id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (confirmed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    
    INDEX idx_billing_month (billing_month),
    INDEX idx_status (status),
    INDEX idx_contract (contract_id),
    INDEX idx_room (room_id),
    UNIQUE KEY unique_contract_month (contract_id, billing_month)
) COMMENT='Hóa đơn hàng tháng với tracking đầy đủ';

-- 2. Create bill notifications tracking table
CREATE TABLE IF NOT EXISTS bill_notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    billing_month DATE NOT NULL,
    notification_type ENUM('reminder', 'meter_reading_request', 'bill_ready', 'overdue', 'payment_confirmed') NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_to INT COMMENT 'user_id',
    message TEXT,
    
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (sent_to) REFERENCES users(user_id) ON DELETE CASCADE,
    
    INDEX idx_billing_month (billing_month),
    INDEX idx_type (notification_type),
    INDEX idx_sent_to (sent_to)
) COMMENT='Tracking các thông báo liên quan đến bills';

-- 3. Add landlord bank info to users table (for VietQR)
ALTER TABLE users 
ADD COLUMN bank_name VARCHAR(100) AFTER phone_number,
ADD COLUMN bank_account_number VARCHAR(50) AFTER bank_name,
ADD COLUMN bank_account_name VARCHAR(255) AFTER bank_account_number;

-- 4. Add auto_approve settings to users (landlord preference)
ALTER TABLE users
ADD COLUMN auto_approve_bills BOOLEAN DEFAULT FALSE COMMENT 'Tự động duyệt bill nếu AI confidence > 95%';

-- 5. Enhance service_readings table for better tracking
ALTER TABLE service_readings
ADD COLUMN bill_id INT AFTER room_id,
ADD COLUMN reading_type ENUM('initial', 'monthly', 'final') DEFAULT 'monthly' AFTER service_type,
ADD FOREIGN KEY (bill_id) REFERENCES bills(bill_id) ON DELETE SET NULL;

-- 6. Add comment to existing utility_configs for clarity
ALTER TABLE utility_configs 
COMMENT = 'Cấu hình giá dịch vụ với hỗ trợ giá bậc thang (from_index, to_index)';
