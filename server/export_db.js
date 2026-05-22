const mysql = require('mysql2/promise');
const fs = require('fs');

async function exportDatabase() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'init_schema'
    });

    try {
        let sqlContent = `-- Database export for init_schema\n`;
        sqlContent += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

        // Get all tables
        const [tables] = await connection.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
        const tableNames = tables.map(t => Object.values(t)[0]);

        for (const tableName of tableNames) {
            try {
                // Get create table statement
                const [createTable] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
                sqlContent += `-- Table structure for \`${tableName}\`\n`;
                sqlContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
                sqlContent += `${createTable[0]['Create Table']};\n\n`;

                // Get table data
                const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
                if (rows.length > 0) {
                    sqlContent += `-- Data for table \`${tableName}\`\n`;
                    for (const row of rows) {
                        const keys = Object.keys(row).map(k => `\`${k}\``).join(', ');
                        const values = Object.values(row).map(v => {
                            if (v === null) return 'NULL';
                            if (typeof v === 'string') {
                                // Escape quotes and backslashes
                                v = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
                                return `'${v}'`;
                            }
                            if (v instanceof Date) {
                                return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
                            }
                            if (typeof v === 'object' && Buffer.isBuffer(v)) {
                                return `X'${v.toString('hex')}'`;
                            }
                            if (typeof v === 'object') {
                                return `'${JSON.stringify(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
                            }
                            return v;
                        }).join(', ');
                        sqlContent += `INSERT INTO \`${tableName}\` (${keys}) VALUES (${values});\n`;
                    }
                    sqlContent += '\n';
                }
            } catch (err) {
                console.warn(`Warning: Could not export table ${tableName}. Error: ${err.message}`);
                sqlContent += `-- Warning: Could not export table \`${tableName}\`. Error: ${err.message}\n\n`;
            }
        }

        sqlContent += `SET FOREIGN_KEY_CHECKS=1;\n`;

        fs.writeFileSync('database_full_dump.sql', sqlContent);
        console.log('Database successfully exported to database_full_dump.sql');
        console.log('Tables exported:', tableNames.join(', '));
    } catch (err) {
        console.error('Error exporting database:', err);
    } finally {
        await connection.end();
    }
}

exportDatabase();
