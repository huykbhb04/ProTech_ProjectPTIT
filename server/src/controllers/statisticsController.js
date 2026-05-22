const Statistics = require('../models/statisticsModel');

exports.getOverviewStats = async (req, res) => {
    try {
        const landlordId = req.user.user_id; // Using user_id from JWT payload
        
        // Note: Check if req.user structure is user_id or userId. 
        // Based on app.js and previously seen controllers, it's often user_id or userId.
        // Let's check auth middleware or another controller to be sure.
        
        const stats = await Statistics.getLandlordOverview(landlordId);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ message: 'Error fetching statistics', error: error.message });
    }
};
