-- Migration to enhance Contracts table for Online Signing
USE phongtro;

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

-- Update status ENUM to include signing states
ALTER TABLE contracts
MODIFY COLUMN status ENUM('draft', 'signed_by_tenant', 'active', 'expired', 'terminated', 'cancelled') DEFAULT 'draft';

-- Backfill old data based on timestamp fields if they already exist
UPDATE contracts
SET status = CASE
    WHEN landlord_signed_at IS NOT NULL THEN 'active'
    WHEN tenant_signed_at IS NOT NULL THEN 'signed_by_tenant'
    ELSE status
END;

-- Optional cleanup for legacy rows where tenant signed but status was still draft
UPDATE contracts
SET status = 'signed_by_tenant'
WHERE tenant_signed_at IS NOT NULL AND status = 'draft';
