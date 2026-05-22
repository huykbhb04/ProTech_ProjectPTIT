import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getMyBuildings, createBuilding, reset } from '../../features/properties/propertySlice';
import {
    Plus, House, Home, MapPin, Loader, Building2, Search, Grid3x3, List,
    X, Pencil, Trash2, Eye, Bed, Layers, Sparkles
} from 'lucide-react';
import axios from 'axios';
import aiService from '../../services/aiService';
import LocationPicker from '../../components/LocationPicker';
import { toast } from 'react-hot-toast';

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
        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            active
                ? 'bg-white text-[#181d1a] shadow-sm'
                : 'text-[#3f4944] hover:bg-white/50'
        }`}
    >
        {label} {count !== undefined && <span className="ml-1 opacity-60">({count})</span>}
    </button>
);

/* ── Building Row ── */
const BuildingRow = ({ building, onEdit, onDelete, onView }) => (
    <tr
        className="border-b hover:bg-[#f9fbfc] transition-colors cursor-pointer group"
        style={{ borderColor: '#bec9c3' }}
        onClick={() => onView(building)}
    >
        <td className="px-6 py-4">
            <div className="flex items-center gap-3">
                <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: '#ebefeb' }}
                >
                    <Building2 style={{ color: '#0f6e56', width: 20, height: 20 }} />
                </div>
                <div>
                    <p className="font-bold text-[#181d1a]">{building.name}</p>
                    <p className="text-[11.5px] text-[#6f7a74] flex items-center gap-1">
                        <MapPin style={{ width: 10, height: 10 }} />
                        {building.address}
                    </p>
                </div>
            </div>
        </td>
        <td className="px-6 py-4">
            <span className="px-3 py-1 rounded-full text-[11.5px] font-semibold bg-[#e6f7f2] text-[#005440] capitalize">
                {building.type === 'apartment' ? 'Chung cư mini' : building.type === 'house' ? 'Nhà nguyên căn' : 'Phòng trọ lẻ'}
            </span>
        </td>
        <td className="px-6 py-4">
            <span className="text-[14px] font-semibold text-[#181d1a]">{building.total_floors || 1}</span>
            <span className="text-[11.5px] text-[#6f7a74] ml-1">tầng</span>
        </td>
        <td className="px-6 py-4">
            <div className="flex flex-col gap-1">
                <span className="px-3 py-1 rounded-full text-[11.5px] font-semibold bg-[#e6f7f2] text-[#005440] inline-flex w-fit">
                    {building.room_count || 0} phòng
                </span>
                <span className="text-[11px] text-[#6f7a74]">
                    Trống: {building.available_count || 0} · Đã thuê: {building.occupied_count || 0}
                </span>
            </div>
        </td>
        <td className="px-6 py-4">
            <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-[11.5px] font-semibold bg-[#dcfce7] text-[#16a34a]">
                    {building.occupied_count || 0} đã thuê
                </span>
                <span className="px-3 py-1 rounded-full text-[11.5px] font-semibold bg-[#fffbeb] text-[#f59e0b]">
                    {building.maintenance_count || 0} bảo trì
                </span>
            </div>
        </td>
        <td className="px-6 py-4 text-right">
            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); onView(building); }}
                    className="p-2 rounded-lg hover:bg-[#ebefeb] transition-colors"
                    title="Xem chi tiết"
                >
                    <Eye style={{ color: '#6f7a74', width: 16, height: 16 }} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(building); }}
                    className="p-2 rounded-lg hover:bg-[#ebefeb] transition-colors"
                    title="Chỉnh sửa"
                >
                    <Pencil style={{ color: '#6f7a74', width: 16, height: 16 }} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(building); }}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Xóa"
                >
                    <Trash2 style={{ color: '#ba1a1a', width: 16, height: 16 }} />
                </button>
            </div>
        </td>
    </tr>
);

/* ── Field Component ── */
const Field = ({ label, children }) => (
    <div>
        <label className="block text-[14px] font-semibold text-[#181d1a] mb-2">{label}</label>
        {children}
    </div>
);

/* ── Modal ── */
const BuildingModal = ({
    isOpen, onClose, onSubmit, loading,
    provinces, districts, wards,
    selProvince, selDistrict, selWard,
    setSelProvince, setSelDistrict, setSelWard,
    form, setForm, locLoading, onAI, aiLoading
}) => {
    if (!isOpen) return null;

    const inputCls = "w-full px-4 py-3 rounded-lg border text-[14px] focus:outline-none transition-all";
    const inputBorder = { borderColor: '#bec9c3', backgroundColor: '#ffffff' };
    const selectStyle = {
        ...inputBorder,
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236f7a74'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '16px',
        paddingRight: '40px'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div
                className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[14px] bg-white shadow-xl"
                style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4 border-b"
                    style={{ borderColor: '#bec9c3', backgroundColor: '#f7faf6' }}
                >
                    <div>
                        <p className="text-[11.5px] font-semibold text-[#6f7a74] uppercase tracking-wider">Mới</p>
                        <h2 className="text-[20px] font-semibold text-[#181d1a]">Thêm Tòa nhà</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#ebefeb] rounded-lg transition-colors">
                        <X style={{ color: '#6f7a74', width: 20, height: 20 }} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={onSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-5">
                    <Field label="Tên tòa nhà">
                        <input
                            type="text"
                            required
                            className={inputCls}
                            style={inputBorder}
                            placeholder="VD: Trọ Xanh House 1"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                        />
                    </Field>

                    {/* Address */}
                    <div className="p-4 rounded-lg space-y-3" style={{ backgroundColor: '#f7faf6' }}>
                        <p className="text-[14px] font-semibold text-[#181d1a] flex items-center gap-2">
                            <MapPin style={{ width: 14, height: 14, color: '#0f6e56' }} />
                            Địa chỉ
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            <select
                                className={inputCls}
                                style={selectStyle}
                                value={selProvince}
                                onChange={e => setSelProvince(e.target.value)}
                                required
                            >
                                <option value="">Tỉnh/Thành</option>
                                {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                            </select>
                            <select
                                className={inputCls}
                                style={selectStyle}
                                disabled={!selProvince}
                                value={selDistrict}
                                onChange={e => setSelDistrict(e.target.value)}
                                required
                            >
                                <option value="">Quận/Huyện</option>
                                {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                            </select>
                            <select
                                className={inputCls}
                                style={selectStyle}
                                disabled={!selDistrict}
                                value={selWard}
                                onChange={e => setSelWard(e.target.value)}
                                required
                            >
                                <option value="">Phường/Xã</option>
                                {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                            </select>
                        </div>
                        {locLoading && <p className="text-[11.5px] text-[#0f6e56] font-semibold">Đang tải...</p>}
                        <input
                            type="text"
                            required
                            className={inputCls}
                            style={{ ...inputBorder, backgroundColor: '#ffffff' }}
                            placeholder="Số nhà, tên đường..."
                            value={form.detailAddress}
                            onChange={e => setForm({ ...form, detailAddress: e.target.value })}
                        />
                    </div>

                    {/* Map Picker */}
                    <Field label="Vị trí bản đồ">
                        <LocationPicker
                            position={form.coordinates}
                            onLocationChange={latlng => setForm({ ...form, coordinates: latlng })}
                        />
                        {form.coordinates && (
                            <p className="text-[11.5px] text-[#0f6e56] font-semibold mt-1">
                                ✓ Đã chọn: {form.coordinates.lat.toFixed(6)}, {form.coordinates.lng.toFixed(6)}
                            </p>
                        )}
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Loại hình">
                            <select
                                className={inputCls}
                                style={selectStyle}
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}
                            >
                                <option value="apartment">Chung cư mini</option>
                                <option value="house">Nhà nguyên căn</option>
                                <option value="room">Phòng trọ lẻ</option>
                            </select>
                        </Field>
                        <Field label="Số tầng">
                            <input
                                type="number"
                                min="1"
                                className={inputCls}
                                style={inputBorder}
                                value={form.totalFloors}
                                onChange={e => setForm({ ...form, totalFloors: parseInt(e.target.value) })}
                            />
                        </Field>
                    </div>

                    {/* Description with AI */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-[14px] font-semibold text-[#181d1a]">Mô tả</label>
                            <button
                                type="button"
                                onClick={onAI}
                                disabled={aiLoading}
                                className="flex items-center gap-1 text-[#0f6e56] text-[11.5px] font-semibold hover:underline disabled:opacity-50"
                            >
                                {aiLoading ? (
                                    <Loader style={{ width: 12, height: 12 }} className="animate-spin" />
                                ) : (
                                    <Sparkles style={{ width: 12, height: 12 }} />
                                )}
                                AI Gợi ý
                            </button>
                        </div>
                        <textarea
                            className={`${inputCls} resize-none`}
                            style={{ ...inputBorder, height: '100px' }}
                            placeholder="Mô tả về tòa nhà..."
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 pt-4 border-t" style={{ borderColor: '#bec9c3' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-lg border font-semibold text-[#3f4944] hover:bg-[#ebefeb] transition-colors"
                            style={{ borderColor: '#bec9c3' }}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#0f6e56' }}
                        >
                            {loading ? (
                                <Loader style={{ width: 16, height: 16 }} className="animate-spin" />
                            ) : (
                                <Plus style={{ width: 16, height: 16 }} />
                            )}
                            Tạo tòa nhà
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ── Main Component ── */
const PropertyList = () => {
    const dispatch = useDispatch();
    const { buildings, isLoading, isError, message } = useSelector(s => s.properties);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table');

    const [form, setForm] = useState({
        name: '', type: 'apartment', totalFloors: 1, description: '', detailAddress: '', coordinates: null
    });
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [selProvince, setSelProvince] = useState('');
    const [selDistrict, setSelDistrict] = useState('');
    const [selWard, setSelWard] = useState('');
    const [locLoading, setLocLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        dispatch(getMyBuildings());
        return () => dispatch(reset());
    }, [dispatch]);

    useEffect(() => {
        axios.get('https://provinces.open-api.vn/api/?depth=1')
            .then(r => setProvinces(r.data))
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!selProvince) { setDistricts([]); setWards([]); return; }
        setLocLoading(true);
        axios.get(`https://provinces.open-api.vn/api/p/${selProvince}?depth=2`)
            .then(r => { setDistricts(r.data.districts); setSelDistrict(''); setWards([]); })
            .catch(console.error)
            .finally(() => setLocLoading(false));
    }, [selProvince]);

    useEffect(() => {
        if (!selDistrict) { setWards([]); return; }
        setLocLoading(true);
        axios.get(`https://provinces.open-api.vn/api/d/${selDistrict}?depth=2`)
            .then(r => { setWards(r.data.wards); setSelWard(''); })
            .catch(console.error)
            .finally(() => setLocLoading(false));
    }, [selDistrict]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const pName = provinces.find(p => p.code == selProvince)?.name || '';
        const dName = districts.find(d => d.code == selDistrict)?.name || '';
        const wName = wards.find(w => w.code == selWard)?.name || '';
        if (!pName || !dName || !wName || !form.detailAddress) {
            toast.error('Vui lòng nhập đầy đủ địa chỉ!');
            return;
        }
        dispatch(createBuilding({
            ...form,
            address: `${form.detailAddress}, ${wName}, ${dName}, ${pName}`,
            coordinates: form.coordinates ? JSON.stringify(form.coordinates) : null
        }));
        setShowModal(false);
        setForm({ name: '', type: 'apartment', totalFloors: 1, description: '', detailAddress: '', coordinates: null });
        setSelProvince(''); setSelDistrict(''); setSelWard('');
    };

    const handleAI = async () => {
        if (!form.name || !form.detailAddress) { toast.error('Nhập tên và địa chỉ trước!'); return; }
        setAiLoading(true);
        try {
            const pName = provinces.find(p => p.code == selProvince)?.name || '';
            const dName = districts.find(d => d.code == selDistrict)?.name || '';
            const res = await aiService.generateDescription({
                title: form.name, price: 0, area: 0,
                location: `${form.detailAddress}, ${dName}, ${pName}`,
                amenities: [form.type], type: 'Tòa nhà'
            });
            if (res.description) setForm(prev => ({ ...prev, description: res.description }));
        } catch (e) {
            toast.error('Lỗi AI: ' + e.message);
        } finally {
            setAiLoading(false);
        }
    };

    const handleDelete = (building) => {
        toast.error('Chức năng xóa đang phát triển');
    };

    const handleEdit = (building) => {
        toast.error('Chức năng sửa đang phát triển');
    };

    const handleView = (building) => {
        window.location.href = `/landlord/properties/${building.building_id}`;
    };

    // Calculate stats from database-backed fields
    const stats = {
        total: buildings.length,
        totalRooms: buildings.reduce((sum, b) => sum + Number(b.room_count || 0), 0),
        occupied: buildings.reduce((sum, b) => sum + Number(b.occupied_count || 0), 0),
        vacant: buildings.reduce((sum, b) => sum + Number(b.available_count || 0), 0),
        deposited: buildings.reduce((sum, b) => sum + Number(b.deposited_count || 0), 0),
        maintenance: buildings.reduce((sum, b) => sum + Number(b.maintenance_count || 0), 0),
    };

    const filteredBuildings = buildings.filter(b => {
        const matchesSearch = b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.address?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || b.type === filter;
        return matchesSearch && matchesFilter;
    });

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
                    <p className="text-[11.5px] font-semibold uppercase tracking-wider text-[#6f7a74] mb-1">Bất động sản</p>
                    <h1 className="text-[24px] font-semibold text-[#181d1a] leading-8">Tòa nhà & Phòng</h1>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-all"
                    style={{ backgroundColor: '#0f6e56' }}
                >
                    <Plus style={{ width: 16, height: 16 }} />
                    Thêm tòa nhà
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                    icon={Building2}
                    iconBg="#e6f7f2"
                    iconColor="#0f6e56"
                    label="Tổng tòa nhà"
                    value={stats.total}
                    subtitle="Đang quản lý"
                />
                <StatCard
                    icon={Layers}
                    iconBg="#eef2ff"
                    iconColor="#4f46e5"
                    label="Tổng phòng"
                    value={stats.totalRooms}
                    subtitle="Phòng trọ"
                />
                <StatCard
                    icon={Bed}
                    iconBg="#dcfce7"
                    iconColor="#16a34a"
                    label="Đã cho thuê"
                    value={stats.occupied}
                    subtitle="Đang hoạt động"
                />
                <StatCard
                    icon={Home}
                    iconBg="#fffbeb"
                    iconColor="#f59e0b"
                    label="Còn trống"
                    value={stats.vacant}
                    subtitle="Sẵn sàng cho thuê"
                />
                <StatCard
                    icon={Layers}
                    iconBg="#fef3c7"
                    iconColor="#b45309"
                    label="Đang bảo trì"
                    value={stats.maintenance}
                    subtitle="Tạm thời khóa phòng"
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-1 p-1 rounded-full" style={{ backgroundColor: '#ebefeb' }}>
                    <FilterTab label="Tất cả" active={filter === 'all'} onClick={() => setFilter('all')} count={buildings.length} />
                    <FilterTab label="Căn hộ" active={filter === 'apartment'} onClick={() => setFilter('apartment')} />
                    <FilterTab label="Nhà nguyên căn" active={filter === 'house'} onClick={() => setFilter('house')} />
                    <FilterTab label="Phòng trọ" active={filter === 'room'} onClick={() => setFilter('room')} />
                </div>
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#6f7a74' }} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none transition-all"
                            style={{ borderColor: '#bec9c3', backgroundColor: '#ffffff', width: 200 }}
                        />
                    </div>
                    {/* View Toggle */}
                    <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: '#bec9c3' }}>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 transition-colors ${viewMode === 'table' ? 'text-white' : 'bg-white text-[#6f7a74] hover:bg-[#ebefeb]'}`}
                            style={viewMode === 'table' ? { backgroundColor: '#0f6e56' } : {}}
                        >
                            <List style={{ width: 16, height: 16 }} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 transition-colors ${viewMode === 'grid' ? 'text-white' : 'bg-white text-[#6f7a74] hover:bg-[#ebefeb]'}`}
                            style={viewMode === 'grid' ? { backgroundColor: '#0f6e56' } : {}}
                        >
                            <Grid3x3 style={{ width: 16, height: 16 }} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader style={{ width: 24, height: 24 }} className="animate-spin text-[#bec9c3]" />
                </div>
            ) : filteredBuildings.length === 0 ? (
                <div
                    className="flex flex-col items-center justify-center py-20 rounded-[14px] border border-dashed cursor-pointer hover:border-[#0f6e56]/30 transition-colors"
                    style={{ borderColor: '#bec9c3' }}
                    onClick={() => setShowModal(true)}
                >
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                        style={{ backgroundColor: '#ebefeb' }}
                    >
                        <House style={{ width: 28, height: 28, color: '#bec9c3' }} />
                    </div>
                    <p className="text-[14px] font-semibold text-[#6f7a74]">Chưa có tòa nhà nào</p>
                    <p className="text-[11.5px] text-[#6f7a74] mt-1">Bấm để thêm tòa nhà đầu tiên</p>
                </div>
            ) : (
                <div
                    className="rounded-[14px] overflow-hidden border"
                    style={{ backgroundColor: '#ffffff', borderColor: '#bec9c3' }}
                >
                    <table className="w-full text-left">
                        <thead style={{ backgroundColor: '#f8fafc' }}>
                            <tr className="border-b" style={{ borderColor: '#bec9c3' }}>
                                <th className="px-6 py-3 text-[11.5px] font-semibold text-[#6f7a74] uppercase tracking-wider">Tòa nhà</th>
                                <th className="px-6 py-3 text-[11.5px] font-semibold text-[#6f7a74] uppercase tracking-wider">Loại hình</th>
                                <th className="px-6 py-3 text-[11.5px] font-semibold text-[#6f7a74] uppercase tracking-wider">Số tầng</th>
                                <th className="px-6 py-3 text-[11.5px] font-semibold text-[#6f7a74] uppercase tracking-wider">Phòng</th>
                                <th className="px-6 py-3 text-[11.5px] font-semibold text-[#6f7a74] uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-[11.5px] font-semibold text-[#6f7a74] uppercase tracking-wider text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: '#bec9c3' }}>
                            {filteredBuildings.map(building => (
                                <BuildingRow
                                    key={building.building_id}
                                    building={building}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onView={handleView}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* FAB */}
            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-50"
                style={{ backgroundColor: '#0f6e56', color: 'white' }}
            >
                <Plus style={{ width: 28, height: 28 }} />
            </button>

            {/* Modal */}
            <BuildingModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleSubmit}
                loading={isLoading}
                building={null}
                provinces={provinces}
                districts={districts}
                wards={wards}
                selProvince={selProvince}
                selDistrict={selDistrict}
                selWard={selWard}
                setSelProvince={setSelProvince}
                setSelDistrict={setSelDistrict}
                setSelWard={setSelWard}
                form={form}
                setForm={setForm}
                locLoading={locLoading}
                onAI={handleAI}
                aiLoading={aiLoading}
            />
        </div>
    );
};

export default PropertyList;
