import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Package,
    Star,
    Plus,
    Pencil,
    Trash2,
    Power,
    Save,
    X,
    DollarSign,
    Loader,
    Settings,
    Clock3,
    CircleCheck,
    CircleAlert,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import adminService from '../../services/adminService';

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(amount || 0));

const PREMIUM_SERVICE_MATRIX = [
    { label: 'Giá 5 ngày', vipSpotlight: 60000, vip1: 50000, vip2: 25000, normal: 0 },
    { label: 'Giá 10 ngày', vipSpotlight: 120000, vip1: 100000, vip2: 50000, normal: 0 },
    { label: 'Giá 15 ngày', vipSpotlight: 180000, vip1: 150000, vip2: 75000, normal: 0 },
    { label: 'Giá 30 ngày', vipSpotlight: 288000, vip1: 240000, vip2: 120000, normal: 0, badge: 'Giảm 20%' },
    { label: 'Giá đẩy tin', vipSpotlight: 0, vip1: 2000, vip2: 2000, normal: null },
    { label: 'Màu sắc tiêu đề', vipSpotlight: 'Màu đỏ, in hoa, đậm', vip1: 'Màu hồng, in hoa, đậm', vip2: 'Màu cam, in hoa, đậm', normal: 'Mặc định, viết thường' },
    { label: 'Kích thước tin', vipSpotlight: 'Rất lớn', vip1: 'Lớn', vip2: 'Trung bình', normal: 'Nhỏ' },
    { label: 'Tự động duyệt (*)', vipSpotlight: true, vip1: true, vip2: true, normal: false },
    { label: 'Duy trì thêm 10 ngày tin thường', vipSpotlight: true, vip1: true, vip2: true, normal: false },
    { label: 'Hiển thị nút gọi điện', vipSpotlight: true, vip1: true, vip2: true, normal: true },
];

const Card = ({ title, subtitle, children, action }) => (
    <div className="rounded-[14px] border border-[#e2e8f0] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4">
            <div>
                <h3 className="text-[20px] font-semibold text-[#0b1c30]">{title}</h3>
                {subtitle && <p className="mt-1 text-[14px] text-[#5c403c]">{subtitle}</p>}
            </div>
            {action}
        </div>
        {children}
    </div>
);

