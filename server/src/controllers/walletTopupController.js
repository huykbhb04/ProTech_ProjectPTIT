const crypto = require('crypto');
const axios = require('axios');
const db = require('../config/database');
const WalletTopup = require('../models/walletTopupModel');

const TECHCOMBANK_ACCOUNT = process.env.TECHCOMBANK_ACCOUNT || '1080938386';
const TECHCOMBANK_ACCOUNT_NAME = process.env.TECHCOMBANK_ACCOUNT_NAME || 'BUI DUC HUY';
const TECHCOMBANK_BANK_CODE = process.env.TECHCOMBANK_BANK_CODE || 'TCB';
const TECHCOMBANK_BANK_BIN = process.env.TECHCOMBANK_BANK_BIN || '970407';
const VNPAY_TMNCODE = process.env.VNPAY_TMN_CODE || '';
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET || '';
const VNPAY_URL = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNPAY_RETURN_URL = process.env.VNPAY_RETURN_URL || 'http://localhost:5000/api/wallet-topups/vnpay-return';
const VNPAY_IPN_URL = process.env.VNPAY_IPN_URL || 'http://localhost:5000/api/wallet-topups/vnpay-ipn';
const TOPUP_EXPIRE_MINUTES = Number(process.env.WALLET_TOPUP_EXPIRE_MINUTES || 30);
const TOPUP_MATCH_WINDOW_MINUTES = Number(process.env.WALLET_TOPUP_MATCH_WINDOW_MINUTES || 1440);

const buildReferenceCode = (userId) => {
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `TOPUP-${userId}-${Date.now()}-${suffix}`;
};

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

