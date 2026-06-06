USE phongtro;

CREATE TABLE IF NOT EXISTS wallet_topups (
    topup_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method ENUM('vietqr', 'momo') DEFAULT 'vietqr',
    reference_code VARCHAR(80) NOT NULL,
    bank_code VARCHAR(50),
    bank_account VARCHAR(50),
    bank_name VARCHAR(100),
    account_name VARCHAR(100),
    qr_code_url VARCHAR(255),
    status ENUM('pending', 'matched', 'credited', 'expired', 'failed') DEFAULT 'pending',
    matched_bank_ref VARCHAR(255),
    matched_description VARCHAR(255),
    matched_at DATETIME NULL,
    credited_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY uniq_wallet_topup_reference (reference_code)
);
