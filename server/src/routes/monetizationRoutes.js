const express = require('express');
const router = express.Router();
const monetizationController = require('../controllers/monetizationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/packages', protect, monetizationController.getPackages);
router.get('/premium-services', protect, monetizationController.getPremiumServices);
router.get('/wallet', protect, monetizationController.getWalletInfo);
router.post('/pay', protect, monetizationController.processPayment);

module.exports = router;
