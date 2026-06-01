const db = require('../src/config/database');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
    try {
        console.log("1. Finding a tenant user in the database...");
        const [users] = await db.query("SELECT * FROM users WHERE role = 'tenant' LIMIT 1");
        if (users.length === 0) {
            console.error("No tenant user found in the database.");
            process.exit(1);
        }
        const user = users[0];
        console.log(`Found tenant user: ${user.email} (ID: ${user.user_id})`);

        // Generate token
        const token = jwt.sign(
            { id: user.user_id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'super_secret_jwt_key_12345',
            { expiresIn: '1h' }
        );
        console.log("2. Generated JWT token for authentication.");

        // Clear server debug log if it exists
        const logPath = path.join(__dirname, '../server_debug.log');
        if (fs.existsSync(logPath)) {
            fs.unlinkSync(logPath);
        }

        console.log("3. Making a request to /api/ai/chat...");
        try {
            const response = await axios.post('http://localhost:3000/api/ai/chat', {
                message: "So sánh giá thuê phòng trọ ở quận Gò Vấp và quận Bình Thạnh",
                history: []
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log("Response status:", response.status);
            console.log("Response data:", response.data);
        } catch (apiErr) {
            console.error("API call failed!");
            console.error("Response status:", apiErr.response ? apiErr.response.status : 'N/A');
            console.error("Response data:", apiErr.response ? apiErr.response.data : apiErr.message);
        }

        // Print debug log contents
        if (fs.existsSync(logPath)) {
            console.log("\n--- SERVER DEBUG LOG CONTENTS ---");
            console.log(fs.readFileSync(logPath, 'utf8'));
            console.log("---------------------------------\n");
        } else {
            console.log("\nNo server_debug.log was generated.");
        }

    } catch (err) {
        console.error("Error in script:", err);
    }
    process.exit(0);
}

run();
