const db = require('./src/config/database');

async function run() {
  try {
    const [existing] = await db.query("SELECT * FROM premium_services WHERE badge_type IN ('home_banner', 'sidebar_banner')");
    if (existing.length === 0) {
      await db.query(`
        INSERT INTO premium_services (name, badge_type, description, price_per_day, is_active) 
        VALUES 
        ('Banner Khổng Lồ (Trang Chủ)', 'home_banner', 'Banner quảng cáo ở ngay đầu trang chủ', 15000, 1),
        ('Banner Sidebar Nổi Bật', 'sidebar_banner', 'Quảng cáo bên góc phải tất cả trang', 7000, 1)
      `);
      console.log('Inserted banners!');
    } else {
      console.log('Already exists');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
run();
