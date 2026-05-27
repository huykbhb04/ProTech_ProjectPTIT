const db = require('../src/config/database');

async function run() {
  try {
    console.log('--- FINDING ROOMS AND LISTINGS WITH ZERO UTILITY PRICES ---');

    // Query rooms
    const [rooms] = await db.query(
      'SELECT room_id, room_number, electricity_price, water_price FROM rooms WHERE electricity_price = 0 OR water_price = 0'
    );
    console.log(`Found ${rooms.length} rooms with zero utility prices.`);

    // Query room_listings
    const [listings] = await db.query(
      'SELECT listing_id, title, electricity_price, water_price FROM room_listings WHERE electricity_price = 0 OR water_price = 0'
    );
    console.log(`Found ${listings.length} room listings with zero utility prices.`);

    // Update rooms to default prices (e.g., electricity: 3500 VND/kWh, water: 15000 VND/m3)
    if (rooms.length > 0) {
      console.log('Updating rooms...');
      const [roomUpdate] = await db.query(
        'UPDATE rooms SET electricity_price = CASE WHEN electricity_price = 0 THEN 3500 ELSE electricity_price END, water_price = CASE WHEN water_price = 0 THEN 15000 ELSE water_price END WHERE electricity_price = 0 OR water_price = 0'
      );
      console.log(`Updated ${roomUpdate.affectedRows} rooms.`);
    }

    // Update room_listings
    if (listings.length > 0) {
      console.log('Updating room listings...');
      const [listingUpdate] = await db.query(
        'UPDATE room_listings SET electricity_price = CASE WHEN electricity_price = 0 THEN 3500 ELSE electricity_price END, water_price = CASE WHEN water_price = 0 THEN 15000 ELSE water_price END WHERE electricity_price = 0 OR water_price = 0'
      );
      console.log(`Updated ${listingUpdate.affectedRows} room listings.`);
    }

    console.log('--- DATABASE SYNC COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Error updating utility prices:', err);
  }
  process.exit(0);
}

run();
