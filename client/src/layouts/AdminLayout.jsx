import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import { resetSavedListings } from '../features/savedListings/savedListingsSlice';
import {
    LayoutDashboard,
    Settings,
    Users,
    FileText,
    LogOut,
    Menu,
    X,
    Search,
    Palette,
    Folder,
    TrendingUp,
    Megaphone,
    DollarSign,
    Shield,
} from 'lucide-react';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        dispatch(resetSavedListings());
        navigate('/');
    };

    const menuItems = [
        { path: '/admin/dashboard', label: 'Thống kê', icon: TrendingUp },
        { path: '/admin/categories', label: 'Quản lý danh mục', icon: Folder },
        { path: '/admin/users', label: 'Quản lý người dùng', icon: Users },
        { path: '/admin/reports', label: 'Quản lý phản ánh', icon: Shield },
        { path: '/admin/banners', label: 'Quản lí quảng cáo', icon: Megaphone },
        { path: '/admin/monetization', label: 'Cài đặt tiền tệ', icon: DollarSign },
        { path: '/admin/seo', label: 'Quản lí seo', icon: Search },
        { path: '/admin/theme', label: 'Quản lí giao diện', icon: Palette },
        { path: '/admin/logs', label: 'Nhật ký hệ thống', icon: FileText },
    ];

    const NavList = ({ onLinkClick }) => (
        <nav className="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar">
            {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={onLinkClick}
                        className={`relative flex items-center gap-4 border-l-[4px] px-4 py-3 transition-colors duration-150 ${isActive ? 'border-[#ef4444] bg-white/10 text-white' : 'border-transparent text-white/60 hover:bg-white/5 hover:text-white'}`}
                    >
                        {isActive && <span className="sidebar-active-indicator" />}
                        <Icon size={18} className="flex-shrink-0" />
                        <span className="text-[14px] font-semibold">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );

    const SidebarInner = ({ showClose }) => (
        <>
            <div className="flex-shrink-0 border-b border-white/10 px-6 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-[24px] font-bold text-white">PropManage</h2>
                        <p className="mt-1 text-[12px] font-semibold tracking-[0.16em] text-white/40">HỆ THỐNG QUẢN TRỊ</p>
                    </div>
                    {showClose && (
                        <button onClick={() => setIsSidebarOpen(false)} className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white">
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-shrink-0 border-b border-white/10 px-5 py-5">
                <Link to="/admin/profile" className="flex items-center gap-3 transition-opacity hover:opacity-80">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/10 bg-[#dc2626] text-white font-bold">
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                            <span>{(user?.full_name || user?.fullName || 'A').charAt(0)}</span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-white">{user?.full_name || user?.fullName || 'Admin User'}</p>
                        <p className="text-[12px] font-semibold text-white/40">Quản trị viên</p>
                    </div>
                </Link>
            </div>

            <NavList onLinkClick={showClose ? () => setIsSidebarOpen(false) : undefined} />

            <div className="mt-auto border-t border-white/10 p-3">
                <button onClick={onLogout} className="flex w-full items-center gap-4 px-4 py-3 text-[14px] font-semibold text-white/60 transition-colors hover:text-[#dc2626]">
                    <LogOut size={18} /> Đăng xuất
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-[#f8f9ff]" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
            <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[260px] flex-col bg-[#1a0a0a] shadow-xl lg:flex">
                <SidebarInner />
            </aside>

            <div className="flex min-h-screen flex-col lg:ml-[260px]">
                <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#e6bdb8] bg-[#f8f9ff] px-4 lg:hidden">
                    <div className="flex items-center gap-2 text-[#dc2626]">
                        <Shield size={18} />
                        <span className="text-base font-black uppercase tracking-tight">Admin</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="rounded-lg p-2 text-[#5c403c] hover:bg-white hover:text-[#dc2626]">
                        <Menu size={20} />
                    </button>
                </header>

                {isSidebarOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
                        <aside className="absolute left-0 top-0 flex h-full w-[260px] flex-col bg-[#1a0a0a] shadow-2xl">
                            <SidebarInner showClose />
                        </aside>
                    </div>
                )}

                <main className="flex-1 overflow-y-auto px-4 py-4 lg:px-8 lg:py-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
