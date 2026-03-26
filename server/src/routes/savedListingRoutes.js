const express = require('express');
const router = express.Router();
const savedListingController = require('../controllers/savedListingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All routes require authentication

router.post('/toggle', savedListingController.toggleSave);
router.get('/', savedListingController.getSavedListings);
router.get('/ids', savedListingController.getSavedIds);

module.exports = router;
