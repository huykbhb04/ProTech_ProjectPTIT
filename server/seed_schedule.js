const db = require('./src/config/database');

async function updateRoomSchedule() {
    try {
        console.log('--- UPDATING ROOM SCHEDULE FOR TESTING ---');

        // 1. Get Room ID from Bill #1 (which we reset earlier)
        const [bills] = await db.execute('SELECT room_id FROM bills ORDER BY bill_id DESC LIMIT 1');
        if (bills.length === 0) return;
        const roomId = bills[0].room_id;

        // 2. Set next cleaning/maintenance dates
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);

        const query = `
            UPDATE rooms 
            SET next_cleaning_date = ?,
                next_maintenance_date = ?
            WHERE room_id = ?
        `;

        await db.execute(query, [nextWeek, nextMonth, roomId]);
        console.log(`✅ Updated Room ${roomId} with cleaning/maintenance schedule.`);

        process.exit(0);
    } catch (error) {
        console.error('Error updating room:', error);
        process.exit(1);
    }
}

updateRoomSchedule();
