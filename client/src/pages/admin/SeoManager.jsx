import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Save, Globe, Loader, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SeoManager = () => {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        id: null, route_path: '/', meta_title: '', meta_description: '', keywords: ''
    });

    useEffect(() => { fetchConfigs(); }, []);

    const fetchConfigs = async () => {
        try {
            const res = await api.get('/admin/system/seo');
            setConfigs(res.data);
            if (res.data.length > 0) setFormData(res.data[0]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/admin/system/seo', formData);
            toast.success('Cập nhật SEO thành công');
            fetchConfigs();
        } catch (err) {
            toast.error('Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader size={24} className="animate-spin text-gray-300" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in-up">

            {/* ── Header ── */}
            <div className="section-divider flex items-end justify-between">
                <div>
                    <p className="section-label mb-1">Hệ thống</p>
                    <h1 className="page-title">Quản lý SEO</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: Form */}
                <div className="lg:col-span-7">
                    <div className="card-base p-8">
                        <h2 className="text-sm font-black text-black uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Search size={14} /> Cấu hình trang
                        </h2>
                        <form onSubmit={handleSave} className="space-y-5">
                            <div>
                                <label className="input-label">Đường dẫn Route (URL)</label>
                                <input value={formData.route_path}
                                    onChange={e => setFormData({ ...formData, route_path: e.target.value })}
                                    className="input-box" placeholder="/" />
                            </div>
                            <div>
                                <label className="input-label">Meta Title</label>
                                <input value={formData.meta_title}
                                    onChange={e => setFormData({ ...formData, meta_title: e.target.value })}
                                    className="input-box" placeholder="PropTech - Thuê trọ thông minh" />
                                <p className="meta-text mt-1">{formData.meta_title.length}/60 ký tự</p>
                            </div>
                            <div>
                                <label className="input-label">Meta Description</label>
                                <textarea value={formData.meta_description}
                                    onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
                                    className="input-box h-28 resize-none"
                                    placeholder="Mô tả trang để lọt top Google..." />
                                <p className="meta-text mt-1">{formData.meta_description.length}/160 ký tự</p>
                            </div>
                            <div>
                                <label className="input-label">Từ khóa (Keywords)</label>
                                <input value={formData.keywords}
                                    onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                                    className="input-box"
                                    placeholder="thuê phòng, trọ thông minh, proptech" />
                            </div>
                            <button type="submit" disabled={saving} className="btn-primary">
                                {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                                Lưu cấu hình
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right: Preview + List */}
                <div className="lg:col-span-5 space-y-4">
                    {/* Google Preview */}
                    <div className="card-base p-6">
                        <h2 className="section-label mb-4 flex items-center gap-2">
                            <Globe size={12} /> Xem trước trên Google
                        </h2>
                        <div className="p-4 bg-gray-50 border border-gray-100">
                            <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                                <Globe size={10} />
                                <span>smartproptech.vn › {(formData.route_path || '/').replace('/', '')}</span>
                            </div>
                            <div className="text-base text-blue-700 hover:underline cursor-pointer mb-1 font-medium">
                                {formData.meta_title || 'Tiêu đề chưa được thiết lập'}
                            </div>
                            <div className="text-sm text-gray-600 line-clamp-2">
                                {formData.meta_description || 'Mô tả trang sẽ xuất hiện ở đây trên kết quả tìm kiếm Google.'}
                            </div>
                        </div>
                    </div>

                    {/* Page list */}
                    <div className="card-base p-6">
                        <h3 className="section-label mb-4">Các trang đã cấu hình</h3>
                        <div className="space-y-2">
                            {configs.map(item => (
                                <button key={item.id} onClick={() => setFormData(item)}
                                    className={`w-full text-left p-3 border transition-all ${formData.id === item.id ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-gray-300 bg-white'}`}>
                                    <div className={`font-black text-xs uppercase tracking-widest ${formData.id === item.id ? 'text-white' : 'text-black'}`}>{item.route_path}</div>
                                    <div className={`text-xs truncate mt-0.5 ${formData.id === item.id ? 'text-white/60' : 'text-gray-400'}`}>{item.meta_title}</div>
                                </button>
                            ))}
                            <button onClick={() => setFormData({ id: null, route_path: '/', meta_title: '', meta_description: '', keywords: '' })}
                                className="w-full p-3 border border-dashed border-gray-200 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:border-black hover:text-black transition-all flex items-center justify-center gap-2">
                                <Plus size={12} /> Thêm trang mới
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeoManager;
