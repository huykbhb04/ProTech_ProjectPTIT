import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSaveListing } from '../../features/savedListings/savedListingsSlice';
import listingService from '../../services/listingService';
import bookingService from '../../services/bookingService';
import savedListingService from '../../services/savedListingService';
import BookingModal from '../../components/tenant/BookingModal';
import { toast } from 'react-hot-toast';
import {
    MapPin,
    Zap,
    Droplets,
    Wifi,
    Tv,
    Wind,
    Refrigerator,
    Clock,
    Calendar,
    Shield,
    User,
    Phone,
    MessageCircle,
    Share2,
    Heart,
    ChevronLeft,
    ChevronRight,
    Star,
    CheckCircle2,
    Calculator,
    AlertTriangle,
    DollarSign
} from 'lucide-react';

const AMENITY_MAP = {
    'fridge': { label: 'Tủ lạnh', icon: Refrigerator },
    'air_conditioner': { label: 'Điều hòa', icon: Wind },
    'washing_machine': { label: 'Máy giặt', icon: Droplets },
    'television': { label: 'TV', icon: Tv },
    'wifi': { label: 'Wifi', icon: Wifi },
    'bed': { label: 'Giường ngủ', icon: CheckCircle2 },
    'wardrobe': { label: 'Tủ quần áo', icon: CheckCircle2 },
    'parking': { label: 'Chỗ để xe', icon: CheckCircle2 }
};

