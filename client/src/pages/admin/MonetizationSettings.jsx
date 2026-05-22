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
    const [deposits, setDeposits] = useState([]);
    const [systemConfigs, setSystemConfigs] = useState({});
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({});

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pkgs, svcs, configs, deps] = await Promise.all([
                adminService.getAllPackages(token),
                adminService.getAllPremiumServices(token),
                adminService.getSystemConfigs(token),
                adminService.getAllBookingDeposits(token),
            ]);
            setPackages(Array.isArray(pkgs) ? pkgs : []);
            setServices(Array.isArray(svcs) ? svcs : []);
            setSystemConfigs(configs || {});
            setDeposits(Array.isArray(deps) ? deps : []);
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
        depositCount: deposits.length,
        activePackages: packages.filter((p) => p.is_active).length,
    }), [packages, services, deposits]);

    const handleCreatePackage = async () => { try { await adminService.createPackage(createForm, token); toast.success('Đã tạo gói tin'); setShowCreateModal(false); setCreateForm({}); await fetchData(); } catch { toast.error('Lỗi tạo gói tin'); } };
    const handleCreateService = async () => { try { await adminService.createPremiumService(createForm, token); toast.success('Đã tạo dịch vụ'); setShowCreateModal(false); setCreateForm({}); await fetchData(); } catch { toast.error('Lỗi tạo dịch vụ'); } };
    const handleSavePackage = async () => { try { await adminService.updatePackage(editingId, editForm, token); toast.success('Đã cập nhật gói tin'); setEditingId(null); setEditForm({}); await fetchData(); } catch { toast.error('Lỗi cập nhật gói tin'); } };
    const handleSaveService = async () => { try { await adminService.updatePremiumService(editingId, editForm, token); toast.success('Đã cập nhật dịch vụ'); setEditingId(null); setEditForm({}); await fetchData(); } catch { toast.error('Lỗi cập nhật dịch vụ'); } };

    const handleTogglePackage = async (id) => { try { await adminService.togglePackageStatus(id, token); await fetchData(); } catch { toast.error('Lỗi cập nhật trạng thái gói'); } };
    const handleToggleService = async (id) => { try { await adminService.toggleServiceStatus(id, token); await fetchData(); } catch { toast.error('Lỗi cập nhật trạng thái dịch vụ'); } };
    const handleDeletePackage = async (id) => { if (!confirm('Bạn có chắc muốn xóa gói tin này?')) return; try { await adminService.deletePackage(id, token); await fetchData(); } catch { toast.error('Lỗi xóa gói tin'); } };
    const handleDeleteService = async (id) => { if (!confirm('Bạn có chắc muốn xóa dịch vụ này?')) return; try { await adminService.deleteService(id, token); await fetchData(); } catch { toast.error('Lỗi xóa dịch vụ'); } };

    const handleConfirmPayment = async (bookingId) => { if (!confirm('Xác nhận đã nhận được tiền cọc cho yêu cầu này?')) return; try { await adminService.confirmBookingPayment(bookingId, token); toast.success('Xác nhận thanh toán thành công!'); await fetchData(); } catch (error) { toast.error(error.response?.data?.message || 'Lỗi xác nhận thanh toán'); } };
    const handlePayout = async (bookingId) => { if (!confirm('Thực hiện thanh toán tiền cọc cho chủ trọ?')) return; try { await adminService.payoutLandlord(bookingId, token); toast.success('Thanh toán cho chủ trọ thành công!'); await fetchData(); } catch (error) { toast.error(error.response?.data?.message || 'Lỗi thanh toán cho chủ trọ'); } };
    const handleUpdateConfig = async (key, value) => { try { await adminService.updateSystemConfig({ key, value }, token); toast.success('Cập nhật cấu hình thành công!'); await fetchData(); } catch { toast.error('Lỗi cập nhật cấu hình!'); } };

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
                        { id: 'deposits', label: `Quản lý cọc (${stats.depositCount})`, icon: DollarSign },
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
                    <Card title="Danh sách dịch vụ VIP" subtitle="Cấu hình dịch vụ cao cấp và kích hoạt nhanh">
                        <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-[#f8f9ff] text-[10px] font-black uppercase tracking-[0.16em] text-[#5c403c]"><tr><th className="px-6 py-4">Tên dịch vụ</th><th className="px-6 py-4">Loại</th><th className="px-6 py-4">Giá</th><th className="px-6 py-4">Mô tả</th><th className="px-6 py-4 text-center">Trạng thái</th><th className="px-6 py-4 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-[#e2e8f0]">{services.map((svc) => (<tr key={svc.service_id} className="hover:bg-[#fef2f2]"><td className="px-6 py-4">{editingId === svc.service_id ? <input value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded-lg border border-[#e6bdb8] px-3 py-2 text-sm" /> : <span className="font-bold text-[#0b1c30]">{svc.name}</span>}</td><td className="px-6 py-4 text-[#5c403c]">{svc.badge_type || '—'}</td><td className="px-6 py-4">{editingId === svc.service_id ? <input type="number" value={editForm.price_per_day || 0} onChange={(e) => setEditForm({ ...editForm, price_per_day: Number(e.target.value) })} className="w-32 rounded-lg border border-[#e6bdb8] px-3 py-2 text-sm" /> : <span className="font-bold text-[#dc2626]">{formatCurrency(svc.price_per_day)}</span>}</td><td className="px-6 py-4">{editingId === svc.service_id ? <input value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full rounded-lg border border-[#e6bdb8] px-3 py-2 text-sm" /> : <span className="text-sm text-[#5c403c]">{svc.description}</span>}</td><td className="px-6 py-4 text-center"><button onClick={() => handleToggleService(svc.service_id)} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${svc.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-100 text-gray-500'}`}><Power size={12} />{svc.is_active ? 'Active' : 'Inactive'}</button></td><td className="px-6 py-4"><div className="flex justify-end gap-2">{editingId === svc.service_id ? <><button onClick={handleSaveService} className="rounded-lg bg-[#dc2626] p-2 text-white"><Save size={18} /></button><button onClick={() => { setEditingId(null); setEditForm({}); }} className="rounded-lg border border-[#e6bdb8] p-2 text-[#5c403c]"><X size={18} /></button></> : <><button onClick={() => { setEditingId(svc.service_id); setEditForm(svc); }} className="rounded-lg border border-[#e6bdb8] p-2 text-[#5c403c]"><Pencil size={18} /></button><button onClick={() => handleDeleteService(svc.service_id)} className="rounded-lg border border-[#e6bdb8] p-2 text-[#5c403c]"><Trash2 size={18} /></button></>}</div></td></tr>))}</tbody></table></div>
                    </Card>
                )}

                {activeTab === 'deposits' && (
                    <Card title="Lịch sử đặt cọc & hoàn tiền" subtitle="Xác nhận thanh toán và xử lý payout cho chủ trọ">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#f8f9ff] text-[10px] font-black uppercase tracking-[0.16em] text-[#5c403c]"><tr><th className="px-6 py-4">Khách hàng</th><th className="px-6 py-4">Bất động sản</th><th className="px-6 py-4">Số tiền</th><th className="px-6 py-4">Trạng thái</th><th className="px-6 py-4 text-right">Hành động</th></tr></thead>
                                <tbody className="divide-y divide-[#e2e8f0]">{deposits.map((item) => (<tr key={item.booking_id} className="hover:bg-[#fef2f2]"><td className="px-6 py-4"><p className="font-semibold text-[#0b1c30]">{item.full_name}</p><p className="text-[12px] text-[#5c403c]">{item.phone_number}</p></td><td className="px-6 py-4 text-[#0b1c30]">{item.property_name || item.room_name || item.listing_title || '—'}</td><td className="px-6 py-4 font-bold text-[#0b1c30]">{formatCurrency(item.deposit_amount || item.amount)}</td><td className="px-6 py-4"><div className="flex flex-col gap-1">{item.is_verified ? <span className="inline-flex w-max items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700"><CircleCheck className="h-3 w-3" />Đã xác minh</span> : <span className="inline-flex w-max items-center gap-1 rounded bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-700"><CircleAlert className="h-3 w-3" />Chờ xác minh</span>}{item.status_label && <span className="inline-flex w-max items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700"><Clock3 className="h-3 w-3" />{item.status_label}</span>}</div></td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleConfirmPayment(item.booking_id)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Xác nhận đã nhận</button><button onClick={() => handlePayout(item.booking_id)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">Payout</button></div></td></tr>))}</tbody>
                            </table>
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
