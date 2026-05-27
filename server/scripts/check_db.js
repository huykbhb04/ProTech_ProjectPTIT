const db = require('../src/config/database');
async function test() {
  try {
    const [rooms] = await db.query("DESCRIBE rooms");
    console.log('rooms columns:', rooms.map(c => ({ Field: c.Field, Type: c.Type })));
    const [buildings] = await db.query("DESCRIBE buildings");
    console.log('buildings columns:', buildings.map(c => ({ Field: c.Field, Type: c.Type })));
  } catch (err) {
    console.error('Error running check script:', err);
  }
  process.exit(0);
}
test();
