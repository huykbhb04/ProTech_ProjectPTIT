const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const ocrController = require('../controllers/ocrController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const uploadMemory = multer({ storage: multer.memoryStorage() });

// AI Description
router.post('/generate-description', protect, aiController.generateDescription);

// AI Chat
router.post('/chat', protect, aiController.chat);

// AI Price Suggestion (ML)
router.post('/predict-price', protect, aiController.predictPrice);

// AI OCR
router.post('/ocr/cccd', protect, uploadMemory.single('file'), ocrController.processCCCD);
router.post('/ocr/meter', protect, uploadMemory.single('file'), ocrController.processMeter);

module.exports = router;
