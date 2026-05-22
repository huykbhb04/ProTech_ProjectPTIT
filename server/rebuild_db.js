const mysql = require('mysql2/promise');
const fs = require('fs');

async function rebuild() {
    let connection;
    try {
        console.log('Connecting to MySQL server...');
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: ''
        });

        console.log('Dropping corrupted database init_schema...');
        try {
            await connection.query('DROP DATABASE IF EXISTS init_schema');
        } catch (err) {
            console.log('Drop database failed, proceeding to manual deletion. Error: ' + err.message);
        }

        console.log('Forcibly removing corrupted database directory...');
        const initSchemaPath = 'C:\\xampp\\mysql\\data\\init_schema';
        if (fs.existsSync(initSchemaPath)) {
            fs.rmSync(initSchemaPath, { recursive: true, force: true });
            console.log('Removed directory mapping.');
        }

        console.log('Recreating database init_schema...');
        await connection.query('CREATE DATABASE init_schema');

        console.log('Database init_schema created successfully!');
    } catch (error) {
        console.error('Error rebuilding database:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

rebuild();
