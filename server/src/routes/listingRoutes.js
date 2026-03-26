const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/active', listingController.getActiveListings);
router.get('/room/:roomId', listingController.getListingByRoom);

// Protected landlord routes
router.post('/', protect, listingController.createListing);
router.get('/landlord', protect, listingController.getLandlordListings);
router.put('/:id', protect, listingController.updateListing);
router.delete('/:id', protect, listingController.deleteListing);

module.exports = router;
