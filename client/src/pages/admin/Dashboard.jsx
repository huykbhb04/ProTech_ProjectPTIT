import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Download,
    Plus,
    Users,
    Package,
    Star,
    CreditCard,
    Activity,
    LayoutDashboard,
    Building2,
    UserRound,
    HandCoins,
    Wrench,
    Settings,
    LogOut,
    Bell,
    ArrowUpRight,
    ArrowUp,
    MoreVertical,
    SlidersHorizontal,
    X,
    History,
    ShieldCheck,
    MemoryStick,
    TrendingUp,
    CircleAlert,
    CircleCheck,
    CircleDashed,
    CircleDollarSign,
    BadgeInfo,
} from 'lucide-react';
import adminService from '../../services/adminService';

const TX_TYPE_LABELS = {
    package: 'Mua gói tin',
    premium_service: 'Dịch vụ VIP',
    banner_ad: 'Quảng cáo Banner',
    wallet_topup: 'Nạp tiền ví',
    booking_deposit: 'Đặt cọc',
};

const formatVND = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));
const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));
const actionLabel = (type) => TX_TYPE_LABELS[type] || type || '—';

const SidebarItem = ({ to, icon: Icon, label, active = false }) => (
    <Link
        to={to}
        className={`flex items-center gap-4 px-4 py-3 transition-colors duration-150 ${active ? 'bg-white/10 border-l-[4px] border-[#ef4444] text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
    >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="text-[14px] font-semibold">{label}</span>
    </Link>
);

const StatCard = ({ icon: Icon, title, value, trend, tone = 'red' }) => {
    const toneMap = {
        red: { bg: 'rgba(220,38,38,0.10)', color: '#dc2626' },
        amber: { bg: 'rgba(245,158,11,0.10)', color: '#b45309' },
        violet: { bg: 'rgba(124,58,237,0.10)', color: '#7c3aed' },
        emerald: { bg: 'rgba(16,185,129,0.10)', color: '#059669' },
    };
    const toneStyle = toneMap[tone] || toneMap.red;

    return (
        <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6f7a74]">{title}</p>
                    <h3 className="mt-2 text-[28px] font-extrabold leading-none text-[#0b1c30]">{value}</h3>
                    {trend && (
                        <p className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-[#16a34a]">
                            <TrendingUp className="h-4 w-4" />
                            {trend}
                        </p>
                    )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: toneStyle.bg, color: toneStyle.color }}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const s = String(status || '').toLowerCase();
    const map = {
        confirmed: ['Thành công', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
        completed: ['Hoàn thành', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
        paid: ['Đã thanh toán', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
        pending: ['Đang xử lý', 'bg-amber-50 text-amber-700 border-amber-200'],
        failed: ['Thất bại', 'bg-red-50 text-red-600 border-red-200'],
        cancelled: ['Đã hủy', 'bg-red-50 text-red-600 border-red-200'],
    };
    const [label, cls] = map[s] || ['—', 'bg-gray-100 text-gray-500 border-gray-200'];
    return <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${cls}`}>{label}</span>;
};

