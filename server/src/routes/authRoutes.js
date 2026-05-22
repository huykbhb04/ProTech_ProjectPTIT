const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register/otp', authController.sendRegisterOtp);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/google', authController.googleAuthStart);
router.post('/google/callback', authController.googleAuthCallback);

module.exports = router;
