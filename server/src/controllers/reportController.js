const ReportModel = require('../models/reportModel');
const User = require('../models/userModel');
const Listing = require('../models/listingModel');
const emailService = require('../services/emailService');
const db = require('../config/database');

// Mapping frontend reason texts to standard DB reason keys
const REASON_MAP = {
    'Tin có dấu hiệu lừa đảo': 'fraud',
    'Tin trùng lặp nội dung': 'duplicate',
    'Không liên hệ được chủ tin đăng': 'no_contact',
    'Thông tin không đúng thực tế (giá, diện tích, hình ảnh...)': 'fake_info',
    'Lý do khác': 'other',
    'fraud': 'fraud',
    'duplicate': 'duplicate',
    'no_contact': 'no_contact',
    'fake_info': 'fake_info',
    'other': 'other'
};

exports.submitReport = async (req, res) => {
    try {
        const listingId = req.params.id;
        const { reporterName, reporterPhone, reason: rawReason, description } = req.body;
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

        if (!reporterName || !reporterPhone || !rawReason) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ Họ tên, Số điện thoại và Lý do.' });
        }

        const reason = REASON_MAP[rawReason] || 'other';

        // 1. Fetch listing details to ensure it exists and get landlord ID
        const [listingRows] = await db.execute(`
            SELECT rl.*, b.landlord_id, u.email as landlord_email, u.full_name as landlord_name
            FROM room_listings rl
            JOIN rooms r ON rl.room_id = r.room_id
            JOIN buildings b ON r.building_id = b.building_id
            JOIN users u ON b.landlord_id = u.user_id
            WHERE rl.listing_id = ?
        `, [listingId]);

        if (listingRows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tin đăng này.' });
        }

        const listing = listingRows[0];
        const landlordId = listing.landlord_id;

        // 2. Create the report in database
        const reportId = await ReportModel.createReport({
            listingId,
            reporterName,
            reporterPhone,
            reason,
            description,
            ipAddress
        });

        let autoHidden = false;

        // 3. Automated Scanning Filters
        // Filter 1: Anti-fraud (fraud reports >= 3 from different phones and IPs in last 2 hours)
        if (reason === 'fraud') {
            const counts = await ReportModel.getRecentFraudReportsCount(listingId, 2);
            if (counts.uniquePhones >= 3) {
                // Auto-hide listing
                await db.execute(
                    "UPDATE room_listings SET status = 'hidden', status_reason = ? WHERE listing_id = ?",
                    ['Tin bị tạm ẩn tự động do nhận nhiều phản ánh lừa đảo', listingId]
                );
                autoHidden = true;

                // Send email notification to landlord
                await emailService.notifyListingAutoHidden(
                    listing.landlord_email,
                    listing.landlord_name,
                    listing.title,
                    'Tin bị báo cáo lừa đảo liên tục từ nhiều người dùng'
                );
            }
        }

        // Filter 3: Reputation score updates
        // If reported for 'fake_info' or 'no_contact', automatically decrease reputation score
        if (reason === 'fake_info') {
            await User.updateReputationScore(landlordId, -5); // deduct 5 points
        } else if (reason === 'no_contact') {
            await User.updateReputationScore(landlordId, -3); // deduct 3 points
        }

        res.status(201).json({
            message: autoHidden 
                ? 'Gửi phản ánh thành công! Tin đăng có dấu hiệu vi phạm nghiêm trọng và đã bị hệ thống tạm ẩn.' 
                : 'Gửi phản ánh thành công! Ban quản trị sẽ xác minh tin đăng này.',
            reportId,
            autoHidden
        });

    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi gửi phản ánh', error: error.message });
    }
};

exports.submitDispute = async (req, res) => {
    try {
        const landlordId = req.user.user_id;
        const { listingId, explanation, proofImages } = req.body;

        if (!listingId || !explanation) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mã tin đăng và giải trình khiếu nại.' });
        }

        // Verify listing belongs to this landlord
        const [listingRows] = await db.execute(`
            SELECT rl.* FROM room_listings rl
            JOIN rooms r ON rl.room_id = r.room_id
            JOIN buildings b ON r.building_id = b.building_id
            WHERE rl.listing_id = ? AND b.landlord_id = ?
        `, [listingId, landlordId]);

        if (listingRows.length === 0) {
            return res.status(403).json({ message: 'Bạn không có quyền khiếu nại cho tin đăng này.' });
        }

        // Create dispute
        const disputeId = await ReportModel.createDispute({
            listingId,
            landlordId,
            explanation,
            proofImages
        });

        // Update listing reason to reflect that a dispute is pending
        await db.execute(
            "UPDATE room_listings SET status_reason = ? WHERE listing_id = ?",
            ['Đang khiếu nại - Chờ Admin xét duyệt', listingId]
        );

        res.status(201).json({
            message: 'Gửi khiếu nại thành công! Vui lòng chờ Admin thẩm định và phản hồi.',
            disputeId
        });

    } catch (error) {
        console.error('Error submitting dispute:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi gửi khiếu nại', error: error.message });
    }
};

// ===== ADMIN CONTROLLER ACTIONS =====

exports.adminGetReports = async (req, res) => {
    try {
        const { status, reason } = req.query;
        const reports = await ReportModel.getAllReports({ status, reason });
        res.json(reports);
    } catch (error) {
        console.error('Error fetching admin reports:', error);
        res.status(500).json({ message: 'Lỗi tải danh sách phản ánh', error: error.message });
    }
};

