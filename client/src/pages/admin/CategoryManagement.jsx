import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
    Folder, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, 
    Loader, Search, X, Check, ChevronDown, House, Home, Building,
    Store, Users, Heart, Award, Grid3X3, Tag, Layers, Box,
    ArrowUpDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Icon mapping for categories
const iconOptions = [
    { value: 'home', label: 'Nhà', icon: Home },
    { value: 'building', label: 'Tòa nhà', icon: Building },
    { value: 'store', label: 'Cửa hàng', icon: Store },
    { value: 'users', label: 'Người dùng', icon: Users },
    { value: 'heart', label: 'Yêu thích', icon: Heart },
    { value: 'folder', label: 'Thư mục', icon: Folder },
    { value: 'award', label: 'Giải thưởng', icon: Award },
    { value: 'grid', label: 'Lưới', icon: Grid3X3 },
    { value: 'tag', label: 'Nhãn', icon: Tag },
    { value: 'layers', label: 'Lớp', icon: Layers },
    { value: 'box', label: 'Hộp', icon: Box },
];

const colorOptions = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
    '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6b7280'
];

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        icon: 'folder',
        color: '#6366f1',
        parent_id: '',
        display_order: 0,
        is_active: 1
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/system/categories');
            setCategories(res.data);
        } catch (err) {
            console.error('Error fetching categories:', err);
            toast.error('Lỗi tải danh sách danh mục');
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        setFormData(prev => ({
            ...prev,
            name,
            slug: editingCategory ? prev.slug : generateSlug(name)
        }));
    };

    const openCreateModal = () => {
        setEditingCategory(null);
        setFormData({
            name: '',
            slug: '',
            description: '',
            icon: 'folder',
            color: '#6366f1',
            parent_id: '',
            display_order: categories.length + 1,
            is_active: 1
        });
        setShowModal(true);
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            icon: category.icon || 'folder',
            color: category.color || '#6366f1',
            parent_id: category.parent_id || '',
            display_order: category.display_order || 0,
            is_active: category.is_active
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.slug.trim()) {
            toast.error('Vui lòng nhập tên danh mục');
            return;
        }

        try {
            if (editingCategory) {
                await api.put(`/admin/system/categories/${editingCategory.category_id}`, formData);
                toast.success('Cập nhật danh mục thành công!');
            } else {
                await api.post('/admin/system/categories', formData);
                toast.success('Tạo danh mục thành công!');
            }
            setShowModal(false);
            fetchCategories();
        } catch (err) {
            console.error('Error saving category:', err);
            toast.error(err.response?.data?.message || 'Lỗi khi lưu danh mục');
        }
    };

    const handleToggleStatus = async (category) => {
        try {
            await api.patch(`/admin/system/categories/${category.category_id}/toggle`);
            toast.success(category.is_active ? 'Đã vô hiệu hóa danh mục' : 'Đã kích hoạt danh mục');
            fetchCategories();
        } catch (err) {
            console.error('Error toggling status:', err);
            toast.error('Lỗi khi thay đổi trạng thái');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/admin/system/categories/${id}`);
            toast.success('Xóa danh mục thành công!');
            setShowDeleteConfirm(null);
            fetchCategories();
        } catch (err) {
            console.error('Error deleting category:', err);
            toast.error(err.response?.data?.message || 'Lỗi khi xóa danh mục');
        }
    };

    const filteredCategories = categories.filter(cat => 
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getIconComponent = (iconName) => {
        const found = iconOptions.find(opt => opt.value === iconName);
        return found ? found.icon : Folder;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="section-divider flex items-end justify-between">
                <div>
                    <p className="section-label mb-2">Quản trị</p>
                    <h1 className="page-title">Quản lý Danh mục</h1>
                </div>
                <button onClick={openCreateModal} className="btn-primary">
                    <Plus size={16} /> Thêm danh mục
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="card-base p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Folder size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{categories.length}</p>
                            <p className="text-sm text-gray-500">Tổng danh mục</p>
                        </div>
                    </div>
                </div>
                <div className="card-base p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <Check size={24} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{categories.filter(c => c.is_active).length}</p>
                            <p className="text-sm text-gray-500">Đang hoạt động</p>
                        </div>
                    </div>
                </div>
                <div className="card-base p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Layers size={24} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{categories.filter(c => c.parent_id).length}</p>
                            <p className="text-sm text-gray-500">Danh mục con</p>
                        </div>
                    </div>
                </div>
                <div className="card-base p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Tag size={24} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">
                                {categories.reduce((sum, c) => sum + (parseInt(c.listing_count) || 0), 0)}
                            </p>
                            <p className="text-sm text-gray-500">Tin đăng</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="card-base p-4">
                <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm danh mục..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-box pl-11"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Categories Grid */}
            <div className="card-base overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader size={24} className="animate-spin text-gray-300" />
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="py-16 text-center">
                        <Folder size={48} className="text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">
                            {searchTerm ? 'Không tìm thấy danh mục nào' : 'Chưa có danh mục nào'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {filteredCategories.map(category => {
                            const IconComponent = getIconComponent(category.icon);
                            return (
                                <div 
                                    key={category.category_id}
                                    className={`p-5 rounded-2xl border-2 transition-all hover:shadow-lg ${
                                        category.is_active 
                                            ? 'bg-white border-gray-100 hover:border-indigo-200' 
                                            : 'bg-gray-50 border-gray-100 opacity-60'
                                    }`}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                                style={{ backgroundColor: category.color + '20' }}
                                            >
                                                <IconComponent size={24} style={{ color: category.color }} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-gray-900">{category.name}</h3>
                                                <p className="text-xs text-gray-400">/{category.slug}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                            category.is_active 
                                                ? 'bg-emerald-100 text-emerald-700' 
                                                : 'bg-gray-200 text-gray-500'
                                        }`}>
                                            {category.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    {category.description && (
                                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                            {category.description}
                                        </p>
                                    )}

                                    {/* Meta Info */}
                                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                                        {category.parent_name && (
                                            <span className="flex items-center gap-1">
                                                <Layers size={12} /> Danh mục cha: {category.parent_name}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Tag size={12} /> {category.listing_count || 0} tin đăng
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <ArrowUpDown size={12} /> #{category.display_order}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div 
                                            className="w-6 h-6 rounded-full cursor-pointer"
                                            style={{ backgroundColor: category.color }}
                                            title={category.color}
                                        />
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleStatus(category)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    category.is_active 
                                                        ? 'hover:bg-amber-50 text-amber-500' 
                                                        : 'hover:bg-emerald-50 text-emerald-500'
                                                }`}
                                                title={category.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                            >
                                                {category.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                            </button>
                                            <button
                                                onClick={() => openEditModal(category)}
                                                className="p-2 hover:bg-indigo-50 text-indigo-500 rounded-lg transition-colors"
                                                title="Chỉnh sửa"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(category)}
                                                className="p-2 hover:bg-red-50 text-red-400 rounded-lg transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl rounded-3xl">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
                            <h2 className="text-xl font-black text-gray-900">
                                {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-5">
                            {/* Name */}
                            <div>
                                <label className="input-label">Tên danh mục <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="input-box"
                                    placeholder="VD: Cho thuê phòng trọ"
                                    value={formData.name}
                                    onChange={handleNameChange}
                                    required
                                />
                            </div>

                            {/* Slug */}
                            <div>
                                <label className="input-label">Slug <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        className="input-box flex-1"
                                        placeholder="VD: phong-tro"
                                        value={formData.slug}
                                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, slug: generateSlug(prev.name) }))}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        Tạo tự động
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">URL-friendly identifier (e.g., /category/phong-tro)</p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="input-label">Mô tả</label>
                                <textarea
                                    className="input-box min-h-[80px]"
                                    placeholder="Mô tả ngắn về danh mục..."
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>

                            {/* Icon & Color Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="input-label">Biểu tượng</label>
                                    <div className="relative">
                                        <select
                                            className="input-box w-full appearance-none pr-10"
                                            value={formData.icon}
                                            onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                                        >
                                            {iconOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="input-label">Màu sắc</label>
                                    <div className="flex items-center gap-2">
                                        {colorOptions.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, color }))}
                                                className={`w-8 h-8 rounded-lg transition-all ${
                                                    formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                                                }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Parent Category */}
                            <div>
                                <label className="input-label">Danh mục cha</label>
                                <div className="relative">
                                    <select
                                        className="input-box w-full appearance-none pr-10"
                                        value={formData.parent_id}
                                        onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                                    >
                                        <option value="">-- Không có danh mục cha --</option>
                                        {categories
                                            .filter(c => !c.parent_id && (!editingCategory || c.category_id !== editingCategory.category_id))
                                            .map(cat => (
                                                <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                                            ))
                                        }
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Display Order */}
                            <div>
                                <label className="input-label">Thứ tự hiển thị</label>
                                <input
                                    type="number"
                                    className="input-box"
                                    min="0"
                                    value={formData.display_order}
                                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                                />
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active === 1}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked ? 1 : 0 }))}
                                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="is_active" className="font-medium text-gray-700">
                                    Kích hoạt danh mục này
                                </label>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 btn-primary justify-center"
                                >
                                    {editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md overflow-hidden shadow-2xl rounded-3xl">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">Xóa danh mục?</h3>
                            <p className="text-gray-500 mb-6">
                                Bạn có chắc muốn xóa danh mục <span className="font-bold text-gray-700">"{showDeleteConfirm.name}"</span>? 
                                Hành động này không thể hoàn tác.
                            </p>
                            {showDeleteConfirm.listing_count > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                                    <p className="text-amber-700 text-sm font-medium">
                                        Cảnh báo: Danh mục này đang có {showDeleteConfirm.listing_count} tin đăng!
                                    </p>
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={() => handleDelete(showDeleteConfirm.category_id)}
                                    className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryManagement;
