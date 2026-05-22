const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { protect, landlordOnly } = require('../middleware/authMiddleware');

// Get overview stats for landlord
router.get('/overview', protect, landlordOnly, statisticsController.getOverviewStats);

module.exports = router;
