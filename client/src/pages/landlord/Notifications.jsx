import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Info, TriangleAlert, Check, Search, Loader, CircleCheck, ReceiptText, CalendarClock, AlertTriangle } from 'lucide-react';
import notificationService from '../../services/notificationService';

/* ── Icon by type ── */
const NotiIcon = ({ type }) => {
    const map = {
        booking: { icon: CalendarClock, bg: '#e6f7f2', color: '#0f6e56' },
        bill: { icon: ReceiptText, bg: 'rgba(160, 243, 212, 0.3)', color: '#005440' },
        alert: { icon: AlertTriangle, bg: '#fee2e2', color: '#ba1a1a' },
    };
    const { icon: Icon, bg, color } = map[type] || { icon: Bell, bg: '#ebefeb', color: '#6f7a74' };
    return (
        <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: bg }}
        >
            <Icon size={18} style={{ color }} />
        </div>
    );
};

/* ── Filter Tab ── */
const FilterTab = ({ active, label, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            active ? 'bg-[#0f6e56] text-white' : 'text-[#3f4944] hover:bg-[#ebefeb]'
        }`}
    >
        {label}
    </button>
);

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const LIMIT = 10;

    useEffect(() => { fetchNotifications(); }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationService.getNotifications();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.noti_id === id ? { ...n, is_read: 1 } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        } catch (err) {
            console.error(err);
        }
    };

    const filtered = notifications.filter(n => {
        const matchSearch = n.title?.toLowerCase().includes(search.toLowerCase()) ||
            n.body?.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' ? true :
            filter === 'unread' ? !n.is_read :
                n.type === filter;
        return matchSearch && matchFilter;
    });

    const totalPages = Math.ceil(filtered.length / LIMIT) || 1;
    const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const FILTERS = [
        { id: 'all', label: 'Tất cả' },
        { id: 'unread', label: 'Chưa đọc' },
        { id: 'booking', label: 'Lịch hẹn' },
        { id: 'bill', label: 'Hóa đơn' },
        { id: 'alert', label: 'Cảnh báo' },
    ];

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 60) return `${mins} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days === 1) return 'Hôm qua';
        return `${days} ngày trước`;
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
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <h3 className="text-[20px] font-semibold text-[#181d1a]">Tất cả thông báo</h3>
                    {unreadCount > 0 && (
                        <span
                            className="px-3 py-1 rounded-full text-[11.5px] font-semibold text-white"
                            style={{ backgroundColor: '#0f6e56' }}
                        >
                            {unreadCount} chưa đọc
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="text-[#005440] text-sm font-semibold hover:underline"
                    >
                        Đánh dấu tất cả là đã đọc
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                {FILTERS.map(f => (
                    <FilterTab
                        key={f.id}
                        label={f.label}
                        active={filter === f.id}
                        onClick={() => { setFilter(f.id); setPage(1); }}
                    />
                ))}
            </div>

            {/* Notifications List */}
            <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: '#bec9c3' }}>
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader style={{ width: 24, height: 24, color: '#bec9c3' }} className="animate-spin" />
                    </div>
                ) : paginated.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Bell style={{ width: 48, height: 48, color: '#bec9c3' }} />
                        <p className="text-sm font-semibold text-[#6f7a74] mt-4">Không có thông báo nào</p>
                    </div>
                ) : (
                    paginated.map(noti => (
                        <div
                            key={noti.noti_id}
                            onClick={() => !noti.is_read && markAsRead(noti.noti_id)}
                            className="group flex items-start gap-4 p-4 hover:bg-[#f9fbfc] transition-colors border-b cursor-pointer relative"
                            style={{
                                backgroundColor: !noti.is_read ? '#f8fafc' : 'white',
                                borderColor: '#bec9c3'
                            }}
                        >
                            <NotiIcon type={noti.type} />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className={`text-[14px] font-bold ${!noti.is_read ? 'text-[#181d1a]' : 'text-[#6f7a74]'}`}>
                                        {noti.title}
                                    </h4>
                                    <span className="text-[11.5px] text-[#6f7a74]">{formatTime(noti.created_at)}</span>
                                </div>
                                <p className={`text-[14px] ${!noti.is_read ? 'text-[#3f4944]' : 'text-[#6f7a74]'}`}>
                                    {noti.body}
                                </p>
                            </div>
                            {!noti.is_read && (
                                <div className="flex flex-col items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: '#005440' }}
                                    />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); markAsRead(noti.noti_id); }}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-[#6f7a74] hover:text-[#005440] transition-all"
                                        title="Đánh dấu đã đọc"
                                    >
                                        <Check style={{ width: 20, height: 20 }} />
                                    </button>
                                </div>
                            )}
                            {noti.is_read && (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-transparent" />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); }}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-[#6f7a74] hover:text-[#ba1a1a] transition-all"
                                        title="Xóa"
                                    >
                                        <Info style={{ width: 20, height: 20 }} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: '#bec9c3', backgroundColor: '#f8fafc' }}>
                    <p className="text-[14px] text-[#6f7a74]">
                        Hiển thị {Math.min((page - 1) * LIMIT + 1, filtered.length)} - {Math.min(page * LIMIT, filtered.length)} trên {filtered.length} thông báo
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="w-10 h-10 rounded-lg border hover:bg-[#ebefeb] disabled:opacity-30 transition-colors flex items-center justify-center"
                            style={{ borderColor: '#bec9c3' }}
                        >
                            <span style={{ color: '#6f7a74' }}>‹</span>
                        </button>
                        {[1, 2, 3].map(p => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className="w-10 h-10 rounded-lg text-[14px] font-semibold flex items-center justify-center transition-colors"
                                style={page === p
                                    ? { backgroundColor: '#0f6e56', color: 'white' }
                                    : { border: '1px solid #bec9c3', color: '#6f7a74' }
                                }
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="w-10 h-10 rounded-lg border hover:bg-[#ebefeb] disabled:opacity-30 transition-colors flex items-center justify-center"
                            style={{ borderColor: '#bec9c3' }}
                        >
                            <span style={{ color: '#6f7a74' }}>›</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
