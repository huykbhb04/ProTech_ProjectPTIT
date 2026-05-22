const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminOnly = require('../middleware/adminMiddleware');

// All routes require admin authentication
router.use(adminOnly);

// ===== LISTING PACKAGES =====
router.get('/packages', adminController.getAllPackages);
router.post('/packages', adminController.createPackage);
router.put('/packages/:id', adminController.updatePackage);
router.patch('/packages/:id/toggle', adminController.togglePackageStatus);
router.delete('/packages/:id', adminController.deletePackage);

// ===== PREMIUM SERVICES =====
router.get('/services', adminController.getAllPremiumServices);
router.post('/services', adminController.createPremiumService);
router.put('/services/:id', adminController.updatePremiumService);
router.patch('/services/:id/toggle', adminController.toggleServiceStatus);
router.delete('/services/:id', adminController.deleteService);

// ===== SYSTEM CONFIGS =====
const adminConfigController = require('../controllers/adminConfigController');
router.get('/system-configs', adminConfigController.getSystemConfigs);
router.post('/system-configs', adminConfigController.updateSystemConfig);

// ===== BOOKING DEPOSITS & PAYOUTS =====
const bookingController = require('../controllers/bookingController');
router.get('/booking-deposits', bookingController.getAllBookingDeposits);
router.post('/booking-deposits/:id/confirm-payment', bookingController.adminConfirmPayment);
router.post('/booking-deposits/:id/payout', bookingController.adminPayoutLandlord);

// ===== USER MANAGEMENT =====
const adminUserController = require('../controllers/adminUserController');
router.get('/users', adminUserController.getAllUsers);
router.post('/users', adminUserController.createUser);
router.put('/users/:id', adminUserController.updateUser);
router.patch('/users/:id/status', adminUserController.updateUserStatus);
router.delete('/users/:id', adminUserController.deleteUser);

module.exports = router;
