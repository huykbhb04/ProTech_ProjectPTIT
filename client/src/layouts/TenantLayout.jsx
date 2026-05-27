import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
    Home, Search, CreditCard, MessageSquare, User,
    LogOut, Bell, Heart, Calendar, X, Users, Menu
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import { resetSavedListings } from '../features/savedListings/savedListingsSlice';
import TopNavbar from '../components/layout/TopNavbar';

const TenantLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const onLogout = () => {
        dispatch(logout()); dispatch(reset()); dispatch(resetSavedListings()); navigate('/');
    };

    const navItems = [
        { icon: Home, label: 'Tổng quan', path: '/tenant/dashboard' },
        { icon: Search, label: 'Tìm phòng', path: '/tenant/discover' },
        { icon: Users, label: 'Tìm bạn', path: '/tenant/roommates' },
        { icon: CreditCard, label: 'Hóa đơn', path: '/tenant/bills' },
        { icon: MessageSquare, label: 'AI Chat', path: '/tenant/chat' },
        { icon: Calendar, label: 'Lịch hẹn', path: '/tenant/bookings' },
        { icon: Heart, label: 'Đã lưu', path: '/tenant/saved', badge: state => state.savedListings?.savedIds?.length || 0 },
        { icon: User, label: 'Cá nhân', path: '/tenant/profile' },
    ];

    const SidebarHeader = ({ showClose }) => (
        <div className="flex h-14 items-center justify-between px-4 border-b border-gray-100 flex-shrink-0">
            <Link to="/" className="flex flex-col items-start min-w-fit group shrink-0">
                <div className="flex items-center">
                    <span className="text-lg font-black tracking-tighter uppercase text-indigo-600">PropTech</span>
                </div>
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tight -mt-0.5">Nền tảng thuê phòng thông minh</span>
            </Link>
            {showClose && (
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-colors">
                    <X size={18} />
                </button>
            )}
        </div>
    );

    const UserInfo = ({ linkPath }) => (
        <div className="px-4 py-4 border-b border-gray-50 flex-shrink-0">
            <Link to={linkPath} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-gray-100 flex-shrink-0">
                    <img
                        src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'T')}&background=4f46e5&color=fff`}
                        alt="Avatar" className="w-full h-full object-cover"
                    />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-black truncate">{user?.full_name}</p>
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Người thuê</span>
                </div>
            </Link>
        </div>
    );

    const NavList = ({ onLinkClick }) => {
        const { savedIds } = useSelector((state) => state.savedListings);

        return (
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-hide">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    const badgeValue = item.badge ? item.badge({ savedListings: { savedIds } }) : 0;
                    return (
                        <Link key={item.path} to={item.path}
                            onClick={onLinkClick}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all duration-200 ${
                                isActive
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                            }`}
                        >
                            <Icon size={15} className={`flex-shrink-0 ${isActive ? 'text-indigo-200' : 'text-gray-400'}`} />
                            <span className="flex-1">{item.label}</span>
                            {item.label === 'Đã lưu' && badgeValue > 0 && (
                                <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none ${isActive ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'}`}>
                                    {badgeValue}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>
        );
    };

    const LogoutBtn = () => (
        <div className="p-3 border-t border-gray-100 flex-shrink-0">
            <button onClick={onLogout}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wide text-red-500 hover:bg-red-50 hover:text-red-600 transition-all">
                <LogOut size={15} /> Đăng xuất
            </button>
        </div>
    );

    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = React.useState(true);

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <div className="hidden lg:block">
                <TopNavbar user={user} onLogout={onLogout} toggleSidebar={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)} />
            </div>

            <div className="flex flex-1 relative">
                {/* Desktop Sidebar (toggled via header hamburger menu) */}
                {user && (
                    <aside className={`fixed inset-y-0 left-0 z-40 w-64 pt-[72px] flex flex-col bg-white border-r border-gray-100 shadow-sm transition-transform duration-300 ease-in-out hidden lg:flex ${isDesktopSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                        <UserInfo linkPath="/tenant/profile" />
                        <NavList />
                        <LogoutBtn />
                    </aside>
                )}

                {/* Main Content */}
                <div className={`flex flex-1 flex-col pb-16 md:pb-0 overflow-y-auto min-h-[calc(100vh-80px)] scrollbar-hide transition-all duration-300 ${isDesktopSidebarOpen && user ? 'lg:pl-64' : 'lg:pl-0'}`}>
                    <main className="flex-1 w-full bg-white">
                        <Outlet />
                    </main>
                </div>
            </div>

            {/* Mobile Top Bar */}
            <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white lg:hidden px-4 sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 rounded-lg transition-all cursor-pointer"
                        aria-label="Open Menu"
                    >
                        <Menu size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Tiện ích</span>
                    </button>
                    <Link to="/" className="flex flex-col items-start min-w-fit group shrink-0">
                        <div className="flex items-center">
                            <span className="text-xl font-black tracking-tighter uppercase text-indigo-600">PropTech</span>
                        </div>
                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tight -mt-1 hidden sm:block">Nền tảng thuê phòng thông minh</span>
                    </Link>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/tenant/profile" className="w-8 h-8 rounded-full border border-indigo-100 overflow-hidden shrink-0 shadow-sm">
                        <img
                            src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'T')}&background=4f46e5&color=fff`}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    </Link>
                </div>
            </header>

            {/* Mobile Drawer */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
                    <aside className="absolute left-0 top-0 h-full w-64 flex flex-col bg-white border-r border-gray-100 shadow-xl">
                        <SidebarHeader showClose />
                        <UserInfo linkPath="/tenant/profile" />
                        <NavList onLinkClick={() => setIsSidebarOpen(false)} />
                        <LogoutBtn />
                    </aside>
                </div>
            )}

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex justify-around items-center py-2.5 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden">
                {navItems.slice(0, 5).map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link key={item.label} to={item.path}
                            className={`flex flex-col items-center gap-0.5 px-2 transition-all duration-200 ${
                                isActive ? 'text-indigo-600' : 'text-gray-400'
                            }`}
                        >
                            <div className={`${isActive ? 'bg-indigo-50 p-2 rounded-xl' : 'p-2'} transition-all`}>
                                <Icon size={20} />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default TenantLayout;