exports.adminResolveReport = async (req, res) => {
    try {
        const reportId = req.params.id;
        const { action, adminNotes } = req.body; // action: 'lock_listing', 'block_user', 'dismiss'

        if (!action) {
            return res.status(400).json({ message: 'Hành động giải quyết (action) là bắt buộc.' });
        }

        const report = await ReportModel.findReportById(reportId);
        if (!report) {
            return res.status(404).json({ message: 'Không tìm thấy phản ánh này.' });
        }

        const { listing_id, landlord_id, landlord_email, landlord_name, listing_title } = report;

        if (action === 'lock_listing') {
            // Lock listing permanently
            await db.execute(
                "UPDATE room_listings SET status = 'locked', status_reason = ? WHERE listing_id = ?",
                [adminNotes || 'Tin bị khóa vĩnh viễn do vi phạm quy định', listing_id]
            );

            // Deduct landlord reputation score
            await User.updateReputationScore(landlord_id, -20);

            // Resolve all pending reports for this listing
            await ReportModel.updateAllReportsForListing(listing_id, 'resolved_lock', adminNotes);
            await ReportModel.updateReportStatus(reportId, 'resolved_lock', adminNotes);

            // Notify landlord
            await emailService.notifyListingLocked(
                landlord_email,
                landlord_name,
                listing_title,
                adminNotes || 'Nội dung tin đăng vi phạm nghiêm trọng quy chuẩn cộng đồng.'
            );

        } else if (action === 'block_user') {
            // Block landlord account
            await User.updateStatus(landlord_id, 'blocked');

            // Lock listing permanently as well
            await db.execute(
                "UPDATE room_listings SET status = 'locked', status_reason = ? WHERE listing_id = ?",
                ['Chủ tin đăng đã bị khóa tài khoản', listing_id]
            );

            // Resolve all pending reports for this listing
            await ReportModel.updateAllReportsForListing(listing_id, 'resolved_lock', adminNotes);
            await ReportModel.updateReportStatus(reportId, 'resolved_lock', adminNotes);

            // Notify landlord
            await emailService.notifyAccountBlocked(
                landlord_email,
                landlord_name,
                adminNotes || 'Tài khoản vi phạm các quy định chính sách bảo mật/lừa đảo.'
            );

        } else if (action === 'dismiss') {
            // Dismiss report, restore listing if it was auto-hidden
            if (report.listing_status === 'hidden') {
                await db.execute(
                    "UPDATE room_listings SET status = 'active', status_reason = NULL WHERE listing_id = ?",
                    [listing_id]
                );
            }

            // Restore landlord reputation score (kindness/reward for being innocent, add 5 points)
            await User.updateReputationScore(landlord_id, 5);

            // Resolve all pending reports for this listing
            await ReportModel.updateAllReportsForListing(listing_id, 'resolved_dismiss', adminNotes);
            await ReportModel.updateReportStatus(reportId, 'resolved_dismiss', adminNotes);
        }

        res.json({ message: 'Giải quyết phản ánh thành công.' });

    } catch (error) {
        console.error('Error resolving report:', error);
        res.status(500).json({ message: 'Lỗi giải quyết phản ánh', error: error.message });
    }
};

exports.adminGetDisputes = async (req, res) => {
    try {
        const { status } = req.query;
        const disputes = await ReportModel.getAllDisputes({ status });
        res.json(disputes);
    } catch (error) {
        console.error('Error fetching disputes:', error);
        res.status(500).json({ message: 'Lỗi tải danh sách khiếu nại', error: error.message });
    }
};

exports.adminResolveDispute = async (req, res) => {
    try {
        const disputeId = req.params.id;
        const { action, adminNotes } = req.body; // action: 'approve' (restore listing), 'reject'

        if (!action) {
            return res.status(400).json({ message: 'Hành động giải quyết (action) là bắt buộc.' });
        }

        const dispute = await ReportModel.findDisputeById(disputeId);
        if (!dispute) {
            return res.status(404).json({ message: 'Không tìm thấy đơn khiếu nại này.' });
        }

        const { listing_id, landlord_id, landlord_email, landlord_name, listing_title } = dispute;

        if (action === 'approve') {
            // Restore listing
            await db.execute(
                "UPDATE room_listings SET status = 'active', status_reason = NULL WHERE listing_id = ?",
                [listing_id]
            );

            // Resolve dispute
            await ReportModel.updateDisputeStatus(disputeId, 'resolved_approved', adminNotes);

            // Boost landlord reputation score for being cleared
            await User.updateReputationScore(landlord_id, 10);

        } else if (action === 'reject') {
            // Reject dispute, listing remains locked/hidden
            await db.execute(
                "UPDATE room_listings SET status_reason = ? WHERE listing_id = ?",
                ['Khiếu nại bị từ chối - Giữ nguyên quyết định xử phạt', listing_id]
            );

            // Resolve dispute
            await ReportModel.updateDisputeStatus(disputeId, 'resolved_rejected', adminNotes);
        }

        res.json({ message: 'Giải quyết khiếu nại thành công.' });

    } catch (error) {
        console.error('Error resolving dispute:', error);
        res.status(500).json({ message: 'Lỗi giải quyết khiếu nại', error: error.message });
    }
};
