const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, landlordOnly } = require('../middleware/authMiddleware');

router.post('/', protect, bookingController.createBooking);
router.get('/landlord', protect, landlordOnly, bookingController.getLandlordBookings);
router.get('/tenant', protect, bookingController.getTenantBookings);
router.get('/user-status/:roomId', protect, bookingController.checkUserRoomStatus);
router.put('/:id/confirm', protect, landlordOnly, bookingController.confirmBooking);
router.put('/:id/reject', protect, landlordOnly, bookingController.rejectBooking);
router.post('/:id/pay-deposit', protect, bookingController.payDeposit);

router.put('/:id/cancel', protect, bookingController.cancelBooking);

module.exports = router;
