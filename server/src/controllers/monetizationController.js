const axios = require('axios');
const crypto = require('crypto');
const Monetization = require('../models/monetizationModel');
const Listing = require('../models/listingModel');
const db = require('../config/database');

exports.getPackages = async (req, res) => {
    try {
        const packages = await Monetization.getAllPackages();
        res.json(packages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tải danh sách gói tin' });
    }
};

exports.getPremiumServices = async (req, res) => {
    try {
        const services = await Monetization.getAllPremiumServices();
        res.json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tải danh sách dịch vụ VIP' });
    }
};

exports.getWalletInfo = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const balance = await Monetization.getWalletBalance(userId);
        const history = await Monetization.getPaymentHistory(userId);
        res.json({ balance: Number(balance || 0), history: Array.isArray(history) ? history : [] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tải thông tin ví' });
    }
};

exports.getWalletHistoryPaginated = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { page = 1, limit = 10 } = req.query;
        const result = await Monetization.getPaymentHistoryPaginated(userId, {
            page: parseInt(page),
            limit: Math.min(50, parseInt(limit)),
        });
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tải lịch sử giao dịch' });
    }
};

const TECHCOMBANK_ACCOUNT = process.env.TECHCOMBANK_ACCOUNT || '1080938386';
const TECHCOMBANK_ACCOUNT_NAME = process.env.TECHCOMBANK_ACCOUNT_NAME || 'BUI DUC HUY';
const TECHCOMBANK_BANK_CODE = process.env.TECHCOMBANK_BANK_CODE || 'TCB';
const TECHCOMBANK_BANK_BIN = process.env.TECHCOMBANK_BANK_BIN || '970407';
const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || '';
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || '';
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || '';
const MOMO_ENDPOINT = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';

const buildVietQrUrl = (amount, content) => {
    const params = new URLSearchParams({
        accountNo: TECHCOMBANK_ACCOUNT,
        accountName: TECHCOMBANK_ACCOUNT_NAME,
        acqId: TECHCOMBANK_BANK_BIN,
        amount: String(amount),
        addInfo: content,
        template: 'compact2',
    });
    return `https://img.vietqr.io/image/${TECHCOMBANK_BANK_CODE}-${TECHCOMBANK_ACCOUNT}-compact2.png?${params.toString()}`;
};

exports.handleMomoIpn = async (req, res) => {
    try {
        console.log('MoMo IPN received:', req.body);
        return res.json({ resultCode: 0, message: 'OK' });
    } catch (error) {
        console.error('MoMo IPN error:', error);
        return res.status(500).json({ message: 'IPN error' });
    }
};

const createMomoPayment = async ({ amount, orderId, orderInfo }) => {
    if (!MOMO_PARTNER_CODE || !MOMO_ACCESS_KEY || !MOMO_SECRET_KEY) {
        throw new Error('MoMo chưa được cấu hình');
    }

    const requestId = `${orderId}-${Date.now()}`;
    const redirectUrl = process.env.MOMO_REDIRECT_URL || 'http://localhost:5173/landlord/wallet';
    const ipnUrl = process.env.MOMO_IPN_URL || 'http://localhost:3000/api/monetization/wallet/topup/momo/ipn';
    const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`;
    const signature = crypto.createHmac('sha256', MOMO_SECRET_KEY).update(rawSignature).digest('hex');

    const payload = {
        partnerCode: MOMO_PARTNER_CODE,
        accessKey: MOMO_ACCESS_KEY,
        requestId,
        amount: String(amount),
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        requestType: 'captureWallet',
        extraData: '',
        lang: 'vi',
        signature,
    };

    const response = await axios.post(MOMO_ENDPOINT, payload, { timeout: 15000 });
    return response.data;
};

exports.topUpWallet = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const amount = Number(req.body.amount || 0);
        const method = req.body.method || 'vietqr';
        const orderInfo = req.body.orderInfo || `Nap tien vi ${userId}`;

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Số tiền nạp không hợp lệ' });
        }

        const transactionRef = `${method.toUpperCase()}-${Date.now()}`;

        if (method === 'momo') {
            const momo = await createMomoPayment({ amount, orderId: transactionRef, orderInfo });
            return res.json({
                method: 'momo',
                transactionRef,
                payUrl: momo.payUrl || momo.deeplink || momo.shortLink || null,
                qrCodeUrl: momo.qrCodeUrl || null,
                raw: momo,
            });
        }

        const vietQrUrl = buildVietQrUrl(amount, transactionRef);
        return res.json({
            method: 'vietqr',
            transactionRef,
            qrCodeUrl: vietQrUrl,
            qrText: `https://img.vietqr.io/image/${TECHCOMBANK_BANK_CODE}-${TECHCOMBANK_ACCOUNT}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transactionRef)}`,
            bank: {
                bankCode: TECHCOMBANK_BANK_CODE,
                bankName: 'Techcombank',
                accountNumber: TECHCOMBANK_ACCOUNT,
                accountName: TECHCOMBANK_ACCOUNT_NAME,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Lỗi nạp tiền' });
    }
};

