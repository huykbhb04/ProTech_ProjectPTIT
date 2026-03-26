import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Package, Star, Plus, Edit2, Trash2, Power, Save, X } from 'lucide-react';
import adminService from '../../services/adminService';

const MonetizationSettings = () => {
    const { token } = useSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState('packages'); // 'packages' or 'services'
    const [packages, setPackages] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pkgs, svcs] = await Promise.all([
                adminService.getAllPackages(token),
                adminService.getAllPremiumServices(token)
            ]);
            // Ensure we always have arrays
            setPackages(Array.isArray(pkgs) ? pkgs : []);
            setServices(Array.isArray(svcs) ? svcs : []);
        } catch (error) {
            console.error('Error fetching data:', error);
            // Set empty arrays on error
            setPackages([]);
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // ===== PACKAGE OPERATIONS =====
    const handleEditPackage = (pkg) => {
        setEditingId(pkg.package_id);
        setEditForm(pkg);
    };

    const handleSavePackage = async () => {
        try {
            await adminService.updatePackage(editingId, editForm, token);
            await fetchData();
            setEditingId(null);
            setEditForm({});
        } catch (error) {
            console.error('Error updating package:', error);
            alert('Lỗi cập nhật gói tin!');
        }
    };

    const handleTogglePackage = async (packageId) => {
        try {
            await adminService.togglePackageStatus(packageId, token);
            await fetchData();
        } catch (error) {
            console.error('Error toggling package:', error);
        }
    };

    const handleDeletePackage = async (packageId) => {
        if (!confirm('Bạn có chắc muốn xóa gói tin này?')) return;
        try {
            await adminService.deletePackage(packageId, token);
            await fetchData();
        } catch (error) {
            console.error('Error deleting package:', error);
            alert('Lỗi xóa gói tin!');
        }
    };

    const handleCreatePackage = async () => {
        try {
            await adminService.createPackage(createForm, token);
            await fetchData();
            setShowCreateModal(false);
            setCreateForm({});
        } catch (error) {
            console.error('Error creating package:', error);
            alert('Lỗi tạo gói tin!');
        }
    };

    // ===== SERVICE OPERATIONS =====
    const handleEditService = (svc) => {
        setEditingId(svc.service_id);
        setEditForm(svc);
    };

    const handleSaveService = async () => {
        try {
            await adminService.updatePremiumService(editingId, editForm, token);
            await fetchData();
            setEditingId(null);
            setEditForm({});
        } catch (error) {
            console.error('Error updating service:', error);
            alert('Lỗi cập nhật dịch vụ!');
        }
    };

    const handleToggleService = async (serviceId) => {
        try {
            await adminService.toggleServiceStatus(serviceId, token);
            await fetchData();
        } catch (error) {
            console.error('Error toggling service:', error);
        }
    };

    const handleDeleteService = async (serviceId) => {
        if (!confirm('Bạn có chắc muốn xóa dịch vụ này?')) return;
        try {
            await adminService.deleteService(serviceId, token);
            await fetchData();
        } catch (error) {
            console.error('Error deleting service:', error);
            alert('Lỗi xóa dịch vụ!');
        }
    };

    const handleCreateService = async () => {
        try {
            await adminService.createPremiumService(createForm, token);
            await fetchData();
            setShowCreateModal(false);
            setCreateForm({});
        } catch (error) {
            console.error('Error creating service:', error);
            alert('Lỗi tạo dịch vụ!');
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-red-600 font-bold">Đang tải...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Cài đặt Monetization</h1>
                    <p className="text-gray-500 font-medium">Quản lý giá gói tin đăng và dịch vụ VIP</p>
                </div>
                <button
                    onClick={() => {
                        setShowCreateModal(true);
                        setCreateForm({});
                    }}
                    className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl hover:bg-red-700 transition flex items-center gap-2"
                >
                    <Plus size={18} /> Thêm mới
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('packages')}
                    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'packages'
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <Package size={16} className="inline mr-2" />
                    Gói tin đăng ({packages.length})
                </button>
                <button
                    onClick={() => setActiveTab('services')}
                    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'services'
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <Star size={16} className="inline mr-2" />
                    Dịch vụ VIP ({services.length})
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                {activeTab === 'packages' ? (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/80 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Tên gói</th>
                                <th className="px-6 py-4">Thời hạn (ngày)</th>
                                <th className="px-6 py-4">Giá (VNĐ)</th>
                                <th className="px-6 py-4">Mô tả</th>
                                <th className="px-6 py-4 text-center">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {packages.map((pkg) => (
                                <tr key={pkg.package_id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        {editingId === pkg.package_id ? (
                                            <input
                                                type="text"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg text-sm font-bold"
                                            />
                                        ) : (
                                            <span className="font-black text-gray-900">{pkg.name}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === pkg.package_id ? (
                                            <input
                                                type="number"
                                                value={editForm.duration_days}
                                                onChange={(e) => setEditForm({ ...editForm, duration_days: parseInt(e.target.value) })}
                                                className="w-24 px-3 py-2 border rounded-lg text-sm"
                                            />
                                        ) : (
                                            <span className="text-gray-700">{pkg.duration_days} ngày</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === pkg.package_id ? (
                                            <input
                                                type="number"
                                                value={editForm.price}
                                                onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                                                className="w-32 px-3 py-2 border rounded-lg text-sm"
                                            />
                                        ) : (
                                            <span className="font-bold text-red-600">{formatCurrency(pkg.price)}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === pkg.package_id ? (
                                            <input
                                                type="text"
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                            />
                                        ) : (
                                            <span className="text-gray-500 text-sm">{pkg.description}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleTogglePackage(pkg.package_id)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${pkg.is_active
                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                : 'bg-gray-100 text-gray-500 border-gray-200'
                                                }`}
                                        >
                                            <Power size={12} className="inline mr-1" />
                                            {pkg.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            {editingId === pkg.package_id ? (
                                                <>
                                                    <button
                                                        onClick={handleSavePackage}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                        title="Lưu"
                                                    >
                                                        <Save size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(null);
                                                            setEditForm({});
                                                        }}
                                                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
                                                        title="Hủy"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEditPackage(pkg)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Sửa"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePackage(pkg.package_id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/80 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Tên dịch vụ</th>
                                <th className="px-6 py-4">Badge Type</th>
                                <th className="px-6 py-4">Giá/ngày (VNĐ)</th>
                                <th className="px-6 py-4">Mô tả</th>
                                <th className="px-6 py-4 text-center">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {services.map((svc) => (
                                <tr key={svc.service_id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        {editingId === svc.service_id ? (
                                            <input
                                                type="text"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg text-sm font-bold"
                                            />
                                        ) : (
                                            <span className="font-black text-gray-900">{svc.name}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === svc.service_id ? (
                                            <select
                                                value={editForm.badge_type}
                                                onChange={(e) => setEditForm({ ...editForm, badge_type: e.target.value })}
                                                className="px-3 py-2 border rounded-lg text-sm"
                                            >
                                                <option value="featured">Featured</option>
                                                <option value="top_rank">Top Rank</option>
                                                <option value="hot_deal">Hot Deal</option>
                                            </select>
                                        ) : (
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold uppercase">
                                                {svc.badge_type}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === svc.service_id ? (
                                            <input
                                                type="number"
                                                value={editForm.price_per_day}
                                                onChange={(e) => setEditForm({ ...editForm, price_per_day: parseFloat(e.target.value) })}
                                                className="w-32 px-3 py-2 border rounded-lg text-sm"
                                            />
                                        ) : (
                                            <span className="font-bold text-red-600">{formatCurrency(svc.price_per_day)}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === svc.service_id ? (
                                            <input
                                                type="text"
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                            />
                                        ) : (
                                            <span className="text-gray-500 text-sm">{svc.description}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleToggleService(svc.service_id)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${svc.is_active
                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                : 'bg-gray-100 text-gray-500 border-gray-200'
                                                }`}
                                        >
                                            <Power size={12} className="inline mr-1" />
                                            {svc.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            {editingId === svc.service_id ? (
                                                <>
                                                    <button
                                                        onClick={handleSaveService}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                        title="Lưu"
                                                    >
                                                        <Save size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(null);
                                                            setEditForm({});
                                                        }}
                                                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
                                                        title="Hủy"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEditService(svc)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Sửa"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteService(svc.service_id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b bg-red-50">
                            <h2 className="text-xl font-black text-gray-900">
                                {activeTab === 'packages' ? 'Tạo gói tin mới' : 'Tạo dịch vụ VIP mới'}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tên</label>
                                <input
                                    type="text"
                                    value={createForm.name || ''}
                                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                                    placeholder="Nhập tên..."
                                />
                            </div>
                            {activeTab === 'packages' ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Thời hạn (ngày)</label>
                                        <input
                                            type="number"
                                            value={createForm.duration_days || ''}
                                            onChange={(e) => setCreateForm({ ...createForm, duration_days: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 border rounded-xl text-sm"
                                            placeholder="30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Giá (VNĐ)</label>
                                        <input
                                            type="number"
                                            value={createForm.price || ''}
                                            onChange={(e) => setCreateForm({ ...createForm, price: parseFloat(e.target.value) })}
                                            className="w-full px-4 py-3 border rounded-xl text-sm"
                                            placeholder="99000"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Badge Type</label>
                                        <select
                                            value={createForm.badge_type || 'featured'}
                                            onChange={(e) => setCreateForm({ ...createForm, badge_type: e.target.value })}
                                            className="w-full px-4 py-3 border rounded-xl text-sm"
                                        >
                                            <option value="featured">Featured</option>
                                            <option value="top_rank">Top Rank</option>
                                            <option value="hot_deal">Hot Deal</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Giá/ngày (VNĐ)</label>
                                        <input
                                            type="number"
                                            value={createForm.price_per_day || ''}
                                            onChange={(e) => setCreateForm({ ...createForm, price_per_day: parseFloat(e.target.value) })}
                                            className="w-full px-4 py-3 border rounded-xl text-sm"
                                            placeholder="15000"
                                        />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Mô tả</label>
                                <textarea
                                    value={createForm.description || ''}
                                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                    className="w-full px-4 py-3 border rounded-xl text-sm"
                                    rows="3"
                                    placeholder="Mô tả chi tiết..."
                                ></textarea>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setCreateForm({});
                                }}
                                className="px-6 py-2 text-gray-500 font-bold text-sm"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={activeTab === 'packages' ? handleCreatePackage : handleCreateService}
                                className="bg-red-600 text-white px-8 py-2 rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg transition"
                            >
                                Tạo mới
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonetizationSettings;
