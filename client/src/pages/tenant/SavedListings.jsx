import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSaveListing } from '../../features/savedListings/savedListingsSlice';
import savedListingService from '../../services/savedListingService';
import {
    Heart,
    MapPin,
    Star,
    Trash2,
    Home,
    ArrowLeft,
    Loader2,
    Calendar,
    SortAsc,
    SortDesc,
    CheckCircle2,
    Scaling,
    Zap,
    Navigation,
    ShoppingBag,
    School,
    Briefcase,
    X,
    Info,
    ArrowRight,
    Search,
    Map
} from 'lucide-react';

// --- Helper for distance calculation ---
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
};

const ComparisonModal = ({ isOpen, onClose, selectedRooms }) => {
    const [userLoc, setUserLoc] = useState({ name: 'Đại học Bách Khoa HN', lat: 21.0068, lng: 105.8429 });
    const [isEditingLoc, setIsEditingLoc] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    const handleSearchLocation = async (e) => {
        if (e) e.preventDefault();
        if (!searchTerm.trim()) return;

        setIsSearching(true);
        setSearchResults([]);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&limit=5&addressdetails=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                setSearchResults(data.map(item => ({
                    name: item.display_name,
                    shortName: item.name || item.display_name.split(',')[0],
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon)
                })));
            } else {
                toast.error('Không tìm thấy địa điểm này trên bản đồ');
            }
        } catch (error) {
            toast.error('Lỗi khi kết nối dịch vụ bản đồ');
        } finally {
            setIsSearching(false);
        }
    };

    const selectLocation = (loc) => {
        setUserLoc({
            name: loc.shortName,
            fullName: loc.name,
            lat: loc.lat,
            lng: loc.lng
        });
        setSearchResults([]);
        setSearchTerm('');
        toast.success(`Đã chọn: ${loc.shortName}`);
    };

    if (!isOpen) return null;

    const locations = [
        { name: 'Đại học Bách Khoa HN', lat: 21.0068, lng: 105.8429 },
        { name: 'Đại học Kinh tế Quốc dân', lat: 21.0007, lng: 105.8422 },
        { name: 'Keangnam Landmark 72', lat: 21.0173, lng: 105.7838 },
        { name: 'Phố Đi Bộ Hoàn Kiếm', lat: 21.0285, lng: 105.8521 },
        { name: 'Đại học Quốc gia HN', lat: 21.0381, lng: 105.7828 }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-6xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">So sánh phòng trọ</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Đánh giá các lựa chọn dựa trên tiêu chí của bạn</p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-8">
                    {/* User Location Picker & Search */}
                    <div className="mb-10 p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 flex flex-col gap-8 shadow-sm">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                                    <Map size={32} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Điểm đến trung tâm của bạn</p>
                                    <p className="text-2xl font-black text-gray-900 tracking-tight">{userLoc.name}</p>
                                </div>
                            </div>

                            <form onSubmit={handleSearchLocation} className="relative w-full md:w-96 group">
                                <input
                                    type="text"
                                    placeholder="Nhập nơi học/làm việc mới..."
                                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent rounded-2xl text-sm font-bold focus:border-indigo-600 focus:outline-none shadow-sm transition-all placeholder:text-gray-300"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                <button
                                    type="submit"
                                    disabled={isSearching}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                                >
                                    {isSearching ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                                </button>

                                {/* Search Results Dropdown */}
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[110] animate-in slide-in-from-top-2">
                                        <div className="p-3 bg-indigo-50/50 border-b border-gray-100">
                                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">Kết quả tìm kiếm phù hợp</p>
                                        </div>
                                        {searchResults.map((result, idx) => {
                                            // Calculate distance to first selected room just for preview
                                            const firstRoom = selectedRooms[0];
                                            const firstRoomCoords = firstRoom ? (typeof firstRoom.coordinates === 'string' ? JSON.parse(firstRoom.coordinates) : firstRoom.coordinates) : null;
                                            const previewDist = firstRoomCoords ? calculateDistance(result.lat, result.lng, firstRoomCoords.lat, firstRoomCoords.lng) : null;

                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => selectLocation(result)}
                                                    className="w-full text-left p-4 hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-0 flex items-start justify-between gap-3"
                                                >
                                                    <div className="flex items-start gap-3 overflow-hidden">
                                                        <MapPin size={16} className="text-indigo-600 mt-1 flex-shrink-0" />
                                                        <div className="overflow-hidden">
                                                            <p className="text-sm font-black text-gray-900 truncate">{result.shortName}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold line-clamp-1">{result.name}</p>
                                                        </div>
                                                    </div>
                                                    {previewDist && (
                                                        <div className="flex-shrink-0 text-right">
                                                            <p className="text-xs font-black text-indigo-600">~ {previewDist} km</p>
                                                            <p className="text-[8px] font-bold text-gray-400 uppercase">Tới phòng 1</p>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="h-px bg-indigo-100/50 w-full"></div>

                        <div className="flex flex-wrap gap-3 justify-center">
                            <p className="w-full text-center text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Gợi ý địa điểm phổ biến</p>
                            {locations.map(loc => (
                                <button
                                    key={loc.name}
                                    onClick={() => setUserLoc(loc)}
                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${userLoc.name === loc.name ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105' : 'bg-white text-indigo-600 hover:bg-white shadow-sm hover:shadow-md'}`}
                                >
                                    {loc.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comparison Table */}
                    <div className="min-w-[800px]">
                        <table className="w-full border-separate border-spacing-x-4">
                            <thead>
                                <tr>
                                    <th className="w-1/4"></th>
                                    {selectedRooms.map(room => (
                                        <th key={room.listing_id} className="w-1/4 pb-6">
                                            <div className="aspect-video rounded-2xl overflow-hidden mb-4 shadow-md">
                                                <img src={Array.isArray(room.images) ? room.images[0] : JSON.parse(room.images || '[]')[0]} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight line-clamp-1">{room.title}</h3>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {/* Rent */}
                                <tr className="group">
                                    <td className="py-4 px-6 bg-gray-50 rounded-l-2xl font-black text-gray-500 uppercase text-[10px] tracking-widest"><div className="flex items-center gap-2"><Zap size={14} className="text-yellow-500" /> Giá thuê / tháng</div></td>
                                    {selectedRooms.map(room => (
                                        <td key={room.listing_id} className="py-4 text-center font-black text-lg text-indigo-600">
                                            {new Intl.NumberFormat('vi-VN').format(room.rent_price)} <span className="text-[10px] text-gray-400 font-bold uppercase">đ</span>
                                        </td>
                                    ))}
                                </tr>
                                {/* Address */}
                                <tr className="group">
                                    <td className="py-4 px-6 bg-gray-50 font-black text-gray-500 uppercase text-[10px] tracking-widest"><div className="flex items-center gap-2"><MapPin size={14} className="text-red-500" /> Vị trí tòa nhà</div></td>
                                    {selectedRooms.map(room => (
                                        <td key={room.listing_id} className="py-4 text-center px-4 font-bold text-gray-600 text-[11px] leading-relaxed">
                                            {room.building_address}
                                        </td>
                                    ))}
                                </tr>
                                {/* Distance */}
                                <tr className="group">
                                    <td className="py-4 px-6 bg-gray-50 font-black text-gray-500 uppercase text-[10px] tracking-widest"><div className="flex items-center gap-2"><Navigation size={14} className="text-blue-500" /> Khoảng cách đến bạn</div></td>
                                    {selectedRooms.map(room => {
                                        const coords = typeof room.coordinates === 'string' ? JSON.parse(room.coordinates) : room.coordinates;
                                        const distance = coords ? calculateDistance(userLoc.lat, userLoc.lng, coords.lat, coords.lng) : null;
                                        return (
                                            <td key={`${room.listing_id}-${userLoc.name}`} className="py-4 text-center font-bold text-gray-700 animate-in zoom-in-95 fade-in duration-300">
                                                {distance ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-lg font-black text-indigo-600 block transition-all">~ {distance} km</span>
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter opacity-60">Theo vị trí thực</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-red-300 font-black uppercase italic tracking-tighter">Chưa có tọa độ</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                                {/* Area */}
                                <tr className="group">
                                    <td className="py-4 px-6 bg-gray-50 font-black text-gray-500 uppercase text-[10px] tracking-widest"><div className="flex items-center gap-2"><Scaling size={14} className="text-green-500" /> Diện tích phòng</div></td>
                                    {selectedRooms.map(room => (
                                        <td key={room.listing_id} className="py-4 text-center font-bold text-gray-700">{room.area} m²</td>
                                    ))}
                                </tr>
                                {/* Security */}
                                <tr className="group">
                                    <td className="py-4 px-6 bg-gray-50 font-black text-gray-500 uppercase text-[10px] tracking-widest"><div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-purple-500" /> An ninh & Tiện ích</div></td>
                                    {selectedRooms.map(room => (
                                        <td key={room.listing_id} className="py-4 px-4 text-left">
                                            <div className="flex flex-wrap gap-1 justify-center">
                                                {Object.entries(room.amenities || {}).filter(([_, v]) => v).slice(0, 4).map(([k]) => (
                                                    <span key={k} className="bg-gray-100 text-[9px] font-bold px-2 py-1 rounded-md text-gray-600 capitalize">{k}</span>
                                                ))}
                                                {room.security_rating && (
                                                    <span className="bg-yellow-100 text-[9px] font-bold px-2 py-1 rounded-md text-yellow-700">An ninh: {room.security_rating}/10</span>
                                                )}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                {/* Surroundings */}
                                <tr className="group">
                                    <td className="py-4 px-6 bg-gray-50 rounded-bl-2xl font-black text-gray-500 uppercase text-[10px] tracking-widest"><div className="flex items-center gap-2"><ShoppingBag size={14} className="text-orange-500" /> Khu vực xung quanh</div></td>
                                    {selectedRooms.map(room => {
                                        const isNearMarket = room.description?.toLowerCase().includes('chợ') || room.description?.toLowerCase().includes('siêu thị');
                                        return (
                                            <td key={room.listing_id} className="py-4 text-center px-4">
                                                <div className="space-y-1">
                                                    {isNearMarket ? (
                                                        <span className="flex items-center justify-center gap-1 text-[10px] font-black text-orange-600 uppercase"><CheckCircle2 size={10} /> Gần chợ/Siêu thị</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter italic">Chưa xác định</span>
                                                    )}
                                                    {room.flood_risk === 'none' && (
                                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Hiếm khi ngập</p>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-gray-900 text-white flex justify-between items-center rounded-b-[3rem]">
                    <div className="flex items-center gap-4">
                        <Info size={20} className="text-gray-400" />
                        <p className="text-xs font-medium text-gray-400 max-w-md">Bảng so sánh dựa trên dữ liệu thật từ chủ trọ cung cấp và phân tích địa lý sơ bộ. Hãy liên hệ để xem phòng trực tiếp.</p>
                    </div>
                    <button onClick={onClose} className="px-10 py-4 bg-white text-gray-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all active:scale-95">
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
};

const SavedListings = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'price-asc', 'price-desc'
    const [compareIds, setCompareIds] = useState([]);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const dispatch = useDispatch();
    const { savedIds } = useSelector(state => state.savedListings);

    useEffect(() => {
        fetchSavedListings();
    }, []);

    // Also re-fetch or filter if savedIds changes from other tabs
    useEffect(() => {
        // If a listing was unsaved elsewhere, we should remove it from the list here too
        setListings(prev => prev.filter(item => savedIds.includes(item.listing_id)));
    }, [savedIds]);

    const fetchSavedListings = async () => {
        try {
            setLoading(true);
            const data = await savedListingService.getSavedListings();
            setListings(data);
        } catch (error) {
            toast.error('Lỗi khi tải danh sách đã lưu');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (e, listingId) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await dispatch(toggleSaveListing(listingId)).unwrap();
            setCompareIds(prev => prev.filter(id => id !== listingId));
            toast.success('Đã xóa khỏi danh sách đã lưu');
        } catch (error) {
            toast.error('Lỗi khi xóa tin');
        }
    };

    const toggleCompare = (listingId) => {
        setCompareIds(prev => {
            if (prev.includes(listingId)) return prev.filter(id => id !== listingId);
            if (prev.length >= 3) {
                toast.error('Chỉ có thể so sánh tối đa 3 phòng');
                return prev;
            }
            return [...prev, listingId];
        });
    };

    const sortedListings = [...listings].sort((a, b) => {
        if (sortBy === 'price-asc') return a.rent_price - b.rent_price;
        if (sortBy === 'price-desc') return b.rent_price - a.rent_price;
        return 0; // 'newest' is handled by backend order or we could add saved_at
    });

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="animate-spin text-gray-900" size={48} />
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <Link to="/tenant/discover" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors mb-4">
                        <ArrowLeft size={14} /> Quay lại khám phá
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl shadow-black/10">
                            <Heart size={24} className="fill-white" />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">Tin đã lưu</h1>
                    </div>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] ml-1">Danh sách những không gian bạn yêu thích nhất</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-2xl">
                        <button
                            onClick={() => setSortBy('newest')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${sortBy === 'newest' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Calendar size={12} className="inline mr-1" /> Mới nhất
                        </button>
                        <button
                            onClick={() => setSortBy('price-asc')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${sortBy === 'price-asc' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <SortAsc size={12} className="inline mr-1" /> Giá tăng
                        </button>
                        <button
                            onClick={() => setSortBy('price-desc')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${sortBy === 'price-desc' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <SortDesc size={12} className="inline mr-1" /> Giá giảm
                        </button>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl px-6 py-3 shadow-sm text-center hidden sm:block">
                        <div className="text-xl font-black text-gray-900">{listings.length}</div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">Tổng cộng</div>
                    </div>
                </div>
            </div>

            {/* List */}
            {sortedListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {sortedListings.map((item) => {
                        const images = Array.isArray(item.images) ? item.images : JSON.parse(item.images || '[]');
                        const coverImage = images[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2670&auto=format&fit=crop';

                        return (
                            <div key={item.listing_id} className="group relative bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                                <Link to={`/tenant/room/${item.room_id}`} className="block">
                                    <div className="relative aspect-[4/5] overflow-hidden">
                                        <img
                                            src={coverImage}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                        {/* Status Tag */}
                                        <div className="absolute top-6 left-6 z-10">
                                            {item.status === 'active' ? (
                                                <span className="bg-green-500/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider">Còn phòng</span>
                                            ) : (
                                                <span className="bg-gray-500/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider">Đã đóng</span>
                                            )}
                                        </div>

                                        <button
                                            onClick={(e) => handleRemove(e, item.listing_id)}
                                            className="absolute top-6 right-6 w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-red-500 shadow-lg hover:bg-red-500 hover:text-white transition-all z-10"
                                            title="Xóa khỏi đã lưu"
                                        >
                                            <Trash2 size={18} />
                                        </button>

                                        {/* Compare Checkbox Overlay */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                toggleCompare(item.listing_id);
                                            }}
                                            className={`absolute bottom-6 left-6 px-4 py-2 backdrop-blur-md rounded-xl flex items-center gap-2 transition-all z-10 font-black text-[9px] uppercase tracking-widest ${compareIds.includes(item.listing_id)
                                                ? 'bg-indigo-600 text-white shadow-xl translate-x-1'
                                                : 'bg-white/90 text-gray-500 hover:bg-indigo-600 hover:text-white'
                                                }`}
                                        >
                                            {compareIds.includes(item.listing_id) ? (
                                                <><CheckCircle2 size={14} /> Đang chọn</>
                                            ) : (
                                                <><Scaling size={14} /> So sánh</>
                                            )}
                                        </button>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <div>
                                            <h3 className="text-sm font-black text-gray-900 line-clamp-1 uppercase tracking-tight">{item.title}</h3>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                                                <MapPin size={10} className="text-black" /> {item.building_name}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            <p className="text-sm font-black text-gray-900">
                                                {new Intl.NumberFormat('vi-VN').format(item.rent_price)} <span className="text-[10px] font-normal opacity-40">VND</span>
                                            </p>
                                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#0056b3]">
                                                <Star size={12} className="fill-[#0056b3]" /> 5.0
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-32 flex flex-col items-center justify-center bg-gray-50/50 rounded-[4rem] border-2 border-dashed border-gray-200 text-center space-y-8 animate-in fade-in duration-700">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl ring-8 ring-gray-50">
                        <Home size={40} className="text-gray-200" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Chưa có tin nào được lưu</h3>
                        <p className="text-gray-400 font-bold max-w-sm mx-auto mt-2 uppercase text-[10px] tracking-widest">Hãy dạo quanh bộ sưu tập và lưu lại những không gian bạn thấy ấn tượng nhất.</p>
                    </div>
                    <Link to="/tenant/discover" className="px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl shadow-black/20 hover:-translate-y-1 transition-all">
                        Khám phá bộ sưu tập ngay
                    </Link>
                </div>
            )}
            {/* Floating Comparison Bar */}
            {compareIds.length >= 1 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[80] animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-gray-900 border border-white/10 text-white rounded-[2rem] px-8 py-4 shadow-2xl flex items-center gap-8 backdrop-blur-xl">
                        <div className="flex -space-x-4">
                            {compareIds.map(id => {
                                const room = listings.find(l => l.listing_id === id);
                                if (!room) return null;
                                const imgs = Array.isArray(room.images) ? room.images : JSON.parse(room.images || '[]');
                                return (
                                    <div key={id} className="w-12 h-12 rounded-full border-2 border-gray-900 overflow-hidden shadow-lg transition-transform hover:-translate-y-2">
                                        <img src={imgs[0]} className="w-full h-full object-cover" alt="" />
                                    </div>
                                );
                            })}
                            {compareIds.length < 3 && (
                                <div className="w-12 h-12 rounded-full border-2 border-gray-900 bg-gray-800 flex items-center justify-center text-gray-500 italic text-[10px] font-bold">
                                    +{3 - compareIds.length}
                                </div>
                            )}
                        </div>

                        <div className="h-10 w-px bg-white/20"></div>

                        <div className="space-y-1">
                            <p className="text-xs font-black uppercase tracking-widest italic">{compareIds.length} tin đã chọn</p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase whitespace-nowrap">Chọn tối đa 3 để so sánh chi tiết</p>
                        </div>

                        <button
                            onClick={() => compareIds.length >= 2 ? setShowCompareModal(true) : toast.error('Chọn ít nhất 2 phòng để so sánh')}
                            disabled={compareIds.length < 2}
                            className={`px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center gap-2 shadow-xl ${compareIds.length >= 2
                                ? 'bg-white text-black hover:-translate-y-1 active:scale-95'
                                : 'bg-gray-800 text-gray-600 grayscale cursor-not-allowed'
                                }`}
                        >
                            So sánh ngay <ArrowRight size={14} />
                        </button>

                        <button
                            onClick={() => setCompareIds([])}
                            className="p-3 text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            <ComparisonModal
                isOpen={showCompareModal}
                onClose={() => setShowCompareModal(false)}
                selectedRooms={listings.filter(l => compareIds.includes(l.listing_id))}
            />
        </div>
    );
};

export default SavedListings;
