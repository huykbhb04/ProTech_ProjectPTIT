const express = require('express');
const router = express.Router();
const { protect, landlordOnly } = require('../middleware/authMiddleware');
const controller = require('../controllers/walletTopupController');

// Named sub-routes MUST come before /:id to avoid being captured as an id param
router.post('/topup', protect, landlordOnly, controller.createWalletTopup);
router.post('/topup/webhook', controller.receiveTopupWebhook);
router.post('/topup/poll', protect, landlordOnly, controller.pollWalletTopups);
router.get('/topup/vnpay-return', controller.vnpayReturn);
router.get('/topup/vnpay-ipn', controller.vnpayIpn);
router.get('/topup/debug', protect, landlordOnly, controller.debugWalletTopupReconciliation);
router.post('/topup/debug', protect, landlordOnly, controller.debugWalletTopupReconciliation);

// Parameterized route last
router.get('/topup/:id', protect, landlordOnly, controller.getWalletTopup);

module.exports = router;
