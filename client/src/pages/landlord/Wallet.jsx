import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Wallet as WalletIcon,
    Plus,
    ChevronLeft,
    ChevronRight,
    CircleCheck,
    TriangleAlert,
    Clock,
    Star,
    X,
    Loader,
    Banknote,
    QrCode,
    MessageCircleMore,
    Copy,
    Check,
} from 'lucide-react';
import monetizationService from '../../services/monetizationService';
import listingService from '../../services/listingService';

const LIMIT = 10;

const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const StatBox = ({ label, value, borderRight }) => (
    <div className="flex flex-col items-center justify-center px-4" style={{ borderRight: borderRight ? '1px solid #bec9c3' : 'none' }}>
        <p className="text-[20px] font-bold text-[#181d1a]">{value}</p>
        <p className="mt-1 text-center text-[11.5px] text-[#6f7a74]">{label}</p>
    </div>
);

const BuildingRow = ({ building, onClick }) => {
    const name = building.name || building.building_name || 'Không có tên';
    const address = building.address || building.full_address || building.location || 'Chưa có địa chỉ';
    const image = building.image || building.cover_image || building.images?.[0];
    const occupancy = Number(building.occupancy_rate || building.occupancy || 0);
    const statusColor = occupancy > 80 ? '#16a34a' : occupancy > 50 ? '#eab308' : '#dc2626';
    const statusBg = occupancy > 80 ? 'rgba(22, 163, 74, 0.1)' : occupancy > 50 ? 'rgba(234, 179, 8, 0.1)' : 'rgba(220, 38, 38, 0.1)';
    const statusLabel = occupancy > 80 ? 'Tốt' : occupancy > 50 ? 'Bảo trì' : 'Cảnh báo';

    return (
        <button
            type="button"
            className="flex w-full items-center gap-4 border-b p-4 text-left transition-all hover:bg-[#f9fbfc]"
            style={{ borderColor: '#bec9c3' }}
            onClick={onClick}
        >
            {image ? (
                <img src={image} alt={name} className="h-[60px] w-[60px] rounded-lg object-cover" />
            ) : (
                <div className="flex h-[60px] w-[60px] items-center justify-center rounded-lg bg-[#ebefeb]">
                    <WalletIcon className="h-6 w-6 text-[#6f7a74]" />
                </div>
            )}
            <div className="min-w-0 flex-1">
                <h5 className="truncate text-[14px] font-semibold text-[#181d1a]">{name}</h5>
                <p className="truncate text-[11.5px] text-[#6f7a74]">{address}</p>
            </div>
            <div className="flex w-48 flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: statusBg, color: statusColor }}>
                        {statusLabel}
                    </span>
                    <span className="text-[11px] text-[#6f7a74]">{occupancy}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ebefeb]">
                    <div className="h-full rounded-full" style={{ width: `${occupancy}%`, backgroundColor: statusColor }} />
                </div>
            </div>
            <span className="rounded-lg p-2 text-[#6f7a74] transition-colors hover:bg-[#ebefeb]">⋮</span>
        </button>
    );
};

const TransactionRow = ({ item, onClick }) => {
    const isPositive = item.payment_type === 'wallet_topup' || item.type === 'topup' || Number(item.amount || 0) > 0;
    const title = item.listing_title || item.description || item.title || (isPositive ? 'Nạp tiền vào ví' : 'Thanh toán');

    return (
        <tr className="cursor-pointer transition-colors hover:bg-[#f9fbfc]" onClick={onClick}>
            <td className="px-4 py-4">
                <p className="text-[14px] font-semibold text-[#181d1a]">{title}</p>
                <p className="text-[11px] text-[#6f7a74]">
                    {item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : ''}
                </p>
            </td>
            <td className="px-4 py-4 text-right">
                <p className="text-[14px] font-bold" style={{ color: isPositive ? '#16a34a' : '#dc2626' }}>
                    {isPositive ? '+' : '-'}{fmt(Math.abs(item.amount || 0))}
                </p>
            </td>
        </tr>
    );
};

