import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft, Wallet, Loader2 } from 'lucide-react';

const fmt = (v) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const RESPONSE_CODES = {
    '00': 'Giao dịch thành công',
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
    '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
    '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.',
    '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
    '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
    '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
    '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch.',
    '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
    '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
    '75': 'Ngân hàng thanh toán đang bảo trì.',
    '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.',
    '99': 'Lỗi không xác định.',
};

export default function VnpayReturn() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { token } = useSelector((s) => s.auth);
    const [countdown, setCountdown] = useState(6);
    const [animateDone, setAnimateDone] = useState(false);

    const status = params.get('status'); // success | failed | error
    const txnRef = params.get('txnRef') || '';
    const amount = Number(params.get('amount') || 0);
    const transactionNo = params.get('transactionNo') || '';
    const responseCode = params.get('responseCode') || '';

    const isSuccess = status === 'success';
    const isFailed = status === 'failed';

    const errorLabel = RESPONSE_CODES[responseCode] || RESPONSE_CODES['99'];

    useEffect(() => {
        // Trigger entrance animation
        const t = setTimeout(() => setAnimateDone(true), 100);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (!isSuccess) return;
        const interval = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    clearInterval(interval);
                    navigate('/landlord/wallet');
                }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isSuccess, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a2540] via-[#0d3352] to-[#0a5c45] p-4">
            {/* Background decorations */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
            </div>

            <div
                className="relative w-full max-w-md transition-all duration-700"
                style={{
                    opacity: animateDone ? 1 : 0,
                    transform: animateDone ? 'translateY(0)' : 'translateY(24px)',
                }}
            >
                {/* Card */}
                <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
                    {/* Top band */}
                    <div
                        className="relative flex flex-col items-center justify-center px-8 py-10"
                        style={{
                            background: isSuccess
                                ? 'linear-gradient(135deg, #065f46, #059669)'
                                : isFailed
                                ? 'linear-gradient(135deg, #7f1d1d, #dc2626)'
                                : 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                        }}
                    >
                        {/* VNPAY logo text */}
                        <div className="mb-5 flex items-center gap-2">
                            <div className="rounded-xl bg-white/20 px-4 py-1.5">
                                <span className="text-[15px] font-black tracking-widest text-white">VNPAY</span>
                            </div>
                            <span className="text-white/70 text-sm">Sandbox</span>
                        </div>

                        {/* Icon */}
                        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 shadow-lg ring-4 ring-white/30">
                            {isSuccess ? (
                                <CheckCircle className="h-14 w-14 text-white" strokeWidth={1.5} />
                            ) : isFailed ? (
                                <XCircle className="h-14 w-14 text-white" strokeWidth={1.5} />
                            ) : (
                                <AlertCircle className="h-14 w-14 text-white" strokeWidth={1.5} />
                            )}
                        </div>

                        <h1 className="mb-1 text-2xl font-bold text-white">
                            {isSuccess ? 'Thanh toán thành công!' : isFailed ? 'Thanh toán thất bại' : 'Lỗi xử lý'}
                        </h1>
                        {isSuccess && amount > 0 && (
                            <p className="text-3xl font-black text-white/90 mt-1">+{fmt(amount)}</p>
                        )}
                        {!isSuccess && (
                            <p className="mt-2 text-center text-sm text-white/80 px-4">{errorLabel}</p>
                        )}
                    </div>

                    {/* Details */}
                    <div className="px-8 py-6 space-y-4">
                        {/* Success details */}
                        {isSuccess && (
                            <>
                                <DetailRow label="Trạng thái" value="Thành công ✓" valueClass="text-emerald-600 font-bold" />
                                {transactionNo && <DetailRow label="Mã giao dịch VNPAY" value={transactionNo} />}
                                {txnRef && <DetailRow label="Mã đơn hàng" value={txnRef} mono />}
                                {amount > 0 && (
                                    <DetailRow
                                        label="Số tiền nạp"
                                        value={fmt(amount)}
                                        valueClass="text-emerald-600 font-bold text-lg"
                                    />
                                )}

                                {/* Countdown */}
                                <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-center gap-3">
                                    <Loader2 className="h-4 w-4 text-emerald-600 animate-spin flex-shrink-0" />
                                    <p className="text-sm text-emerald-700">
                                        Tự động chuyển về Ví sau <strong>{countdown}</strong> giây...
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Failed details */}
                        {isFailed && (
                            <>
                                <DetailRow label="Trạng thái" value="Thất bại ✗" valueClass="text-red-600 font-bold" />
                                {txnRef && <DetailRow label="Mã đơn hàng" value={txnRef} mono />}
                                {responseCode && <DetailRow label="Mã lỗi" value={responseCode} />}
                                <p className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                                    {errorLabel}
                                </p>
                            </>
                        )}

                        {/* Error state */}
                        {status === 'error' && (
                            <p className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
                                Đã có lỗi xảy ra trong quá trình xử lý. Vui lòng kiểm tra lại số dư ví hoặc liên hệ hỗ trợ.
                            </p>
                        )}

                        {/* Actions */}
                        <div className="pt-2 flex flex-col gap-3">
                            <button
                                id="btn-go-wallet"
                                onClick={() => navigate('/landlord/wallet')}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                                style={{
                                    background: isSuccess
                                        ? 'linear-gradient(135deg, #065f46, #059669)'
                                        : 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                                }}
                            >
                                <Wallet className="h-4 w-4" />
                                {isSuccess ? 'Xem Ví của tôi' : 'Quay về Ví'}
                            </button>

                            {!isSuccess && (
                                <button
                                    id="btn-retry-topup"
                                    onClick={() => {
                                        navigate('/landlord/wallet');
                                    }}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3.5 font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-95"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Thử lại
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 px-8 py-4 text-center">
                        <p className="text-xs text-gray-400">
                            Được xử lý bởi{' '}
                            <span className="font-semibold text-[#0066b2]">VNPAY</span> · Sandbox Environment
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailRow({ label, value, valueClass = 'text-gray-800 font-medium', mono = false }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-gray-50 pb-3">
            <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
            <span className={`text-sm text-right break-all ${valueClass} ${mono ? 'font-mono text-xs' : ''}`}>
                {value}
            </span>
        </div>
    );
}