exports.processPayment = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { listingId, paymentType, referenceId, amount, paymentMethod, durationDays = 30 } = req.body;
        const userId = req.user.user_id;

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ message: 'Số tiền không hợp lệ' });
        }

        if (paymentMethod === 'wallet') {
            const [rows] = await connection.execute('SELECT wallet_balance FROM users WHERE user_id = ? FOR UPDATE', [userId]);
            const currentBalance = parseFloat(rows[0]?.wallet_balance || 0);
            if (currentBalance < parsedAmount) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ message: 'Số dư trong ví không đủ để thực hiện giao dịch' });
            }
            await connection.execute('UPDATE users SET wallet_balance = wallet_balance - ? WHERE user_id = ?', [parsedAmount, userId]);
        }

        const transactionRef = `SIM-${Date.now()}`;
        const [paymentResult] = await connection.execute(
            `INSERT INTO listing_payments 
            (user_id, listing_id, amount, payment_method, payment_type, reference_id, transaction_ref, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')`,
            [userId, listingId || null, parsedAmount, paymentMethod, paymentType, referenceId || null, transactionRef]
        );
        const paymentId = paymentResult.insertId;

        await connection.commit();
        connection.release();

        try {
            if (paymentType === 'package') {
                const pkg = await Monetization.getPackageById(referenceId);
                const [currentListingRows] = await db.query('SELECT expires_at FROM room_listings WHERE listing_id = ?', [listingId]);
                let baseDate = new Date();
                if (currentListingRows[0]?.expires_at && new Date(currentListingRows[0].expires_at) > baseDate) {
                    baseDate = new Date(currentListingRows[0].expires_at);
                }
                const expiresAt = new Date(baseDate);
                expiresAt.setDate(expiresAt.getDate() + (pkg?.duration_days || durationDays));
                await Monetization.applyPackageToListing(listingId, referenceId, expiresAt);
            }

            if (paymentType === 'listing_renewal') {
                const [currentListingRows] = await db.query('SELECT expires_at, status FROM room_listings WHERE listing_id = ?', [listingId]);
                let baseDate = new Date();
                if (currentListingRows[0]?.expires_at && new Date(currentListingRows[0].expires_at) > baseDate) {
                    baseDate = new Date(currentListingRows[0].expires_at);
                }
                const expiresAt = new Date(baseDate);
                expiresAt.setDate(expiresAt.getDate() + Number(durationDays || 30));
                await Listing.update(listingId, {
                    status: 'active',
                    expires_at: expiresAt.toISOString().slice(0, 19).replace('T', ' ')
                });
            }

            if (paymentType === 'premium_service') {
                const premiumUntil = new Date();
                const days = req.body.durationDays || 7;
                premiumUntil.setDate(premiumUntil.getDate() + days);
                await Monetization.applyPremiumServiceToListing(listingId, referenceId, premiumUntil);
            }
        } catch (sideEffectError) {
            console.error('Warning: Post-payment side effect failed:', sideEffectError.message);
        }

        res.json({ message: 'Thanh toán thành công', paymentId, transactionRef });
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error(error);
        res.status(500).json({ message: 'Lỗi xử lý thanh toán' });
    }
};

exports.getRenewalQuote = async (req, res) => {
    try {
        const { listingId } = req.params;
        const { durationDays = 30 } = req.query;
        const days = Number(durationDays || 30);
        const listing = await Listing.getByRoomIdFromListingId ? await Listing.getByRoomIdFromListingId(listingId) : null;
        const pricePerDay = 10000;
        const amount = pricePerDay * days;
        res.json({ listingId, durationDays: days, amount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Không thể tính giá gia hạn' });
    }
};
