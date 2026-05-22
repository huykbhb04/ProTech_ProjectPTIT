import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
    Megaphone, Plus, Clock, Eye, Pencil, Trash2, RefreshCw, X,
    ChevronLeft, ChevronRight as ChevronRightIcon, Image, ListFilter, Download,
    TrendingUp, Eye as EyeIcon, ArrowUp, Timer, CirclePlus, EyeOff
} from 'lucide-react';

const LIMIT = 10;

/* ── Helpers ── */
const formatVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n || 0);

/* ── Stat Card ── */
const StatCard = ({ label, value, subtitle, trend }) => (
    <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#bec9c3' }}>
        <p className="text-[11.5px] text-[#6f7a74] uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-[20px] font-bold text-[#181d1a]">{value}</h3>
        {trend && (
            <div className="flex items-center gap-1 text-[#0f6e56] mt-1">
                <ArrowUp style={{ width: 12, height: 12 }} />
                <span className="text-[11.5px]">{trend}</span>
            </div>
        )}
        {subtitle && (
            <p className="text-[11.5px] text-[#3f4944] mt-1">{subtitle}</p>
        )}
    </div>
);

/* ── Status Badge ── */
const StatusBadge = ({ status }) => {
    const statusMap = {
        active: { label: 'Đang chạy', bg: 'rgba(15, 110, 86, 0.1)', color: '#005440' },
        pending: { label: 'Đang duyệt', bg: 'rgba(234, 179, 8, 0.1)', color: '#a16207' },
        rejected: { label: 'Từ chối', bg: '#fee2e2', color: '#dc2626' },
        expired: { label: 'Hết hạn', bg: '#f3f4f6', color: '#6f7a74' }
    };
    const s = statusMap[status] || { label: status, bg: '#f3f4f6', color: '#6f7a74' };
    return (
        <span className="px-3 py-1 rounded-full text-[11.5px] font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>
            {s.label}
        </span>
    );
};

/* ── Pagination ── */
const Pagination = ({ currentPage, totalPages, onPageChange, total }) => (
    <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: '#bec9c3', backgroundColor: '#f8fafc' }}>
        <span className="text-[11.5px] text-[#6f7a74]">Hiển thị 3 trên {total} chiến dịch</span>
        <div className="flex items-center gap-1">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
                className="p-2 rounded border hover:bg-[#ebefeb] disabled:opacity-30"
                style={{ borderColor: '#bec9c3' }}>
                <ChevronLeft style={{ width: 16, height: 16, color: '#6f7a74' }} />
            </button>
            {[1, 2, 3].map(p => (
                <button key={p} onClick={() => onPageChange(p)}
                    className="w-8 h-8 rounded text-[11.5px] font-bold flex items-center justify-center transition-colors"
                    style={currentPage === p
                        ? { backgroundColor: '#0f6e56', color: 'white' }
                        : { borderColor: '#bec9c3', backgroundColor: 'white', color: '#6f7a74' }
                    }>
                    {p}
                </button>
            ))}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
                className="p-2 rounded border hover:bg-[#ebefeb] disabled:opacity-30"
                style={{ borderColor: '#bec9c3' }}>
                <ChevronRightIcon style={{ width: 16, height: 16, color: '#6f7a74' }} />
            </button>
        </div>
    </div>
);

