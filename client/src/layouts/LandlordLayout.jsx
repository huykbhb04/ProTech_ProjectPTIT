import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import { resetSavedListings } from '../features/savedListings/savedListingsSlice';
import {
    LayoutDashboard, Bell, Building2, House, Home, Calendar, FileText,
    Receipt, CreditCard, Megaphone, Settings, LogOut, Menu, X, User, Plus
} from 'lucide-react';

const LandlordLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const onLogout = () => {
        dispatch(logout()); dispatch(reset()); dispatch(resetSavedListings()); navigate('/');
    };

    const menuItems = [
        { path: '/landlord/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { path: '/landlord/notifications', label: 'Thông báo', icon: Bell },
        { path: '/landlord/properties', label: 'Tòa nhà', icon: Building2 },
        { path: '/landlord/listings', label: 'Tin đăng', icon: Home },
        { path: '/landlord/bookings', label: 'Lịch xem', icon: Calendar },
        { path: '/landlord/contracts', label: 'Hợp đồng', icon: FileText },
        { path: '/landlord/bills', label: 'Hóa đơn', icon: Receipt },
        { path: '/landlord/wallet', label: 'Thu chi', icon: CreditCard },
        { path: '/landlord/campaigns', label: 'Yêu cầu', icon: Megaphone },
        { path: '/landlord/maintenance', label: 'Bảo trì', icon: Settings },
    ];

    const NavList = ({ onLinkClick }) => (
        <nav className="flex-1 overflow-y-auto py-4 px-4">
            {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={onLinkClick}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                            isActive
                                ? 'text-white border-l-[3px] font-bold'
                                : 'text-white/70 font-normal hover:bg-white/5 hover:text-white'
                        }`}
                        style={{
                            backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                            borderLeftColor: isActive ? '#a0f3d4' : 'transparent',
                        }}
                    >
                        <Icon style={{ width: 20, height: 20 }} />
                        <span className="text-sm font-semibold">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );

    const SidebarHeader = ({ showClose }) => (
        <div className="px-6 py-6 border-b" style={{ borderColor: '#bec9c3' }}>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[24px] font-black text-white leading-8">PropManage</h1>
                    <p className="text-sm text-white/60 mt-0.5">Quản lý chuyên nghiệp</p>
                </div>
                {showClose && (
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-1 text-white/60 hover:text-white"
                    >
                        <X style={{ width: 20, height: 20 }} />
                    </button>
                )}
            </div>
        </div>
    );

    const UserInfo = ({ linkPath }) => (
        <div className="px-6 py-5 border-b" style={{ borderColor: '#bec9c3' }}>
            <Link to={linkPath} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div
                    className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2"
                    style={{ borderColor: '#bec9c3' }}
                >
                    <img
                        src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'L')}&background=0f6e56&color=fff`}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user?.full_name || user?.fullName}</p>
                    <p className="text-[11.5px] font-semibold text-white/60 uppercase tracking-wider">Chủ trọ</p>
                </div>
            </Link>
        </div>
    );

    const LogoutBtn = () => (
        <div className="p-4">
            <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
            >
                <LogOut style={{ width: 20, height: 20 }} />
                <span className="text-sm font-semibold">Đăng xuất</span>
            </button>
        </div>
    );

    const PremiumBtn = () => (
        <div className="p-4 border-t" style={{ borderColor: '#bec9c3' }}>
            <button
                className="w-full text-white py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: '#0f6e56' }}
                onClick={() => navigate('/landlord/wallet')}
            >
                <Plus style={{ width: 16, height: 16 }} />
                Nâng cấp Premium
            </button>
        </div>
    );

    return (
        <div className="flex min-h-screen" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
            {/* Desktop Sidebar */}
            <aside
                className="fixed left-0 top-0 h-full w-[260px] flex flex-col z-50 border-r hidden lg:flex"
                style={{ backgroundColor: '#0f1f1a', borderColor: '#bec9c3' }}
            >
                <SidebarHeader />
                <UserInfo linkPath="/landlord/profile" />
                <NavList />
                <PremiumBtn />
                <LogoutBtn />
            </aside>

            {/* Main content */}
            <div className="flex flex-1 flex-col min-h-screen lg:ml-[260px]">
                {/* Mobile top bar */}
                <header
                    className="flex h-16 items-center justify-between px-4 lg:hidden z-40 border-b"
                    style={{
                        backgroundColor: '#f7faf6',
                        borderColor: '#bec9c3'
                    }}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-[#0f6e56]">PropManage</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-[#3f4944] hover:bg-[#ebefeb] rounded-lg transition-all"
                    >
                        <Menu style={{ width: 24, height: 24 }} />
                    </button>
                </header>

                {/* Mobile drawer */}
                {isSidebarOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div
                            className="absolute inset-0"
                            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                            onClick={() => setIsSidebarOpen(false)}
                        />
                        <aside
                            className="absolute left-0 top-0 h-full w-[260px] flex flex-col"
                            style={{ backgroundColor: '#0f1f1a' }}
                        >
                            <SidebarHeader showClose />
                            <UserInfo linkPath="/landlord/profile" />
                            <NavList onLinkClick={() => setIsSidebarOpen(false)} />
                            <PremiumBtn />
                            <LogoutBtn />
                        </aside>
                    </div>
                )}

                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default LandlordLayout;
