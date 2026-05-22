const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.get('/me', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.post('/avatar', protect, upload.single('avatar'), userController.uploadAvatar);

router.get('/payment-methods', protect, userController.getPaymentMethods);
router.post('/payment-methods', protect, userController.addPaymentMethod);
router.delete('/payment-methods/:id', protect, userController.deletePaymentMethod);

router.post('/verify-id', protect, userController.verifyIdentity);

module.exports = router;
