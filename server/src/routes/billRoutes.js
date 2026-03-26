const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const { protect, landlordOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Tenant routes
router.get('/tenant/list', protect, billController.getTenantBills);
router.get('/:id', protect, billController.getBillDetail);
router.put('/:id/meter-reading', protect, upload.single('image'), billController.uploadMeterReading);
router.put('/:id/payment-proof', protect, upload.single('proof'), billController.submitPaymentProof);
router.get('/:id/vietqr', protect, billController.generateVietQR);

// Landlord routes
router.get('/landlord/list', protect, landlordOnly, billController.getLandlordBills);
router.put('/:id/confirm', protect, landlordOnly, billController.confirmBill);
router.put('/:id/approve-payment', protect, landlordOnly, billController.approvePayment);
router.put('/:id/mark-paid', protect, landlordOnly, billController.landlordMarkAsPaid);

// Manual creation (landlord only)
router.post('/create', protect, landlordOnly, billController.createBill);

module.exports = router;
