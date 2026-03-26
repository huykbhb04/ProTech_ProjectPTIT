const mysql = require('mysql2/promise');
require('dotenv').config();

const updateSchema = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smart_proptech'
    });

    try {
        console.log('Connected to database. updating schema...');

        // 1. Update buildings table
        try {
            await connection.query(`
            ALTER TABLE buildings 
            ADD COLUMN type VARCHAR(50) DEFAULT 'apartment',
            ADD COLUMN description TEXT,
            ADD COLUMN total_floors INT DEFAULT 1;
        `);
            console.log('Successfully updated "buildings" table.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('"buildings" table already has these columns.');
            } else {
                console.error('Error updating buildings:', e.message);
            }
        }

        // 2. Update rooms table
        try {
            await connection.query(`
            ALTER TABLE rooms 
            ADD COLUMN floor INT DEFAULT 1,
            ADD COLUMN description TEXT,
            ADD COLUMN amenities JSON;
        `);
            console.log('Successfully updated "rooms" table.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('"rooms" table already has these columns.');
            } else {
                console.error('Error updating rooms:', e.message);
            }
        }

        console.log('Schema update complete.');
    } catch (error) {
        console.error('Database connection failed:', error);
    } finally {
        await connection.end();
    }
};

updateSchema();
