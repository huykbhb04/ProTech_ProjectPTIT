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
  const bookingCols = {
    payment_status: 'ALTER TABLE bookings ADD COLUMN payment_status ENUM("unpaid", "paid", "refunded") DEFAULT "unpaid" AFTER status',
    payment_date: 'ALTER TABLE bookings ADD COLUMN payment_date DATETIME NULL AFTER payment_status',
    payout_status: 'ALTER TABLE bookings ADD COLUMN payout_status ENUM("unpaid", "paid") DEFAULT "unpaid" AFTER payment_date',
    payout_date: 'ALTER TABLE bookings ADD COLUMN payout_date DATETIME NULL AFTER payout_status',
    deposit_amount: 'ALTER TABLE bookings ADD COLUMN deposit_amount DECIMAL(12,2) DEFAULT 0 AFTER payout_date',
    commission_rate: 'ALTER TABLE bookings ADD COLUMN commission_rate DECIMAL(12,2) DEFAULT 0 AFTER deposit_amount',
    commission_amount: 'ALTER TABLE bookings ADD COLUMN commission_amount DECIMAL(12,2) DEFAULT 0 AFTER commission_rate',
    lead_person_name: 'ALTER TABLE bookings ADD COLUMN lead_person_name VARCHAR(100) NULL AFTER commission_amount',
    lead_person_phone: 'ALTER TABLE bookings ADD COLUMN lead_person_phone VARCHAR(15) NULL AFTER lead_person_name',
    landlord_notes: 'ALTER TABLE bookings ADD COLUMN landlord_notes TEXT NULL AFTER lead_person_phone',
    confirm_log: 'ALTER TABLE bookings ADD COLUMN confirm_log TEXT NULL AFTER landlord_notes',
  };

  for (const [col, sql] of Object.entries(bookingCols)) {
    const exists = await columnExists('bookings', col);
    if (!exists) {
      console.log(`Adding column ${col}...`);
      await db.query(sql);
    }
  }

  const [bookingTable] = await db.query("SHOW TABLES LIKE 'bookings'");
  if (bookingTable.length === 0) {
    console.log('Creating bookings table...');
    const sql = fs.readFileSync(path.join(__dirname, '../database/update_booking_schema.sql'), 'utf8');
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(Boolean)
      .filter(s => !s.startsWith('--') && !s.startsWith('USE '));

    for (const statement of statements) {
      await db.query(statement);
    }
  }

  console.log('Booking migration applied successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