const RoleBadge = ({ role }) => {
    const s = String(role || '').toLowerCase();
    const map = {
        admin: ['Quản trị', 'bg-red-50 text-red-700 border-red-200'],
        landlord: ['Chủ nhà', 'bg-indigo-50 text-indigo-700 border-indigo-200'],
        tenant: ['Người thuê', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
    };
    const [label, cls] = map[s] || ['—', 'bg-gray-100 text-gray-500 border-gray-200'];
    return <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${cls}`}>{label}</span>;
};

const TopBar = () => (
    <header className="flex h-20 items-center justify-between border-b border-[#e6bdb8] bg-[#f8f9ff] px-8">
        <div className="flex flex-1 items-center gap-8">
            <span className="text-[12px] font-black tracking-[0.24em] text-[#b70011]">QUẢN TRỊ HỆ THỐNG</span>
            <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5c403c]" />
                <input
                    placeholder="Tìm kiếm nhanh..."
                    className="w-full rounded-lg border border-transparent bg-[#eff4ff] py-3 pl-11 pr-4 text-[14px] outline-none transition-all focus:border-[#dc2626] focus:bg-white"
                />
            </div>
        </div>
        <div className="flex items-center gap-6">
            <button className="relative rounded-full p-2 text-[#5c403c] transition-colors hover:bg-white hover:text-[#dc2626]">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#dc2626]" />
            </button>
            <div className="flex items-center gap-3 border-l border-[#e6bdb8] pl-4">
                <div className="hidden text-right lg:block">
                    <p className="text-[14px] font-semibold text-[#0b1c30] leading-tight">Admin User</p>
                    <p className="text-[12px] text-[#5c403c]">Quản trị viên</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dc2626] text-white font-bold">A</div>
            </div>
        </div>
    </header>
);

const SectionTitle = ({ title, subtitle, actions }) => (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
            <h1 className="text-[30px] font-bold leading-[38px] tracking-[-0.02em] text-[#0b1c30]">{title}</h1>
            {subtitle && <p className="mt-1 text-[16px] leading-6 text-[#5c403c]">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-3">{actions}</div>}
    </div>
);

const FilterChip = ({ label, onRemove }) => (
    <div className="flex items-center gap-2 rounded-full border border-[#dc2626]/20 bg-[#fef2f2] px-3 py-1 text-[10px] font-bold text-[#dc2626]">
        <span>{label}</span>
        <button onClick={onRemove} className="rounded-full p-0.5 hover:bg-[#dc2626]/10"><X className="h-3 w-3" /></button>
    </div>
);

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [txLoading, setTxLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [txFilters, setTxFilters] = useState({ search: '', type: '', status: '', dateFrom: '', dateTo: '' });
    const [localSearch, setLocalSearch] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('DESC');
    const [page, setPage] = useState(1);

    const getAuthToken = () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            return user?.token || null;
        } catch {
            return null;
        }
    };

    const fetchOverview = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) throw new Error('Missing admin token');
            const result = await adminService.getDashboardOverview(token);
            setData(result);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = useCallback(async (filters, sort, currentPage) => {
        setTxLoading(true);
        try {
            const token = getAuthToken();
            if (!token) throw new Error('Missing admin token');
            const result = await adminService.getTransactions(token, {
                ...filters,
                sortBy: sort.sortBy,
                sortOrder: sort.sortOrder,
                page: currentPage,
                limit: 10,
            });
            setTransactions(result.transactions || []);
            setPagination(result.pagination || null);
        } catch (err) {
            console.error(err);
        } finally {
            setTxLoading(false);
        }
    }, []);

    useEffect(() => { fetchOverview(); }, []);
    useEffect(() => { fetchTransactions(txFilters, { sortBy, sortOrder }, page); }, [txFilters, sortBy, sortOrder, page, fetchTransactions]);

    const handleSort = (field) => {
        if (sortBy === field) setSortOrder((s) => (s === 'ASC' ? 'DESC' : 'ASC'));
        else {
            setSortBy(field);
            setSortOrder('DESC');
        }
        setPage(1);
    };

    const applySearch = () => {
        setTxFilters((prev) => ({ ...prev, search: localSearch }));
        setPage(1);
    };

    const resetFilters = () => {
        setLocalSearch('');
        setTxFilters({ search: '', type: '', status: '', dateFrom: '', dateTo: '' });
        setPage(1);
    };

    const stats = useMemo(() => {
        return data?.stats || {};
    }, [data]);

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="flex items-center gap-3 text-[#5c403c]"><div className="h-5 w-5 animate-spin rounded-full border-2 border-[#dc2626] border-t-transparent" />Đang tải dữ liệu...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <TopBar />
            <div className="space-y-8 px-4 py-6 lg:px-8">
                    <SectionTitle
                        title="Admin Dashboard"
                        subtitle="Tổng quan hoạt động PropTech"
                        actions={[
                            <button key="export" className="flex items-center gap-2 rounded-lg border border-[#e6bdb8] bg-white px-4 py-3 text-[14px] font-semibold text-[#0b1c30] transition-colors hover:bg-[#eff4ff]">
                                <Download className="h-4 w-4" /> Xuất báo cáo
                            </button>,
                            <button key="add" className="flex items-center gap-2 rounded-lg bg-[#dc2626] px-4 py-3 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#b91c1c]">
                                <Plus className="h-4 w-4" /> Thêm mới
                            </button>,
                        ]}
                    />

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard icon={Users} title="Tổng Users" value={formatNumber(stats.totalUsers)} trend="+12% tháng này" tone="red" />
                        <StatCard icon={Package} title="Gói tin đã bán" value={formatNumber(stats.totalPackages)} trend="+5% tuần này" tone="amber" />
                        <StatCard icon={Star} title="Dịch vụ VIP" value={formatNumber(stats.totalServices)} trend="Đang hoạt động" tone="violet" />
                        <StatCard icon={CreditCard} title="Doanh thu" value={formatVND(stats.totalRevenue)} trend="+18.4% quý" tone="emerald" />
                    </div>

                    <div className="grid grid-cols-12 gap-5 items-start">
                        <section className="col-span-12 overflow-hidden rounded-[14px] border border-[#e2e8f0] bg-white shadow-sm xl:col-span-9">
                            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4">
                                <h3 className="text-[20px] font-semibold text-[#0b1c30]">Giao dịch gần đây</h3>
                                <button className="text-[14px] font-semibold text-[#dc2626] hover:underline">Xem tất cả</button>
                            </div>

                            <div className="border-b border-[#e2e8f0] bg-[#f8f9ff] px-6 py-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="relative min-w-[220px] flex-1">
                                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5c403c]" />
                                        <input
                                            value={localSearch}
                                            onChange={(e) => setLocalSearch(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                                            placeholder="Tìm theo tên người dùng..."
                                            className="w-full rounded-lg border border-[#e6bdb8] bg-white py-2.5 pl-11 pr-4 text-[14px] outline-none transition-colors focus:border-[#dc2626]"
                                        />
                                    </div>

                                    <select
                                        value={txFilters.type}
                                        onChange={(e) => { setTxFilters((p) => ({ ...p, type: e.target.value })); setPage(1); }}
                                        className="rounded-lg border border-[#e6bdb8] bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[#dc2626]"
                                    >
                                        <option value="">Tất cả loại GD</option>
                                        {Object.entries(TX_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                    </select>

                                    <select
                                        value={txFilters.status}
                                        onChange={(e) => { setTxFilters((p) => ({ ...p, status: e.target.value })); setPage(1); }}
                                        className="rounded-lg border border-[#e6bdb8] bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[#dc2626]"
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="pending">Đang xử lý</option>
                                        <option value="confirmed">Thành công</option>
                                        <option value="completed">Hoàn thành</option>
                                        <option value="paid">Đã thanh toán</option>
                                        <option value="failed">Thất bại</option>
                                        <option value="cancelled">Đã hủy</option>
                                    </select>

                                    <div className="flex items-center gap-2">
                                        <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5c403c]">Từ</span>
                                        <input type="date" value={txFilters.dateFrom} onChange={(e) => { setTxFilters((p) => ({ ...p, dateFrom: e.target.value })); setPage(1); }} className="rounded-lg border border-[#e6bdb8] bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[#dc2626]" />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5c403c]">Đến</span>
                                        <input type="date" value={txFilters.dateTo} onChange={(e) => { setTxFilters((p) => ({ ...p, dateTo: e.target.value })); setPage(1); }} className="rounded-lg border border-[#e6bdb8] bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[#dc2626]" />
                                    </div>

                                    <button onClick={applySearch} className="flex items-center gap-2 rounded-lg bg-[#dc2626] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#b91c1c]">
                                        <SlidersHorizontal className="h-4 w-4" /> Lọc
                                    </button>
                                    <button onClick={resetFilters} className="flex items-center gap-2 rounded-lg border border-[#e6bdb8] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#5c403c] transition-colors hover:bg-[#eff4ff]">
                                        <X className="h-4 w-4" /> Xóa lọc
                                    </button>
                                </div>

                                {(txFilters.search || txFilters.type || txFilters.status || txFilters.dateFrom || txFilters.dateTo) && (
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5c403c]">Đang lọc:</span>
                                        {txFilters.search && <FilterChip label={`Tìm: ${txFilters.search}`} onRemove={() => { setLocalSearch(''); setTxFilters((p) => ({ ...p, search: '' })); }} />}
                                        {txFilters.type && <FilterChip label={`Loại: ${actionLabel(txFilters.type)}`} onRemove={() => setTxFilters((p) => ({ ...p, type: '' }))} />}
                                        {txFilters.status && <FilterChip label={`Trạng thái: ${txFilters.status}`} onRemove={() => setTxFilters((p) => ({ ...p, status: '' }))} />}
                                        {txFilters.dateFrom && <FilterChip label={`Từ: ${txFilters.dateFrom}`} onRemove={() => setTxFilters((p) => ({ ...p, dateFrom: '' }))} />}
                                        {txFilters.dateTo && <FilterChip label={`Đến: ${txFilters.dateTo}`} onRemove={() => setTxFilters((p) => ({ ...p, dateTo: '' }))} />}
                                    </div>
                                )}
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-[#e2e8f0] bg-[#f8f9ff]">
                                            <th className="px-6 py-4 text-[14px] font-bold text-[#5c403c]" onClick={() => handleSort('full_name')}>
                                                <button className="flex items-center gap-1 hover:text-[#dc2626]">Người dùng {sortBy === 'full_name' ? (sortOrder === 'ASC' ? '↑' : '↓') : ''}</button>
                                            </th>
                                            <th className="px-6 py-4 text-[14px] font-bold text-[#5c403c]" onClick={() => handleSort('type')}>
                                                <button className="flex items-center gap-1 hover:text-[#dc2626]">Loại GD {sortBy === 'type' ? (sortOrder === 'ASC' ? '↑' : '↓') : ''}</button>
                                            </th>
                                            <th className="px-6 py-4 text-[14px] font-bold text-[#5c403c] text-right" onClick={() => handleSort('amount')}>
                                                <button className="ml-auto flex items-center gap-1 hover:text-[#dc2626]">Số tiền {sortBy === 'amount' ? (sortOrder === 'ASC' ? '↑' : '↓') : ''}</button>
                                            </th>
                                            <th className="px-6 py-4 text-[14px] font-bold text-[#5c403c]" onClick={() => handleSort('status')}>
                                                <button className="flex items-center gap-1 hover:text-[#dc2626]">Trạng thái {sortBy === 'status' ? (sortOrder === 'ASC' ? '↑' : '↓') : ''}</button>
                                            </th>
                                            <th className="px-6 py-4 text-[14px] font-bold text-[#5c403c]" onClick={() => handleSort('created_at')}>
                                                <button className="flex items-center gap-1 hover:text-[#dc2626]">Thời gian {sortBy === 'created_at' ? (sortOrder === 'ASC' ? '↑' : '↓') : ''}</button>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#e2e8f0]">
                                        {txLoading ? (
                                            <tr><td colSpan={5} className="px-6 py-16 text-center text-[#5c403c]">Đang tải giao dịch...</td></tr>
                                        ) : transactions.length > 0 ? transactions.map((tx, idx) => (
                                            <tr key={`${tx.source || 'tx'}-${tx.id || idx}`} className="hover:bg-[#fef2f2]">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fee2e2] text-[12px] font-black text-[#dc2626]">{tx.full_name?.charAt(0) || '?'}</div>
                                                        <div>
                                                            <p className="text-[14px] font-bold text-[#0b1c30]">{tx.full_name || '—'}</p>
                                                            <RoleBadge role={tx.role} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-[14px] font-medium text-[#0b1c30]">{actionLabel(tx.type)}</p>
                                                    {tx.detail && <p className="mt-1 line-clamp-1 text-[11px] text-[#5c403c]">{tx.detail}</p>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <p className="text-[14px] font-extrabold text-[#0b1c30]">{formatVND(tx.amount)}</p>
                                                    {Number(tx.commission_amount || 0) > 0 && <p className="text-[11px] font-semibold text-[#16a34a]">+{formatVND(tx.commission_amount)}</p>}
                                                </td>
                                                <td className="px-6 py-4"><StatusBadge status={tx.status} /></td>
                                                <td className="px-6 py-4 text-[14px] text-[#5c403c]">
                                                    {tx.created_at ? new Date(tx.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={5} className="px-6 py-16 text-center text-[#5c403c]">Không tìm thấy giao dịch nào</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {pagination && pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between border-t border-[#e2e8f0] bg-[#f8f9ff] px-6 py-4">
                                    <p className="text-[11px] font-medium text-[#5c403c]">
                                        Hiển thị <span className="font-bold text-[#0b1c30]">{(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)}</span> trên <span className="font-bold text-[#0b1c30]">{pagination.total}</span> giao dịch
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex h-8 w-8 items-center justify-center rounded border border-[#e2e8f0] text-[#5c403c] transition-colors hover:bg-white disabled:opacity-30">
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + Math.max(1, Math.min(page - 2, pagination.totalPages - 4))).map((p) => (
                                                <button key={p} onClick={() => setPage(p)} className={`flex h-8 w-8 items-center justify-center rounded border text-[11px] font-bold transition-colors ${p === page ? 'border-[#dc2626] bg-[#dc2626] text-white' : 'border-[#e2e8f0] text-[#5c403c] hover:bg-white'}`}>
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                        <button onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages} className="flex h-8 w-8 items-center justify-center rounded border border-[#e2e8f0] text-[#5c403c] transition-colors hover:bg-white disabled:opacity-30">
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>

                        <aside className="col-span-12 space-y-5 xl:col-span-3">
                            <h4 className="px-1 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#5c403c]">Truy cập nhanh</h4>
                            <Link to="/admin/users" className="group relative overflow-hidden rounded-[14px] border-l-4 border-[#dc2626] bg-white p-4 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-[#dc2626]" />
                                    <div>
                                        <p className="text-[14px] font-semibold text-[#0b1c30]">Đang chờ duyệt</p>
                                        <p className="text-[14px] text-[#5c403c]">12 tin đăng mới</p>
                                    </div>
                                </div>
                                <ArrowUpRight className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e2e8f0] transition-all group-hover:translate-x-1 group-hover:text-[#dc2626]" />
                            </Link>

                            <Link to="/admin/users" className="group relative overflow-hidden rounded-[14px] border-l-4 border-[#b45309] bg-white p-4 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-center gap-3">
                                    <CircleAlert className="h-5 w-5 text-[#b45309]" />
                                    <div>
                                        <p className="text-[14px] font-semibold text-[#0b1c30]">Khiếu nại khách</p>
                                        <p className="text-[14px] text-[#5c403c]">2 yêu cầu chưa xử lý</p>
                                    </div>
                                </div>
                                <ArrowUpRight className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e2e8f0] transition-all group-hover:translate-x-1 group-hover:text-[#b45309]" />
                            </Link>

                            <Link to="/admin/users" className="group relative overflow-hidden rounded-[14px] border-l-4 border-[#16a34a] bg-white p-4 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="h-5 w-5 text-[#16a34a]" />
                                    <div>
                                        <p className="text-[14px] font-semibold text-[#0b1c30]">Duyệt KYC</p>
                                        <p className="text-[14px] text-[#5c403c]">5 tài khoản chờ đối soát</p>
                                    </div>
                                </div>
                                <ArrowUpRight className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e2e8f0] transition-all group-hover:translate-x-1 group-hover:text-[#16a34a]" />
                            </Link>

                            <Link to="/admin/audit" className="group relative overflow-hidden rounded-[14px] border-l-4 border-[#7c3aed] bg-white p-4 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-center gap-3">
                                    <History className="h-5 w-5 text-[#7c3aed]" />
                                    <div>
                                        <p className="text-[14px] font-semibold text-[#0b1c30]">Lịch sử hệ thống</p>
                                        <p className="text-[14px] text-[#5c403c]">Xem nhật ký thay đổi</p>
                                    </div>
                                </div>
                                <ArrowUpRight className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e2e8f0] transition-all group-hover:translate-x-1 group-hover:text-[#7c3aed]" />
                            </Link>

                            <div className="relative overflow-hidden rounded-[14px] bg-[#dc2626] p-6 text-white shadow-sm">
                                <div className="relative z-10">
                                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/70">Trạng thái Server</p>
                                    <h5 className="mt-2 text-[20px] font-semibold">Hệ thống Ổn định</h5>
                                    <p className="mt-3 text-[14px] leading-6 text-white/85">Thời gian phản hồi trung bình 120ms. Không có sự cố ghi nhận.</p>
                                    <button className="mt-5 w-full rounded-lg bg-white py-2.5 text-[14px] font-semibold text-[#dc2626] transition-colors hover:bg-[#f8f9ff]">Chi tiết hệ thống</button>
                                </div>
                                <MemoryStick className="absolute -bottom-3 -right-3 h-28 w-28 text-white/10" />
                            </div>

                            <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
                                <div className="mb-4 flex items-center justify-between">
                                    <p className="text-[14px] font-semibold text-[#0b1c30]">Phiên bản v2.4.0</p>
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">MỚI NHẤT</span>
                                </div>
                                <img
                                    className="mb-4 h-32 w-full rounded-lg object-cover"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYGdtm2pWmYtm3b1gYiN6OjYdudmyJdsFO-bKC65Eo9nuked4YZwzbSOcYhtVkQnJEZ-CaNF-JM0laVXy3QtMCnAQQGf_fRhnhSr-n2BvaPRn_dLWeFBfsDpTgDLVhvBXkarSsvKCOib0XUNrlVFDEIkJHOKZ4ctWJtgatrR1hPcF-TCizAmJZqkycvDtpvvHyPWeH3dleOnRs6B-lFwB6GqPY2heIg_YSTCCBJsASRk0pIrMqmQxYZwhSgjde1OSZLQi2Av_VOzJK"
                                    alt="Admin dashboard preview"
                                />
                                <p className="text-[14px] leading-6 text-[#5c403c]">Bản cập nhật tối ưu hóa công cụ lọc và tăng tốc độ tải báo cáo tài chính.</p>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
    );
};

export default Dashboard;
