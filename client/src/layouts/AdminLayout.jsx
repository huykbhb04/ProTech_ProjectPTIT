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
    Shield
} from 'lucide-react';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
        { path: '/admin/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { path: '/admin/monetization', label: 'Cài đặt Monetization', icon: Settings },
        { path: '/admin/users', label: 'Quản lý Users', icon: Users },
        { path: '/admin/logs', label: 'System Logs', icon: FileText },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop')] bg-cover bg-fixed bg-center">
            {/* Overlay backdrop */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-0"></div>

            {/* Desktop Sidebar (Hover-to-reveal) */}
            <div className="fixed inset-y-0 left-0 z-50 group hidden lg:block">
                {/* Visual Indicator (slim line) */}
                <div className="absolute inset-y-0 left-0 w-1.5 bg-red-600/20 group-hover:bg-transparent transition-colors duration-500 rounded-r-full h-full"></div>

                <aside className="h-full w-64 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] glass flex flex-col border-r border-white/30 shadow-[20px_0_50px_rgba(0,0,0,0.1)] relative">
                    <div className="flex h-full flex-col relative z-10">
                        {/* Logo */}
                        <div className="flex h-16 items-center justify-center border-b border-white/20 bg-gradient-to-r from-red-600 to-orange-600">
                            <Shield className="text-white mr-2" size={24} />
                            <h1 className="text-2xl font-black text-white tracking-tight">ADMIN</h1>
                        </div>

                        {/* User Info */}
                        <div className="p-4 text-center">
                            <Link to="/admin/profile" className="mx-auto h-20 w-20 overflow-hidden rounded-full border-4 border-red-500 shadow-md block group relative">
                                <img src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name || user?.fullName}&background=dc2626&color=fff`} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </Link>
                            <p className="mt-2 font-black text-gray-800">{user?.fullName}</p>
                            <p className="text-xs text-red-600 font-black uppercase tracking-widest">{user?.role}</p>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 space-y-1 px-2 py-4">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`group flex items-center rounded-lg px-2 py-2 text-sm font-medium transition-colors ${isActive
                                            ? 'bg-red-600 text-white shadow-md'
                                            : 'text-gray-700 hover:bg-white/50 hover:text-red-600'
                                            }`}
                                    >
                                        <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-red-200' : 'text-gray-500 group-hover:text-red-500'}`} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Logout */}
                        <div className="p-4 border-t border-white/20">
                            <button
                                onClick={onLogout}
                                className="flex w-full items-center rounded-lg px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                            >
                                <LogOut className="mr-3 h-5 w-5" />
                                Đăng xuất
                            </button>
                        </div>
                    </div>

                    {/* Expand Handle */}
                    <div className="absolute top-1/2 -right-3 w-6 h-12 bg-white flex items-center justify-center rounded-full border border-gray-100 shadow-lg text-red-600 group-hover:opacity-0 transition-opacity translate-y-[-50%] pointer-events-none">
                        <div className="w-1 h-4 bg-red-200 rounded-full"></div>
                    </div>
                </aside>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 flex-col z-10 overflow-hidden">
                {/* Mobile Header */}
                <header className="flex h-16 items-center justify-between border-b border-white/20 glass lg:hidden px-4">
                    <div className="text-xl font-black text-red-600 flex items-center gap-2">
                        <Shield size={24} /> ADMIN
                    </div>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600">
                        {isSidebarOpen ? <X /> : <Menu />}
                    </button>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
