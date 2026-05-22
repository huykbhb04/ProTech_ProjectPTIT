const fs = require('fs');
const path = require('path');

const dataDir = 'C:\\xampp\\mysql\\data';
const backupDir = 'C:\\xampp\\mysql\\data_broken_backup';

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

const dbsToMove = ['employee_schedule', 'phongtro', 'phongtro1', 'smart_proptech', 'test'];

for (const db of dbsToMove) {
    const src = path.join(dataDir, db);
    const dest = path.join(backupDir, db);
    if (fs.existsSync(src)) {
        try {
            fs.renameSync(src, dest);
            console.log(`Successfully moved ${db} to backup folder.`);
        } catch (e) {
            console.log(`Could not move ${db}: ${e.message}`);
        }
    }
}