const buildVnpayUrl = ({ amount, referenceCode, orderInfo, ipAddr }) => {
    if (!VNPAY_TMNCODE || !VNPAY_HASH_SECRET) throw new Error('VNPay chưa được cấu hình');
    const createDate = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const vnpCreateDate = `${createDate.getFullYear()}${pad(createDate.getMonth() + 1)}${pad(createDate.getDate())}${pad(createDate.getHours())}${pad(createDate.getMinutes())}${pad(createDate.getSeconds())}`;
    const params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: VNPAY_TMNCODE,
        vnp_Amount: String(Math.round(amount * 100)),
        vnp_CurrCode: 'VND',
        vnp_TxnRef: referenceCode,
        vnp_OrderInfo: orderInfo || `Nạp tiền ví ${referenceCode}`,
        vnp_OrderType: 'other',
        vnp_Locale: 'vn',
        vnp_ReturnUrl: VNPAY_RETURN_URL,
        vnp_IpAddr: ipAddr || '127.0.0.1',
        vnp_CreateDate: vnpCreateDate,
        vnp_ExpireDate: `${vnpCreateDate.slice(0, 8)}${pad(createDate.getHours() + 1)}${pad(createDate.getMinutes())}${pad(createDate.getSeconds())}`,
    };
    const sorted = Object.keys(params).sort();
    // VNPAY requires URL-encoded values (like PHP urlencode / Java URLEncoder)
    const signData = sorted.map(k => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`).join('&');
    const secureHash = crypto.createHmac('sha512', VNPAY_HASH_SECRET).update(Buffer.from(signData, 'utf-8')).digest('hex');
    return `${VNPAY_URL}?${signData}&vnp_SecureHash=${secureHash}`;
};

exports.createWalletTopup = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const amount = Number(req.body.amount || 0);
        const method = String(req.body.method || 'vietqr').toLowerCase();
        const orderInfo = req.body.orderInfo || `Nạp tiền ví ${userId}`;
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Số tiền nạp không hợp lệ' });
        }

        const referenceCode = buildReferenceCode(userId);
        const expiresAt = new Date(Date.now() + TOPUP_EXPIRE_MINUTES * 60 * 1000);
        let qrCodeUrl = null;
        let payUrl = null;
        let bank = null;

        if (method === 'vnpay') {
            payUrl = buildVnpayUrl({ amount, referenceCode, orderInfo, ipAddr: req.ip?.replace('::ffff:', '') || '127.0.0.1' });
        } else {
            qrCodeUrl = buildVietQrUrl(amount, referenceCode);
            bank = {
                bankCode: TECHCOMBANK_BANK_CODE,
                bankName: 'Techcombank',
                accountNumber: TECHCOMBANK_ACCOUNT,
                accountName: TECHCOMBANK_ACCOUNT_NAME,
            };
        }

        const topupId = await WalletTopup.create({
            user_id: userId,
            amount,
            payment_method: method === 'vnpay' ? 'vnpay' : 'vietqr',
            reference_code: referenceCode,
            bank_code: method === 'vnpay' ? 'VNPAY' : TECHCOMBANK_BANK_CODE,
            bank_account: method === 'vnpay' ? '' : TECHCOMBANK_ACCOUNT,
            bank_name: method === 'vnpay' ? 'VNPAY' : 'Techcombank',
            account_name: method === 'vnpay' ? 'VNPAY' : TECHCOMBANK_ACCOUNT_NAME,
            qr_code_url: qrCodeUrl,
        });

        return res.json({
            topupId,
            amount,
            method,
            referenceCode,
            qrCodeUrl,
            payUrl,
            bank,
            transferContent: referenceCode,
            expiresAt,
            status: 'pending',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Lỗi tạo yêu cầu nạp tiền' });
    }
};

exports.getWalletTopup = async (req, res) => {
    try {
        const { id } = req.params;
        const topup = await WalletTopup.getById(id);
        if (!topup || topup.user_id !== req.user.user_id) {
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu nạp tiền' });
        }
        return res.json(topup);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Lỗi lấy trạng thái nạp tiền' });
    }
};

const applyTopupMatch = async ({ topupId, bankRef, description }) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [lockRows] = await connection.execute('SELECT topup_id, status, user_id, amount FROM wallet_topups WHERE topup_id = ? FOR UPDATE', [topupId]);
        const topup = lockRows[0];
        if (!topup || topup.status === 'credited') {
            await connection.rollback();
            return false;
        }

        await connection.execute('UPDATE users SET wallet_balance = wallet_balance + ? WHERE user_id = ?', [topup.amount, topup.user_id]);
        await connection.execute(
            `UPDATE wallet_topups
             SET status = 'credited', matched_bank_ref = ?, matched_description = ?, matched_at = NOW(), credited_at = NOW()
             WHERE topup_id = ?`,
            [String(bankRef || ''), String(description || ''), topup.topup_id]
        );
        await connection.execute(
            `INSERT INTO transactions (bill_id, gateway_ref_id, amount, bank_code, status)
             VALUES (NULL, ?, ?, ?, 'success')`,
            [String(bankRef || topup.topup_id), topup.amount, TECHCOMBANK_BANK_CODE]
        );
        await connection.commit();
        return true;
    } catch (e) {
        await connection.rollback();
        throw e;
    } finally {
        connection.release();
    }
};

const extractDescription = (tx) => String(tx.description || tx.transferContent || tx.memo || tx.content || '').trim();

exports.receiveTopupWebhook = async (req, res) => {
    try {
        const payload = req.body || {};
        const transactions = Array.isArray(payload.transactions)
            ? payload.transactions
            : Array.isArray(payload.data)
                ? payload.data
                : Array.isArray(payload)
                    ? payload
                    : [];

        const matched = [];
        for (const tx of transactions) {
            const description = extractDescription(tx).toUpperCase();
            const amount = Number(tx.amount || tx.tranAmount || 0);
            const bankRef = tx.id || tx.transactionId || tx.ref || tx.reference || '';

            if (!description || !amount) continue;

            const [candidates] = await db.execute(
                `SELECT * FROM wallet_topups
                 WHERE status IN ('pending', 'matched')
                   AND amount = ?
                   AND created_at >= (NOW() - INTERVAL ? MINUTE)
                 ORDER BY created_at DESC`,
                [amount, TOPUP_MATCH_WINDOW_MINUTES]
            );

            for (const topup of candidates) {
                if (description.includes(topup.reference_code.toUpperCase())) {
                    const applied = await applyTopupMatch({
                        topupId: topup.topup_id,
                        bankRef,
                        description,
                    });
                    if (applied) {
                        matched.push({ topupId: topup.topup_id, referenceCode: topup.reference_code, amount: topup.amount });
                        break;
                    }
                }
            }
        }

        return res.json({ success: true, matchedCount: matched.length, matched });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Lỗi xử lý webhook đối soát' });
    }
};

exports.pollWalletTopups = async (req, res) => {
    try {
        const topups = await WalletTopup.getPending(50);
        const matched = [];
        const apiUrl = process.env.BANK_RECONCILIATION_API_URL;
        if (!apiUrl) {
            return res.json({ success: true, matchedCount: 0, matched: [], note: 'BANK_RECONCILIATION_API_URL not configured' });
        }

        for (const topup of topups) {
            const response = await axios.get(apiUrl, {
                params: { account: TECHCOMBANK_ACCOUNT, q: topup.reference_code, amount: topup.amount },
                timeout: 15000,
            });

            const transactions = Array.isArray(response.data?.transactions)
                ? response.data.transactions
                : Array.isArray(response.data)
                    ? response.data
                    : [];

            const hit = transactions.find((tx) => {
                const desc = extractDescription(tx).toUpperCase();
                const amount = Number(tx.amount || tx.tranAmount || 0);
                return desc.includes(topup.reference_code.toUpperCase()) && amount === Number(topup.amount);
            });

            if (!hit) continue;
            const applied = await applyTopupMatch({
                topupId: topup.topup_id,
                bankRef: hit.id || hit.transactionId || hit.ref || '',
                description: extractDescription(hit),
            });
            if (applied) matched.push({ topupId: topup.topup_id, referenceCode: topup.reference_code, amount: topup.amount });
        }

        res.json({ success: true, matchedCount: matched.length, matched });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Lỗi polling đối soát' });
    }
};

exports.debugWalletTopupReconciliation = async (req, res) => {
    try {
        const { referenceCode, amount, description, payload } = req.body || {};
        const debugDescription = String(description || payload?.description || payload?.transferContent || payload?.memo || '').trim();
        const debugAmount = Number(amount || payload?.amount || payload?.tranAmount || 0);
        const reference = String(referenceCode || payload?.referenceCode || payload?.reference || '').trim();

        const [recentTopups] = await db.execute(
            `SELECT topup_id, user_id, amount, reference_code, status, created_at, matched_bank_ref, matched_description
             FROM wallet_topups
             ORDER BY created_at DESC
             LIMIT 20`
        );

        let match = null;
        if (reference || debugDescription) {
            const candidates = recentTopups.filter((t) => {
                const amountOk = debugAmount ? Number(t.amount) === debugAmount : true;
                const refOk = reference ? t.reference_code.toUpperCase() === reference.toUpperCase() : true;
                const descOk = debugDescription ? debugDescription.toUpperCase().includes(t.reference_code.toUpperCase()) : true;
                return amountOk && refOk && descOk;
            });
            match = candidates[0] || null;
        }

        res.json({
            success: true,
            config: {
                account: TECHCOMBANK_ACCOUNT,
                bankCode: TECHCOMBANK_BANK_CODE,
                reconciliationApiConfigured: Boolean(process.env.BANK_RECONCILIATION_API_URL),
            },
            input: { referenceCode: reference || null, amount: debugAmount || null, description: debugDescription || null },
            recentTopups,
            matchedTopup: match,
            wouldMatch: Boolean(match),
            reason: match
                ? 'Matched by reference/description/amount'
                : 'No local topup matched the provided sample data',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Lỗi debug đối soát' });
    }
};

// ─── VNPAY Handlers ──────────────────────────────────────────────────────────

const verifyVnpaySign = (query) => {
    const secureHash = query.vnp_SecureHash;
    const signData = { ...query };
    delete signData.vnp_SecureHash;
    delete signData.vnp_SecureHashType;
    // Sort keys, then URL-encode values (matches VNPAY signing method)
    const sorted = Object.keys(signData).sort();
    const queryStr = sorted
        .map(k => `${k}=${encodeURIComponent(signData[k]).replace(/%20/g, '+')}`)
        .join('&');
    const hash = crypto.createHmac('sha512', VNPAY_HASH_SECRET).update(Buffer.from(queryStr, 'utf-8')).digest('hex');
    return hash === secureHash;
};

/**
 * GET /api/wallet-topups/topup/vnpay-return
 * VNPAY redirects user back to this URL after payment.
 * We redirect the browser to the frontend result page.
 */
exports.vnpayReturn = async (req, res) => {
    try {
        const query = req.query;
        const isValid = verifyVnpaySign(query);
        const responseCode = query.vnp_ResponseCode;
        const txnRef = query.vnp_TxnRef;
        const amount = Math.round(Number(query.vnp_Amount || 0) / 100);
        const transactionNo = query.vnp_TransactionNo || '';
        const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';

        if (isValid && responseCode === '00') {
            // Try to credit the topup immediately
            try {
                const topup = await WalletTopup.findByReference(txnRef);
                if (topup && topup.status !== 'credited') {
                    await applyTopupMatch({
                        topupId: topup.topup_id,
                        bankRef: transactionNo,
                        description: `VNPAY ${txnRef}`,
                    });
                }
            } catch (e) {
                console.error('[vnpayReturn] applyTopupMatch error:', e.message);
            }
            return res.redirect(
                `${frontendBase}/payment/vnpay-return?status=success&txnRef=${encodeURIComponent(txnRef)}&amount=${amount}&transactionNo=${encodeURIComponent(transactionNo)}`
            );
        }

        return res.redirect(
            `${frontendBase}/payment/vnpay-return?status=failed&txnRef=${encodeURIComponent(txnRef)}&responseCode=${responseCode}`
        );
    } catch (error) {
        console.error('[vnpayReturn]', error);
        const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendBase}/payment/vnpay-return?status=error`);
    }
};

