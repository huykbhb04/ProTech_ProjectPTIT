-- Migration to add CCCD and Handover details
USE init_schema;
-- This allows storing tenant and landlord identity verification documents

ALTER TABLE contracts
ADD COLUMN tenant_cccd_front_url VARCHAR(500) AFTER contract_content,
ADD COLUMN tenant_cccd_back_url VARCHAR(500) AFTER tenant_cccd_front_url,
ADD COLUMN tenant_full_name VARCHAR(255) AFTER tenant_cccd_back_url,
ADD COLUMN tenant_id_number VARCHAR(20) AFTER tenant_full_name,
ADD COLUMN tenant_dob DATE AFTER tenant_id_number,
ADD COLUMN tenant_address TEXT AFTER tenant_dob,
ADD COLUMN landlord_cccd_front_url VARCHAR(500) AFTER tenant_address,
ADD COLUMN landlord_cccd_back_url VARCHAR(500) AFTER landlord_cccd_front_url;

-- Add index for faster lookups by ID number
CREATE INDEX idx_tenant_id_number ON contracts(tenant_id_number);
