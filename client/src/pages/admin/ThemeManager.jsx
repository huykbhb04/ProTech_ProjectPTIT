import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Palette, Save, MonitorPlay, Columns3, LayoutTemplate, CreditCard, Play, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ThemeManager = () => {
    const [theme, setTheme] = useState({
        active_layout: 'modern',
        primary_color: '#000000',
        secondary_color: '#ffffff',
        grid_columns: 3,
        sidebar_layout: 'both',
        primary_font: 'Inter',
        card_style: 'minimal',
        banner_effect: 'fade',
        listings_per_page: 12
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTheme = async () => {
            try {
                const res = await api.get('/admin/system/theme');
                if (res.data) setTheme({ ...theme, ...res.data });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTheme();
    }, []);

    const handleSave = async () => {
        try {
            await api.post('/admin/system/theme', theme);
            toast.success('Cập nhật giao diện thành công!');
        } catch (err) {
            toast.error('Lưu cấu hình thất bại');
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
                    <h1 className="page-title">Thiết kế &amp; Giao diện</h1>
                </div>
                <button onClick={handleSave} className="btn-primary">
                    <Save size={14} /> Xuất bản thay đổi
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* SETTINGS PANEL */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Layout Section */}
                    <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                            <LayoutTemplate size={14} /> Bố cục tổng thể (Layout)
                        </h2>
                        
                        <div className="space-y-10">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-4">Sidebar Configuration</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { id: 'left', label: 'Cạnh trái' },
                                        { id: 'right', label: 'Cạnh phải' },
                                        { id: 'both', label: 'Hai bên' },
                                        { id: 'none', label: 'Full Width' }
                                    ].map(item => (
                                        <button 
                                            key={item.id}
                                            onClick={() => setTheme({...theme, sidebar_layout: item.id})}
                                            className={`p-4 border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${theme.sidebar_layout === item.id ? 'border-black bg-black text-white' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-4">Hiển thị tin đăng trên 1 dòng (Grid)</label>
                                <div className="flex gap-4">
                                    {[2, 3, 4].map(num => (
                                        <button 
                                            key={num}
                                            onClick={() => setTheme({...theme, grid_columns: num})}
                                            className={`w-14 h-14 flex items-center justify-center border-2 rounded-2xl font-bold text-lg transition-all ${theme.grid_columns === num ? 'border-black bg-black text-white' : 'border-gray-100 text-gray-400'}`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                    <div className="ml-auto text-xs text-gray-400 font-medium">Hiện tại: {theme.grid_columns} cột</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Aesthetics Section */}
                    <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                            <CreditCard size={14} /> Thẩm mỹ & Thành phần (Aesthetics)
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-4">Card Style</label>
                                <div className="space-y-3">
                                    {['minimal', 'classic', 'glass'].map(style => (
                                        <button 
                                            key={style}
                                            onClick={() => setTheme({...theme, card_style: style})}
                                            className={`w-full p-4 border-2 rounded-2xl text-left flex items-center justify-between group ${theme.card_style === style ? 'border-black bg-gray-50' : 'border-gray-50'}`}
                                        >
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${theme.card_style === style ? 'text-black' : 'text-gray-400'}`}>
                                                {style}
                                            </span>
                                            <div className={`w-3 h-3 rounded-full ${theme.card_style === style ? 'bg-black' : 'bg-gray-100'}`}></div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-4">Màu sắc thương hiệu</label>
                                    <div className="flex items-center gap-6">
                                        <input 
                                            type="color" 
                                            value={theme.primary_color} 
                                            onChange={(e) => setTheme({...theme, primary_color: e.target.value})} 
                                            className="h-20 w-20 cursor-pointer rounded-full border-4 border-white shadow-xl" 
                                        />
                                        <div>
                                            <div className="text-[10px] font-black text-gray-300 uppercase mb-1">Mã màu hex</div>
                                            <input 
                                                type="text" 
                                                value={theme.primary_color} 
                                                onChange={(e) => setTheme({...theme, primary_color: e.target.value})}
                                                className="bg-transparent border-none p-0 text-xl font-mono focus:ring-0" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-4">Hiệu ứng Banner</label>
                                    <select 
                                        value={theme.banner_effect}
                                        onChange={(e) => setTheme({...theme, banner_effect: e.target.value})}
                                        className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-black"
                                    >
                                        <option value="fade">Fade (Tan biến)</option>
                                        <option value="slide">Slide (Trượt ngang)</option>
                                        <option value="zoom">Zoom (Phun trào)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* VISUAL PREVIEW SIDEBAR */}
                <div className="lg:col-span-5 relative">
                    <div className="sticky top-24">
                        <div className="bg-gray-100 p-10 rounded-[3rem] border border-gray-200/50 flex flex-col items-center">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-2 self-start">
                                <MonitorPlay size={14} /> Bản mô phỏng (Mockup)
                            </h3>

                            {/* Browser Frame Mockup */}
                            <div className="w-full bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden border border-gray-100 transition-all duration-700">
                                {/* Navbar Mock */}
                                <div className="h-10 flex items-center px-6" style={{ backgroundColor: theme.primary_color }}>
                                    <div className="h-2 w-20 bg-white/30 rounded-full"></div>
                                </div>

                                {/* Body Mock */}
                                <div className="p-6 space-y-6">
                                    {/* Banner Mock */}
                                    <div className="h-32 w-full rounded-3xl opacity-10 flex items-center justify-center" style={{ backgroundColor: theme.primary_color }}>
                                        <Play className="text-gray-400" size={24} />
                                    </div>

                                    {/* Sidebar + Main Grid Mock */}
                                    <div className="grid grid-cols-12 gap-3 h-48">
                                        {(theme.sidebar_layout === 'left' || theme.sidebar_layout === 'both') && (
                                            <div className="col-span-2 bg-gray-50 rounded-xl"></div>
                                        )}
                                        <div className={`bg-gray-50/50 rounded-xl p-3 ${(theme.sidebar_layout === 'none') ? 'col-span-12' : (theme.sidebar_layout === 'both') ? 'col-span-8' : 'col-span-10'}`}>
                                            <div className={`grid gap-2 h-full`} style={{ gridTemplateColumns: `repeat(${theme.grid_columns}, 1fr)` }}>
                                                {[...Array(theme.grid_columns * 2)].map((_, i) => (
                                                    <div key={i} className={`rounded-lg ${theme.card_style === 'glass' ? 'bg-white/80 border' : theme.card_style === 'classic' ? 'bg-white shadow-sm' : 'bg-gray-200/50'} h-12`}></div>
                                                ))}
                                            </div>
                                        </div>
                                        {(theme.sidebar_layout === 'right' || theme.sidebar_layout === 'both') && (
                                            <div className="col-span-2 bg-gray-50 rounded-xl"></div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className="mt-8 text-[10px] text-gray-400 font-medium text-center max-w-xs leading-relaxed">
                                Cấu hình trên sẽ thay đổi hoàn toàn giao diện người dùng (Tenant). <br />
                                <span className="text-black font-black">Lưu ý:</span> Cấu hình số cột sẽ được tự động Responsive trên các thiết bị nhỏ hơn.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThemeManager;