const MonetizationSettings = () => {
    const { token } = useSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState('packages');
    const [packages, setPackages] = useState([]);
    const [services, setServices] = useState([]);
    const [systemConfigs, setSystemConfigs] = useState({});
    const [pricing, setPricing] = useState(PREMIUM_SERVICE_MATRIX);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({});

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pkgs, svcs, configs] = await Promise.all([
                adminService.getAllPackages(token),
                adminService.getAllPremiumServices(token),
                adminService.getSystemConfigs(token),
            ]);
            setPackages(Array.isArray(pkgs) ? pkgs : []);
            setServices(Array.isArray(svcs) ? svcs : []);
            setSystemConfigs(configs || {});
            setPricing(configs?.monetization_pricing?.rows?.length ? configs.monetization_pricing.rows : PREMIUM_SERVICE_MATRIX);
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải dữ liệu cấu hình.');
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => ({
        packageCount: packages.length,
        serviceCount: services.length,
        activePackages: packages.filter((p) => p.is_active).length,
    }), [packages, services]);

    const handleCreatePackage = async () => { try { await adminService.createPackage(createForm, token); toast.success('Đã tạo gói tin'); setShowCreateModal(false); setCreateForm({}); await fetchData(); } catch { toast.error('Lỗi tạo gói tin'); } };
    const handleCreateService = async () => { try { await adminService.createPremiumService(createForm, token); toast.success('Đã tạo dịch vụ'); setShowCreateModal(false); setCreateForm({}); await fetchData(); } catch { toast.error('Lỗi tạo dịch vụ'); } };
    const handleSavePackage = async () => { try { await adminService.updatePackage(editingId, editForm, token); toast.success('Đã cập nhật gói tin'); setEditingId(null); setEditForm({}); await fetchData(); } catch { toast.error('Lỗi cập nhật gói tin'); } };
    const handleSaveService = async () => { try { await adminService.updatePremiumService(editingId, editForm, token); toast.success('Đã cập nhật dịch vụ'); setEditingId(null); setEditForm({}); await fetchData(); } catch { toast.error('Lỗi cập nhật dịch vụ'); } };

    const handleTogglePackage = async (id) => { try { await adminService.togglePackageStatus(id, token); await fetchData(); } catch { toast.error('Lỗi cập nhật trạng thái gói'); } };
    const handleToggleService = async (id) => { try { await adminService.toggleServiceStatus(id, token); await fetchData(); } catch { toast.error('Lỗi cập nhật trạng thái dịch vụ'); } };
    const handleDeletePackage = async (id) => { if (!confirm('Bạn có chắc muốn xóa gói tin này?')) return; try { await adminService.deletePackage(id, token); await fetchData(); } catch { toast.error('Lỗi xóa gói tin'); } };
    const handleDeleteService = async (id) => { if (!confirm('Bạn có chắc muốn xóa dịch vụ này?')) return; try { await adminService.deleteService(id, token); await fetchData(); } catch { toast.error('Lỗi xóa dịch vụ'); } };


    const handleUpdateConfig = async (key, value) => { try { await adminService.updateSystemConfig({ key, value }, token); toast.success('Cập nhật cấu hình thành công!'); await fetchData(); } catch { toast.error('Lỗi cập nhật cấu hình!'); } };
    const updatePricingCell = (rowId, field, value) => {
        setPricing((prev) => prev.map((row) => row.id === rowId ? { ...row, [field]: value } : row));
    };
    const handleSavePricing = async () => {
        await handleUpdateConfig('monetization_pricing', { rows: pricing });
    };
    const currencyInput = (v) => Number(String(v).replace(/[^\d.-]/g, '') || 0);

    if (loading) return <div className="flex min-h-[400px] items-center justify-center"><Loader size={24} className="animate-spin text-gray-300" /></div>;

    return (
        <div className="min-h-screen bg-[#f8f9ff] pb-20" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
            <div className="space-y-5">
                <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-8 shadow-sm">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                        <div>
                            <h1 className="text-[30px] font-bold leading-[38px] tracking-[-0.02em] text-[#0b1c30]">Cài đặt tiền tệ</h1>
                            <p className="mt-1 text-[16px] text-[#5c403c]">Quản lý gói tin, dịch vụ VIP, tiền cọc và cấu hình hệ thống.</p>
                        </div>
                        {activeTab !== 'system' && activeTab !== 'deposits' && (
                            <button onClick={() => { setShowCreateModal(true); setCreateForm({}); }} className="flex items-center gap-2 rounded-lg bg-[#dc2626] px-4 py-3 text-[14px] font-semibold text-white shadow-sm hover:bg-[#b91c1c]">
                                <Plus size={14} /> Thêm mới
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    {[
                        { id: 'packages', label: `Gói tin (${stats.packageCount})`, icon: Package },
                        { id: 'services', label: `Dịch vụ VIP (${stats.serviceCount})`, icon: Star },
                        { id: 'system', label: 'Cài đặt chung', icon: Settings },
                    ].map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[14px] font-semibold transition-all ${activeTab === id ? 'bg-[#dc2626] text-white shadow-md' : 'bg-[#eff4ff] text-[#5c403c] hover:bg-[#e5eeff]'}`}>
                            <Icon size={16} /> {label}
                        </button>
                    ))}
                </div>

                {activeTab === 'packages' && (
                    <Card title="Danh sách gói tin" subtitle="Thiết lập giá, thời hạn và trạng thái hoạt động">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#f8f9ff] text-[10px] font-black uppercase tracking-[0.16em] text-[#5c403c]"><tr><th className="px-6 py-4">Tên gói</th><th className="px-6 py-4">Thời hạn</th><th className="px-6 py-4">Giá</th><th className="px-6 py-4">Mô tả</th><th className="px-6 py-4 text-center">Trạng thái</th><th className="px-6 py-4 text-right">Thao tác</th></tr></thead>
                                <tbody className="divide-y divide-[#e2e8f0]">
                                    {packages.map((pkg) => (
                                        <tr key={pkg.package_id} className="hover:bg-[#fef2f2]">
                                            <td className="px-6 py-4">{editingId === pkg.package_id ? <input value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded-lg border border-[#e6bdb8] px-3 py-2 text-sm" /> : <span className="font-bold text-[#0b1c30]">{pkg.name}</span>}</td>
                                            <td className="px-6 py-4">{editingId === pkg.package_id ? <input type="number" value={editForm.duration_days || 0} onChange={(e) => setEditForm({ ...editForm, duration_days: Number(e.target.value) })} className="w-24 rounded-lg border border-[#e6bdb8] px-3 py-2 text-sm" /> : <span className="text-[#5c403c]">{pkg.duration_days} ngày</span>}</td>
                                            <td className="px-6 py-4">{editingId === pkg.package_id ? <input type="number" value={editForm.price || 0} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} className="w-32 rounded-lg border border-[#e6bdb8] px-3 py-2 text-sm" /> : <span className="font-bold text-[#dc2626]">{formatCurrency(pkg.price)}</span>}</td>
                                            <td className="px-6 py-4">{editingId === pkg.package_id ? <input value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full rounded-lg border border-[#e6bdb8] px-3 py-2 text-sm" /> : <span className="text-sm text-[#5c403c]">{pkg.description}</span>}</td>
                                            <td className="px-6 py-4 text-center"><button onClick={() => handleTogglePackage(pkg.package_id)} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${pkg.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-100 text-gray-500'}`}><Power size={12} />{pkg.is_active ? 'Active' : 'Inactive'}</button></td>
                                            <td className="px-6 py-4"><div className="flex justify-end gap-2">{editingId === pkg.package_id ? <><button onClick={handleSavePackage} className="rounded-lg bg-[#dc2626] p-2 text-white"><Save size={18} /></button><button onClick={() => { setEditingId(null); setEditForm({}); }} className="rounded-lg border border-[#e6bdb8] p-2 text-[#5c403c]"><X size={18} /></button></> : <><button onClick={() => { setEditingId(pkg.package_id); setEditForm(pkg); }} className="rounded-lg border border-[#e6bdb8] p-2 text-[#5c403c]"><Pencil size={18} /></button><button onClick={() => handleDeletePackage(pkg.package_id)} className="rounded-lg border border-[#e6bdb8] p-2 text-[#5c403c]"><Trash2 size={18} /></button></>}</div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeTab === 'services' && (
                    <Card title="Bảng giá dịch vụ VIP" subtitle="Chỉnh sửa và lưu trực tiếp vào cấu hình hệ thống">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#e2e8f0]">
                                <thead>
                                    <tr className="text-white">
                                        <th className="bg-white px-5 py-5 text-left text-[13px] font-bold text-[#0b1c30]">Dịch vụ</th>
                                        <th className="bg-[#ef4444] px-5 py-5 text-center text-[15px] font-black uppercase tracking-wide">Tin VIP nổi bật</th>
                                        <th className="bg-[#ec4899] px-5 py-5 text-center text-[15px] font-black uppercase tracking-wide">Tin VIP 1</th>
                                        <th className="bg-[#f97316] px-5 py-5 text-center text-[15px] font-black uppercase tracking-wide">Tin VIP 2</th>
                                        <th className="bg-[#2563eb] px-5 py-5 text-center text-[15px] font-black uppercase tracking-wide">Tin thường</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pricing.map((row, index) => (
                                        <tr key={row.id || row.label} className={index % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                                            <td className="border-t border-[#e2e8f0] px-5 py-4 text-[14px] font-semibold text-[#0b1c30]">{row.label}</td>
                                            {['vipSpotlight', 'vip1', 'vip2', 'normal'].map((field, fieldIndex) => {
                                                const editable = !(row.label.includes('Màu sắc') || row.label.includes('Kích thước') || row.label.includes('Tự động duyệt') || row.label.includes('Duy trì thêm') || row.label.includes('Hiển thị nút gọi điện'));
                                                const raw = row[field];
                                                return (
                                                    <td key={field} className="border-t border-[#e2e8f0] px-5 py-4 text-center">
                                                        {editable ? (
                                                            <input
                                                                type="number"
                                                                value={raw ?? ''}
                                                                onChange={(e) => updatePricingCell(row.id, field, e.target.value === '' ? '' : currencyInput(e.target.value))}
                                                                className="w-full rounded-lg border border-[#dbe3ee] bg-white px-3 py-2 text-center text-[14px] font-bold text-[#0b1c30] outline-none focus:border-[#dc2626]"
                                                                placeholder={field === 'normal' && row.label.includes('Giá đẩy') ? 'Không khả dụng' : '0'}
                                                            />
                                                        ) : (
                                                            <div className="text-[14px] font-bold text-[#0b1c30]">
                                                                {typeof raw === 'number' ? (raw === 0 ? 'Miễn phí' : formatCurrency(raw)) : raw === true ? <span className="text-emerald-600">✓</span> : raw === false ? <span className="text-red-500">✕</span> : raw}
                                                            </div>
                                                        )}
                                                        {row.badge && fieldIndex === 2 && <div className="mt-1 text-[11px] font-black text-emerald-600">{row.badge}</div>}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-5">
                            <button onClick={handleSavePricing} className="rounded-lg bg-[#dc2626] px-5 py-3 text-[14px] font-semibold text-white shadow-sm hover:bg-[#b91c1c]">
                                <Save size={16} className="mr-2 inline" /> Lưu bảng giá
                            </button>
                        </div>
                    </Card>
                )}



                {activeTab === 'system' && (
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                        <Card title="Tiền tệ mặc định" subtitle="Thiết lập đơn vị tiền tệ và ký hiệu hiển thị">
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em] text-[#5c403c]">Mã tiền tệ</label>
                                    <div className="flex">
                                        <input value={systemConfigs.currency_code || 'VND'} onChange={(e) => setSystemConfigs((prev) => ({ ...prev, currency_code: e.target.value }))} className="flex-1 rounded-l-lg border border-[#e6bdb8] bg-white px-4 py-3 outline-none focus:border-[#dc2626]" type="text" />
                                        <span className="flex items-center rounded-r-lg border border-l-0 border-[#e6bdb8] bg-[#eff4ff] px-4 font-semibold text-[#5c403c]">₫</span>
                                    </div>
                                </div>
                                <button onClick={() => handleUpdateConfig('currency_code', systemConfigs.currency_code || 'VND')} className="flex items-center gap-2 rounded-lg bg-[#dc2626] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#b91c1c]">
                                    <Save className="h-4 w-4" /> Lưu thay đổi
                                </button>
                            </div>
                        </Card>

                        <Card title="Tự động gia hạn" subtitle="Thông báo trước khi gói tin hết hạn">
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em] text-[#5c403c]">Ngày thông báo</label>
                                    <div className="flex">
                                        <input value={systemConfigs.renewal_notice_days || 3} onChange={(e) => setSystemConfigs((prev) => ({ ...prev, renewal_notice_days: e.target.value }))} className="flex-1 rounded-l-lg border border-[#e6bdb8] bg-white px-4 py-3 outline-none focus:border-[#dc2626]" type="number" />
                                        <span className="flex items-center rounded-r-lg border border-l-0 border-[#e6bdb8] bg-[#eff4ff] px-4 font-semibold text-[#5c403c]">Ngày</span>
                                    </div>
                                </div>
                                <button onClick={() => handleUpdateConfig('renewal_notice_days', Number(systemConfigs.renewal_notice_days || 3))} className="flex items-center gap-2 rounded-lg bg-[#dc2626] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#b91c1c]">
                                    <Save className="h-4 w-4" /> Cập nhật
                                </button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
                    <div className="relative w-full max-w-lg overflow-hidden rounded-[16px] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-[#f8f9ff] px-6 py-4">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5c403c]">Tạo mới</p>
                                <h3 className="text-[20px] font-bold text-[#0b1c30]">Thêm cấu hình monetization</h3>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-2 hover:bg-[#eff4ff]"><X className="h-5 w-5 text-[#5c403c]" /></button>
                        </div>
                        <div className="space-y-4 p-6">
                            <input value={createForm.name || ''} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Tên" className="w-full rounded-lg border border-[#e6bdb8] px-4 py-3 outline-none focus:border-[#dc2626]" />
                            <input value={createForm.description || ''} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Mô tả" className="w-full rounded-lg border border-[#e6bdb8] px-4 py-3 outline-none focus:border-[#dc2626]" />
                            <input value={createForm.price || ''} onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })} placeholder="Giá" className="w-full rounded-lg border border-[#e6bdb8] px-4 py-3 outline-none focus:border-[#dc2626]" />
                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={() => setShowCreateModal(false)} className="rounded-lg border border-[#e6bdb8] px-4 py-3 text-[14px] font-semibold text-[#5c403c]">Hủy</button>
                                <button onClick={activeTab === 'packages' ? handleCreatePackage : handleCreateService} className="rounded-lg bg-[#dc2626] px-4 py-3 text-[14px] font-semibold text-white">Lưu</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonetizationSettings;