/**
 * GET /api/wallet-topups/topup/vnpay-ipn
 * VNPAY server calls this URL to confirm payment result (IPN).
 */
exports.vnpayIpn = async (req, res) => {
    try {
        const query = req.query;
        const isValid = verifyVnpaySign(query);
        if (!isValid) {
            return res.json({ RspCode: '97', Message: 'Invalid signature' });
        }

        const responseCode = query.vnp_ResponseCode;
        const txnRef = query.vnp_TxnRef;
        const vnpAmount = Math.round(Number(query.vnp_Amount || 0) / 100);
        const transactionNo = query.vnp_TransactionNo || '';

        const topup = await WalletTopup.findByReference(txnRef);
        if (!topup) {
            return res.json({ RspCode: '01', Message: 'Order not found' });
        }
        if (Number(topup.amount) !== vnpAmount) {
            return res.json({ RspCode: '04', Message: 'Invalid amount' });
        }
        if (topup.status === 'credited') {
            return res.json({ RspCode: '02', Message: 'Order already confirmed' });
        }

        if (responseCode === '00') {
            await applyTopupMatch({
                topupId: topup.topup_id,
                bankRef: transactionNo,
                description: `VNPAY IPN ${txnRef}`,
            });
            return res.json({ RspCode: '00', Message: 'Confirm success' });
        }

        // Payment failed — mark expired
        await WalletTopup.markExpired(topup.topup_id);
        return res.json({ RspCode: '00', Message: 'Confirm success' });
    } catch (error) {
        console.error('[vnpayIpn]', error);
        return res.json({ RspCode: '99', Message: 'Unknown error' });
    }
};