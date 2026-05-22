import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import {
    CircleCheck,
    CircleX,
    Clock,
    Trash2,
    Eye,
    Star,
    LayoutTemplate,
    Loader,
    Image,
    Phone,
    Mail,
    Building2,
    House,
    MapPin,
    TriangleAlert,
    RefreshCw,
    Globe,
    Search,
    SlidersHorizontal,
    X,
    Download,
    Plus,
    ArrowUpRight,
    TrendingUp,
    BadgeInfo,
    Megaphone,
    Timer,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const formatVND = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));

const getStatusMeta = (status) => {
    switch (status) {
        case 'pending': return { label: 'Chờ duyệt', tone: 'bg-amber-50 text-amber-700 border-amber-200' };
        case 'active': return { label: 'Đang chạy', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        case 'rejected': return { label: 'Từ chối', tone: 'bg-red-50 text-red-700 border-red-200' };
        case 'expired': return { label: 'Hết hạn', tone: 'bg-gray-50 text-gray-600 border-gray-200' };
        default: return { label: status || '—', tone: 'bg-gray-50 text-gray-600 border-gray-200' };
    }
};

const getTypeLabel = (type) => (type === 'home_banner' ? 'Trang chủ' : type === 'sidebar_banner' ? 'Sidebar' : type || '—');

const getDisplayStyleLabel = (style) => {
    switch (style) {
        case 'default': return 'Mặc định';
        case 'luxury': return 'Sang trọng';
        case 'modern': return 'Hiện đại';
        case 'vibrant': return 'Nổi bật';
        default: return style || 'Mặc định';
    }
};

const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
};

const StatCard = ({ icon: Icon, title, value, tone = 'red', hint }) => {
    const tones = {
        red: { bg: 'rgba(220,38,38,0.10)', color: '#dc2626' },
        amber: { bg: 'rgba(245,158,11,0.10)', color: '#b45309' },
        emerald: { bg: 'rgba(16,185,129,0.10)', color: '#059669' },
        indigo: { bg: 'rgba(99,102,241,0.10)', color: '#4f46e5' },
    };
    const t = tones[tone] || tones.red;
    return (
        <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#5c403c]">{title}</p>
                    <h3 className="mt-2 text-[28px] font-extrabold leading-none text-[#0b1c30]">{value}</h3>
                    {hint && <p className="mt-2 text-[12px] font-semibold text-[#5c403c]">{hint}</p>}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: t.bg, color: t.color }}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
};

