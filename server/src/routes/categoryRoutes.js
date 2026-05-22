const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public routes
router.get('/', categoryController.getActiveCategories);
router.get('/:id', categoryController.getCategoryById);

// Admin routes (protected)
router.post('/', protect, adminOnly, categoryController.createCategory);
router.put('/:id', protect, adminOnly, categoryController.updateCategory);
router.delete('/:id', protect, adminOnly, categoryController.deleteCategory);
router.patch('/:id/toggle', protect, adminOnly, categoryController.toggleCategoryStatus);

module.exports = router;
