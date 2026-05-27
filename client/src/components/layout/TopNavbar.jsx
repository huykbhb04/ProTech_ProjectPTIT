import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Heart,
    UserPlus,
    LogIn,
    SquarePlus,
    LogOut,
    Calendar,
    Menu
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, reset } from '../../features/auth/authSlice';
import { fetchSavedIds, resetSavedListings } from '../../features/savedListings/savedListingsSlice';
import NotificationDropdown from './NotificationDropdown';

const TopNavbar = ({ user, toggleSidebar }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { savedIds } = useSelector(state => state.savedListings);
    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        dispatch(resetSavedListings());
        navigate('/');
    };

    React.useEffect(() => {
        if (user && (user.role === 'tenant' || user.role === 'guest')) {
            dispatch(fetchSavedIds());
        }
    }, [dispatch, user]);

    return (
        <header className="sticky top-0 z-[60] w-full bg-white border-b border-gray-100 shadow-sm relative navbar-dynamic">
            <div className="max-w-[1400px] mx-auto px-4 h-[72px] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {user && toggleSidebar && (
                        <button
                            onClick={toggleSidebar}
                            className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 rounded-lg transition-all cursor-pointer"
                            aria-label="Toggle Sidebar"
                        >
                            <Menu size={20} />
                            <span className="text-xs font-bold uppercase tracking-wider">Tiện ích</span>
                        </button>
                    )}
                    <Link to="/" className="flex flex-col items-start min-w-fit group shrink-0">
                        <div className="flex items-center">
                            <span className="text-2xl font-black tracking-tighter uppercase text-indigo-600">PropTech</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight -mt-1 hidden md:block">Nền tảng thuê phòng thông minh</span>
                    </Link>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Link to="/tenant/saved" className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-gray-800 hover:border-indigo-200 hover:text-indigo-600 transition-colors relative">
                        <Heart size={18} className={`text-gray-400 ${savedIds.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                        <span className="hidden sm:inline text-[13px] font-bold whitespace-nowrap">Tin đã lưu</span>
                        {savedIds.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                {savedIds.length}
                            </span>
                        )}
                    </Link>

                    {(!user || user.role === 'tenant' || user.role === 'guest') && (
                        <Link to="/tenant/bookings" className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-gray-800 hover:border-indigo-200 hover:text-indigo-600 transition-colors">
                            <Calendar size={18} className="text-gray-400" />
                            <span className="hidden sm:inline text-[13px] font-bold whitespace-nowrap">Lịch hẹn</span>
                        </Link>
                    )}

                    <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                    {!user ? (
                        <>
                            <Link to="/register" className="flex items-center gap-1.5 px-3 py-2 text-gray-800 hover:text-indigo-600 transition-colors">
                                <UserPlus size={20} className="text-gray-400" />
                                <span className="text-sm font-bold font-sans">Đăng ký</span>
                            </Link>
                            <Link to="/login" className="flex items-center gap-1.5 px-3 py-2 text-gray-800 hover:text-indigo-600 transition-colors">
                                <LogIn size={20} className="text-gray-400" />
                                <span className="text-sm font-bold font-sans">Đăng nhập</span>
                            </Link>
                        </>
                    ) : (
                        <>
                            <NotificationDropdown user={user} />
                            <div className="h-6 w-px bg-gray-200 mx-1"></div>
                            <div className="flex items-center gap-1.5 pl-2 border-l border-gray-100 group/user relative">
                                <Link to={`/${user.role === 'guest' ? 'tenant' : user.role}/profile`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                    <div className="hidden md:block text-right">
                                        <p className="text-xs font-black text-gray-900 leading-none mb-1">{user.full_name || user.fullName}</p>
                                        <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-tighter">
                                            {user.role === 'landlord' ? 'Chủ trọ' : user.role === 'admin' ? 'Quản trị' : 'Thành viên'}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full border-2 border-indigo-100 shadow-sm overflow-hidden cursor-pointer shrink-0">
                                        <img
                                            src={user.avatar_url || user.avatar || `https://ui-avatars.com/api/?name=${user.full_name || user.fullName}&background=4f46e5&color=fff`}
                                            className="w-full h-full object-cover"
                                            alt="avatar"
                                        />
                                    </div>
                                </Link>
                                <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Đăng xuất">
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </>
                    )}

                    {(!user || user.role === 'landlord') && (
                        <Link
                            to={user?.role === 'landlord' ? '/landlord/listings' : '/register?role=landlord'}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-full text-sm font-black flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <SquarePlus size={18} /> Đăng tin
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopNavbar;
