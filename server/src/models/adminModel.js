const db = require('../config/database');

class Admin {
    // ===== LISTING PACKAGES =====

    static async getAllPackages() {
        const [rows] = await db.execute('SELECT * FROM listing_packages ORDER BY duration_days ASC');
        return rows;
    }

    static async createPackage(data) {
        const { name, duration_days, price, description } = data;
        const [result] = await db.execute(
            'INSERT INTO listing_packages (name, duration_days, price, description, is_active) VALUES (?, ?, ?, ?, TRUE)',
            [name, duration_days, price, description]
        );
        return result.insertId;
    }

    static async updatePackage(packageId, data) {
        const { name, duration_days, price, description } = data;
        await db.execute(
            'UPDATE listing_packages SET name = ?, duration_days = ?, price = ?, description = ? WHERE package_id = ?',
            [name, duration_days, price, description, packageId]
        );
    }

    static async togglePackageStatus(packageId) {
        await db.execute(
            'UPDATE listing_packages SET is_active = NOT is_active WHERE package_id = ?',
            [packageId]
        );
    }

    static async deletePackage(packageId) {
        await db.execute('DELETE FROM listing_packages WHERE package_id = ?', [packageId]);
    }

    // ===== PREMIUM SERVICES =====

    static async getAllPremiumServices() {
        const [rows] = await db.execute('SELECT * FROM premium_services ORDER BY price_per_day DESC');
        return rows;
    }

    static async createPremiumService(data) {
        const { name, badge_type, price_per_day, description } = data;
        const [result] = await db.execute(
            'INSERT INTO premium_services (name, badge_type, price_per_day, description, is_active) VALUES (?, ?, ?, ?, TRUE)',
            [name, badge_type, price_per_day, description]
        );
        return result.insertId;
    }

    static async updatePremiumService(serviceId, data) {
        const { name, badge_type, price_per_day, description } = data;
        await db.execute(
            'UPDATE premium_services SET name = ?, badge_type = ?, price_per_day = ?, description = ? WHERE service_id = ?',
            [name, badge_type, price_per_day, description, serviceId]
        );
    }

    static async toggleServiceStatus(serviceId) {
        await db.execute(
            'UPDATE premium_services SET is_active = NOT is_active WHERE service_id = ?',
            [serviceId]
        );
    }

    static async deleteService(serviceId) {
        await db.execute('DELETE FROM premium_services WHERE service_id = ?', [serviceId]);
    }
}

module.exports = Admin;
