const express = require('express');
const router = express.Router();
const roommateController = require('../controllers/roommateController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, roommateController.getMyProfile);
router.post('/profile', protect, roommateController.updateProfile);
router.get('/matches', protect, roommateController.findMatches);

module.exports = router;
