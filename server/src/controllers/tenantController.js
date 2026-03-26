const Property = require('../models/propertyModel');
const db = require('../config/database');

exports.getMyRoom = async (req, res) => {
    try {
        const tenantId = req.user.userId;

        // 1. Find active contract for this tenant
        const contractQuery = `
            SELECT c.*, r.room_number, r.floor, r.area, b.name as building_name, b.address_full
            FROM contracts c
            JOIN rooms r ON c.room_id = r.room_id
            JOIN buildings b ON r.building_id = b.building_id
            WHERE c.tenant_id = ? AND c.status = 'active'
            LIMIT 1
        `;
        const [contracts] = await db.execute(contractQuery, [tenantId]);

        if (contracts.length === 0) {
            return res.status(200).json({ message: 'No active contract found', hasContract: false });
        }

        const contract = contracts[0];

        // 2. Use existing getRoomDetails to get the rest of the info (Utilities, Assets, Maintenance)
        const details = await Property.getRoomDetails(contract.room_id);

        res.json({
            ...details,
            hasContract: true
        });

    } catch (error) {
        console.error("Get My Room Error:", error);
        res.status(500).json({ message: 'Error fetching tenant room details' });
    }
};
