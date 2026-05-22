const express = require('express');
const router = express.Router();
const adminConfigController = require('../controllers/adminConfigController');
const categoryController = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// SEO
router.get('/seo', adminConfigController.getAllSeo);
router.post('/seo', protect, adminOnly, adminConfigController.updateSeo);

// Theme
router.get('/theme', adminConfigController.getTheme);
router.post('/theme', protect, adminOnly, adminConfigController.updateTheme);

// System Configs
router.get('/configs', protect, adminOnly, adminConfigController.getSystemConfigs);
router.post('/configs', protect, adminOnly, adminConfigController.updateSystemConfig);

// Banner Admin
router.get('/banners', protect, adminOnly, adminConfigController.getBannerRequests);
router.put('/banners/:id/status', protect, adminOnly, adminConfigController.updateBannerStatus);
router.delete('/banners/:id', protect, adminOnly, adminConfigController.deleteBannerRequest);

// Listing Details for Admin
router.get('/listings/:id', protect, adminOnly, adminConfigController.getListingDetails);

// Categories Management
router.get('/categories', protect, adminOnly, categoryController.getAllCategories);
router.post('/categories', protect, adminOnly, categoryController.createCategory);
router.put('/categories/:id', protect, adminOnly, categoryController.updateCategory);
router.delete('/categories/:id', protect, adminOnly, categoryController.deleteCategory);
router.patch('/categories/:id/toggle', protect, adminOnly, categoryController.toggleCategoryStatus);

// Note: Public banners moved to listingRoutes to avoid 401 issues
module.exports = router;
