const db = require('../src/config/database');

const createTables = async () => {
    try {
        console.log("Running migration for Roommate Matching...");

        // Create roommate_profiles
        await db.execute(`
            CREATE TABLE IF NOT EXISTS roommate_profiles (
                profile_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                budget_min DECIMAL(12,2),
                budget_max DECIMAL(12,2),
                lifestyle_vector JSON,
                status ENUM('active', 'matched', 'hidden') DEFAULT 'active',
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        `);
        console.log("Checked/Created table: roommate_profiles");

        // Create roommate_matches
        await db.execute(`
            CREATE TABLE IF NOT EXISTS roommate_matches (
                match_id INT AUTO_INCREMENT PRIMARY KEY,
                user_a_id INT NOT NULL,
                user_b_id INT NOT NULL,
                compatibility_score FLOAT,
                ai_reasoning TEXT,
                status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
                FOREIGN KEY (user_a_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (user_b_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        `);
        console.log("Checked/Created table: roommate_matches");

        console.log("Migration successful!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

createTables();