const CostEstimator = ({ rentPrice, electricPrice, waterPrice, servicePrice }) => {
    const [elecUsage, setElecUsage] = useState(50);
    const [waterUsage, setWaterUsage] = useState(4);

    const totalCost = rentPrice + (elecUsage * electricPrice) + (waterUsage * waterPrice) + servicePrice;

    return (
        <div className="glass p-8 rounded-[2rem] border border-white/40 shadow-2xl relative overflow-hidden group">
            {/* Glossy overlay effect */}
            <div className="absolute -top-1/2 -left-1/4 w-[150%] h-[150%] bg-gradient-to-br from-white/20 via-transparent to-transparent rotate-45 pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                        <Calculator size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Dự toán cá nhân</p>
                        <h3 className="font-black text-gray-900 text-lg">Chi phí hàng tháng</h3>
                    </div>
                </div>

                <div className="space-y-6 mb-8">
                    <div className="p-4 bg-white/40 rounded-2xl border border-white/50">
                        <label className="flex justify-between text-[11px] font-black text-gray-500 uppercase tracking-wider mb-3">
                            <span>⚡ Điện ({new Intl.NumberFormat('vi-VN').format(electricPrice)}đ/kWh)</span>
                            <span className="text-indigo-600">{elecUsage} kWh</span>
                        </label>
                        <input
                            type="range" min="0" max="500" step="5"
                            value={elecUsage}
                            onChange={(e) => setElecUsage(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200/50 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>
                    <div className="p-4 bg-white/40 rounded-2xl border border-white/50">
                        <label className="flex justify-between text-[11px] font-black text-gray-500 uppercase tracking-wider mb-3">
                            <span>💧 Nước ({new Intl.NumberFormat('vi-VN').format(waterPrice)}đ/m3)</span>
                            <span className="text-blue-600">{waterUsage} m³</span>
                        </label>
                        <input
                            type="range" min="0" max="30" step="1"
                            value={waterUsage}
                            onChange={(e) => setWaterUsage(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200/50 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>

                <div className="space-y-3 text-sm border-t border-gray-100 pt-6">
                    <div className="flex justify-between text-gray-500 font-bold">
                        <span>Tiền thuê phòng</span>
                        <span className="text-gray-900">{new Intl.NumberFormat('vi-VN').format(rentPrice)}₫</span>
                    </div>
                    <div className="flex justify-between text-gray-500 font-bold">
                        <span>Phí dịch vụ cố định</span>
                        <span className="text-gray-900">{new Intl.NumberFormat('vi-VN').format(servicePrice)}₫</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 mt-2 border-t border-dashed border-gray-200">
                        <span className="font-black text-gray-900 uppercase tracking-wider text-xs">Tổng dự toán</span>
                        <span className="text-2xl font-black text-indigo-600">
                            {new Intl.NumberFormat('vi-VN').format(totalCost)}₫
                        </span>
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center flex-1">
                        Kết quả chỉ mang tính chất tham khảo
                    </p>
                </div>
            </div>
        </div>
    );
};

const RoomDetail = () => {
    const { id } = useParams();
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const location = useLocation();

    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [hasBooking, setHasBooking] = useState(false);
    const dispatch = useDispatch();
    const { savedIds } = useSelector(state => state.savedListings);
    const isSaved = listing ? savedIds.includes(listing.listing_id) : false;

    const fetchListing = async () => {
        try {
            const data = await listingService.getListingByRoom(id);
            setListing(data);
        } catch (error) {
            console.error("Error fetching listing details:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListing();
    }, [id]);

    const checkBookingStatus = async () => {
        if (user && user.role === 'tenant' && listing) {
            try {
                const { hasBooking } = await bookingService.checkRoomBookingStatus(listing.room_id);
                setHasBooking(hasBooking);
            } catch (error) {
                console.error("Error checking booking status:", error);
            }
        }
    };

    useEffect(() => {
        checkBookingStatus();
    }, [user, listing]);

    if (loading) return (
        <div className="min-h-screen flex justify-center items-center bg-gray-50">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!listing) return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 text-gray-500">
            <AlertTriangle size={48} className="mb-4 text-yellow-500" />
            <h2 className="text-xl font-bold">Không tìm thấy phòng trọ này</h2>
            <Link to="/tenant/discover" className="mt-4 text-indigo-600 hover:underline">Quay lại tìm kiếm</Link>
        </div>
    );

    const images = Array.isArray(listing.images) ? listing.images : JSON.parse(listing.images || '[]');
    if (images.length === 0) images.push('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2670&auto=format&fit=crop');

    let parsedAmenities = {};
    try {
        parsedAmenities = typeof listing.amenities === 'string' ? JSON.parse(listing.amenities) : (listing.amenities || {});
    } catch (e) { parsedAmenities = {}; }

    const handleBooking = () => {
        if (!user) {
            if (window.confirm("Bạn cần đăng nhập để đặt lịch xem phòng. Đi đến trang đăng nhập ngay?")) {
                navigate('/login', { state: { from: location.pathname } });
            }
            return;
        }
        if (user.role !== 'tenant') {
            alert("Chức năng này chỉ dành cho người thuê (Tenant).");
            return;
        }
        setIsBookingModalOpen(true);
    };

    const handleToggleSave = async () => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để lưu tin');
            return;
        }
        try {
            await dispatch(toggleSaveListing(listing.listing_id)).unwrap();
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        }
    };

    return (
        <div className="min-h-screen relative pb-20 overflow-x-hidden">
            {/* Background Image & Overlay */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img
                    src={images[0]}
                    className="w-full h-full object-cover opacity-10 scale-105 blur-2xl"
                    alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-gray-50/80 to-gray-50/95 backdrop-blur-[2px]"></div>
            </div>

            {/* Nav & Breadcrumb */}
            <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-white/40 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
                    <Link to="/tenant/discover" className="p-2.5 hover:bg-white/80 rounded-2xl transition-all text-gray-500 shadow-sm border border-transparent hover:border-gray-100 hover:scale-105 active:scale-95">
                        <ChevronLeft size={22} />
                    </Link>
                    <div className="flex-1 flex flex-col min-w-0">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Chi tiết phòng</span>
                        <h1 className="font-black text-gray-900 truncate text-base md:text-lg leading-tight">{listing.title}</h1>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2.5 hover:bg-white/80 rounded-2xl text-indigo-600 transition-all shadow-sm border border-transparent hover:border-indigo-100 hover:scale-105 active:scale-95 group">
                            <Share2 size={20} className="group-hover:rotate-12 transition-transform" />
                        </button>
                        <button
                            onClick={handleToggleSave}
                            className={`p-2.5 rounded-2xl transition-all shadow-sm border border-transparent hover:scale-105 active:scale-95 group ${isSaved ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200' : 'hover:bg-white/80 text-red-500 hover:border-red-100'}`}
                        >
                            <Heart size={20} className={`transition-transform ${isSaved ? 'fill-white scale-110' : 'group-hover:scale-125'}`} />
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT COLUMN - Main Content */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Gallery Section */}
                        <div className="glass rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 group/gallery animate-in fade-in duration-500">
                            <div
                                className="aspect-[16/10] md:aspect-video bg-gray-100 relative cursor-zoom-in overflow-hidden"
                                onClick={() => setShowLightbox(true)}
                            >
                                <img
                                    key={activeImage}
                                    src={images[activeImage]}
                                    alt="Room view"
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover/gallery:scale-105 animate-in fade-in zoom-in-95 duration-700"
                                />
                                <div className="absolute top-6 left-6 flex flex-col gap-2">
                                    {listing.premium_until && new Date(listing.premium_until) > new Date() && (
                                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1.5 rounded-xl font-black text-[10px] shadow-xl flex items-center gap-1.5 backdrop-blur-md border border-white/20 animate-pulse">
                                            <Star size={12} fill="currentColor" /> BỘ SƯU TẬP ĐẶC BIỆT
                                        </div>
                                    )}
                                    <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border border-white/10 w-fit">
                                        PHÒNG ID: #{listing.room_id}
                                    </div>
                                </div>
                                <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-xl text-white px-4 py-2 rounded-2xl text-[10px] font-black border border-white/10 group-hover/gallery:scale-110 transition-transform">
                                    {activeImage + 1} / {images.length}
                                </div>
                            </div>
                            <div className="p-4 flex gap-3 overflow-x-auto scrollbar-hide bg-white/30 backdrop-blur-sm">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`w-20 md:w-24 h-16 md:h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all ${activeImage === idx ? 'border-indigo-600 ring-4 ring-indigo-500/10 scale-105' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" alt="" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Info Header Card */}
                        <div className="glass p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 relative overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
                            {/* Glossy overlay effect */}
                            <div className="absolute -top-1/2 -right-1/4 w-[150%] h-[150%] bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent rotate-12 pointer-events-none"></div>

                            <div className="relative z-10">
                                <h1 className="text-2xl md:text-4xl font-black text-gray-900 mb-6 leading-tight tracking-tight">
                                    {listing.title}
                                </h1>

                                <div className="flex flex-col gap-6">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2.5 bg-red-100 rounded-xl text-red-600 shadow-sm mt-0.5">
                                            <MapPin size={22} fill="currentColor" fillOpacity={0.2} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Vị trí</p>
                                            <p className="text-gray-800 font-bold text-lg leading-tight">{listing.address || 'Địa chỉ đang cập nhật'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-indigo-600 p-5 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                                            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                                                <DollarSign size={80} />
                                            </div>
                                            <p className="text-[10px] uppercase font-black text-indigo-100/70 mb-1 relative z-10">Giá thuê / Tháng</p>
                                            <p className="text-2xl font-black relative z-10">{new Intl.NumberFormat('vi-VN').format(listing.rent_price)}₫</p>
                                        </div>
                                        <div className="glass p-5 rounded-3xl border-transparent bg-white/60 shadow-sm relative overflow-hidden group">
                                            <div className="absolute -right-4 -bottom-4 opacity-5 text-gray-900 group-hover:rotate-12 transition-transform duration-500">
                                                <Zap size={80} />
                                            </div>
                                            <p className="text-[10px] uppercase font-black text-gray-400 mb-1">Diện tích</p>
                                            <p className="text-2xl font-black text-gray-900">{listing.area} m²</p>
                                        </div>
                                        <div className="glass p-5 rounded-3xl border-transparent bg-white/60 shadow-sm">
                                            <p className="text-[10px] uppercase font-black text-gray-400 mb-1">Đặt cọc</p>
                                            <p className="text-xl font-black text-gray-900">{new Intl.NumberFormat('vi-VN').format(listing.deposit_amount)}₫</p>
                                        </div>
                                        <div className="glass p-5 rounded-3xl border-transparent bg-white/60 shadow-sm">
                                            <p className="text-[10px] uppercase font-black text-gray-400 mb-1">Tối đa</p>
                                            <p className="text-xl font-black text-gray-900">{listing.max_occupants || 2} <span className="text-xs text-gray-400">người</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs Style Content Sections */}
                        <div className="space-y-8">
                            {/* Description */}
                            <div className="glass p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40">
                                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                                    Mô tả chi tiết
                                </h2>
                                <div className="text-gray-600 text-[15px] leading-[1.8] whitespace-pre-line font-medium italic bg-indigo-50/30 p-6 rounded-2xl border border-indigo-100/50">
                                    {listing.description}
                                </div>
                            </div>

                            {/* Amenities Grid */}
                            <div className="glass p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40">
                                <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                                    Tiện ích nội thất
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(parsedAmenities).map(([key, value]) => {
                                        if (value) {
                                            const meta = AMENITY_MAP[key] || { label: key, icon: CheckCircle2 };
                                            const Icon = meta.icon;
                                            return (
                                                <div key={key} className="flex flex-col items-center gap-3 p-5 glass bg-white/50 rounded-3xl border-white/40 hover:scale-105 transition-transform group">
                                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                                        <Icon size={24} />
                                                    </div>
                                                    <span className="text-xs font-black text-gray-700 uppercase tracking-tight text-center">{meta.label}</span>
                                                </div>
                                            )
                                        }
                                        return null;
                                    })}
                                </div>
                            </div>

                            {/* Map View */}
                            <div className="glass p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 relative overflow-hidden">
                                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                                    Bản đồ vị trí
                                </h2>
                                <div className="rounded-[1.5rem] overflow-hidden h-72 bg-gray-100 relative border border-gray-100">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        scrolling="no"
                                        marginHeight="0"
                                        marginWidth="0"
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(listing.address || 'Vietnam')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                        className="grayscale-[0.2] contrast-[1.1]"
                                    ></iframe>
                                    <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xl px-4 py-2.5 rounded-xl text-[10px] font-black text-gray-500 shadow-xl border border-white/20 uppercase tracking-wider text-center">
                                        Vị trí có thể sai lệch đôi chút để bảo mật
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Sticky Actions */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-24 space-y-6">
                            {/* Cost Estimator Widget */}
                            <CostEstimator
                                rentPrice={listing.rent_price}
                                electricPrice={listing.electricity_price}
                                waterPrice={listing.water_price}
                                servicePrice={listing.service_price}
                            />

                            {/* Contact Card */}
                            <div className="glass p-8 rounded-[2rem] border border-white/40 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-3xl"></div>

                                <div className="flex items-center gap-5 mb-8">
                                    <div className="w-16 h-16 rounded-3xl bg-gray-100 overflow-hidden border-2 border-white shadow-xl relative ring-4 ring-indigo-50">
                                        <img
                                            src={listing.landlord_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.landlord_name || 'Host')}&background=6366f1&color=fff`}
                                            alt="Host"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Liên hệ chủ nhà</p>
                                        <h3 className="text-xl font-black text-gray-900 leading-tight">{listing.landlord_name || 'Chủ nhà thân thiện'}</h3>
                                        <div className="flex gap-1 mt-1.5 Items-center">
                                            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} className="text-yellow-400" fill="currentColor" />)}
                                            <span className="text-[10px] font-black text-gray-400 ml-1 uppercase">(4.9)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        onClick={handleBooking}
                                        className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl hover:-translate-y-1 active:scale-95 ${hasBooking
                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                            : 'bg-gray-900 text-white hover:bg-black hover:shadow-gray-200'
                                            }`}
                                    >
                                        <Calendar size={20} />
                                        {hasBooking ? 'Bạn đã đặt lịch phòng này' : 'Đặt lịch xem phòng'}
                                    </button>

                                    <div className="grid grid-cols-2 gap-3">
                                        <a
                                            href={`tel:${listing.landlord_phone}`}
                                            className="bg-white hover:bg-gray-50 text-gray-900 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-gray-100 shadow-sm"
                                        >
                                            <Phone size={18} fill="currentColor" fillOpacity={0.1} /> Gọi điện
                                        </a>
                                        <button className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100">
                                            <MessageCircle size={18} /> Zalo ngay
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-gray-100 text-center space-y-3">
                                    <div className="flex items-center justify-center gap-2">
                                        <Shield className="w-5 h-5 text-green-500" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đảm bảo bởi SmartProp</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-medium px-4 leading-relaxed">
                                        Thông tin đã được xác minh. Mọi giao dịch tiền đặt cọc nên thực hiện qua hệ thống.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Lightbox Modal */}
            {showLightbox && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
                    onClick={() => setShowLightbox(false)}
                >
                    <button
                        className="absolute top-10 right-10 text-white/40 hover:text-white transition-colors hover:scale-110 active:scale-90"
                    >
                        <AlertTriangle className="rotate-45" size={48} />
                    </button>

                    <div
                        className="relative max-w-6xl w-full h-[80vh] flex items-center justify-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={images[activeImage]}
                            className="max-h-full max-w-full object-contain rounded-3xl shadow-[0_0_100px_rgba(255,255,255,0.1)] animate-in zoom-in-95 duration-500"
                            alt="Full View"
                        />

                        {/* Internal Navigation Buttons */}
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImage(prev => (prev - 1 + images.length) % images.length);
                                }}
                                className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white pointer-events-auto transition-all"
                            >
                                <ChevronLeft size={32} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImage(prev => (prev + 1) % images.length);
                                }}
                                className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white pointer-events-auto transition-all"
                            >
                                <ChevronRight size={32} />
                            </button>
                        </div>
                    </div>

                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 px-6 py-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setActiveImage(idx); }}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === activeImage ? 'bg-indigo-500 scale-150' : 'bg-white/30 hover:bg-white/50'}`}
                            ></button>
                        ))}
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {listing && (
                <BookingModal
                    isOpen={isBookingModalOpen}
                    onClose={() => setIsBookingModalOpen(false)}
                    roomId={listing.room_id}
                    roomNumber={listing.room_number}
                    buildingName={listing.building_name}
                    onSuccess={checkBookingStatus}
                />
            )}
        </div>
    );
};

export default RoomDetail;
