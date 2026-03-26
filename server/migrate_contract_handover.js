const db = require('./src/config/database');

async function migrate() {
    try {
        console.log('--- Running Contract Handover Fields Migration ---');

        const migration = `
            ALTER TABLE contracts
            ADD COLUMN handover_electricity_index INT AFTER landlord_cccd_back_url,
            ADD COLUMN handover_water_index INT AFTER handover_electricity_index,
            ADD COLUMN handover_date DATETIME AFTER handover_water_index,
            ADD COLUMN service_commitments JSON AFTER handover_date,
            ADD COLUMN additional_services JSON AFTER service_commitments;
        `;

        await db.execute(migration);
        console.log('✅ Migration completed successfully!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();
