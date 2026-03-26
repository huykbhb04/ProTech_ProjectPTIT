const db = require('./src/config/database');

async function checkUsers() {
    try {
        const [rows] = await db.execute('SELECT user_id, email, full_name, role, password_hash FROM users');
        console.log('--- Users in Database ---');
        rows.forEach(user => {
            console.log(`ID: ${user.user_id} | Email: ${user.email} | Name: ${user.full_name} | Role: ${user.role}`);
            console.log(`Hash starts with: ${user.password_hash.substring(0, 10)}...`);
            console.log('-------------------------');
        });
        process.exit(0);
    } catch (error) {
        console.error('Error checking users:', error);
        process.exit(1);
    }
}

checkUsers();