const AdCampaigns = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [bannerServices, setBannerServices] = useState([]);
    const [landlordListings, setLandlordListings] = useState([]);
    const [previewImage, setPreviewImage] = useState('');
    const [formData, setFormData] = useState({ listing_id: '', type: 'home_banner', image_url: '', duration_days: 7 });
    const [renewData, setRenewData] = useState({ duration_days: 7 });
    const [submitting, setSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchBannerServices = async () => {
        try {
            const res = await api.get('/monetization/premium-services');
            if (res.data) {
                const services = Array.isArray(res.data) ? res.data : [];
                setBannerServices(services.filter(s => s.is_active));
            }
        } catch (err) {
            console.error('Lỗi lấy danh sách dịch vụ banner', err);
        }
    };

    const safeParseImages = (images) => {
        if (!images) return [];
        if (Array.isArray(images)) return images;
        try {
            const parsed = JSON.parse(images);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const fetchLandlordActiveListings = async () => {
        try {
            const res = await api.get('/listings/landlord');
            const rows = Array.isArray(res.data) ? res.data : [];
            const activeRows = rows.filter((item) => item.status === 'active');
            const normalized = activeRows.map((item) => {
                const images = safeParseImages(item.images);
                return {
                    ...item,
                    images,
                    preview_image: images[0] || '',
                };
            });
            setLandlordListings(normalized);
        } catch (err) {
            console.error('Lỗi lấy danh sách listing active của landlord', err);
            setLandlordListings([]);
        }
    };

    const fetchRequests = useCallback(async (pageNum = 1) => {
        setLoading(true);
        try {
            const res = await api.get('/landlord/banners/my-requests', {
                params: { page: pageNum, limit: LIMIT }
            });
            const data = res.data;
            if (Array.isArray(data)) {
                setRequests(data);
                setTotal(data.length);
                setTotalPages(1);
            } else if (data.requests) {
                setRequests(data.requests || []);
                setTotal(data.total || 0);
                setTotalPages(data.totalPages || 1);
            } else {
                setRequests(Array.isArray(data.data) ? data.data : []);
                setTotal(data.total || 0);
                setTotalPages(data.totalPages || 1);
            }
            setPage(pageNum);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi lấy danh sách.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests(page);
        fetchBannerServices();
        fetchLandlordActiveListings();
    }, [page]);

    const calculateFee = () => {
        const selected = bannerServices.find(s => s.badge_type === formData.type);
        const base = selected ? selected.price_per_day : 0;
        return base * formData.duration_days;
    };

    const calculateRenewFee = () => {
        const selected = bannerServices.find(s => s.badge_type === selectedCampaign?.type);
        const base = selected ? selected.price_per_day : 0;
        return base * renewData.duration_days;
    };

    const handleListingChange = (listingId) => {
        const selected = landlordListings.find((item) => String(item.listing_id) === String(listingId));
        const preview = selected?.preview_image || '';
        setFormData((prev) => ({
            ...prev,
            listing_id: listingId,
            image_url: preview,
        }));
        setPreviewImage(preview);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const isBanner = formData.type === 'home_banner' || formData.type === 'sidebar_banner';
            if (isBanner) {
                const selected = landlordListings.find((item) => String(item.listing_id) === String(formData.listing_id));
                if (!selected) throw new Error('Vui lòng chọn một tin active hợp lệ');
                const payload = { ...formData, image_url: selected.preview_image || formData.image_url, fee_paid: calculateFee() };
                await api.post('/landlord/banners/request', payload);
                alert('Đăng ký chạy Quảng cáo thành công!');
            } else {
                const selected = bannerServices.find(s => s.badge_type === formData.type);
                if (!selected) throw new Error('Dịch vụ không hợp lệ');
                await api.post('/monetization/pay', {
                    listingId: formData.listing_id, paymentType: 'premium_service',
                    amount: calculateFee(), paymentMethod: 'wallet',
                    referenceId: selected.service_id, durationDays: formData.duration_days
                });
            }
            setShowModal(false);
            setFormData({ listing_id: '', type: 'home_banner', image_url: '', duration_days: 7 });
            setPreviewImage('');
            fetchRequests(page);
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi gửi yêu cầu.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRenew = async () => {
        if (!selectedCampaign) return;
        setSubmitting(true);
        try {
            const selected = bannerServices.find(s => s.badge_type === selectedCampaign.type);
            if (!selected) throw new Error('Dịch vụ không hợp lệ');
            await api.post('/monetization/pay', {
                listingId: selectedCampaign.listing_id, paymentType: 'premium_service',
                amount: calculateRenewFee(), paymentMethod: 'wallet',
                referenceId: selected.service_id, durationDays: renewData.duration_days
            });
            alert('Gia hạn chiến dịch thành công!');
            setShowRenewModal(false);
            setSelectedCampaign(null);
            setRenewData({ duration_days: 7 });
            fetchRequests(page);
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi gia hạn.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (campaign) => {
        if (!confirm(`Bạn có chắc muốn xóa chiến dịch này?`)) return;
        try {
            await api.delete(`/landlord/banners/request/${campaign.request_id}`);
            alert('Xóa chiến dịch thành công!');
            fetchRequests(page);
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi xóa chiến dịch.');
        }
    };

    const openDetail = (campaign) => {
        setSelectedCampaign(campaign);
        setShowDetailModal(true);
    };

    const openRenew = (campaign) => {
        setSelectedCampaign(campaign);
        setRenewData({ duration_days: 7 });
        setShowRenewModal(true);
    };

    // Calculate stats from real API data
    const stats = {
        totalBudget: requests.length > 0 ? formatVND(requests.reduce((sum, r) => sum + (r.budget || 0), 0)) : '0đ',
        impressions: requests.length > 0 ? requests.reduce((sum, r) => sum + (r.impressions || 0), 0).toLocaleString() : '0',
        activeCampaigns: requests.filter(r => r.status === 'active').length || 0,
        newCustomers: requests.length > 0 ? requests.reduce((sum, r) => sum + (r.clicks || 0), 0).toLocaleString() : '0'
    };

    return (
        <div
            className="min-h-screen pb-20"
            style={{
                backgroundColor: '#f7faf6',
                fontFamily: "'Be Vietnam Pro', sans-serif",
                paddingTop: '80px',
                paddingLeft: '24px',
                paddingRight: '24px',
                maxWidth: '1280px',
                margin: '0 auto'
            }}
        >
            {/* Hero Banner */}
            <div
                className="relative rounded-xl p-8 mb-6 overflow-hidden flex items-center"
                style={{
                    background: 'linear-gradient(to right, #312e81, #7c3aed)',
                    minHeight: '280px'
                }}
            >
                <div className="z-10 max-w-xl">
                    <h1 className="text-white text-[32px] font-bold mb-2">Tăng gấp 5 lần lượt xem</h1>
                    <p className="text-white/80 text-[16px] mb-6">
                        Tiếp cận hàng nghìn khách hàng tiềm năng đang tìm kiếm căn hộ mỗi ngày.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-6 py-3 rounded-lg font-bold text-[14px] hover:opacity-90 transition-colors shadow-lg"
                            style={{ backgroundColor: 'white', color: '#4f46e5' }}
                        >
                            Tạo chiến dịch
                        </button>
                        <button className="px-6 py-3 rounded-lg font-bold text-[14px] text-white border border-white/20 hover:bg-white/20 transition-colors">
                            Tìm hiểu thêm
                        </button>
                    </div>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-20 pointer-events-none">
                    <TrendingUp style={{ position: 'absolute', right: -40, bottom: -40, width: 240, height: 240, color: 'white' }} />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Tổng ngân sách" value={stats.totalBudget} trend="12% so với tháng trước" />
                <StatCard label="Lượt hiển thị" value={stats.impressions} trend="4.5% tỷ lệ CTR" />
                <StatCard label="Chiến dịch đang chạy" value={stats.activeCampaigns} subtitle="3 chiến dịch sắp kết thúc" />
                <StatCard label="Khách hàng mới" value={stats.newCustomers} subtitle="Tăng trưởng ổn định" />
            </div>

            {/* Error Alert */}
            {error && (
                <div className="mb-6 p-4 rounded-xl flex items-center gap-2" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                    <Eye style={{ width: 20 }} /> {error}
                </div>
            )}

            {/* Table Section */}
            <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#bec9c3' }}>
                <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: '#bec9c3' }}>
                    <h3 className="text-[20px] font-bold text-[#181d1a]">Quản lý chiến dịch</h3>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-1 px-3 py-2 rounded-lg border text-[14px] font-semibold hover:bg-[#ebefeb] transition-colors" style={{ borderColor: '#bec9c3', color: '#3f4944' }}>
                            <ListFilter style={{ width: 16, height: 16 }} />
                            Bộ lọc
                        </button>
                        <button className="flex items-center gap-1 px-3 py-2 rounded-lg border text-[14px] font-semibold hover:bg-[#ebefeb] transition-colors" style={{ borderColor: '#bec9c3', color: '#3f4944' }}>
                            <Download style={{ width: 16, height: 16 }} />
                            Xuất báo cáo
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead style={{ backgroundColor: '#f1f4f1' }}>
                            <tr>
                                <th className="px-6 py-4 text-[14px] font-bold text-[#3f4944]">Chiến dịch</th>
                                <th className="px-6 py-4 text-[14px] font-bold text-[#3f4944]">Loại Banner</th>
                                <th className="px-6 py-4 text-[14px] font-bold text-[#3f4944]">Hình ảnh</th>
                                <th className="px-6 py-4 text-[14px] font-bold text-[#3f4944]">Trạng thái</th>
                                <th className="px-6 py-4 text-[14px] font-bold text-[#3f4944]">Ngân sách</th>
                                <th className="px-6 py-4 text-[14px] font-bold text-[#3f4944]">Lượt xem</th>
                                <th className="px-6 py-4 text-[14px] font-bold text-[#3f4944]">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: '#bec9c3' }}>
                            {loading ? (
                                <tr><td colSpan="7" className="px-6 py-16 text-center">Đang tải...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan="7" className="px-6 py-16 text-center text-[#6f7a74]">Bạn chưa có chiến dịch nào.</td></tr>
                            ) : requests.map((item) => (
                                <tr key={item.request_id} className="hover:bg-[#f9fbfc] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-[14px] text-[#181d1a]">{item.listing_title || 'Tin đăng'}</div>
                                        <div className="text-[11.5px] text-[#6f7a74]">ID: {item.request_id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 rounded-full text-[11.5px] font-bold"
                                            style={{ backgroundColor: item.type === 'home_banner' ? '#e0e7ff' : '#f3e8ff', color: item.type === 'home_banner' ? '#4338ca' : '#7c3aed' }}>
                                            {item.type === 'home_banner' ? 'Trang chủ' : 'Sidebar'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt="Banner" className="w-[80px] h-[45px] rounded-md object-cover border" style={{ borderColor: '#bec9c3' }} />
                                        ) : (
                                            <div className="w-[80px] h-[45px] rounded-md border flex items-center justify-center" style={{ backgroundColor: '#ebefeb', borderColor: '#bec9c3' }}>
                                                <Image style={{ width: 20, height: 20, color: '#6f7a74' }} />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={item.status} />
                                    </td>
                                    <td className="px-6 py-4 text-[14px] font-bold">{new Intl.NumberFormat('vi-VN').format(item.fee_paid)}đ/ngày</td>
                                    <td className="px-6 py-4 text-[14px]">{item.views || 0}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => openDetail(item)} className="p-2 rounded border hover:border-[#0f6e56] hover:text-[#0f6e56] transition-colors" style={{ borderColor: '#bec9c3', color: '#6f7a74' }}>
                                                <Eye style={{ width: 18, height: 18 }} />
                                            </button>
                                            <button onClick={() => openRenew(item)} className="p-2 rounded border hover:border-[#0f6e56] hover:text-[#0f6e56] transition-colors" style={{ borderColor: '#bec9c3', color: '#6f7a74' }}>
                                                <RefreshCw style={{ width: 18, height: 18 }} />
                                            </button>
                                            <button onClick={() => handleDelete(item)} className="p-2 rounded border hover:border-[#dc2626] hover:text-[#dc2626] transition-colors" style={{ borderColor: '#bec9c3', color: '#6f7a74' }}>
                                                <Trash2 style={{ width: 18, height: 18 }} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} />
            </div>

            {/* FAB */}
            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-6 right-6 flex items-center gap-2 px-6 py-3 rounded-full shadow-xl hover:opacity-90 active:scale-95 transition-all z-50"
                style={{ backgroundColor: '#0f6e56', color: 'white' }}
            >
                <Plus style={{ width: 20, height: 20 }} />
                <span className="text-[14px] font-bold">Chiến dịch mới</span>
            </button>

            {/* Modal Tạo chiến dịch */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white rounded-[16px] w-full max-w-lg shadow-xl overflow-hidden" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#bec9c3', backgroundColor: '#f7faf6' }}>
                            <h3 className="text-[20px] font-bold text-[#181d1a]">Mua Gói Quảng Cáo</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[#ebefeb] rounded-lg transition-colors">
                                <X style={{ width: 20, height: 20, color: '#6f7a74' }} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-[14px] font-semibold text-[#181d1a] mb-2">Chọn tin đăng active</label>
                                <select
                                    required
                                    value={formData.listing_id}
                                    onChange={e => handleListingChange(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border text-[14px] focus:outline-none focus:border-[#0f6e56]"
                                    style={{ borderColor: '#bec9c3', backgroundColor: '#f7faf6' }}
                                >
                                    <option value="">-- Chọn một tin đang active --</option>
                                    {landlordListings.map((item) => (
                                        <option key={item.listing_id} value={item.listing_id}>
                                            {item.title} · {item.building_name} · Phòng {item.room_number} · {new Intl.NumberFormat('vi-VN').format(item.rent_price)}đ · active
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-[140px_1fr]">
                                <div>
                                    <label className="block text-[14px] font-semibold text-[#181d1a] mb-2">Ảnh preview</label>
                                    <div className="w-full h-[120px] rounded-xl border overflow-hidden flex items-center justify-center" style={{ borderColor: '#bec9c3', backgroundColor: '#ebefeb' }}>
                                        {previewImage ? (
                                            <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center px-4">
                                                <Image style={{ width: 28, height: 28, color: '#6f7a74', margin: '0 auto 8px' }} />
                                                <p className="text-[11.5px] text-[#6f7a74]">Ảnh đầu tiên của tin</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[14px] font-semibold text-[#181d1a] mb-2">Vị trí banner</label>
                                        <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border text-[14px] focus:outline-none focus:border-[#0f6e56]"
                                            style={{ borderColor: '#bec9c3', backgroundColor: '#f7faf6' }}>
                                            {bannerServices.length > 0 ? bannerServices.map((svc) => (
                                                <option key={svc.service_id} value={svc.badge_type}>{svc.name}</option>
                                            )) : (
                                                <><option value="home_banner">Banner Trang chủ</option><option value="sidebar_banner">Sidebar</option></>
                                            )}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[14px] font-semibold text-[#181d1a] mb-2">Số ngày</label>
                                            <input type="number" min="1" value={formData.duration_days}
                                                onChange={e => setFormData({ ...formData, duration_days: Number(e.target.value) })}
                                                className="w-full px-4 py-3 rounded-lg border text-[14px] focus:outline-none focus:border-[#0f6e56]"
                                                style={{ borderColor: '#bec9c3', backgroundColor: '#f7faf6' }} />
                                        </div>
                                        <div className="p-4 rounded-xl flex flex-col justify-center" style={{ backgroundColor: '#e6f7f2' }}>
                                            <span className="text-[11.5px] text-[#005440] uppercase font-semibold">Tổng thanh toán</span>
                                            <span className="text-[24px] font-bold text-[#0f6e56]">{new Intl.NumberFormat('vi-VN').format(calculateFee())}đ</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={submitting || !formData.listing_id}
                                className="w-full py-3 rounded-lg text-white font-bold hover:opacity-90 transition disabled:opacity-50"
                                style={{ backgroundColor: '#0f6e56' }}>
                                {submitting ? 'Đang xử lý...' : 'Thanh toán từ số dư ví'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Chi tiết */}
            {showDetailModal && selectedCampaign && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetailModal(false)} />
                    <div className="relative bg-white rounded-[16px] w-full max-w-lg shadow-xl overflow-hidden" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#bec9c3', backgroundColor: '#f7faf6' }}>
                            <h3 className="text-[20px] font-bold text-[#181d1a]">Chi tiết chiến dịch</h3>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-[#ebefeb] rounded-lg">
                                <X style={{ width: 20, height: 20, color: '#6f7a74' }} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-center mb-4">
                                {selectedCampaign.image_url ? (
                                    <img src={selectedCampaign.image_url} alt="Banner" className="w-full max-w-sm h-32 object-cover rounded-xl border" style={{ borderColor: '#bec9c3' }} />
                                ) : (
                                    <div className="w-full max-w-sm h-32 rounded-xl border flex items-center justify-center" style={{ backgroundColor: '#ebefeb', borderColor: '#bec9c3' }}>
                                        <Image style={{ width: 48, height: 48, color: '#6f7a74' }} />
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[11.5px] text-[#6f7a74] uppercase">Loại banner</p>
                                    <p className="font-bold text-[#181d1a]">{selectedCampaign.type === 'home_banner' ? 'Banner Trang Chủ' : 'Sidebar'}</p>
                                </div>
                                <div>
                                    <p className="text-[11.5px] text-[#6f7a74] uppercase">Trạng thái</p>
                                    <StatusBadge status={selectedCampaign.status} />
                                </div>
                                <div>
                                    <p className="text-[11.5px] text-[#6f7a74] uppercase">Thời gian</p>
                                    <p className="font-bold text-[#181d1a]">{selectedCampaign.duration_days} ngày</p>
                                </div>
                                <div>
                                    <p className="text-[11.5px] text-[#6f7a74] uppercase">Chi phí</p>
                                    <p className="font-bold text-[#0f6e56]">{new Intl.NumberFormat('vi-VN').format(selectedCampaign.fee_paid)}đ</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: '#bec9c3', backgroundColor: '#f7faf6' }}>
                            <button onClick={() => { setShowDetailModal(false); openRenew(selectedCampaign); }}
                                className="flex-1 py-3 rounded-lg text-white font-bold hover:opacity-90 transition" style={{ backgroundColor: '#0f6e56' }}>
                                Gia hạn
                            </button>
                            <button onClick={() => { setShowDetailModal(false); handleDelete(selectedCampaign); }}
                                className="flex-1 py-3 rounded-lg text-white font-bold hover:opacity-90 transition" style={{ backgroundColor: '#dc2626' }}>
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Gia hạn */}
            {showRenewModal && selectedCampaign && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowRenewModal(false)} />
                    <div className="relative bg-white rounded-[16px] w-full max-w-md shadow-xl" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#bec9c3', backgroundColor: '#f7faf6' }}>
                            <h3 className="text-[20px] font-bold text-[#181d1a]">Gia hạn chiến dịch</h3>
                            <button onClick={() => setShowRenewModal(false)} className="p-2 hover:bg-[#ebefeb] rounded-lg">
                                <X style={{ width: 20, height: 20, color: '#6f7a74' }} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="p-4 rounded-xl" style={{ backgroundColor: '#f7faf6' }}>
                                <p className="text-[11.5px] text-[#6f7a74] uppercase mb-1">Chiến dịch hiện tại</p>
                                <p className="font-bold text-[#181d1a]">{selectedCampaign.type === 'home_banner' ? 'Banner Trang Chủ' : 'Sidebar'}</p>
                                <p className="text-[14px] text-[#6f7a74]">{selectedCampaign.duration_days} ngày - {new Intl.NumberFormat('vi-VN').format(selectedCampaign.fee_paid)}đ</p>
                            </div>
                            <div>
                                <label className="block text-[14px] font-semibold text-[#181d1a] mb-2">Số ngày gia hạn thêm</label>
                                <input type="number" min="1" value={renewData.duration_days}
                                    onChange={e => setRenewData({ duration_days: Number(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-lg border text-[14px] focus:outline-none focus:border-[#0f6e56]"
                                    style={{ borderColor: '#bec9c3', backgroundColor: '#f7faf6' }} />
                            </div>
                            <div className="p-4 rounded-xl" style={{ backgroundColor: '#e6f7f2' }}>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-[#005440]">Thanh toán thêm:</span>
                                    <span className="text-[20px] font-bold text-[#0f6e56]">{new Intl.NumberFormat('vi-VN').format(calculateRenewFee())}đ</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: '#bec9c3', backgroundColor: '#f7faf6' }}>
                            <button onClick={() => setShowRenewModal(false)} className="flex-1 py-3 rounded-lg border font-bold hover:bg-[#ebefeb] transition" style={{ borderColor: '#bec9c3', color: '#3f4944' }}>Hủy</button>
                            <button onClick={handleRenew} disabled={submitting} className="flex-1 py-3 rounded-lg text-white font-bold hover:opacity-90 transition disabled:opacity-50" style={{ backgroundColor: '#0f6e56' }}>
                                {submitting ? 'Đang xử lý...' : 'Xác nhận gia hạn'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdCampaigns;
