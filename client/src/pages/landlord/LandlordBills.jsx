import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, ChevronRight, Download, Loader, Plus, Search, ListFilter,
    Receipt, Clock, CircleCheck, CheckCircle, TriangleAlert, ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import api from '../../services/api';

/* ── Stat Card ── */
const StatCard = ({ icon: Icon, iconBg, iconColor, label, value, subtitle }) => (
    <div
        className="rounded-[14px] p-4 flex flex-col justify-between border hover:border-[#0f6e56]/30 transition-colors"
        style={{ backgroundColor: '#ffffff', borderColor: '#bec9c3' }}
    >
        <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-[#3f4944]">{label}</span>
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: iconBg }}
            >
                <Icon style={{ color: iconColor, width: 18, height: 18 }} />
            </div>
        </div>
        <div className="mt-2">
            <p className="text-[24px] font-semibold text-[#181d1a] leading-7">{value}</p>
            {subtitle && <p className="text-[11.5px] text-[#6f7a74] mt-1">{subtitle}</p>}
        </div>
    </div>
);

/* ── Filter Tab ── */
const FilterTab = ({ active, label, count, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
            active
                ? 'bg-white text-[#181d1a] shadow-sm'
                : 'text-[#3f4944] hover:bg-white/50'
        }`}
    >
        {label} {count !== undefined && <span className="ml-1 opacity-60">({count})</span>}
    </button>
);

/* ── Pagination ── */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = [];
    for (let i = 1; i <= Math.min(totalPages, 5); i++) pages.push(i);

    return (
        <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: '#bec9c3', backgroundColor: '#f8fafc' }}>
            <span className="text-sm font-semibold text-[#3f4944]">
                Hiển thị 1 - {Math.min(10, totalPages * 10)} trên tổng số {totalPages * 10} hóa đơn
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded border hover:bg-[#ebefeb] disabled:opacity-50 transition-colors"
                    style={{ borderColor: '#bec9c3', backgroundColor: '#ffffff' }}
                >
                    <ChevronLeft style={{ width: 16, height: 16, color: '#6f7a74' }} />
                </button>
                {pages.map(page => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`w-8 h-8 rounded flex items-center justify-center text-sm font-semibold transition-colors ${
                            currentPage === page
                                ? 'text-white'
                                : 'border hover:bg-[#ebefeb]'
                        }`}
                        style={currentPage === page
                            ? { backgroundColor: '#0f6e56' }
                            : { borderColor: '#bec9c3', backgroundColor: '#ffffff', color: '#6f7a74' }
                        }
                    >
                        {page}
                    </button>
                ))}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded border hover:bg-[#ebefeb] disabled:opacity-50 transition-colors"
                    style={{ borderColor: '#bec9c3', backgroundColor: '#ffffff' }}
                >
                    <ChevronRightIcon style={{ width: 16, height: 16, color: '#6f7a74' }} />
                </button>
            </div>
        </div>
    );
};

/* ── Status Badge ── */
const StatusBadge = ({ status }) => {
    const statusMap = {
        paid: { label: 'Đã thu', bg: '#eef2ff', color: '#4f46e5' },
        pending: { label: 'Chờ duyệt', bg: '#fef3c7', color: '#d97706' },
        confirmed: { label: 'Chưa thu', bg: '#e5e9e5', color: '#6f7a74' },
        pending_approval: { label: 'Chờ duyệt', bg: '#fef3c7', color: '#d97706' },
        overdue: { label: 'Quá hạn', bg: '#fee2e2', color: '#dc2626' }
    };
    const s = statusMap[status] || { label: status, bg: '#e5e9e5', color: '#6f7a74' };

    return (
        <span
            className="px-3 py-1 rounded-full text-[11.5px] font-semibold"
            style={{ backgroundColor: s.bg, color: s.color }}
        >
            {s.label}
        </span>
    );
};

const FILTERS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'confirmed', label: 'Chưa thu' },
    { id: 'pending_approval', label: 'Chờ duyệt' },
    { id: 'paid', label: 'Đã thu' },
    { id: 'overdue', label: 'Quá hạn' },
];

const LandlordBills = () => {
    const navigate = useNavigate();
    const [bills, setBills] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, paid: 0, overdue: 0, totalRevenue: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        setLoading(true);
        api.get('/bills/landlord/list')
            .then(r => {
                setBills(r.data.bills || []);
                setStats(r.data.stats || { total: 0, pending: 0, confirmed: 0, paid: 0, overdue: 0, totalRevenue: 0 });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = bills.filter(b => {
        const matchesFilter = filter === 'all' ? true : b.status === filter;
        const matchesSearch = !searchTerm ||
            b.bill_id?.toString().includes(searchTerm) ||
            b.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const paginated = filtered.slice((currentPage - 1) * 10, currentPage * 10);
    const totalPagesCalc = Math.ceil(filtered.length / 10) || 1;

    const fmtVND = n => n?.toLocaleString('vi-VN') + ' đ';

    // Calculate stats for display
    const displayStats = {
        revenue: stats.totalRevenue || 0,
        pending: stats.pending + stats.confirmed || 0,
        paid: stats.paid || 0,
        overdue: stats.overdue || 0
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
            <div className="flex items-end justify-between mb-6">
                <div>
                    <p className="text-[11.5px] font-semibold uppercase tracking-wider text-[#6f7a74] mb-1">Tài chính</p>
                    <h1 className="text-[24px] font-semibold text-[#181d1a] leading-8">Hóa đơn</h1>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#4f46e5] text-sm font-semibold border hover:bg-[#4f46e5]/5 transition-colors"
                    style={{ borderColor: '#4f46e5' }}
                >
                    <Download style={{ width: 16, height: 16 }} />
                    Xuất báo cáo
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                    icon={Receipt}
                    iconBg="#e6f7f2"
                    iconColor="#0f6e56"
                    label="Tổng doanh thu"
                    value={fmtVND(displayStats.revenue)}
                    subtitle="+12.5% so với tháng trước"
                />
                <StatCard
                    icon={Clock}
                    iconBg="#fef3c7"
                    iconColor="#d97706"
                    label="Chờ duyệt"
                    value={`${displayStats.pending} hóa đơn`}
                    subtitle={`Tổng: ${fmtVND(displayStats.pending * 1500000)}`}
                />
                <StatCard
                    icon={CheckCircle}
                    iconBg="#eef2ff"
                    iconColor="#4f46e5"
                    label="Đã thu"
                    value={fmtVND(displayStats.paid * 1500000)}
                    subtitle="Đã hoàn thành 85% kế hoạch"
                />
                <StatCard
                    icon={TriangleAlert}
                    iconBg="#fee2e2"
                    iconColor="#dc2626"
                    label="Quá hạn"
                    value={fmtVND(displayStats.overdue * 2000000)}
                    subtitle={`${displayStats.overdue} hóa đơn trễ hạn`}
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-1 p-1 rounded-full" style={{ backgroundColor: '#ebefeb' }}>
                    {FILTERS.map(f => (
                        <FilterTab
                            key={f.id}
                            label={f.label}
                            active={filter === f.id}
                            onClick={() => { setFilter(f.id); setCurrentPage(1); }}
                        />
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#6f7a74' }} />
                        <input
                            type="text"
                            placeholder="Tìm mã hóa đơn..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none transition-all"
                            style={{ borderColor: '#bec9c3', backgroundColor: '#ffffff', width: 200 }}
                        />
                    </div>
                    <button
                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold border hover:bg-white transition-colors"
                        style={{ borderColor: '#bec9c3', color: '#3f4944' }}
                    >
                        <ListFilter style={{ width: 16, height: 16 }} />
                        Lọc nâng cao
                    </button>
                    <button
                        className="flex items-center gap-1 px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-all"
                        style={{ backgroundColor: '#0f6e56' }}
                    >
                        <Plus style={{ width: 16, height: 16 }} />
                        Tạo hóa đơn mới
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-[14px] overflow-hidden border" style={{ backgroundColor: '#ffffff', borderColor: '#bec9c3' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead style={{ backgroundColor: '#f8fafc' }}>
                            <tr className="border-b" style={{ borderColor: '#bec9c3' }}>
                                <th className="px-6 py-3 text-[11.5px] font-semibold text-[#6f7a74] uppercase tracking-wider">Mã & Phòng</th>
                                <th className="px-6 py-3 text-[11.5px] font-semibold text-[#6f7a74] uppercase tracking-wider">Kỳ hóa đơn</th>
                                <th className="px-6 py-3 text-[11.5px] font-semibold text-[#6f7a74] uppercase tracking-wider">Người thuê</th>
                                <th className="px-6 py-3 text-[11.5px] font-semibold text-[#6f7a74] uppercase tracking-wider">Tổng tiền</th>
                                <th className="px-6 py-3 text-[11.5px] font-semibold text-[#6f7a74] uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-[11.5px] font-semibold text-[#6f7a74] uppercase tracking-wider text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: '#bec9c3' }}>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <Loader style={{ width: 24, height: 24 }} className="animate-spin text-[#bec9c3] mx-auto" />
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <p className="text-sm font-semibold text-[#6f7a74]">Không có hóa đơn nào</p>
                                    </td>
                                </tr>
                            ) : paginated.map(bill => (
                                <tr
                                    key={bill.bill_id}
                                    className="hover:bg-[#f9fbfc] transition-colors cursor-pointer group"
                                    style={{ borderColor: '#bec9c3' }}
                                    onClick={() => navigate(`/landlord/bills/${bill.bill_id}`)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-xs text-[#6f7a74] tracking-tighter uppercase mb-0.5">
                                                INV-{new Date().getFullYear()}-{String(bill.bill_id).padStart(3, '0')}
                                            </span>
                                            <span className="font-bold text-[#181d1a]">Phòng {bill.room_number}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[#181d1a]">
                                                Tháng {new Date(bill.billing_month).getMonth() + 1}/{new Date(bill.billing_month).getFullYear()}
                                            </span>
                                            <span className="text-xs text-[#6f7a74]">Hạn: {new Date(bill.due_date).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-[#181d1a]">{bill.tenant_name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-semibold text-[#181d1a]">{fmtVND(bill.total_amount)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={bill.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/landlord/bills/${bill.bill_id}`); }}
                                            className="text-[#005440] text-sm font-semibold hover:underline decoration-2 underline-offset-4"
                                        >
                                            Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPagesCalc}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* FAB */}
            <button
                onClick={() => {}}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-50"
                style={{ backgroundColor: '#0f6e56', color: 'white' }}
            >
                <Plus style={{ width: 28, height: 28 }} />
            </button>
        </div>
    );
};

export default LandlordBills;
