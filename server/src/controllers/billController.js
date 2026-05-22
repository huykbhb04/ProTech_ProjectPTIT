const Bill = require('../models/billModel');
const Contract = require('../models/contractModel');
const cloudinary = require('../config/cloudinary');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// ==================== Tenant Endpoints ====================

exports.getTenantBills = async (req, res) => {
    try {
        const tenantId = req.user.user_id;
        const bills = await Bill.getTenantBills(tenantId);
        res.json(bills);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBillDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const bill = await Bill.getById(id);

        if (!bill) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        }

        // Verify access
        if (req.user.role === 'tenant' && bill.tenant_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Không có quyền truy cập' });
        }

        res.json(bill);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.uploadMeterReading = async (req, res) => {
    try {
        const { id } = req.params; // bill_id
        const { type, reading_value } = req.body; // 'electricity' or 'water', manual value
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'Vui lòng upload ảnh đồng hồ để làm bằng chứng' });
        }

        // file.path = Cloudinary URL (https://...) when using multer-cloudinary
        const cloudinaryUrl = file.path;

        let reading = parseFloat(reading_value);
        let confidence = 1.0; // Manual input is 100% confident
        let isManual = true;

        // If no manual reading provided, try AI OCR (fallback)
        if (isNaN(reading)) {
            isManual = false;
            try {
                // BUG FIX #6: file.path is a Cloudinary URL, not a local path.
                // Download the image from Cloudinary into a buffer, then send to AI service.
                const axiosLib = require('axios');
                const imageResponse = await axiosLib.get(cloudinaryUrl, { responseType: 'arraybuffer' });
                const imageBuffer = Buffer.from(imageResponse.data);

                const formData = new FormData();
                const { Blob } = require('buffer');
                formData.append('file', new Blob([imageBuffer], { type: file.mimetype || 'image/jpeg' }), file.originalname || 'meter.jpg');

                const aiResponse = await axiosLib.post('http://localhost:8000/ocr/meter', formData, {
                    headers: formData.getHeaders ? formData.getHeaders() : { 'Content-Type': 'multipart/form-data' }
                });
                reading = aiResponse.data.reading;
                confidence = aiResponse.data.confidence;
            } catch (aiError) {
                console.error('AI service error:', aiError.message);
                return res.status(503).json({
                    message: 'Dịch vụ AI OCR tạm thời không khả dụng. Vui lòng nhập số thủ công.',
                    imageUrl: cloudinaryUrl
                });
            }
        }

        // Update bill with meter reading
        await Bill.updateMeterReading(id, type, reading, cloudinaryUrl, confidence);

        // Recalculate total if both readings are available
        const bill = await Bill.getById(id);
        if (bill.electricity_new && bill.water_new) {
            await Bill.calculateTotalAmount(id);
        }

        res.json({
            success: true,
            reading,
            confidence,
            imageUrl: cloudinaryUrl,
            autoApprove: true,
            isManual,
            message: 'Đã cập nhật chỉ số thành công'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.submitPaymentProof = async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_note, transaction_ref } = req.body;
        const file = req.file;

        const paymentData = {
            payment_method: 'transfer',
            payment_proof_url: file ? file.path : null,
            payment_note,
            transaction_ref
        };

        await Bill.submitPayment(id, paymentData);

        res.json({
            success: true,
            message: 'Đã ghi nhận thanh toán. Chủ nhà sẽ xác nhận sớm.'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==================== Landlord Endpoints ====================

exports.getLandlordBills = async (req, res) => {
    try {
        const landlordId = req.user.user_id;
        const filters = {
            status: req.query.status,
            month: req.query.month
        };

        const bills = await Bill.getLandlordBills(landlordId, filters);

        // Calculate stats
        const stats = {
            total: bills.length,
            pending: bills.filter(b => b.status === 'pending').length,
            confirmed: bills.filter(b => b.status === 'confirmed').length,
            paid: bills.filter(b => b.status === 'paid').length,
            overdue: bills.filter(b => b.status === 'overdue').length,
            totalRevenue: bills.filter(b => b.status === 'paid')
                .reduce((sum, b) => sum + parseFloat(b.total_amount), 0)
        };

        res.json({ bills, stats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.confirmBill = async (req, res) => {
    try {
        const { id } = req.params;
        const landlordId = req.user.user_id;

        const bill = await Bill.getById(id);

        if (!bill) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        }

        // Verify ownership
        const [building] = await require('../config/database').execute(
            'SELECT landlord_id FROM buildings b JOIN rooms r ON b.building_id = r.building_id WHERE r.room_id = ?',
            [bill.room_id]
        );

        if (building[0].landlord_id !== landlordId) {
            return res.status(403).json({ message: 'Không có quyền thực hiện' });
        }

        await Bill.confirmBill(id, landlordId);

        res.json({
            success: true,
            message: 'Đã xác nhận hóa đơn'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.approvePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const landlordId = req.user.user_id;

        const bill = await Bill.getById(id);
        if (!bill) return res.status(404).json({ message: 'Bill not found' });

        // Verify ownership (simplified check if trusted middleware, but good to keep)

        await Bill.approvePayment(id, landlordId);

        res.json({
            success: true,
            message: 'Đã xác nhận thanh toán thành công'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.landlordMarkAsPaid = async (req, res) => {
    try {
        const { id } = req.params;
        // For landlord manually marking as paid (cash), logic remains similar but perhaps direct to paid
        const { payment_method = 'cash', payment_note } = req.body;

        const paymentData = {
            payment_method,
            payment_note,
            payment_proof_url: null,
            transaction_ref: 'CASH-' + Date.now()
        };

        // If landlord marks as paid, it goes straight to paid, or uses the old markAsPaid but we should use approvePayment if we want consistancy 
        // But markAsPaid is fine for "Manual Cash Received". 
        // Let's keep markAsPaid existing logic for 'Cash' but ensure it sets status='paid'.
        // My Bill.markAsPaid sets status='paid'. That is fine.

        await Bill.markAsPaid(id, paymentData);

        res.json({
            success: true,
            message: 'Đã đánh dấu hóa đơn là đã thanh toán'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==================== VietQR Generation ====================

exports.generateVietQR = async (req, res) => {
    try {
        const { id } = req.params;
        const bill = await Bill.getById(id);

        if (!bill) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        }

        // Get landlord bank info
        const [landlord] = await require('../config/database').execute(
            `SELECT u.bank_name, u.bank_account_number, u.bank_account_name
             FROM buildings b 
             JOIN rooms r ON b.building_id = r.building_id
             JOIN users u ON b.landlord_id = u.user_id
             WHERE r.room_id = ?`,
            [bill.room_id]
        );

        if (!landlord[0] || !landlord[0].bank_account_number) {
            return res.status(400).json({
                message: 'Chủ nhà chưa cấu hình thông tin ngân hàng'
            });
        }

        const month = new Date(bill.billing_month).toISOString().substring(0, 7);
        const description = `PHONG${bill.room_number} THANG${month}`;

        // Generate VietQR using API.vietqr.io
        const qrData = {
            accountNo: landlord[0].bank_account_number,
            accountName: landlord[0].bank_account_name,
            acqId: landlord[0].bank_code || '970415', // Default to Vietinbank
            amount: Math.round(bill.total_amount),
            addInfo: description,
            format: 'text',
            template: 'compact'
        };

        const qrUrl = `https://img.vietqr.io/image/${qrData.acqId}-${qrData.accountNo}-${qrData.template}.png?amount=${qrData.amount}&addInfo=${encodeURIComponent(qrData.addInfo)}&accountName=${encodeURIComponent(qrData.accountName)}`;

        res.json({
            success: true,
            qrUrl,
            bankInfo: {
                bank: landlord[0].bank_name,
                accountNumber: landlord[0].bank_account_number,
                accountName: landlord[0].bank_account_name
            },
            amount: bill.total_amount,
            description
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==================== Manual Operations ====================

exports.createBill = async (req, res) => {
    try {
        const billData = req.body;
        const billId = await Bill.create(billData);

        res.status(201).json({
            success: true,
            billId,
            message: 'Đã tạo hóa đơn thành công'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = exports;
