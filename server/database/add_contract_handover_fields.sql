-- Migration: Add handover information fields to contracts table
-- This allows storing utility readings, service commitments, and additional services
-- when landlord signs the contract

ALTER TABLE contracts
ADD COLUMN handover_electricity_index INT AFTER landlord_cccd_back_url,
ADD COLUMN handover_water_index INT AFTER handover_electricity_index,
ADD COLUMN handover_date DATETIME AFTER handover_water_index,
ADD COLUMN service_commitments JSON AFTER handover_date,
ADD COLUMN additional_services JSON AFTER service_commitments;

-- Add comment for documentation
ALTER TABLE contracts 
COMMENT = 'Contracts table with handover information for check-in process';
