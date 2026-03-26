import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Heart,
    UserPlus,
    LogIn,
    Filter,
    MapPin,
    PlusSquare,
    LogOut,
    Calendar
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, reset } from '../../features/auth/authSlice';
import { fetchSavedIds, resetSavedListings } from '../../features/savedListings/savedListingsSlice';
import NotificationDropdown from './NotificationDropdown';

const TopNavbar = ({ user }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { savedIds } = useSelector(state => state.savedListings);
    const [searchValue, setSearchValue] = useState('');

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        dispatch(resetSavedListings());
        navigate('/');
    };

    React.useEffect(() => {
        if (user && user.role === 'tenant') {
            dispatch(fetchSavedIds());
        }
    }, [dispatch, user]);

    const handleSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            if (searchValue.trim()) {
                navigate(`/tenant/discover?search=${encodeURIComponent(searchValue.trim())}`);
            } else {
                navigate('/tenant/discover');
            }
        }
    };

    return (
        <header className="sticky top-0 z-[60] w-full bg-white border-b border-gray-100 shadow-sm relative">
            <div className="max-w-[1400px] mx-auto px-4 h-20 flex items-center justify-between gap-4">
                {/* Logo Section */}
                <Link to="/" className="flex flex-col items-start min-w-fit group">
                    <div className="flex items-center">
                        <span className="text-2xl font-black text-[#0056b3] tracking-tighter uppercase">Smart</span>
                        <span className="text-2xl font-black text-[#f60] tracking-tighter uppercase pl-1">Rental</span>
                        <span className="text-gray-400 text-base font-bold ml-1">.COM</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight -mt-1 hidden md:block">Kênh thông tin phòng trọ số 1 Việt Nam</span>
                </Link>

                {/* Search & Filter - Desktop */}
                <div className="hidden lg:flex flex-1 max-w-xl items-center gap-2 px-6">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <MapPin size={16} className="text-gray-400 group-focus-within:text-[#0056b3] transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-4 py-3 bg-[#f1f3f5] border-transparent rounded-full text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all placeholder:text-gray-500"
                            placeholder="Tìm theo khu vực"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-5 py-3 bg-white border border-gray-200 rounded-full text-xs font-black text-gray-700 flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <Filter size={14} className="text-gray-400" /> Bộ lọc
                    </button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1 md:gap-3">
                    <Link
                        to="/tenant/saved"
                        className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-gray-800 hover:text-[#0056b3] transition-colors relative group"
                    >
                        <Heart size={20} className={`text-gray-400 group-hover:text-red-500 transition-colors ${savedIds.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                        <span className="text-sm font-bold hidden xl:inline font-sans">Tin đã lưu</span>
                        {savedIds.length > 0 && (
                            <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                {savedIds.length}
                            </span>
                        )}
                    </Link>

                    {user?.role === 'tenant' && (
                        <Link
                            to="/tenant/bookings"
                            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-gray-800 hover:text-[#0056b3] transition-colors"
                        >
                            <Calendar size={20} className="text-gray-400" />
                            <span className="text-sm font-bold hidden xl:inline font-sans font-sans">Lịch hẹn</span>
                        </Link>
                    )}

                    <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                    {!user ? (
                        <>
                            <Link to="/register" className="flex items-center gap-1.5 px-3 py-2 text-gray-800 hover:text-[#0056b3] transition-colors">
                                <UserPlus size={20} className="text-gray-400" />
                                <span className="text-sm font-bold font-sans">Đăng ký</span>
                            </Link>
                            <Link to="/login" className="flex items-center gap-1.5 px-3 py-2 text-gray-800 hover:text-[#0056b3] transition-colors">
                                <LogIn size={20} className="text-gray-400" />
                                <span className="text-sm font-bold font-sans">Đăng nhập</span>
                            </Link>
                        </>
                    ) : (
                        <>
                            <NotificationDropdown user={user} />
                            <div className="h-6 w-px bg-gray-200 mx-1"></div>
                            <div className="flex items-center gap-1 md:gap-3 pr-2 border-r border-gray-100 mr-2 group/user relative">
                                <Link
                                    to={`/${user.role}/profile`}
                                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                >
                                    <div className="hidden sm:block text-right">
                                        <p className="text-xs font-black text-gray-900 leading-none mb-1">{user.full_name || user.fullName}</p>
                                        <p className="text-[9px] font-bold text-[#0056b3] uppercase tracking-tighter">
                                            {user.role === 'landlord' ? 'Chủ trọ' : user.role === 'admin' ? 'Quản trị' : 'Thành viên'}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full border-2 border-blue-50 shadow-sm overflow-hidden cursor-pointer">
                                        <img
                                            src={user.avatar_url || user.avatar || `https://ui-avatars.com/api/?name=${user.full_name || user.fullName}&background=0056b3&color=fff`}
                                            className="w-full h-full object-cover"
                                            alt="avatar"
                                        />
                                    </div>
                                </Link>
                                <button
                                    onClick={onLogout}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Đăng xuất"
                                >
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </>
                    )}

                    {(!user || user.role === 'landlord') && (
                        <Link
                            to={user?.role === 'landlord' ? '/landlord/listings' : '/register?role=landlord'}
                            className="bg-[#f60] text-white px-6 py-3 rounded-full text-sm font-black flex items-center gap-2 shadow-lg shadow-orange-100 hover:bg-[#e85a00] hover:-translate-y-0.5 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <PlusSquare size={18} /> Đăng tin
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopNavbar;