const BannerManagement = () => {
    useSelector((state) => state.auth);
    const [requests, setRequests] = useState([]);
    const [selectedBanner, setSelectedBanner] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [listingDetails, setListingDetails] = useState(null);
    const [isListingModalOpen, setIsListingModalOpen] = useState(false);
    const [loadingListing, setLoadingListing] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/system/banners');
            setRequests(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching banner requests:', err);
            toast.error('Lỗi tải danh sách yêu cầu');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status, extra = {}) => {
        try {
            await api.put(`/admin/system/banners/${id}/status`, { status, ...extra });
            toast.success('Cập nhật trạng thái thành công!');
            fetchRequests();
            if (selectedBanner?.request_id === id) {
                setSelectedBanner((prev) => (prev ? { ...prev, status, ...extra } : prev));
            }
        } catch (err) {
            console.error('Error updating banner:', err);
            toast.error('Lỗi cập nhật: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa yêu cầu này?')) return;
        try {
            await api.delete(`/admin/system/banners/${id}`);
            fetchRequests();
            toast.success('Xóa thành công!');
            setIsDetailModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi xóa');
        }
    };

    const openDetailModal = (banner) => {
        setSelectedBanner(banner);
        setCurrentImageIndex(0);
        setIsDetailModalOpen(true);
    };

    const fetchListingDetails = async (listingId) => {
        setLoadingListing(true);
        try {
            const res = await api.get(`/admin/system/listings/${listingId}`);
            setListingDetails(res.data);
            setIsListingModalOpen(true);
        } catch (err) {
            console.error('Error fetching listing details:', err);
            toast.error('Không thể tải thông tin tin đăng');
        } finally {
            setLoadingListing(false);
        }
    };

    const images = useMemo(() => selectedBanner?.image_url?.split(',').filter(Boolean) || [], [selectedBanner]);
    const filteredRequests = useMemo(() => requests.filter((req) => {
        const haystack = `${req.landlord_name || ''} ${req.landlord_email || ''} ${req.listing_title || ''} ${req.building_name || ''} ${req.room_number || ''} ${req.type || ''}`.toLowerCase();
        const matchesSearch = haystack.includes(search.toLowerCase());
        const matchesStatus = !statusFilter || req.status === statusFilter;
        return matchesSearch && matchesStatus;
    }), [requests, search, statusFilter]);

    const stats = useMemo(() => ({
        total: requests.length,
        pending: requests.filter((r) => r.status === 'pending').length,
        active: requests.filter((r) => r.status === 'active').length,
        expired: requests.filter((r) => r.status === 'expired').length,
    }), [requests]);

    const selectedStatusMeta = selectedBanner ? getStatusMeta(selectedBanner.status) : null;
    const daysLeft = selectedBanner?.end_date ? getDaysRemaining(selectedBanner.end_date) : null;

    return (
        <div className="min-h-screen bg-[#f8f9ff]" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
            <div className="space-y-8 px-4 py-4 lg:px-8 lg:py-8">
                <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                        <div>
                            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#5c403c]">Quản trị</p>
                            <h1 className="mt-1 text-[30px] font-bold leading-[38px] tracking-[-0.02em] text-[#0b1c30]">Quản lý Banner quảng cáo</h1>
                            <p className="mt-1 text-[16px] text-[#5c403c]">Duyệt, tạm dừng, gỡ banner và xem toàn bộ lịch sử chiến dịch.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button className="flex items-center gap-2 rounded-lg border border-[#e6bdb8] bg-white px-4 py-3 text-[14px] font-semibold text-[#0b1c30] transition-colors hover:bg-[#eff4ff]">
                                <Download className="h-4 w-4" /> Xuất báo cáo
                            </button>
                            <button className="flex items-center gap-2 rounded-lg bg-[#dc2626] px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#b91c1c]">
                                <Plus className="h-4 w-4" /> Tạo chiến dịch
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard icon={Megaphone} title="Tổng yêu cầu" value={stats.total} tone="red" hint="Toàn bộ chiến dịch banner" />
                    <StatCard icon={Clock} title="Chờ duyệt" value={stats.pending} tone="amber" hint="Cần admin xử lý" />
                    <StatCard icon={TrendingUp} title="Đang chạy" value={stats.active} tone="emerald" hint="Đang hiển thị trên hệ thống" />
                    <StatCard icon={Timer} title="Hết hạn" value={stats.expired} tone="indigo" hint="Cần gia hạn hoặc dừng" />
                </div>

                <div className="grid grid-cols-12 gap-5 items-start">
                    <section className="col-span-12 overflow-hidden rounded-[14px] border border-[#e2e8f0] bg-white shadow-sm xl:col-span-8">
                        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4">
                            <div>
                                <h2 className="text-[20px] font-semibold text-[#0b1c30]">Danh sách Banner</h2>
                                <p className="mt-1 text-[14px] text-[#5c403c]">{filteredRequests.length} kết quả phù hợp</p>
                            </div>
                            <div className="flex gap-3">
                                <button className="flex items-center gap-2 rounded-lg border border-[#e6bdb8] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#5c403c] transition-colors hover:bg-[#eff4ff]">
                                    <SlidersHorizontal className="h-4 w-4" /> Lọc
                                </button>
                                <button className="flex items-center gap-2 rounded-lg border border-[#e6bdb8] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#5c403c] transition-colors hover:bg-[#eff4ff]">
                                    <RefreshCw className="h-4 w-4" /> Làm mới
                                </button>
                            </div>
                        </div>

                        <div className="border-b border-[#e2e8f0] bg-[#f8f9ff] px-6 py-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative min-w-[220px] flex-1">
                                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5c403c]" />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Tìm kiếm chiến dịch..."
                                        className="w-full rounded-lg border border-[#e6bdb8] bg-white py-2.5 pl-11 pr-4 text-[14px] outline-none transition-colors focus:border-[#dc2626]"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="rounded-lg border border-[#e6bdb8] bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[#dc2626]"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="pending">Chờ duyệt</option>
                                    <option value="active">Đang chạy</option>
                                    <option value="rejected">Từ chối</option>
                                    <option value="expired">Hết hạn</option>
                                </select>
                                {(search || statusFilter) && (
                                    <button onClick={() => { setSearch(''); setStatusFilter(''); }} className="flex items-center gap-2 rounded-lg border border-[#e6bdb8] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#5c403c] transition-colors hover:bg-[#eff4ff]">
                                        <X className="h-4 w-4" /> Xóa lọc
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-[#e2e8f0] bg-[#f8f9ff]">
                                        <th className="px-6 py-4 text-[14px] font-bold text-[#5c403c]">Chủ trọ</th>
                                        <th className="px-6 py-4 text-[14px] font-bold text-[#5c403c]">Tin đăng</th>
                                        <th className="px-6 py-4 text-[14px] font-bold text-[#5c403c]">Loại banner</th>
                                        <th className="px-6 py-4 text-[14px] font-bold text-[#5c403c]">Thanh toán</th>
                                        <th className="px-6 py-4 text-[14px] font-bold text-[#5c403c]">Thời hạn</th>
                                        <th className="px-6 py-4 text-[14px] font-bold text-[#5c403c]">Trạng thái</th>
                                        <th className="px-6 py-4 text-[14px] font-bold text-[#5c403c] text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e2e8f0]">
                                    {loading ? (
                                        <tr><td colSpan={7} className="px-6 py-16 text-center text-[#5c403c]">Đang tải...</td></tr>
                                    ) : filteredRequests.length === 0 ? (
                                        <tr><td colSpan={7} className="px-6 py-16 text-center text-[#5c403c]">Chưa có yêu cầu quảng cáo nào</td></tr>
                                    ) : filteredRequests.map((req) => {
                                        const meta = getStatusMeta(req.status);
                                        const daysRemaining = getDaysRemaining(req.end_date);
                                        const isExpiringSoon = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 3;
                                        const isExpired = daysRemaining !== null && daysRemaining <= 0;
                                        const firstImage = req.image_url ? req.image_url.split(',').filter(Boolean)[0] : '';
                                        const imageSrc = firstImage ? (firstImage.startsWith('http') ? firstImage : `http://127.0.0.1:3000${firstImage}`) : '';

                                        return (
                                            <tr key={req.request_id} className="group hover:bg-[#fef2f2]">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fee2e2] text-[14px] font-black text-[#dc2626]">
                                                            {req.landlord_name?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="text-[14px] font-bold text-[#0b1c30]">{req.landlord_name || 'N/A'}</p>
                                                            <p className="text-[12px] text-[#5c403c] flex items-center gap-1"><Mail className="h-3 w-3" /> {req.landlord_email || 'N/A'}</p>
                                                            {req.landlord_phone && <p className="text-[12px] text-[#5c403c] flex items-center gap-1"><Phone className="h-3 w-3" /> {req.landlord_phone}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#eff4ff] border border-[#e2e8f0]">
                                                            {imageSrc ? <img src={imageSrc} alt="banner" className="h-full w-full object-cover" /> : <Image className="h-4 w-4 text-[#5c403c]" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="max-w-[220px] truncate text-[14px] font-bold text-[#0b1c30]">{req.listing_title || 'N/A'}</p>
                                                            <p className="text-[12px] text-[#5c403c] flex items-center gap-1"><Building2 className="h-3 w-3" /> {req.building_name || 'N/A'}</p>
                                                            <p className="text-[12px] text-[#5c403c] flex items-center gap-1"><House className="h-3 w-3" /> Phòng {req.room_number || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-2">
                                                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-tighter ${req.type === 'home_banner' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                            {getTypeLabel(req.type)}
                                                        </span>
                                                        <p className="flex items-center gap-1 text-[12px] text-[#5c403c]"><LayoutTemplate className="h-3 w-3" /> {getDisplayStyleLabel(req.display_style)}</p>
                                                        <p className="flex items-center gap-1 text-[12px] text-[#5c403c]"><Star className={`h-3 w-3 ${req.priority > 0 ? 'text-amber-400 fill-current' : 'text-gray-200'}`} /> Ưu tiên: {req.priority || 0}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-[14px] font-bold text-[#0b1c30]">{formatVND(req.fee_paid || 0)}</p>
                                                    <p className="text-[12px] text-[#5c403c] capitalize">{req.payment_method === 'wallet' ? 'Ví' : req.payment_method || '—'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1 text-[12px] text-[#5c403c]">
                                                        <p>Tạo: {formatDateTime(req.created_at)}</p>
                                                        <p className={`${isExpired ? 'text-red-600 font-semibold' : isExpiringSoon ? 'text-amber-600 font-semibold' : ''}`}>
                                                            Hết: {req.end_date ? formatDateTime(req.end_date) : `Còn ${req.duration_days || 0} ngày`}
                                                        </p>
                                                        {daysRemaining !== null && req.end_date && (
                                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${isExpired ? 'bg-red-100 text-red-600' : isExpiringSoon ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                {isExpired ? 'Hết hạn' : `${daysRemaining} ngày`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${meta.tone}`}>
                                                        {meta.label}
                                                    </span>
                                                    {req.status === 'pending' && <p className="mt-1 text-[12px] text-[#5c403c] flex items-center gap-1"><Clock className="h-3 w-3 text-amber-500" /> Cần duyệt</p>}
                                                    {req.status === 'active' && !isExpired && <p className="mt-1 text-[12px] text-[#5c403c] flex items-center gap-1"><CircleCheck className="h-3 w-3 text-emerald-500" /> Đang hiển thị</p>}
                                                    {isExpired && <p className="mt-1 text-[12px] text-red-600 flex items-center gap-1"><TriangleAlert className="h-3 w-3" /> Hết hạn</p>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <button onClick={() => openDetailModal(req)} className="rounded-lg border border-[#e6bdb8] p-2 text-[#5c403c] hover:border-[#dc2626] hover:text-[#dc2626]" title="Xem chi tiết"><Eye className="h-4 w-4" /></button>
                                                        {req.status === 'pending' && (
                                                            <>
                                                                <button onClick={() => handleUpdateStatus(req.request_id, 'active', { priority: req.priority || 0, display_style: req.display_style || 'default' })} className="rounded-lg border border-[#e6bdb8] p-2 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50" title="Duyệt"><CircleCheck className="h-4 w-4" /></button>
                                                                <button onClick={() => handleUpdateStatus(req.request_id, 'rejected')} className="rounded-lg border border-[#e6bdb8] p-2 text-red-500 hover:border-red-300 hover:bg-red-50" title="Từ chối"><CircleX className="h-4 w-4" /></button>
                                                            </>
                                                        )}
                                                        {req.status === 'active' && <button onClick={() => handleUpdateStatus(req.request_id, 'pending')} className="rounded-lg border border-[#e6bdb8] p-2 text-amber-500 hover:border-amber-300 hover:bg-amber-50" title="Tạm dừng"><Clock className="h-4 w-4" /></button>}
                                                        <button onClick={() => handleDelete(req.request_id)} className="rounded-lg border border-[#e6bdb8] p-2 text-[#5c403c] hover:border-[#dc2626] hover:text-[#dc2626]" title="Xóa"><Trash2 className="h-4 w-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <aside className="col-span-12 space-y-5 xl:col-span-4">
                        <div className="rounded-[14px] bg-[#1a0a0a] p-6 text-white shadow-xl">
                            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/40">Truy cập nhanh</p>
                            <h3 className="mt-2 text-[24px] font-bold">Quản lý banner</h3>
                            <p className="mt-2 text-[14px] text-white/70">Duyệt quảng cáo theo checklist: ảnh, thanh toán, thời hạn và trạng thái.</p>
                        </div>

                        <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[14px] font-semibold text-[#0b1c30]">Bộ lọc nhanh</p>
                                <BadgeInfo className="h-4 w-4 text-[#5c403c]" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {['pending', 'active', 'rejected', 'expired'].map((item) => (
                                    <button
                                        key={item}
                                        onClick={() => setStatusFilter((current) => current === item ? '' : item)}
                                        className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${statusFilter === item ? 'border-[#dc2626] bg-[#fef2f2] text-[#dc2626]' : 'border-[#e6bdb8] bg-white text-[#5c403c]'}`}
                                    >
                                        {getStatusMeta(item).label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-[14px] font-semibold text-[#0b1c30]">Hướng dẫn xử lý</p>
                                <ArrowUpRight className="h-4 w-4 text-[#5c403c]" />
                            </div>
                            <div className="mt-4 space-y-3 text-[14px] text-[#5c403c]">
                                <p>• Xem chi tiết để kiểm tra chủ trọ, tin đăng và ảnh banner.</p>
                                <p>• Duyệt banner khi đã xác nhận thanh toán và nội dung hợp lệ.</p>
                                <p>• Tạm dừng hoặc gỡ nếu chiến dịch vi phạm hoặc hết hạn.</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {isDetailModalOpen && selectedBanner && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-[#f8f9ff] px-6 py-4">
                            <div>
                                <h2 className="text-[20px] font-semibold text-[#0b1c30]">Chi tiết chiến dịch quảng cáo</h2>
                                <p className="text-[14px] text-[#5c403c]">Mã ID: #{selectedBanner.request_id} • Ngày tạo: {formatDateTime(selectedBanner.created_at)}</p>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="rounded-lg p-2 text-[#5c403c] hover:bg-[#eff4ff]"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="grid flex-1 grid-cols-12 gap-6 overflow-y-auto p-6">
                            <div className="col-span-12 space-y-4 md:col-span-7">
                                <div className="aspect-video overflow-hidden rounded-2xl border border-[#e2e8f0] bg-[#eff4ff]">
                                    {images.length > 0 ? (
                                        <img
                                            src={images[currentImageIndex]?.startsWith('http') ? images[currentImageIndex] : `http://127.0.0.1:3000${images[currentImageIndex]}`}
                                            className="h-full w-full object-cover"
                                            alt="Banner"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-[#5c403c]"><Image className="h-10 w-10" /></div>
                                    )}
                                </div>

                                {images.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {images.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentImageIndex(idx)}
                                                className={`h-16 w-24 overflow-hidden rounded-xl border-2 ${idx === currentImageIndex ? 'border-[#dc2626]' : 'border-[#e2e8f0] opacity-70 hover:opacity-100'}`}
                                            >
                                                <img src={img?.startsWith('http') ? img : `http://127.0.0.1:3000${img}`} alt={`thumb-${idx}`} className="h-full w-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="col-span-12 space-y-4 md:col-span-5">
                                <div className={`rounded-2xl border-2 p-4 ${selectedStatusMeta.tone}`}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            {selectedBanner.status === 'active' && <CircleCheck className="h-6 w-6 text-emerald-500" />}
                                            {selectedBanner.status === 'pending' && <Clock className="h-6 w-6 text-amber-500" />}
                                            {selectedBanner.status === 'rejected' && <CircleX className="h-6 w-6 text-red-500" />}
                                            <div>
                                                <p className="text-[16px] font-bold">{selectedStatusMeta.label}</p>
                                                {daysLeft !== null && selectedBanner.end_date && <p className="text-[12px] opacity-80">Còn {daysLeft} ngày nữa hết hạn</p>}
                                            </div>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${selectedBanner.type === 'home_banner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {getTypeLabel(selectedBanner.type)}
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8f9ff] p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5c403c]">Thông tin tin đăng</p>
                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-[12px] text-[#5c403c]">Tiêu đề</p>
                                                <p className="font-bold text-[#0b1c30]">{selectedBanner.listing_title || 'N/A'}</p>
                                            </div>
                                            {selectedBanner.listing_id && (
                                                <button onClick={() => fetchListingDetails(selectedBanner.listing_id)} className="inline-flex items-center gap-1 rounded-lg border border-[#e6bdb8] bg-white px-3 py-2 text-[12px] font-semibold text-[#dc2626] hover:bg-[#fef2f2]">
                                                    <Globe className="h-3 w-3" /> Xem chi tiết
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-[14px] text-[#5c403c]">
                                            <div><p className="text-[12px]">Tòa nhà</p><p className="font-semibold text-[#0b1c30]">{selectedBanner.building_name || 'N/A'}</p></div>
                                            <div><p className="text-[12px]">Phòng</p><p className="font-semibold text-[#0b1c30]">{selectedBanner.room_number || 'N/A'}</p></div>
                                        </div>
                                        {selectedBanner.building_address && <p className="text-[14px] text-[#5c403c] flex items-center gap-1"><MapPin className="h-4 w-4" /> {selectedBanner.building_address}</p>}
                                        {selectedBanner.rent_price && <p className="text-[20px] font-bold text-[#dc2626]">{formatVND(selectedBanner.rent_price)}/tháng</p>}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8f9ff] p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5c403c]">Thông tin chủ trọ</p>
                                    <div className="mt-3 flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fee2e2] text-[#dc2626] font-bold">{selectedBanner.landlord_name?.charAt(0)?.toUpperCase() || '?'}</div>
                                        <div>
                                            <p className="font-bold text-[#0b1c30]">{selectedBanner.landlord_name || 'N/A'}</p>
                                            <p className="text-[14px] text-[#5c403c] flex items-center gap-1"><Mail className="h-3 w-3" /> {selectedBanner.landlord_email || 'N/A'}</p>
                                            {selectedBanner.landlord_phone && <p className="text-[14px] text-[#5c403c] flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedBanner.landlord_phone}</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8f9ff] p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5c403c]">Thanh toán & lịch trình</p>
                                    <div className="mt-3 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[14px] text-[#5c403c]">Phí</span>
                                            <span className="font-bold text-[#0b1c30]">{formatVND(selectedBanner.fee_paid || 0)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[14px] text-[#5c403c]">Thanh toán qua</span>
                                            <span className="font-semibold text-[#0b1c30] capitalize">{selectedBanner.payment_method === 'wallet' ? 'Ví tài khoản' : selectedBanner.payment_method || 'N/A'}</span>
                                        </div>
                                        <div className="border-t border-[#e2e8f0] pt-3 text-[14px] text-[#5c403c] space-y-1">
                                            <p>• Tạo: {formatDateTime(selectedBanner.created_at)}</p>
                                            <p>• Hết hạn: {selectedBanner.end_date ? formatDateTime(selectedBanner.end_date) : `Còn ${selectedBanner.duration_days || 0} ngày`}</p>
                                        </div>
                                    </div>
                                </div>

                                    <div className="flex gap-3 pt-2">
                                    {selectedBanner.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleUpdateStatus(selectedBanner.request_id, 'active', { priority: selectedBanner.priority || 0, display_style: selectedBanner.display_style || 'default' })} className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 text-[14px] font-semibold text-white hover:bg-emerald-700">
                                                Duyệt Banner
                                            </button>
                                            <button onClick={() => handleUpdateStatus(selectedBanner.request_id, 'rejected')} className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-[14px] font-semibold text-white hover:bg-red-700">
                                                Từ chối
                                            </button>
                                        </>
                                    )}
                                    {selectedBanner.status === 'active' && (
                                        <button onClick={() => handleUpdateStatus(selectedBanner.request_id, 'pending')} className="flex-1 rounded-lg bg-amber-600 px-4 py-3 text-[14px] font-semibold text-white hover:bg-amber-700">
                                            Tạm dừng
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(selectedBanner.request_id)} className="rounded-lg border border-[#e6bdb8] px-4 py-3 text-[#dc2626] hover:bg-[#fef2f2]">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isListingModalOpen && listingDetails && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-[#f8f9ff] px-6 py-4">
                            <h3 className="text-[20px] font-semibold text-[#0b1c30]">Chi tiết tin đăng</h3>
                            <button onClick={() => setIsListingModalOpen(false)} className="rounded-lg p-2 text-[#5c403c] hover:bg-[#eff4ff]"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="grid gap-5 p-6 md:grid-cols-2">
                            <div className="rounded-2xl overflow-hidden border border-[#e2e8f0] bg-[#eff4ff] aspect-[4/3] flex items-center justify-center">
                                {loadingListing ? <Loader className="h-6 w-6 animate-spin text-[#5c403c]" /> : listingDetails.images?.[0] ? <img src={Array.isArray(listingDetails.images) ? listingDetails.images[0] : listingDetails.images} alt="listing" className="h-full w-full object-cover" /> : <Image className="h-10 w-10 text-[#5c403c]" />}
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#5c403c]">Tiêu đề</p>
                                    <p className="mt-1 text-[20px] font-bold text-[#0b1c30]">{listingDetails.title || listingDetails.listing_title || 'N/A'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-[14px]">
                                    <div className="rounded-2xl bg-[#f8f9ff] p-4"><p className="text-[#5c403c]">Tòa nhà</p><p className="font-semibold text-[#0b1c30]">{listingDetails.building_name || 'N/A'}</p></div>
                                    <div className="rounded-2xl bg-[#f8f9ff] p-4"><p className="text-[#5c403c]">Phòng</p><p className="font-semibold text-[#0b1c30]">{listingDetails.room_number || 'N/A'}</p></div>
                                </div>
                                <div className="rounded-2xl bg-[#f8f9ff] p-4">
                                    <p className="text-[#5c403c]">Địa chỉ</p>
                                    <p className="font-semibold text-[#0b1c30]">{listingDetails.building_address || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BannerManagement;
