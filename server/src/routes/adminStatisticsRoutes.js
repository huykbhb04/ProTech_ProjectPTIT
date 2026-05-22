const express = require('express');
const router = express.Router();
const adminStatisticsController = require('../controllers/adminStatisticsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Get overview stats for admin
router.get('/overview', protect, adminOnly, adminStatisticsController.getAdminOverview);

// Get paginated, filterable, sortable transactions
router.get('/transactions', protect, adminOnly, adminStatisticsController.getTransactions);

module.exports = router;
