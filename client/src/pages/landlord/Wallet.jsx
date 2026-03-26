import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    CreditCard,
    Wallet as WalletIcon,
    History,
    Zap,
    ArrowUpRight,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Star,
    ChevronRight,
    QrCode,
    Plus,
    Calendar
} from 'lucide-react';
import monetizationService from '../../services/monetizationService';
import listingService from '../../services/listingService';

const Wallet = () => {
    const { token } = useSelector((state) => state.auth);
    const [wallet, setWallet] = useState({ balance: 0, history: [] });
    const [listings, setListings] = useState([]);
    const [packages, setPackages] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTopUp, setShowTopUp] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [walletData, listingsData, packagesData, servicesData] = await Promise.all([
                    monetizationService.getWalletInfo(token),
                    listingService.getLandlordListings(token),
                    monetizationService.getPackages(token),
                    monetizationService.getPremiumServices(token)
                ]);
                setWallet(walletData);
                setListings(listingsData);
                setPackages(packagesData);
                setServices(servicesData);
            } catch (error) {
                console.error('Error fetching monetization data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const getDaysRemaining = (expiresAt) => {
        if (!expiresAt) return 0;
        const diff = new Date(expiresAt) - new Date();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const StatusBadge = ({ listing }) => {
        const days = getDaysRemaining(listing.expires_at);
        const isPremium = listing.premium_until && new Date(listing.premium_until) > new Date();

        return (
            <div className="flex flex-wrap gap-2">
                {listing.status === 'active' && days > 0 ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Hiển thị
                    </span>
                ) : (
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-200 flex items-center gap-1">
                        <AlertTriangle size={12} /> {days === 0 ? 'Hết hạn' : 'Đã ẩn'}
                    </span>
                )}
                {isPremium && (
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-yellow-200 flex items-center gap-1">
                        <Star size={12} fill="currentColor" /> VIP {listing.premium_badge?.split('_').join(' ').toUpperCase()}
                    </span>
                )}
            </div>
        );
    };

    const [showRenewalModal, setShowRenewalModal] = useState(false);
    const [selectedListingForRenewal, setSelectedListingForRenewal] = useState(null);
    const [selectedPackageForRenewal, setSelectedPackageForRenewal] = useState(null);

    const handleRenewClick = (listing) => {
        setSelectedListingForRenewal(listing);
        setSelectedPackageForRenewal(null);
        setShowRenewalModal(true);
    };

    const handleRenewalPayment = async () => {
        if (!selectedListingForRenewal || !selectedPackageForRenewal) return;

        try {
            // Check if wallet has enough balance
            if (wallet.balance < selectedPackageForRenewal.price) {
                alert('Số dư ví không đủ. Vui lòng nạp thêm tiền!');
                return;
            }

            await monetizationService.processPayment({
                listingId: selectedListingForRenewal.listing_id,
                paymentType: 'package',
                referenceId: selectedPackageForRenewal.package_id,
                amount: selectedPackageForRenewal.price,
                paymentMethod: 'wallet',
                roomId: selectedListingForRenewal.room_id // Optional: might be needed for context
            }, token);

            alert('Gia hạn tin đăng thành công!');
            setShowRenewalModal(false);

            // Refresh data
            const [walletData, listingsData] = await Promise.all([
                monetizationService.getWalletInfo(token),
                listingService.getLandlordListings(token)
            ]);
            setWallet(walletData);
            setListings(listingsData);

        } catch (error) {
            console.error('Renewal failed:', error);
            alert('Gia hạn thất bại: ' + (error.response?.data?.message || 'Lỗi hệ thống'));
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-indigo-600 font-bold">Đang tải dữ liệu ví...</div>;

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            {/* Header / Wallet Card */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 p-8 rounded-3xl shadow-2xl relative overflow-hidden text-white group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <p className="text-indigo-100 text-xs font-black uppercase tracking-[0.2em] mb-2">Số dư hiện tại</p>
                                <h1 className="text-5xl font-black tracking-tight">{formatCurrency(wallet.balance)}</h1>
                            </div>
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                                <WalletIcon size={32} />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowTopUp(true)}
                                className="bg-white text-indigo-700 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                <Plus size={18} /> Nạp tiền vào ví
                            </button>
                            <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-3 rounded-2xl font-bold text-sm hover:bg-white/20 transition-all active:scale-95">
                                Xuất lịch sử
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col justify-between overflow-hidden relative group">
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-50 rounded-tl-full blur-2xl -mb-16 -mr-16 group-hover:bg-indigo-100 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                                <Zap size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-800 tracking-tight">Thống kê tin</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Hiệu năng quảng cáo</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b border-gray-50 pb-3">
                                <span className="text-gray-500 font-medium">Đang hiển thị</span>
                                <span className="text-2xl font-black text-indigo-600">{listings.filter(l => l.status === 'active' && getDaysRemaining(l.expires_at) > 0).length}</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-gray-50 pb-3">
                                <span className="text-gray-500 font-medium">Sắp hết hạn</span>
                                <span className="text-2xl font-black text-orange-500">{listings.filter(l => getDaysRemaining(l.expires_at) > 0 && getDaysRemaining(l.expires_at) <= 5).length}</span>
                            </div>
                        </div>
                    </div>
                    <button className="mt-6 w-full py-3 bg-gray-50 text-gray-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-colors relative z-10">
                        Phân tích chuyên sâu
                    </button>
                </div>
            </div>

            {/* Listing Management Progress bars */}
            <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase text-sm">
                        <Clock size={18} className="text-indigo-600" /> QUẢN LÝ THỜI HẠN TIN ĐĂNG
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold">Cập nhật lúc: {new Date().toLocaleTimeString()}</p>
                </div>
                <div className="divide-y">
                    {listings.length > 0 ? listings.map(listing => {
                        const days = getDaysRemaining(listing.expires_at);
                        const progress = Math.min(100, (days / 30) * 100); // Base on 30 days for visual
                        return (
                            <div key={listing.listing_id} className="p-6 flex flex-col md:flex-row md:items-center gap-6 group hover:bg-gray-50/80 transition-colors">
                                <div className="md:w-1/3">
                                    <h4 className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{listing.title}</h4>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 font-medium">
                                        <ArrowUpRight size={12} /> {listing.building_name} - Phòng {listing.room_number}
                                    </p>
                                    <div className="mt-3">
                                        <StatusBadge listing={listing} />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tiến độ gói tin</p>
                                        <p className="text-sm font-black text-indigo-700">Còn {days} ngày</p>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                                        <div
                                            className={`h-full transition-all duration-1000 ${days > 10 ? 'bg-indigo-500' : days > 3 ? 'bg-orange-500' : 'bg-red-500'}`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 text-right">Hết hạn: {listing.expires_at ? new Date(listing.expires_at).toLocaleDateString('vi-VN') : 'N/A'}</p>
                                </div>
                                <div className="md:w-48 flex gap-2">
                                    <button
                                        onClick={() => handleRenewClick(listing)}
                                        className="flex-1 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95"
                                    >
                                        Gia hạn
                                    </button>
                                    <button className="flex-1 py-2 border border-gray-200 text-gray-500 rounded-xl text-xs font-bold hover:bg-white transition-all">VIP</button>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="p-12 text-center text-gray-400 italic">Chưa có tin đăng nào cần quản lý thời hạn.</div>
                    )}
                </div>
            </div>

            {/* Pricing Tables */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Packages Table */}
                <div className="space-y-6">
                    <h3 className="font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase text-sm px-2">
                        <Calendar size={18} className="text-indigo-600" /> BẢNG GIÁ GÓI TIN ĐĂNG
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        {packages.map(pkg => (
                            <div key={pkg.package_id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-50 transition-all flex flex-col justify-between group">
                                <div>
                                    <h4 className="font-black text-sm text-gray-800 mb-2 leading-tight">{pkg.name}</h4>
                                    <p className="text-[10px] text-gray-400 leading-relaxed mb-6 font-medium uppercase tracking-[0.05em]">{pkg.description}</p>
                                    <p className="text-2xl font-black text-indigo-700 mb-1">{formatCurrency(pkg.price)}</p>
                                    <p className="text-[10px] text-gray-400 font-bold italic">/{pkg.duration_days} ngày hiển thị</p>
                                </div>
                                <button className="mt-8 w-full py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 active:scale-95">Chọn gói</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Services Table */}
                <div className="space-y-6">
                    <h3 className="font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase text-sm px-2">
                        <Star size={18} className="text-yellow-500" fill="currentColor" /> DỊCH VỤ GIÁ TRỊ GIA TĂNG (VIP)
                    </h3>
                    <div className="space-y-4">
                        {services.map(svc => (
                            <div key={svc.service_id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center group hover:bg-indigo-50/30 transition-all hover:border-indigo-200">
                                <div className="flex gap-4 items-center">
                                    <div className={`p-3 rounded-2xl shadow-sm ${svc.badge_type === 'featured' ? 'bg-orange-100 text-orange-600' :
                                        svc.badge_type === 'top_rank' ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600'
                                        }`}>
                                        <Zap size={24} fill="currentColor" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-800 tracking-tight">{svc.name}</h4>
                                        <p className="text-[10px] text-gray-400 font-medium">{svc.description}</p>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-6">
                                    <div>
                                        <p className="font-black text-indigo-600">{formatCurrency(svc.price_per_day)}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Mỗi ngày</p>
                                    </div>
                                    <button className="p-2 bg-white text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90">
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Payment History Table */}
            <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b bg-gray-50/50">
                    <h3 className="font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase text-sm">
                        <History size={18} className="text-indigo-600" /> BIẾN ĐỘNG SỐ DƯ
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/80 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Thời gian</th>
                                <th className="px-6 py-4">Loại giao dịch</th>
                                <th className="px-6 py-4">Nội dung</th>
                                <th className="px-6 py-4">Số tiền</th>
                                <th className="px-6 py-4 text-center">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {wallet.history.map(item => (
                                <tr key={item.payment_id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-500">{new Date(item.created_at).toLocaleString('vi-VN')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${item.payment_type === 'wallet_topup' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                            }`}>
                                            {item.payment_type === 'wallet_topup' ? 'Nạp tiền' : 'Chi trả gói'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-800">{item.listing_title || 'Nạp tiền vào ví'}</p>
                                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">REF: {item.transaction_ref}</p>
                                    </td>
                                    <td className="px-6 py-4 font-black">
                                        <span className={item.payment_type === 'wallet_topup' ? 'text-green-600' : 'text-red-600'}>
                                            {item.payment_type === 'wallet_topup' ? '+' : '-'}{formatCurrency(item.amount)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            {item.status === 'completed' ?
                                                <CheckCircle2 size={16} className="text-green-500" /> :
                                                <AlertTriangle size={16} className="text-orange-500" />
                                            }
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {wallet.history.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">Chưa có lịch sử giao dịch.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Renewal Modal */}
            {showRenewalModal && selectedListingForRenewal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Gia hạn tin đăng</h2>
                                <p className="text-xs text-gray-500 mt-1">Chọn gói gia hạn cho: <span className="font-bold text-indigo-600">{selectedListingForRenewal.title}</span></p>
                            </div>
                            <button onClick={() => setShowRenewalModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Listing Summary */}
                            <div className="bg-indigo-50 p-4 rounded-2xl mb-6 flex gap-4 items-center">
                                <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                                    <Clock size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Trạng thái hiện tại</p>
                                    <p className="text-sm font-bold text-gray-800">
                                        Hết hạn: {selectedListingForRenewal.expires_at ? new Date(selectedListingForRenewal.expires_at).toLocaleDateString('vi-VN') : 'Chưa kích hoạt'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Số dư ví</p>
                                    <p className={`text-lg font-black ${wallet.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(wallet.balance)}
                                    </p>
                                </div>
                            </div>

                            <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2">
                                <Calendar size={16} className="text-indigo-600" /> CHỌN GÓI GIA HẠN
                            </h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                {packages.map(pkg => (
                                    <div
                                        key={pkg.package_id}
                                        onClick={() => setSelectedPackageForRenewal(pkg)}
                                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all relative ${selectedPackageForRenewal?.package_id === pkg.package_id
                                                ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-200 ring-offset-2'
                                                : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {selectedPackageForRenewal?.package_id === pkg.package_id && (
                                            <div className="absolute top-3 right-3 text-indigo-600">
                                                <CheckCircle2 size={20} fill="currentColor" className="text-white" />
                                            </div>
                                        )}
                                        <h4 className="font-black text-gray-900 mb-1">{pkg.name}</h4>
                                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{pkg.description}</p>
                                        <div className="flex justify-between items-end">
                                            <span className="text-lg font-black text-indigo-700">{formatCurrency(pkg.price)}</span>
                                            <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-lg border">{pkg.duration_days} ngày</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-between items-center gap-4">
                            <div className="flex-1">
                                {selectedPackageForRenewal && (
                                    <p className="text-xs text-gray-600">
                                        Tổng thanh toán: <span className="font-black text-lg text-indigo-700 block">{formatCurrency(selectedPackageForRenewal.price)}</span>
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowRenewalModal(false)}
                                    className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    disabled={!selectedPackageForRenewal}
                                    onClick={handleRenewalPayment}
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <CreditCard size={18} /> Xác nhận thanh toán
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Simulated Top Up Modal */}
            {showTopUp && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-8 text-center">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">NẠP TIỀN QUA VIETQR</h2>
                            <p className="text-sm text-gray-500 font-medium mb-8">Dùng ứng dụng ngân hàng quét mã để nạp tiền (Demo)</p>

                            <div className="mx-auto w-56 h-56 bg-gray-50 p-4 rounded-3xl border border-gray-100 flex items-center justify-center mb-8 relative group">
                                <QrCode size={180} className="text-indigo-900 transition-transform group-hover:scale-95 duration-500" />
                                <div className="absolute inset-x-8 top-1/2 h-0.5 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-bounce"></div>
                            </div>

                            <div className="bg-indigo-50 p-4 rounded-2xl mb-8 flex justify-between items-center text-left">
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Số tiền nạp</p>
                                    <p className="text-xl font-black text-indigo-700">500.000 VNĐ</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Thời hạn</p>
                                    <p className="text-xs font-bold text-indigo-700">Hiệu lực trong 5:00</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowTopUp(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    Đóng
                                </button>
                                <button
                                    onClick={async () => {
                                        await monetizationService.processPayment({
                                            paymentType: 'wallet_topup',
                                            amount: 500000,
                                            paymentMethod: 'vietqr'
                                        }, token);
                                        window.location.reload();
                                    }}
                                    className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                                >
                                    Giả lập thành công
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wallet;
