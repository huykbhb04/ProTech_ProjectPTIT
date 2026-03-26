const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { protect } = require('../middleware/authMiddleware');

// Protected routes (require login)
router.use(protect);

// Building Routes
router.post('/buildings', propertyController.createBuilding);
router.get('/buildings', propertyController.getMyBuildings);
router.get('/buildings/:id', propertyController.getBuilding);

// Room Routes
router.post('/rooms', propertyController.createRoom);
router.put('/rooms/:roomId', propertyController.updateRoom);
router.get('/rooms/available-all', propertyController.getAvailableRoomsAll);
router.get('/rooms/:roomId/details', propertyController.getRoomDetails);
router.delete('/rooms/:roomId', propertyController.deleteRoom);
router.get('/buildings/:buildingId/rooms', propertyController.getRooms);

module.exports = router;
