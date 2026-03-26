import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import { resetSavedListings } from '../features/savedListings/savedListingsSlice';
import {
    Home,
    Search,
    CreditCard,
    MessageSquare,
    User,
    LogOut,
    Bell,
    Heart,
    UserPlus,
    LogIn,
    Filter,
    MapPin,
    PlusSquare,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';

import TopNavbar from '../components/layout/TopNavbar';

const TenantLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [isExpanded, setIsExpanded] = useState(false);

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        dispatch(resetSavedListings());
        navigate('/');
    };

    const navItems = user ? [
        { icon: <Home size={24} />, label: 'Tổng quan', path: '/tenant/dashboard' },
        { icon: <Search size={24} />, label: 'Tìm phòng', path: '/tenant/discover' },
        { icon: <UserPlus size={24} />, label: 'Tìm bạn', path: '/tenant/roommates' },
        { icon: <CreditCard size={24} />, label: 'Hóa đơn', path: '/tenant/bills' },
        { icon: <MessageSquare size={24} />, label: 'AI Chat', path: '/tenant/chat' },
        { icon: <User size={24} />, label: 'Cá nhân', path: '/tenant/profile' }
    ] : [
        { icon: <Search size={24} />, label: 'Tìm phòng', path: '/tenant/discover' }
    ];

    // Close sidebar on route change
    useEffect(() => {
        setIsExpanded(false);
    }, [location.pathname]);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 bg-[url('https://images.unsplash.com/photo-1554133682-674839f11883?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-fixed bg-center">
            {/* Overlay backdrop */}
            <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-0 pointer-events-none"></div>

            <TopNavbar user={user} onLogout={onLogout} />

            <div className="flex flex-1 relative z-10 overflow-hidden">
                {/* Desktop Sidebar (Auth-gated & Click-to-reveal) */}
                {user && (
                    <div className="fixed inset-y-0 left-0 z-50 hidden md:block pt-20">
                        {/* Mask / Overlay when expanded */}
                        {isExpanded && (
                            <div
                                className="fixed inset-0 bg-black/5 backdrop-blur-[1px] z-[-1]"
                                onClick={() => setIsExpanded(false)}
                            ></div>
                        )}

                        <aside className={`h-full w-64 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] glass flex flex-col border-r border-white/30 shadow-[20px_0_50px_rgba(0,0,0,0.1)] relative ${isExpanded ? 'translate-x-0' : '-translate-x-full'}`}>
                            {/* Glowing effect inside sidebar */}
                            <div className="absolute top-20 -left-10 w-40 h-40 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none opacity-50"></div>

                            <div className="flex h-full flex-col relative z-10">
                                {/* User Info */}
                                <div className="p-6 text-center">
                                    <Link to="/tenant/profile" className="mx-auto h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-xl mb-4 block group relative">
                                        <img src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name}&background=6366f1&color=fff`} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </Link>
                                    <p className="font-black text-gray-800 tracking-tight">{user.full_name}</p>
                                    <div className="mt-1 inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase">Người thuê</div>
                                </div>

                                {/* Navigation */}
                                <nav className="flex-1 space-y-2 px-4 py-4">
                                    {navItems.map((item) => {
                                        const isActive = location.pathname === item.path;
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className={`group flex items-center rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300 ${isActive
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 translate-x-1'
                                                    : 'text-gray-500 hover:bg-white/50 hover:text-indigo-600'
                                                    }`}
                                            >
                                                <span className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-500'} mr-3`}>
                                                    {item.icon}
                                                </span>
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </nav>

                                {/* Logout */}
                                <div className="p-4 border-t border-white/20">
                                    <button
                                        onClick={onLogout}
                                        className="flex w-full items-center rounded-2xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="mr-3 h-5 w-5" />
                                        Đăng xuất
                                    </button>
                                </div>
                            </div>

                            {/* Toggle Button (Arrow) */}
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="absolute top-1/2 -right-4 w-8 h-12 bg-white flex items-center justify-center rounded-xl border border-gray-100 shadow-xl text-indigo-600 hover:bg-indigo-50 hover:scale-110 active:scale-95 transition-all translate-y-[-50%] z-50 group"
                            >
                                <ChevronRight className={`w-5 h-5 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                                {!isExpanded && (
                                    <div className="absolute right-full mr-2 px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        Mở Menu
                                    </div>
                                )}
                            </button>
                        </aside>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex flex-1 flex-col z-10 pb-20 md:pb-0 overflow-y-auto min-h-screen scrollbar-hide">
                    {/* Page Content */}
                    <main className="flex-1 w-full">
                        <Outlet />
                    </main>
                </div>
            </div>

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-2xl border-t border-gray-100 flex justify-around items-center py-3 px-2 shadow-[0_-5px_30px_rgba(0,0,0,0.08)] md:hidden">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}
                        >
                            <div className={`${isActive ? 'bg-indigo-100 p-2.5 rounded-2xl shadow-inner' : 'p-2.5'}`}>
                                {item.icon}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default TenantLayout;
