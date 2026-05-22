const Booking = require('../models/bookingModel');
const Notification = require('../models/notificationModel');
const Property = require('../models/propertyModel');
const db = require('../config/database');

const parseConfirmLog = (value) => {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch (_) {
        return value;
    }
};

exports.createBooking = async (req, res) => {
    try {
        const { roomId, bookingDate, bookingTime } = req.body;
        const tenantId = req.user.user_id;

        if (!bookingDate || !bookingTime) {
            return res.status(400).json({ message: 'Vui lòng chọn đầy đủ ngày và giờ đặt lịch.' });
        }

        const selectedAt = new Date(`${bookingDate}T${bookingTime}:00`);
        const minAllowedAt = new Date(Date.now() + 60 * 60 * 1000);

        if (Number.isNaN(selectedAt.getTime())) {
            return res.status(400).json({ message: 'Ngày hoặc giờ đặt lịch không hợp lệ.' });
        }

        if (selectedAt < minAllowedAt) {
            return res.status(400).json({ message: 'Vui lòng chọn lịch hẹn cách thời điểm hiện tại ít nhất 1 tiếng.' });
        }

        // 1. Check for time conflicts (+/- 15 minutes)
        const hasConflict = await Booking.checkConflict(tenantId, bookingDate, bookingTime);
        if (hasConflict) {
            return res.status(400).json({
                message: 'Bạn đã có một lịch hẹn khác trong vòng 15 phút quanh khoảng thời gian này. Vui lòng chọn giờ khác.'
            });
        }

        // 2. Get viewing deposit config
        const [configs] = await db.query('SELECT config_key, config_value FROM system_configs WHERE config_key IN (?, ?)', ['viewing_deposit_amount', 'viewing_deposit_commission']);
        const depositAmount = parseFloat(configs.find(c => c.config_key === 'viewing_deposit_amount')?.config_value || 200000);
        const commissionRate = parseFloat(configs.find(c => c.config_key === 'viewing_deposit_commission')?.config_value || 10);
        const commissionAmount = (depositAmount * commissionRate) / 100;

        const bookingId = await Booking.create({
            roomId,
            tenantId,
            bookingDate,
            bookingTime,
            type: 'viewing',
            depositAmount,
            commissionRate,
            commissionAmount
        });

        // 3. Notify landlord
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
            depositAmount,
            message: 'Đã tạo yêu cầu xem phòng. Vui lòng thanh toán tiền cọc 200k để xác nhận lịch hẹn.'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.adminConfirmPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy đơn.' });
        }

        // 1. Update payment status
        await db.execute('UPDATE bookings SET payment_status = "paid", payment_date = NOW() WHERE booking_id = ?', [id]);
        
        // 2. Update booking status to 'deposited' ONLY if it's currently 'pending'
        // If it's already 'confirmed' by landlord, leave it as 'confirmed'
        if (booking.status === 'pending') {
            await db.execute('UPDATE bookings SET status = "deposited" WHERE booking_id = ?', [id]);
        }
        
        // Notify tenant
        await Notification.create(
            booking.tenant_id,
            'Thanh toán cọc thành công',
            `Hệ thống đã xác nhận khoản cọc ${new Intl.NumberFormat('vi-VN').format(booking.deposit_amount)} VNĐ cho lịch xem phòng ${booking.room_number}.`,
            'booking'
        );

        res.json({ success: true, message: 'Đã xác nhận thanh toán thành công.' });
    } catch (error) {
        console.error('Error in adminConfirmPayment:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.adminPayoutLandlord = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ message: 'Không tìm thấy đơn.' });

        if (booking.payment_status !== 'paid') {
            return res.status(400).json({ message: 'Khách chưa thanh toán, không thể thực hiện payout.' });
        }

        const payoutAmount = booking.deposit_amount - booking.commission_amount;

        // Transactional update
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Update booking
            await connection.execute('UPDATE bookings SET payout_status = "paid", payout_date = NOW() WHERE booking_id = ?', [id]);

            // 2. Add to landlord wallet
            await connection.execute('UPDATE users SET wallet_balance = wallet_balance + ? WHERE user_id = ?', [payoutAmount, booking.landlord_id]);

            await connection.commit();
            res.json({ success: true, message: 'Đã thực hiện thanh toán cho Chủ trọ.' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllBookingDeposits = async (req, res) => {
    try {
        const [bookings] = await db.query(`
            SELECT b.*, r.room_number, bl.name as building_name, 
                   ut.full_name as tenant_name, ul.full_name as landlord_name
            FROM bookings b
            JOIN rooms r ON b.room_id = r.room_id
            JOIN buildings bl ON r.building_id = bl.building_id
            JOIN users ut ON b.tenant_id = ut.user_id
            JOIN users ul ON bl.landlord_id = ul.user_id
            WHERE b.deposit_amount > 0
            ORDER BY b.created_at DESC
        `);
        res.json(bookings);
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
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        const { leadPersonName, leadPersonPhone, landlordNotes } = req.body;

        const booking = await Booking.findById(id);
        if (!booking) {
            connection.release();
            return res.status(404).json({ message: 'Không tìm thấy thông tin đặt lịch.' });
        }

        if (booking.landlord_id !== req.user.user_id) {
            connection.release();
            return res.status(403).json({ message: 'Bạn không có quyền xác nhận lịch hẹn này.' });
        }

        const confirmLog = JSON.stringify({
            action: 'confirmed',
            confirmedBy: req.user.user_id,
            confirmedAt: new Date().toISOString(),
            leadPersonName,
            leadPersonPhone,
            landlordNotes,
            previousStatus: booking.status,
        });

        await connection.beginTransaction();

        await connection.execute(
            `UPDATE bookings 
             SET status = 'confirmed', lead_person_name = ?, lead_person_phone = ?, landlord_notes = ?, confirm_log = ?
             WHERE booking_id = ?`,
            [leadPersonName || null, leadPersonPhone || null, landlordNotes || null, confirmLog, id]
        );

        const msg = booking.type === 'reservation' 
            ? `Yêu cầu đặt cọc phòng ${booking.room_number} của bạn đã được chấp nhận. Vui lòng tiến hành thanh toán tiền cọc để giữ chỗ.`
            : `Lịch xem phòng ${booking.room_number} tại ${booking.building_name} của bạn đã được xác nhận. Người dẫn xem: ${leadPersonName} (${leadPersonPhone}). Ngày: ${booking.booking_date} lúc ${booking.booking_time}.`;

        await Notification.create(
            booking.tenant_id,
            'Xác nhận từ Chủ trọ',
            msg,
            'booking'
        );

        await connection.commit();
        connection.release();

        res.json({
            success: true,
            message: 'Xác nhận thành công.'
        });
    } catch (error) {
        try {
            await connection.rollback();
        } catch (_) {}
        connection.release();
        res.status(500).json({ message: error.message });
    }
};

exports.rejectBooking = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const booking = await Booking.findById(id);

        if (!booking || booking.landlord_id !== req.user.user_id) {
            connection.release();
            return res.status(403).json({ message: 'Không có quyền thực hiện.' });
        }

        const rejectLog = JSON.stringify({
            action: 'rejected',
            rejectedBy: req.user.user_id,
            rejectedAt: new Date().toISOString(),
            reason: reason || null,
            previousStatus: booking.status,
        });

        await connection.beginTransaction();
        await connection.execute('UPDATE bookings SET status = "rejected", confirm_log = ? WHERE booking_id = ?', [rejectLog, id]);

        await Notification.create(
            booking.tenant_id,
            'Lịch xem phòng bị từ chối',
            `Yêu cầu xem phòng ${booking.room_number} tại ${booking.building_name} của bạn đã bị từ chối${reason ? `: ${reason}` : '.'}`,
            'booking'
        );

        await connection.commit();
        connection.release();

        res.json({ success: true, message: 'Đã từ chối lịch hẹn.' });
    } catch (error) {
        try { await connection.rollback(); } catch (_) {}
        connection.release();
        res.status(500).json({ message: error.message });
    }
};
