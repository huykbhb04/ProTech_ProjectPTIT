const express = require('express');
const router = express.Router();
const Notification = require('../models/notificationModel');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, async (req, res) => {
    try {
        const notis = await Notification.getByUser(req.user.user_id);
        res.json(notis);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id/read', protect, async (req, res) => {
    try {
        await Notification.markAsRead(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/read-all', protect, async (req, res) => {
    try {
        await Notification.markAllAsRead(req.user.user_id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
