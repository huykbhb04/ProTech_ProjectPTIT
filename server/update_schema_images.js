const mysql = require('mysql2/promise');
require('dotenv').config();

const updateSchemaImages = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smart_proptech'
    });

    try {
        console.log('Connected to database. Adding images column to rooms table...');

        try {
            await connection.query(`
            ALTER TABLE rooms 
            ADD COLUMN images JSON;
        `);
            console.log('Successfully updated "rooms" table with "images" column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('"rooms" table already has "images" column.');
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

updateSchemaImages();
