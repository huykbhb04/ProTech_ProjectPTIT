const axios = require('axios');
const db = require('../config/database');
const WalletTopup = require('../models/walletTopupModel');

const TECHCOMBANK_ACCOUNT = process.env.TECHCOMBANK_ACCOUNT || '1080938386';
const TECHCOMBANK_BANK_CODE = process.env.TECHCOMBANK_BANK_CODE || 'TCB';
const POLL_INTERVAL_MS = Number(process.env.WALLET_TOPUP_POLL_INTERVAL_MS || 300000);

const reconcileTopups = async () => {
    const topups = await WalletTopup.getPending(50);
    const apiUrl = process.env.BANK_RECONCILIATION_API_URL;
    if (!apiUrl) return 0;

    let matchedCount = 0;
    for (const topup of topups) {
        const response = await axios.get(apiUrl, {
            params: { account: TECHCOMBANK_ACCOUNT, q: topup.reference_code },
            timeout: 15000,
        });

        const txs = Array.isArray(response.data?.transactions)
            ? response.data.transactions
            : Array.isArray(response.data)
                ? response.data
                : [];

        const hit = txs.find((tx) => {
            const desc = String(tx.description || tx.transferContent || tx.memo || '').toUpperCase();
            return desc.includes(topup.reference_code.toUpperCase()) && Number(tx.amount || 0) === Number(topup.amount);
        });

        if (!hit) continue;

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const [lockRows] = await connection.execute('SELECT * FROM wallet_topups WHERE topup_id = ? FOR UPDATE', [topup.topup_id]);
            const locked = lockRows[0];
            if (!locked || locked.status === 'credited') {
                await connection.rollback();
                continue;
            }

            await connection.execute('UPDATE users SET wallet_balance = wallet_balance + ? WHERE user_id = ?', [locked.amount, locked.user_id]);
            await connection.execute(
                `UPDATE wallet_topups SET status = 'credited', matched_bank_ref = ?, matched_description = ?, matched_at = NOW(), credited_at = NOW() WHERE topup_id = ?`,
                [String(hit.id || hit.transactionId || hit.ref || ''), String(hit.description || hit.transferContent || hit.memo || ''), locked.topup_id]
            );
            await connection.execute(
                `INSERT INTO transactions (bill_id, gateway_ref_id, amount, bank_code, status) VALUES (NULL, ?, ?, ?, 'success')`,
                [String(hit.id || hit.transactionId || hit.ref || locked.topup_id), locked.amount, TECHCOMBANK_BANK_CODE]
            );
            await connection.commit();
            matchedCount += 1;
        } catch (e) {
            await connection.rollback();
            throw e;
        } finally {
            connection.release();
        }
    }

    return matchedCount;
};

const init = () => {
    setInterval(() => {
        reconcileTopups().catch((err) => console.error('[WalletTopupPoller]', err.message));
    }, POLL_INTERVAL_MS);
};

module.exports = { init, reconcileTopups };
