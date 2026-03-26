const db = require('./src/config/database');

async function updateExpiredListings() {
    try {
        console.log('Checking for expired listings...\n');

        // Update status to 'paused' for listings that have expired
        const [result] = await db.execute(`
            UPDATE room_listings 
            SET status = 'paused' 
            WHERE status = 'active' 
              AND expires_at IS NOT NULL 
              AND expires_at < NOW()
        `);

        console.log(`✓ Updated ${result.affectedRows} expired listings to 'paused' status`);

        // Also clear premium status if premium_until has passed
        const [premiumResult] = await db.execute(`
            UPDATE room_listings 
            SET premium_service_id = NULL, premium_until = NULL 
            WHERE premium_until IS NOT NULL 
              AND premium_until < NOW()
        `);

        console.log(`✓ Cleared premium status from ${premiumResult.affectedRows} listings`);

        console.log('\n✅ Expiration check completed successfully!');
    } catch (error) {
        console.error('❌ Error updating expired listings:', error.message);
    } finally {
        process.exit(0);
    }
}

updateExpiredListings();
