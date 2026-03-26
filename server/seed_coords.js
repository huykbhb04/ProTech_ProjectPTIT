const db = require('./src/config/database');

async function seedCoordinates() {
    try {
        const [buildings] = await db.execute('SELECT building_id, name, address_full FROM buildings');
        console.log(`Found ${buildings.length} buildings to update.`);

        const samples = [
            { lat: 21.0068, lng: 105.8429 },
            { lat: 21.0173, lng: 105.7838 },
            { lat: 21.0285, lng: 105.8521 }
        ];

        for (let i = 0; i < buildings.length; i++) {
            const coords = samples[i % samples.length];
            await db.execute('UPDATE buildings SET coordinates = ? WHERE building_id = ?', [
                JSON.stringify(coords),
                buildings[i].building_id
            ]);
            console.log(`Updated building ${buildings[i].name} with coords ${JSON.stringify(coords)}`);
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding coordinates:', error);
        process.exit(1);
    }
}

seedCoordinates();
