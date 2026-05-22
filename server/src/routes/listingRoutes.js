const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/active', listingController.getActiveListings);
router.get('/room/:roomId', listingController.getListingByRoom);

// Public Banners & Theme
const adminConfigController = require('../controllers/adminConfigController');
router.get('/banners/active', adminConfigController.getActiveBanners);
router.get('/theme', adminConfigController.getTheme);
router.get('/configs', adminConfigController.getSystemConfigs);

// Protected landlord routes
router.post('/', protect, listingController.createListing);
router.get('/landlord', protect, listingController.getLandlordListings);
router.get('/landlord/paginated', protect, listingController.getLandlordListingsPaginated);
router.put('/:id', protect, listingController.updateListing);
router.delete('/:id', protect, listingController.deleteListing);
router.post('/:id/view', listingController.incrementView);

module.exports = router;
