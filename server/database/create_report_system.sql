-- SQL Migration Script for Listing Reports & Landlord Trust Score System

-- 1. Modify room_listings table status and add status_reason
ALTER TABLE room_listings MODIFY COLUMN status ENUM('active', 'paused', 'closed', 'hidden', 'locked') DEFAULT 'active';

-- Add status_reason if not exists (checked in script, but here is standard SQL)
ALTER TABLE room_listings ADD COLUMN status_reason VARCHAR(255) NULL AFTER status;

-- 2. Create listing_reports table
CREATE TABLE IF NOT EXISTS listing_reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    listing_id INT NOT NULL,
    reporter_name VARCHAR(100) NOT NULL,
    reporter_phone VARCHAR(15) NOT NULL,
    reason VARCHAR(50) NOT NULL, -- 'fraud', 'duplicate', 'no_contact', 'fake_info', 'other'
    description TEXT,
    status ENUM('pending', 'resolved_lock', 'resolved_dismiss') DEFAULT 'pending',
    ip_address VARCHAR(45) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    admin_notes TEXT,
    FOREIGN KEY (listing_id) REFERENCES room_listings(listing_id) ON DELETE CASCADE
);

-- 3. Create listing_disputes table
CREATE TABLE IF NOT EXISTS listing_disputes (
    dispute_id INT AUTO_INCREMENT PRIMARY KEY,
    listing_id INT NOT NULL,
    landlord_id INT NOT NULL,
    explanation TEXT NOT NULL,
    proof_images JSON, -- stores array of image URLs
    status ENUM('pending', 'resolved_approved', 'resolved_rejected') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    admin_notes TEXT,
    FOREIGN KEY (listing_id) REFERENCES room_listings(listing_id) ON DELETE CASCADE,
    FOREIGN KEY (landlord_id) REFERENCES users(user_id) ON DELETE CASCADE
);
