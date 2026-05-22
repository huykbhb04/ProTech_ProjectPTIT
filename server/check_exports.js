const bookingController = require('./src/controllers/bookingController');
console.log('Keys:', Object.keys(bookingController));
console.log('getAllBookingDeposits:', typeof bookingController.getAllBookingDeposits);
console.log('adminConfirmPayment:', typeof bookingController.adminConfirmPayment);
console.log('adminPayoutLandlord:', typeof bookingController.adminPayoutLandlord);
