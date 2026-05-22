-- Migration to enhance Contracts table for Online Signing
USE init_schema;

ALTER TABLE contracts 
ADD COLUMN booking_id INT AFTER contract_id,
ADD COLUMN landlord_id INT AFTER tenant_id,
ADD COLUMN tenant_signed_at DATETIME NULL,
ADD COLUMN landlord_signed_at DATETIME NULL,
ADD COLUMN contract_content JSON NULL,
ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE;

-- Add foreign key for booking_id if not exists
ALTER TABLE contracts
ADD CONSTRAINT fk_contract_booking
FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL;

-- Update status ENUM to include more signing states if needed (already has draft, active, expired, terminated)
-- 'signed_by_tenant' could be useful
ALTER TABLE contracts
MODIFY COLUMN status ENUM('draft', 'signed_by_tenant', 'active', 'expired', 'terminated') DEFAULT 'draft';
