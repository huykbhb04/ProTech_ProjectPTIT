import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Search, Loader, Plus, ChevronLeft, ChevronRight as ChevronRightIcon,
    FilePen, FileSpreadsheet, ScrollText, BadgeCheck, ArrowRight
} from 'lucide-react';
import contractService from '../../services/contractService';

/* ── Stat Card ── */
const StatCard = ({ icon: Icon, iconBg, iconColor, label, value }) => (
    <div
        className="bg-white rounded-xl border flex items-center gap-4 p-4"
        style={{ borderColor: '#bec9c3' }}
    >
        <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: iconBg }}
        >
            <Icon style={{ color: iconColor, width: 20, height: 20 }} />
        </div>
        <div>
            <p className="text-[11.5px] font-semibold text-[#3f4944] uppercase tracking-wider">{label}</p>
            <p className="text-[20px] font-bold text-[#181d1a]">{value}</p>
        </div>
    </div>
);

/* ── Filter Tab ── */
const FilterTab = ({ active, label, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            active
                ? 'bg-[#0f6e56] text-white'
                : 'text-[#3f4944] hover:bg-[#ebefeb]'
        }`}
    >
        {label}
    </button>
);

/* ── Status Badge ── */
const StatusBadge = ({ status }) => {
    const statusMap = {
        draft: { label: 'Bản nháp', bg: '#e5e9e5', color: '#6f7a74' },
        signed_by_tenant: { label: 'Chờ xác nhận', bg: '#e0e7ff', color: '#4338ca' },
        active: { label: 'Đang hoạt động', bg: '#dcfce7', color: '#15803d' },
        cancelled: { label: 'Đã từ chối', bg: '#fee2e2', color: '#dc2626' },
        terminated: { label: 'Đã hủy', bg: '#fee2e2', color: '#dc2626' },
        expired: { label: 'Hết hạn', bg: '#e5e9e5', color: '#6f7a74' }
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

/* ── Pagination ── */
const Pagination = ({ currentPage, totalPages, onPageChange }) => (
    <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: '#bec9c3', backgroundColor: '#f8fafc' }}>
        <span className="text-[11.5px] text-[#6f7a74]">Hiển thị 4 trên {totalPages} hợp đồng</span>
        <div className="flex items-center gap-1">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded hover:bg-[#ebefeb] disabled:opacity-30"
            >
                <ChevronLeft style={{ width: 16, height: 16, color: '#6f7a74' }} />
            </button>
            {[1, 2, 3].map(page => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`w-8 h-8 rounded text-[11.5px] font-bold flex items-center justify-center transition-colors ${
                        currentPage === page ? 'bg-[#0f6e56] text-white' : 'hover:bg-[#ebefeb]'
                    }`}
                >
                    {page}
                </button>
            ))}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded hover:bg-[#ebefeb] disabled:opacity-30"
            >
                <ChevronRightIcon style={{ width: 16, height: 16, color: '#6f7a74' }} />
            </button>
        </div>
    </div>
);

const FILTERS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'draft', label: 'Bản nháp' },
    { id: 'signed_by_tenant', label: 'Chờ ký' },
    { id: 'active', label: 'Đang hoạt động' },
];

const LandlordContracts = () => {
    const navigate = useNavigate();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const LIMIT = 10;

    useEffect(() => {
        contractService.getLandlordContracts()
            .then(setContracts)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = contracts.filter(c => {
        const matchFilter = filter === 'all' || c.status === filter;
        const q = search.toLowerCase();
        const matchSearch = !q ||
            c.tenant_name?.toLowerCase().includes(q) ||
            c.room_number?.toLowerCase().includes(q) ||
            c.building_name?.toLowerCase().includes(q);
        return matchFilter && matchSearch;
    });

    const totalPages = Math.ceil(filtered.length / LIMIT) || 1;
    const paginated = filtered.slice((currentPage - 1) * LIMIT, currentPage * LIMIT);

    const stats = {
        total: contracts.length,
        draft: contracts.filter(c => c.status === 'draft').length,
        pending: contracts.filter(c => c.status === 'signed_by_tenant').length,
        active: contracts.filter(c => c.status === 'active').length,
    };

    const handleLandlordAction = async (contractId, action) => {
        try {
            if (action === 'confirm') await contractService.landlordSign(contractId);
            if (action === 'reject') await contractService.landlordReject(contractId);
            if (action === 'cancel') await contractService.landlordCancel(contractId);
            const refreshed = await contractService.getLandlordContracts();
            setContracts(refreshed);
        } catch (error) {
            console.error(error);
        }
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
                    <p className="text-[11.5px] font-semibold uppercase tracking-wider text-[#6f7a74] mb-1">Pháp lý</p>
                    <h1 className="text-[24px] font-semibold text-[#181d1a] leading-8">Hợp đồng</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 rounded-lg border text-sm font-semibold hover:bg-[#ebefeb] transition-colors" style={{ borderColor: '#bec9c3', color: '#3f4944' }}>
                        Nạp tiền
                    </button>
                    <button
                        className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-all"
                        style={{ backgroundColor: '#0f6e56' }}
                    >
                        <Plus style={{ width: 16, height: 16, display: 'inline', marginRight: 4 }} />
                        Tạo hợp đồng mới
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                    icon={ScrollText}
                    iconBg="#e6f7f2"
                    iconColor="#0f6e56"
                    label="Tổng hợp đồng"
                    value={stats.total}
                />
                <StatCard
                    icon={FileSpreadsheet}
                    iconBg="#e5e9e5"
                    iconColor="#6f7a74"
                    label="Bản nháp"
                    value={stats.draft}
                />
                <StatCard
                    icon={FilePen}
                    iconBg="#e0e7ff"
                    iconColor="#4338ca"
                    label="Chờ ký"
                    value={stats.pending}
                />
                <StatCard
                    icon={BadgeCheck}
                    iconBg="#dcfce7"
                    iconColor="#15803d"
                    label="Đang hoạt động"
                    value={stats.active}
                />
            </div>

            {/* Filter & Search */}
            <div
                className="bg-white p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 mb-6"
                style={{ borderColor: '#bec9c3' }}
            >
                <div
                    className="flex items-center px-4 py-2 rounded-lg border w-full md:w-[400px]"
                    style={{ borderColor: '#bec9c3', backgroundColor: '#f1f4f1' }}
                >
                    <Search style={{ width: 16, height: 16, color: '#6f7a74', marginRight: 8 }} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên người thuê, số phòng..."
                        className="bg-transparent border-none outline-none text-sm w-full"
                        style={{ color: '#181d1a' }}
                        value={search}
                        onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    />
                </div>
                <div className="flex items-center gap-1 p-1 rounded-full" style={{ backgroundColor: '#f1f4f1' }}>
                    {FILTERS.map(f => (
                        <FilterTab
                            key={f.id}
                            label={f.label}
                            active={filter === f.id}
                            onClick={() => { setFilter(f.id); setCurrentPage(1); }}
                        />
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[14px] border overflow-hidden" style={{ borderColor: '#bec9c3' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead style={{ backgroundColor: '#f1f4f1' }}>
                            <tr className="border-b" style={{ borderColor: '#bec9c3' }}>
                                <th className="px-6 py-4 text-[14px] font-semibold text-[#3f4944] border-b" style={{ borderColor: '#bec9c3' }}>Mã hợp đồng</th>
                                <th className="px-6 py-4 text-[14px] font-semibold text-[#3f4944] border-b" style={{ borderColor: '#bec9c3' }}>Người thuê</th>
                                <th className="px-6 py-4 text-[14px] font-semibold text-[#3f4944] border-b" style={{ borderColor: '#bec9c3' }}>Phòng / Tòa nhà</th>
                                <th className="px-6 py-4 text-[14px] font-semibold text-[#3f4944] border-b" style={{ borderColor: '#bec9c3' }}>Thời hạn</th>
                                <th className="px-6 py-4 text-[14px] font-semibold text-[#3f4944] border-b" style={{ borderColor: '#bec9c3' }}>Trạng thái</th>
                                <th className="px-6 py-4 text-[14px] font-semibold text-[#3f4944] border-b text-right" style={{ borderColor: '#bec9c3' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: '#bec9c3' }}>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <Loader style={{ width: 24, height: 24, color: '#bec9c3' }} className="animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <p className="text-sm font-semibold text-[#6f7a74]">Không tìm thấy hợp đồng nào</p>
                                    </td>
                                </tr>
                            ) : paginated.map(c => (
                                    <tr
                                        key={c.contract_id}
                                        className="hover:bg-[#f9fbfc] transition-colors cursor-pointer"
                                        style={{ borderColor: '#bec9c3' }}
                                        onClick={() => navigate(`/landlord/contracts/${c.contract_id}`)}
                                    >
                                        <td className="px-6 py-4 font-medium" style={{ color: '#005440' }}>
                                            #{c.contract_id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#181d1a]">{c.tenant_name}</span>
                                                <span className="text-[11.5px] text-[#6f7a74]">{c.tenant_email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm" style={{ color: '#181d1a' }}>
                                            P.{c.room_number} - {c.building_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-sm">
                                                <span>{new Date(c.start_date).toLocaleDateString('vi-VN')}</span>
                                                <ArrowRight style={{ width: 14, height: 14, color: '#6f7a74' }} />
                                                <span style={{ color: c.status === 'expired' ? '#dc2626' : '#181d1a', fontWeight: c.status === 'expired' ? 500 : 400 }}>
                                                    {new Date(c.end_date).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={c.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {c.status === 'signed_by_tenant' && (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleLandlordAction(c.contract_id, 'confirm'); }}
                                                            className="px-3 py-1.5 rounded-lg text-[13px] font-bold text-white flex items-center gap-1 shadow-sm transition-all hover:opacity-90"
                                                            style={{ backgroundColor: '#0f6e56' }}
                                                        >
                                                            Xác nhận
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleLandlordAction(c.contract_id, 'reject'); }}
                                                            className="px-3 py-1.5 rounded-lg border text-[13px] font-semibold hover:border-red-500 hover:text-red-600 transition-all"
                                                            style={{ borderColor: '#fecaca', color: '#b91c1c' }}
                                                        >
                                                            Từ chối
                                                        </button>
                                                    </>
                                                )}
                                                {c.status === 'active' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleLandlordAction(c.contract_id, 'cancel'); }}
                                                        className="px-3 py-1.5 rounded-lg border text-[13px] font-semibold hover:border-red-500 hover:text-red-600 transition-all"
                                                        style={{ borderColor: '#fecaca', color: '#b91c1c' }}
                                                    >
                                                        Hủy hợp đồng
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/landlord/contracts/${c.contract_id}`); }}
                                                    className="px-3 py-1.5 rounded-lg border text-[13px] font-semibold hover:border-[#0f6e56] hover:text-[#0f6e56] transition-all"
                                                    style={{ borderColor: '#bec9c3', color: '#3f4944' }}
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
};

export default LandlordContracts;
