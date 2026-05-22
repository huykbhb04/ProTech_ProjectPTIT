const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { protect, landlordOnly } = require('../middleware/authMiddleware');

router.post('/request', protect, landlordOnly, bannerController.createBannerRequest);
router.get('/my-requests', protect, landlordOnly, bannerController.getMyBannerRequests);

module.exports = router;