const TopUpModal = ({ isOpen, onClose, onSubmit, amount, setAmount, loading, onRefreshStatus }) => {
    const [copied, setCopied] = useState(false);
    const [paymentData, setPaymentData] = useState(null);
    const [topupRecord, setTopupRecord] = useState(null);
    const [method, setMethod] = useState('vietqr'); // 'vietqr' | 'vnpay'
    const [vnpayLoading, setVnpayLoading] = useState(false);

    if (!isOpen) return null;

    const presets = [100000, 200000, 500000, 1000000];
    const transferContent = paymentData?.transferContent || paymentData?.referenceCode || `NAP ${amount || 0}`;

    const copyContent = async () => {
        try {
            await navigator.clipboard.writeText(transferContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (e) {
            console.error(e);
        }
    };

    const handleVnpayPay = async () => {
        try {
            setVnpayLoading(true);
            const amountNum = Number(amount);
            if (!Number.isFinite(amountNum) || amountNum <= 0) return;
            const res = await onSubmit('vnpay');
            if (res?.payUrl) {
                window.location.href = res.payUrl;
            }
        } catch (e) {
            console.error(e);
        } finally {
            setVnpayLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative w-full max-w-4xl overflow-hidden rounded-[24px] bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-[#f8f9ff] px-6 py-4">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5c403c]">Nạp tiền vào ví</p>
                        <h3 className="text-[20px] font-bold text-[#0b1c30]">Chọn phương thức thanh toán</h3>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-2 hover:bg-[#eff4ff]"><X className="h-5 w-5 text-[#5c403c]" /></button>
                </div>

                {/* Method tabs */}
                <div className="flex gap-2 border-b border-[#e2e8f0] bg-[#f8f9ff] px-6 pb-0">
                    <button
                        onClick={() => setMethod('vietqr')}
                        className={`flex items-center gap-2 border-b-2 px-4 py-3 text-[13px] font-semibold transition-all ${method === 'vietqr' ? 'border-[#0f6e56] text-[#0f6e56]' : 'border-transparent text-[#6f7a74] hover:text-[#0b1c30]'}`}
                    >
                        <QrCode className="h-4 w-4" /> VietQR
                    </button>
                    <button
                        onClick={() => setMethod('vnpay')}
                        className={`flex items-center gap-2 border-b-2 px-4 py-3 text-[13px] font-semibold transition-all ${method === 'vnpay' ? 'border-[#0066b2] text-[#0066b2]' : 'border-transparent text-[#6f7a74] hover:text-[#0b1c30]'}`}
                    >
                        <Banknote className="h-4 w-4" /> VNPAY
                    </button>
                </div>

                <div className="grid gap-6 p-6 lg:grid-cols-2">
                    {/* Left: Amount selector */}
                    <div className="space-y-5">
                        <div>
                            <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em] text-[#5c403c]">Số tiền</label>
                            <input type="number" min="10000" step="1000" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-2xl border border-[#e6bdb8] px-4 py-3 text-sm outline-none focus:border-[#dc2626]" placeholder="Nhập số tiền" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {presets.map((item) => (
                                <button key={item} type="button" onClick={() => setAmount(String(item))} className="rounded-2xl border border-[#e6bdb8] px-4 py-3 text-sm font-semibold text-[#0b1c30] hover:border-[#dc2626] hover:bg-[#fef2f2]">{fmt(item)}</button>
                            ))}
                        </div>

                        {/* VNPAY info panel */}
                        {method === 'vnpay' && (
                            <div className="rounded-2xl border border-[#bbd6f5] bg-[#f0f8ff] p-4 space-y-3">
                                <p className="text-[12px] font-bold text-[#0066b2] uppercase tracking-widest">Thanh toán qua VNPAY</p>
                                <ul className="text-[13px] text-[#1e3a5f] space-y-1.5 list-disc list-inside">
                                    <li>Hỗ trợ thẻ ATM, VISA, MasterCard, JCB</li>
                                    <li>Thanh toán ngay, số dư được cộng tức thì</li>
                                    <li>Bảo mật theo tiêu chuẩn PCI DSS</li>
                                    <li>Hỗ trợ hơn 40 ngân hàng Việt Nam</li>
                                </ul>
                                <div className="flex items-center gap-2 rounded-xl border border-[#bbd6f5] bg-white px-3 py-2">
                                    <span className="rounded bg-[#0066b2] px-2 py-0.5 text-[10px] font-black tracking-widest text-white">VNPAY</span>
                                    <span className="text-[11px] text-[#5c403c]">Sandbox · Môi trường kiểm thử</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Payment method panel */}
                    {method === 'vietqr' ? (
                        <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8f9ff] p-5">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#5c403c]">VietQR</p>
                                        <h4 className="text-[18px] font-bold text-[#0b1c30]">Quét mã để nạp tiền</h4>
                                    </div>
                                    <span className="rounded-full bg-[#fef2f2] px-3 py-1 text-[11px] font-bold text-[#dc2626]">Tự động đối soát</span>
                                </div>
                                <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-[#e6bdb8] bg-white p-6">
                                    <div className="text-center">
                                        <div className="mx-auto mb-4 flex h-40 w-40 items-center justify-center rounded-2xl border border-[#e2e8f0] bg-[#f8f9ff] p-3">
                                            <img src={paymentData?.qrCodeUrl || `https://img.vietqr.io/image/TCB-1080938386-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}`} alt="VietQR" className="max-h-36 w-full object-contain" />
                                        </div>
                                        <p className="text-[12px] text-[#5c403c]">Quét mã VietQR và chuyển khoản đúng nội dung bên dưới.</p>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 text-sm text-[#5c403c]">
                                    <p className="font-semibold text-[#0b1c30]">Thông tin chuyển khoản</p>
                                    <p>Ngân hàng: {paymentData?.bank?.bankName || 'Techcombank'}</p>
                                    <p>Chủ tài khoản: {paymentData?.bank?.accountName || 'BUI DUC HUY'}</p>
                                    <p>Số tài khoản: {paymentData?.bank?.accountNumber || '1080938386'}</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <code className="rounded bg-[#f8f9ff] px-2 py-1 text-[12px]">{transferContent}</code>
                                        <button onClick={copyContent} className="rounded-lg border border-[#e6bdb8] px-3 py-2 text-[12px] font-semibold text-[#0b1c30]">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* VNPAY panel */
                        <div className="rounded-[20px] border border-[#bbd6f5] bg-gradient-to-br from-[#f0f8ff] to-[#e8f4fd] p-5 flex flex-col items-center justify-center gap-5">
                            {/* VNPAY Logo */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0066b2] shadow-lg">
                                    <span className="text-[18px] font-black tracking-tight text-white">VNP</span>
                                </div>
                                <div className="text-center">
                                    <p className="text-[20px] font-bold text-[#0b1c30]">Cổng thanh toán VNPAY</p>
                                    <p className="text-[13px] text-[#5c7080]">Bạn sẽ được chuyển sang trang VNPAY để hoàn tất thanh toán</p>
                                </div>
                            </div>

                            <div className="w-full space-y-2">
                                <div className="flex items-center justify-between rounded-xl border border-[#bbd6f5] bg-white px-4 py-2.5">
                                    <span className="text-[12px] text-[#5c7080]">Số tiền thanh toán</span>
                                    <span className="text-[15px] font-bold text-[#0066b2]">{fmt(Number(amount) || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl border border-[#bbd6f5] bg-white px-4 py-2.5">
                                    <span className="text-[12px] text-[#5c7080]">Phương thức</span>
                                    <span className="text-[12px] font-semibold text-[#1e3a5f]">ATM / Thẻ QH / Ví điện tử</span>
                                </div>
                            </div>

                            <button
                                id="btn-pay-vnpay"
                                onClick={handleVnpayPay}
                                disabled={vnpayLoading || !Number(amount) || Number(amount) < 10000}
                                className="w-full rounded-2xl py-4 text-[15px] font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #0066b2, #005a9e)' }}
                            >
                                {vnpayLoading ? (
                                    <><Loader className="h-5 w-5 animate-spin" /> Đang chuyển hướng...</>
                                ) : (
                                    <><Banknote className="h-5 w-5" /> Thanh toán qua VNPAY</>
                                )}
                            </button>

                            <p className="text-center text-[11px] text-[#9ba8b0]">
                                Thẻ test NCB: <span className="font-mono font-semibold">9704198526191432198</span><br />
                                Tên: NGUYEN VAN A · Phát hành: 07/15 · OTP: 123456
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer actions for VietQR */}
                {method === 'vietqr' && (
                    <div className="flex gap-3 border-t border-[#e2e8f0] px-6 py-4">
                        <button onClick={onClose} className="flex-1 rounded-2xl border border-[#e6bdb8] px-5 py-3 font-semibold text-[#5c403c] hover:bg-[#f8f9ff]">Hủy</button>
                        <button
                            onClick={async () => {
                                const result = await onSubmit('vietqr');
                                if (result) { setPaymentData(result); setTopupRecord(result); }
                            }}
                            disabled={loading || !Number(amount)}
                            className="flex-1 rounded-2xl bg-[#dc2626] px-5 py-3 font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-50"
                        >
                            {loading ? 'Đang xử lý...' : 'Tạo QR thanh toán'}
                        </button>
                    </div>
                )}

                {/* Footer actions for VNPAY */}
                {method === 'vnpay' && (
                    <div className="flex gap-3 border-t border-[#e2e8f0] px-6 py-4">
                        <button onClick={onClose} className="flex-1 rounded-2xl border border-[#e6bdb8] px-5 py-3 font-semibold text-[#5c403c] hover:bg-[#f8f9ff]">Hủy</button>
                    </div>
                )}

                {topupRecord && method === 'vietqr' && (
                    <div className="border-t border-[#e2e8f0] px-6 py-4 text-sm text-[#5c403c]">
                        <p className="font-semibold text-[#0b1c30]">Trạng thái yêu cầu nạp</p>
                        <p>Mã tham chiếu: {topupRecord.referenceCode || topupRecord.reference_code}</p>
                        <p>Trạng thái: {topupRecord.status || 'pending'}</p>
                        <button onClick={onRefreshStatus} className="mt-2 rounded-lg border border-[#e6bdb8] px-3 py-2 text-[12px] font-semibold text-[#0b1c30]">Làm mới trạng thái</button>
                    </div>
                )}
            </div>
        </div>
    );
};


const Wallet = () => {
    const { token } = useSelector((s) => s.auth);
    const [wallet, setWallet] = useState({ balance: 0, history: [] });
    const [packages, setPackages] = useState([]);
    const [services, setServices] = useState([]);
    const [loadingMeta, setLoadingMeta] = useState(true);
    const [listings, setListings] = useState([]);
    const [listingPage, setListingPage] = useState(1);
    const [listingTotal, setListingTotal] = useState(0);
    const [listingLoading, setListingLoading] = useState(false);
    const [txPage, setTxPage] = useState(1);
    const [txTotal, setTxTotal] = useState(0);
    const [txLoading, setTxLoading] = useState(false);
    const [selectedTx, setSelectedTx] = useState(null);
    const [showTopUp, setShowTopUp] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('500000');
    const [topUpLoading, setTopUpLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [w, pkgs, svcs] = await Promise.all([
                    monetizationService.getWalletInfo(token),
                    monetizationService.getPackages(token),
                    monetizationService.getPremiumServices(token),
                ]);
                setWallet(w);
                setPackages(pkgs || []);
                setServices(svcs || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingMeta(false);
            }
        };
        load();
    }, [token]);

    const fetchListings = async (page) => {
        setListingLoading(true);
        try {
            const res = await listingService.getLandlordListingsPaginated({ page, limit: LIMIT });
            setListings(res.listings || []);
            setListingTotal(res.total || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setListingLoading(false);
        }
    };

    const fetchTransactions = async (page) => {
        setTxLoading(true);
        try {
            const res = await monetizationService.getWalletHistoryPaginated(token, page, LIMIT);
            setWallet(prev => ({ ...prev, history: res.history || [] }));
            setTxTotal(res.total || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setTxLoading(false);
        }
    };

    useEffect(() => { fetchListings(listingPage); }, [listingPage]);
    useEffect(() => { fetchTransactions(txPage); }, [txPage]);

    useEffect(() => {
        if (showTopUp) return;
    }, [showTopUp]);

    const handleTopUp = async (method = 'vietqr') => {
        try {
            setTopUpLoading(true);
            const amount = Number(topUpAmount);
            if (!Number.isFinite(amount) || amount <= 0) return null;

            const res = await monetizationService.topUpWallet(token, { amount, method });
            setWallet((prev) => ({ ...prev, pending_topup: res }));
            return res;
        } catch (e) {
            console.error(e);
            return null;
        } finally {
            setTopUpLoading(false);
        }
    };

    if (loadingMeta) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader className="h-6 w-6 animate-spin text-[#bec9c3]" />
            </div>
        );
    }

    const realTxCount = wallet.history?.length || txTotal || 0;
    const monthlyExpense = wallet.history?.filter(t => t.payment_type !== 'wallet_topup')?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const monthlyIncome = wallet.history?.filter(t => t.payment_type === 'wallet_topup')?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    const stats = {
        txCount: realTxCount,
        expense: fmt(monthlyExpense),
        income: fmt(monthlyIncome),
    };

    const transactionsToShow = wallet.history || [];

    return (
        <div className="min-h-screen bg-[#f7faf6] px-6 pb-20 pt-20 font-['Be_Vietnam_Pro',sans-serif]">
            <div className="mx-auto max-w-[1280px]">
                <div className="mb-6 flex items-end justify-between">
                    <div>
                        <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-wider text-[#6f7a74]">Tài chính</p>
                        <h1 className="text-[24px] font-semibold leading-8 text-[#181d1a]">Ví & Thanh toán</h1>
                    </div>
                </div>

                <div className="mb-8 grid grid-cols-12 gap-6">
                    <div className="col-span-12 flex min-h-[240px] flex-col justify-between rounded-xl p-8 text-white lg:col-span-7" style={{ background: 'linear-gradient(to bottom right, #085041, #1d9e75)' }}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="mb-1 text-[14px] font-semibold opacity-80">Số dư khả dụng</p>
                                <h3 className="text-[48px] font-bold">{fmt(wallet.balance)}</h3>
                            </div>
                            <Banknote className="h-12 w-12 opacity-40" />
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button onClick={() => setShowTopUp(true)} className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-[14px] font-semibold text-[#0f6e56] transition-all hover:opacity-90">
                                <Plus className="h-4 w-4" /> Nạp tiền
                            </button>
                            <button className="rounded-lg border border-white/30 px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-white/10">
                                Rút tiền
                            </button>
                        </div>
                    </div>

                    <div className="col-span-12 flex items-center justify-center rounded-xl border bg-white lg:col-span-5" style={{ borderColor: '#bec9c3', minHeight: '240px' }}>
                        <div className="grid h-full w-full grid-cols-3">
                            <StatBox label="Giao dịch tháng này" value={stats.txCount} borderRight />
                            <StatBox label="Chi tiêu tháng này" value={stats.expense} borderRight />
                            <StatBox label="Thu nhập" value={stats.income} />
                        </div>
                    </div>
                </div>

                <div className="mb-8 grid grid-cols-12 gap-6">
                    <div className="col-span-12 lg:col-span-8">
                        <div className="mb-4 flex items-center justify-between">
                            <h4 className="text-[20px] font-semibold text-[#181d1a]">Quản lý Tòa nhà & Thanh toán</h4>
                            <button className="text-[14px] font-semibold text-[#005440] hover:underline">Xem tất cả</button>
                        </div>
                        <div className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: '#bec9c3' }}>
                            {listingLoading ? (
                                <div className="p-6 text-sm text-[#6f7a74]">Đang tải tòa nhà...</div>
                            ) : listings.length > 0 ? (
                                listings.map((b, i) => <BuildingRow key={b.id || i} building={b} onClick={() => {}} />)
                            ) : (
                                <div className="p-6 text-sm text-[#6f7a74]">Chưa có dữ liệu tòa nhà.</div>
                            )}
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h4 className="text-[20px] font-semibold text-[#181d1a]">Lịch sử giao dịch</h4>
                        </div>
                        <div className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: '#bec9c3' }}>
                            {txLoading ? (
                                <div className="p-6 text-sm text-[#6f7a74]">Đang tải giao dịch...</div>
                            ) : (
                                <>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b" style={{ backgroundColor: '#f1f4f1', borderColor: '#bec9c3' }}>
                                                <th className="px-4 py-3 text-[11px] font-semibold text-[#6f7a74]">Chi tiết</th>
                                                <th className="px-4 py-3 text-right text-[11px] font-semibold text-[#6f7a74]">Số tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y" style={{ borderColor: '#bec9c3' }}>
                                            {transactionsToShow.length > 0 ? transactionsToShow.map(item => (
                                                <TransactionRow key={item.payment_id} item={item} onClick={() => setSelectedTx(item)} />
                                            )) : (
                                                <tr><td colSpan={2} className="p-6 text-center text-sm text-[#6f7a74]">Chưa có giao dịch</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                    <div className="flex items-center justify-between border-t px-6 py-4" style={{ borderColor: '#bec9c3', backgroundColor: '#f8fafc' }}>
                                        <span className="text-[11px] text-[#6f7a74]">Tổng {txTotal} giao dịch</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1} className="flex h-8 w-8 items-center justify-center rounded border disabled:opacity-30" style={{ borderColor: '#bec9c3' }}>
                                                <ChevronLeft className="h-4 w-4 text-[#6f7a74]" />
                                            </button>
                                            <span className="min-w-8 rounded bg-[#0f6e56] px-3 py-1 text-center text-[11px] font-bold text-white">{txPage}</span>
                                            <button onClick={() => setTxPage(p => p + 1)} className="flex h-8 w-8 items-center justify-center rounded border" style={{ borderColor: '#bec9c3' }}>
                                                <ChevronRight className="h-4 w-4 text-[#6f7a74]" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="relative rounded-xl border bg-white p-6" style={{ borderColor: '#bec9c3' }}>
                        <div className="mb-2 flex items-center gap-2 text-[#0f6e56]"><Star className="h-5 w-5" /> <span className="font-semibold">Cá nhân</span></div>
                        <p className="text-sm text-[#6f7a74]">Quản lý cơ bản</p>
                    </div>
                    <div className="relative rounded-xl border bg-white p-6" style={{ borderColor: '#0f6e56' }}>
                        <div className="mb-2 flex items-center gap-2 text-[#0f6e56]"><Star className="h-5 w-5" /> <span className="font-semibold">Chuyên nghiệp</span></div>
                        <p className="text-sm text-[#6f7a74]">Tính năng nâng cao</p>
                    </div>
                    <div className="relative rounded-xl border bg-white p-6" style={{ borderColor: '#bec9c3' }}>
                        <div className="mb-2 flex items-center gap-2 text-[#0f6e56]"><Star className="h-5 w-5" /> <span className="font-semibold">Doanh nghiệp</span></div>
                        <p className="text-sm text-[#6f7a74]">Tùy chỉnh theo nhu cầu</p>
                    </div>
                </div>
            </div>

            <button onClick={() => setShowTopUp(true)} className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#0f6e56] text-white shadow-lg transition-transform hover:scale-105">
                <Plus className="h-7 w-7" />
            </button>

            <TopUpModal isOpen={showTopUp} onClose={() => setShowTopUp(false)} onSubmit={handleTopUp} amount={topUpAmount} setAmount={setTopUpAmount} loading={topUpLoading} />
        </div>
    );
};

export default Wallet;
