const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { protect } = require('../middleware/authMiddleware');

router.get('/my-room', protect, tenantController.getMyRoom);

module.exports = router;
