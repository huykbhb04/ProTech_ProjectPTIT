const Booking = require('../models/bookingModel');
const Notification = require('../models/notificationModel');
const Property = require('../models/propertyModel');

exports.createBooking = async (req, res) => {
    try {
        const { roomId, bookingDate, bookingTime } = req.body;
        const tenantId = req.user.user_id;

        // 1. Check for time conflicts (+/- 15 minutes)
        const hasConflict = await Booking.checkConflict(tenantId, bookingDate, bookingTime);
        if (hasConflict) {
            return res.status(400).json({
                message: 'Bạn đã có một lịch hẹn khác trong vòng 15 phút quanh khoảng thời gian này. Vui lòng chọn giờ khác.'
            });
        }

        const bookingId = await Booking.create({
            roomId,
            tenantId,
            bookingDate,
            bookingTime
        });

        // Get room and landlord info for notification
        const room = await Property.getRoomById(roomId);
        if (room) {
            const building = await Property.getBuildingById(room.building_id);
            if (building) {
                await Notification.create(
                    building.landlord_id,
                    'Yêu cầu đặt lịch xem phòng mới',
                    `Người thuê ${req.user.full_name} đã đặt lịch xem phòng ${room.room_number} tại ${building.name} vào ngày ${bookingDate} lúc ${bookingTime}.`,
                    'booking'
                );
            }
        }

        res.status(201).json({
            success: true,
            bookingId,
            message: 'Đặt lịch xem phòng thành công. Vui lòng chờ xác nhận từ chủ trọ.'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getLandlordBookings = async (req, res) => {
    try {
        const bookings = await Booking.getByLandlord(req.user.user_id);
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTenantBookings = async (req, res) => {
    try {
        const bookings = await Booking.getByTenant(req.user.user_id);
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.checkUserRoomStatus = async (req, res) => {
    try {
        const { roomId } = req.params;
        const tenantId = req.user.user_id;

        const hasBooking = await Booking.hasExistingBooking(tenantId, roomId);
        res.json({ hasBooking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.confirmBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { leadPersonName, leadPersonPhone, landlordNotes } = req.body;

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin đặt lịch.' });
        }

        // Verify landlord
        if (booking.landlord_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Bạn không có quyền xác nhận lịch hẹn này.' });
        }

        await Booking.confirm(id, {
            leadPersonName,
            leadPersonPhone,
            landlordNotes
        });

        // Notify tenant
        await Notification.create(
            booking.tenant_id,
            'Đã xác nhận lịch xem phòng',
            `Lịch xem phòng ${booking.room_number} tại ${booking.building_name} của bạn đã được xác nhận. Người dẫn xem: ${leadPersonName} (${leadPersonPhone}). Ngày: ${booking.booking_date} lúc ${booking.booking_time}.`,
            'booking'
        );

        res.json({
            success: true,
            message: 'Xác nhận lịch xem phòng thành công.'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.rejectBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id);

        if (!booking || booking.landlord_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Không có quyền thực hiện.' });
        }

        await Booking.updateStatus(id, 'rejected');

        await Notification.create(
            booking.tenant_id,
            'Lịch xem phòng bị từ chối',
            `Yêu cầu xem phòng ${booking.room_number} tại ${booking.building_name} của bạn đã bị từ chối.`,
            'booking'
        );

        res.json({ success: true, message: 'Đã từ chối lịch hẹn.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
