const fs = require('fs');
const path = require('path');
const db = require('../src/config/database');

async function columnExists(table, column) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].count > 0;
}

async function main() {
  console.log('Starting Report & Dispute system migration...');

  // 1. Update status enum in room_listings
  try {
    console.log('Modifying room_listings status enum...');
    await db.query(
      "ALTER TABLE room_listings MODIFY COLUMN status ENUM('active', 'paused', 'closed', 'hidden', 'locked') DEFAULT 'active'"
    );
    console.log('Success modifying room_listings status enum.');
  } catch (err) {
    console.error('Error modifying room_listings status enum:', err.message);
  }

  // 2. Add status_reason if not exists
  const reasonExists = await columnExists('room_listings', 'status_reason');
  if (!reasonExists) {
    try {
      console.log('Adding column status_reason to room_listings...');
      await db.query(
        "ALTER TABLE room_listings ADD COLUMN status_reason VARCHAR(255) NULL AFTER status"
      );
      console.log('Success adding status_reason column.');
    } catch (err) {
      console.error('Error adding status_reason column:', err.message);
    }
  } else {
    console.log('Column status_reason already exists in room_listings.');
  }

  // 3. Create listing_reports table
  try {
    console.log('Creating listing_reports table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS listing_reports (
          report_id INT AUTO_INCREMENT PRIMARY KEY,
          listing_id INT NOT NULL,
          reporter_name VARCHAR(100) NOT NULL,
          reporter_phone VARCHAR(15) NOT NULL,
          reason VARCHAR(50) NOT NULL,
          description TEXT,
          status ENUM('pending', 'resolved_lock', 'resolved_dismiss') DEFAULT 'pending',
          ip_address VARCHAR(45) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          admin_notes TEXT,
          FOREIGN KEY (listing_id) REFERENCES room_listings(listing_id) ON DELETE CASCADE
      )
    `);
    console.log('Success creating listing_reports table.');
  } catch (err) {
    console.error('Error creating listing_reports table:', err.message);
  }

  // 4. Create listing_disputes table
  try {
    console.log('Creating listing_disputes table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS listing_disputes (
          dispute_id INT AUTO_INCREMENT PRIMARY KEY,
          listing_id INT NOT NULL,
          landlord_id INT NOT NULL,
          explanation TEXT NOT NULL,
          proof_images JSON,
          status ENUM('pending', 'resolved_approved', 'resolved_rejected') DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          admin_notes TEXT,
          FOREIGN KEY (listing_id) REFERENCES room_listings(listing_id) ON DELETE CASCADE,
          FOREIGN KEY (landlord_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    console.log('Success creating listing_disputes table.');
  } catch (err) {
    console.error('Error creating listing_disputes table:', err.message);
  }

  console.log('Migration completed.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
