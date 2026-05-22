const db = require('./src/config/database');
const bcrypt = require('bcrypt');

async function createAdmin() {
    try {
        const email = 'admin@example.com';
        const rawPassword = 'admin';
        const fullName = 'Administrator';
        const phone = '0123456789';
        
        // Check if admin already exists
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            console.log('Admin user already exists with email:', email);
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(rawPassword, salt);

        // Insert into users
        const query = `
            INSERT INTO users (email, password_hash, full_name, phone_number, role)
            VALUES (?, ?, ?, ?, 'admin')
        `;
        
        await db.query(query, [email, passwordHash, fullName, phone]);

        console.log('Admin user created successfully:');
        console.log('Email:', email);
        console.log('Password:', rawPassword);
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdmin();
