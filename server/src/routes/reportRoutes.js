const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, landlordOnly, adminOnly } = require('../middleware/authMiddleware');

// Giai đoạn 1: Người thuê phát hiện bất thường và gửi phản ánh (Public)
router.post('/listings/:id/report', reportController.submitReport);

// Giai đoạn 4: Cơ chế khiếu nại của Chủ phòng trọ
router.post('/disputes', protect, landlordOnly, reportController.submitDispute);

// Giai đoạn 3: Admin tiếp nhận thông tin và ra phán quyết tối hậu
router.get('/admin/reports', protect, adminOnly, reportController.adminGetReports);
router.post('/admin/reports/:id/resolve', protect, adminOnly, reportController.adminResolveReport);

router.get('/admin/disputes', protect, adminOnly, reportController.adminGetDisputes);
router.post('/admin/disputes/:id/resolve', protect, adminOnly, reportController.adminResolveDispute);

module.exports = router;
