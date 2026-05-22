START TRANSACTION;
SET FOREIGN_KEY_CHECKS = 0;

-- Seed users (landlords)
INSERT INTO users (full_name, email, password_hash, phone_number, role, wallet_balance, is_verified, reputation_score, avatar_url)
VALUES
('Nguyễn Minh Tuấn', 'tuannm@landlord.com', '$2b$10$examplehashplaceholder', '0901111001', 'landlord', 500000, 1, 96, 'https://api.dicebear.com/7.x/personas/svg?seed=Nguyen%20Minh%20Tuan'),
('Trần Thị Hoa', 'hoatt@landlord.com', '$2b$10$examplehashplaceholder', '0901111002', 'landlord', 300000, 1, 94, 'https://api.dicebear.com/7.x/personas/svg?seed=Tran%20Thi%20Hoa'),
('Lê Văn Phúc', 'phucvl@landlord.com', '$2b$10$examplehashplaceholder', '0901111003', 'landlord', 750000, 1, 97, 'https://api.dicebear.com/7.x/personas/svg?seed=Le%20Van%20Phuc'),
('Phạm Thị Lan', 'lanpt@landlord.com', '$2b$10$examplehashplaceholder', '0901111004', 'landlord', 200000, 1, 93, 'https://api.dicebear.com/7.x/personas/svg?seed=Pham%20Thi%20Lan'),
('Vũ Đình Hùng', 'hungvd@landlord.com', '$2b$10$examplehashplaceholder', '0901111005', 'landlord', 600000, 1, 95, 'https://api.dicebear.com/7.x/personas/svg?seed=Vu%20Dinh%20Hung');

-- NOTE:
-- The SQL seed is intentionally kept as a template because the exact user_id / building_id values
-- depend on the current database state. Use the Node seed script to generate deterministic, real IDs.

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
