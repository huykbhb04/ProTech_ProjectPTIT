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

module.exports = router;
