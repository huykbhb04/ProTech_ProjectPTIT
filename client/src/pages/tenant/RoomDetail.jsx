import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
    ArrowLeft,
    Bath,
    BedDouble,
    Calendar,
    CarFront,
    ChevronLeft,
    ChevronRight,
    CircleCheck,
    Droplets,
    Heart,
    MapPin,
    MessageCircle,
    Phone,
    Ruler,
    Share2,
    ShieldCheck,
    Sparkles,
    Star,
    Tv,
    Wifi,
    Wind,
    Refrigerator,
    WashingMachine,
    TriangleAlert,
    Calculator,
    User,
    LogOut,
    Copy,
    X,
} from 'lucide-react';
import listingService from '../../services/listingService';
import bookingService from '../../services/bookingService';
import BookingModal from '../../components/tenant/BookingModal';
import { toggleSaveListing, fetchSavedIds } from '../../features/savedListings/savedListingsSlice';

const AMENITY_MAP = {
    fridge: { label: 'Tủ lạnh', icon: Refrigerator },
    air_conditioner: { label: 'Điều hòa', icon: Wind },
    washing_machine: { label: 'Máy giặt', icon: WashingMachine },
    television: { label: 'TV', icon: Tv },
    wifi: { label: 'Wi-Fi', icon: Wifi },
    bed: { label: 'Giường ngủ', icon: BedDouble },
    wardrobe: { label: 'Tủ quần áo', icon: CircleCheck },
    parking: { label: 'Chỗ để xe', icon: CarFront },
    bathroom: { label: 'Phòng tắm riêng', icon: Bath },
    balcony: { label: 'Ban công', icon: Sparkles },
};

const splitImages = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            return value.split(',').map(s => s.trim()).filter(Boolean);
        }
    }
    return [];
};

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

const timeAgo = (dateString) => {
    if (!dateString) return 'Vừa xong';
    const now = new Date();
    const posted = new Date(dateString);
    const diffMs = now - posted;
    if (diffMs < 0) return 'Vừa xong';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
};

const CostEstimator = ({ rentPrice = 0, electricPrice = 0, waterPrice = 0, servicePrice = 0 }) => {
    const isFlatWater = waterPrice > 30000;
    const [electricUsage, setElectricUsage] = useState(90);
    const [waterUsage, setWaterUsage] = useState(5);

    const electricCost = electricUsage * Number(electricPrice || 0);
    const waterCost = isFlatWater ? Number(waterPrice || 0) : waterUsage * Number(waterPrice || 0);

    const total = Number(rentPrice || 0)
        + electricCost
        + waterCost
        + Number(servicePrice || 0);

    return (
        <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dae2ff] text-[#004ac6]">
                    <Calculator size={24} />
                </div>
                <div>
                    <h3 className="text-[24px] font-semibold leading-8 text-[#191b23]">Bộ tính chi phí</h3>
                    <p className="text-[14px] text-[#737686]">Dự tính chi phí hàng tháng</p>
                </div>
            </div>
            <div className="space-y-5">
                <div>
                    <div className="mb-2 flex justify-between text-[14px] text-[#434655]">
                        <span>Điện (Ước tính) <span className="text-gray-400 text-xs font-normal">({formatCurrency(electricPrice)}đ/kWh)</span></span>
                        <span className="font-semibold text-[#191b23]">{electricUsage} kWh</span>
                    </div>
                    <input type="range" min="0" max="500" step="5" value={electricUsage} onChange={(e) => setElectricUsage(Number(e.target.value))} className="w-full accent-[#004ac6]" />
                </div>
                <div>
                    <div className="mb-2 flex justify-between text-[14px] text-[#434655]">
                        <span>Nước {isFlatWater ? '(Cố định)' : '(Ước tính)'} <span className="text-gray-400 text-xs font-normal">({formatCurrency(waterPrice)}đ/{isFlatWater ? 'người' : 'm³'})</span></span>
                        <span className="font-semibold text-[#191b23]">{isFlatWater ? 'Cố định' : `${waterUsage} m³`}</span>
                    </div>
                    <input type="range" min="0" max="30" step="1" value={waterUsage} onChange={(e) => setWaterUsage(Number(e.target.value))} className="w-full accent-[#004ac6] disabled:opacity-50 disabled:cursor-not-allowed" disabled={isFlatWater} />
                </div>
                <div className="space-y-3 border-t border-[#e2e8f0] pt-5 text-[14px]">
                    <div className="flex justify-between text-[#434655]"><span>Tiền thuê phòng</span><span className="font-semibold text-[#191b23]">{formatCurrency(rentPrice)}₫</span></div>
                    <div className="flex justify-between text-[#434655]"><span>Phí dịch vụ cố định</span><span className="font-semibold text-[#191b23]">{formatCurrency(servicePrice)}₫</span></div>
                    {isFlatWater && (
                        <div className="flex justify-between text-[#434655]"><span>Tiền nước cố định</span><span className="font-semibold text-[#191b23]">{formatCurrency(waterPrice)}₫</span></div>
                    )}
                    <div className="flex items-end justify-between border-t border-dashed border-[#c3c6d7] pt-4">
                        <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#737686]">TỔNG CHI PHÍ ƯỚC TÍNH</span>
                        <span className="text-[24px] font-bold tracking-tight text-[#004ac6]">{formatCurrency(total)}₫</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RoomDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { savedIds } = useSelector(state => state.savedListings);

    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [hasBooking, setHasBooking] = useState(false);
    const [vipListings, setVipListings] = useState([]);
    const [allActiveListings, setAllActiveListings] = useState([]);
    const [systemConfigs, setSystemConfigs] = useState({ viewing_deposit_amount: 200000 });

    // Modals & form states
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('Tin có dấu hiệu lừa đảo');
    const [reportDesc, setReportDesc] = useState('');
    const [reportName, setReportName] = useState('');
    const [reportPhone, setReportPhone] = useState('');
    const [captchaChecked, setCaptchaChecked] = useState(false);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success('Đã sao chép đường dẫn tin đăng!');
            setIsShareModalOpen(false);
        } catch (err) {
            toast.error('Không thể sao chép đường dẫn');
        }
    };

    const handleReportSubmit = (e) => {
        e.preventDefault();
        if (!captchaChecked) {
            toast.error('Vui lòng xác thực bạn không phải là robot');
            return;
        }
        toast.success('Gửi phản ánh thành công! Ban quản trị sẽ xác minh tin đăng này.');
        setReportDesc('');
        setReportName('');
        setReportPhone('');
        setCaptchaChecked(false);
        setIsReportModalOpen(false);
    };

    const sameAreaRef = useRef(null);
    const newUpdatedRef = useRef(null);

    const isSaved = listing ? savedIds.includes(listing.listing_id) : false;

    const formatCompactPrice = (price) => {
        const p = Number(price || 0);
        if (p >= 1000000) {
            const millions = p / 1000000;
            const formatted = millions.toFixed(1).replace('.0', '');
            return `${formatted} triệu/tháng`;
        }
        return `${formatCurrency(p)}đ/tháng`;
    };

    const scroll = (ref, direction) => {
        if (ref.current) {
            const scrollAmount = 300;
            ref.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const getDistrict = (address) => {
        if (!address) return '';
        const parts = address.split(',');
        for (const part of parts) {
            const cleanPart = part.trim().toLowerCase();
            if (
                cleanPart.includes('quận') || 
                cleanPart.includes('huyện') || 
                cleanPart.includes('thị xã') ||
                cleanPart.includes('cầu giấy') ||
                cleanPart.includes('đống đa') ||
                cleanPart.includes('thanh xuân') ||
                cleanPart.includes('hai bà trưng') ||
                cleanPart.includes('tây hồ') ||
                cleanPart.includes('bình thạnh') ||
                cleanPart.includes('tân bình') ||
                cleanPart.includes('gò vấp') ||
                cleanPart.includes('thủ đức')
            ) {
                return part.trim();
            }
        }
        return '';
    };

    const getProvince = (address) => {
        if (!address) return '';
        const cleanAddr = address.toLowerCase();
        if (cleanAddr.includes('hà nội') || cleanAddr.includes('ha noi')) return 'Hà Nội';
        if (cleanAddr.includes('hồ chí minh') || cleanAddr.includes('hcm') || cleanAddr.includes('sài gòn') || cleanAddr.includes('sai gon')) return 'Hồ Chí Minh';
        if (cleanAddr.includes('đà nẵng') || cleanAddr.includes('da nang')) return 'Đà Nẵng';
        return '';
    };

    const sameAreaListings = useMemo(() => {
        if (!listing || !allActiveListings.length) return [];
        const district = getDistrict(listing.address);
        const province = getProvince(listing.address);
        
        let filtered = allActiveListings.filter(item => 
            item.room_id !== listing.room_id && 
            district && 
            (item.address || '').toLowerCase().includes(district.toLowerCase())
        );
        if (filtered.length === 0) {
            filtered = allActiveListings.filter(item => 
                item.room_id !== listing.room_id && 
                province && 
                (item.address || '').toLowerCase().includes(province.toLowerCase())
            );
        }
        return filtered;
    }, [listing, allActiveListings]);

    const newListings = useMemo(() => {
        if (!listing || !allActiveListings.length) return [];
        return allActiveListings
            .filter(item => item.room_id !== listing.room_id)
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }, [listing, allActiveListings]);

    useEffect(() => {
        if (user && (user.role === 'tenant' || user.role === 'guest')) {
            dispatch(fetchSavedIds());
        }
    }, [dispatch, user]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [data, configs, allListings] = await Promise.all([
                    listingService.getListingByRoom(id),
                    listingService.getPublicSystemConfigs().catch(() => null),
                    listingService.getActiveListings().catch(() => []),
                ]);

                setListing(data);
                if (configs) setSystemConfigs(configs);
                if (data?.listing_id) listingService.incrementView(data.listing_id).catch(() => {});
                if (Array.isArray(allListings)) {
                    setAllActiveListings(allListings);
                    let vips = allListings.filter(item => item.room_id !== Number(id) && item.premium_until && new Date(item.premium_until) > new Date());
                    if (vips.length < 3) {
                        const nonVips = allListings.filter(item => item.room_id !== Number(id) && !(item.premium_until && new Date(item.premium_until) > new Date()));
                        vips = [...vips, ...nonVips];
                    }
                    setVipListings(vips.slice(0, 6));
                }
            } catch (error) {
                console.error('Error fetching listing details:', error);
                toast.error('Không thể tải chi tiết tin đăng');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    useEffect(() => {
        const check = async () => {
            if (!user || (user.role !== 'tenant' && user.role !== 'guest') || !listing) return;
            try {
                const result = await bookingService.checkRoomBookingStatus(listing.room_id);
                setHasBooking(Boolean(result?.hasBooking));
            } catch (error) {
                console.error('Error checking booking status:', error);
            }
        };
        check();
    }, [user, listing]);

    const images = useMemo(() => {
        const imgs = splitImages(listing?.images);
        return imgs.length > 0 ? imgs : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2670&auto=format&fit=crop'];
    }, [listing]);

    const amenities = useMemo(() => {
        try {
            return typeof listing?.amenities === 'string' ? JSON.parse(listing.amenities) : (listing?.amenities || {});
        } catch {
            return {};
        }
    }, [listing]);

    const handleBooking = () => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để đặt lịch xem phòng');
            navigate('/login', { state: { from: location } });
            return;
        }
        if (user.role !== 'tenant' && user.role !== 'guest') {
            toast.error('Chức năng này chỉ dành cho người thuê.');
            return;
        }
        setIsBookingModalOpen(true);
    };

    const handleToggleSave = async () => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để lưu tin');
            navigate('/login', { state: { from: location } });
            return;
        }
        try {
            await dispatch(toggleSaveListing(listing.listing_id)).unwrap();
        } catch {
            toast.error('Có lỗi xảy ra');
        }
    };

    if (loading) return <div className="flex min-h-[400px] items-center justify-center bg-[#faf8ff]"><div className="h-10 w-10 animate-spin rounded-full border-2 border-[#004ac6] border-t-transparent" /></div>;
    if (!listing) return <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 bg-[#faf8ff] px-4 text-center"><TriangleAlert size={40} className="text-amber-500" /><h2 className="text-[24px] font-semibold text-[#191b23]">Không tìm thấy phòng trọ này</h2><Link to="/tenant/discover" className="rounded-[8px] bg-[#004ac6] px-5 py-3 text-[14px] font-semibold text-white">Quay lại tìm kiếm</Link></div>;

    const isVip = listing.premium_until && new Date(listing.premium_until) > new Date();
    const tags = [listing.category_name || 'Master Suite', listing.building_name || 'Vinhomes Central Park', listing.address || 'District 1, HCMC'];
    const stats = [
        { label: 'Giá thuê hàng tháng', value: `${formatCurrency(listing.rent_price)} VNĐ`, accent: true },
        { label: 'Diện tích', value: `${listing.area || '—'} m²` },
        { label: 'Tiền đặt cọc', value: `${formatCurrency(listing.deposit_amount || systemConfigs.viewing_deposit_amount)} VNĐ` },
        { label: 'Số người ở', value: `Tối đa ${listing.max_occupants || 2} người` },
    ];
    const amenityEntries = Object.entries(amenities).filter(([, value]) => Boolean(value));

    return (
        <div className="min-h-screen bg-[#faf8ff] text-[#191b23]">
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
            <header className="sticky top-0 z-50 border-b border-[#c3c6d7] bg-[#faf8ff]">
                <nav className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-8">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex flex-col items-start min-w-fit group shrink-0">
                            <div className="flex items-center">
                                <span className="text-2xl font-black tracking-tighter uppercase text-indigo-600">PropTech</span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight -mt-1 hidden md:block">Nền tảng thuê phòng thông minh</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                        {(!user || user.role === 'tenant' || user.role === 'guest') && (
                            <>
                                <Link to="/tenant/saved" className="hidden sm:flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] px-4 py-2 text-[14px] font-medium text-[#191b23] transition-colors hover:border-[#004ac6] hover:text-[#004ac6]">
                                    <Heart size={16} className="text-[#ba1a1a]" />
                                    <span className="hidden md:inline">Tin đã lưu</span>
                                    {savedIds.length > 0 && <span className="ml-1 rounded-full bg-[#ba1a1a] px-2 py-0.5 text-[11px] font-bold text-white">{savedIds.length}</span>}
                                </Link>
                                <Link to="/tenant/bookings" className="hidden sm:flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] px-4 py-2 text-[14px] font-medium text-[#191b23] transition-colors hover:border-[#004ac6] hover:text-[#004ac6]">
                                    <Calendar size={16} className="text-[#737686]" />
                                    <span className="hidden md:inline">Lịch hẹn</span>
                                </Link>
                            </>
                        )}
                        {user ? (
                            <>
                                <Link to={`/${user.role === 'guest' ? 'tenant' : user.role}/profile`} className="flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-2 text-[14px] font-medium text-[#191b23] hover:border-[#004ac6] hover:text-[#004ac6]">
                                    <User size={16} /> <span className="hidden md:inline">{user.full_name || user.fullName || 'Tài khoản'}</span>
                                </Link>
                                <button onClick={async () => { await dispatch(logout()); dispatch(reset()); navigate('/'); }} className="rounded-[8px] bg-[#0c1a3a] px-6 py-2 text-[14px] font-medium text-white hover:opacity-90">
                                    Đăng xuất
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="rounded-[8px] px-4 py-2 text-[14px] font-medium text-[#191b23] hover:bg-[#f3f3fe]">Đăng nhập</Link>
                                <Link to="/register" className="rounded-[8px] bg-[#2563eb] px-6 py-2 text-[14px] font-medium text-white shadow-sm transition-opacity hover:opacity-90">Đăng ký</Link>
                            </>
                        )}
                    </div>
                </nav>
                <div className="border-t border-[#c3c6d7]/40 bg-white">
                    <div className="mx-auto max-w-[1280px] px-4 md:px-8 py-2.5 flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth">
                        {[
                            { id: '1', name: 'Phòng trọ' },
                            { id: '3', name: 'Nhà nguyên căn' },
                            { id: '2', name: 'Căn hộ chung cư' },
                            { id: '8', name: 'Căn hộ mini' },
                            { id: '12', name: 'Căn hộ dịch vụ' },
                            { id: '5', name: 'Ở ghép' },
                            { id: '4', name: 'Mặt bằng' },
                            { id: 'pricing', name: 'Bảng giá dịch vụ' }
                        ].map(cat => {
                            const targetUrl = cat.id === 'pricing' 
                                ? '/services-price' 
                                : `/tenant/discover?category=${cat.id}`;
                            return (
                                <Link 
                                    key={cat.id} 
                                    className="text-[13px] font-bold text-[#434655] hover:text-[#004ac6] transition-colors whitespace-nowrap py-1" 
                                    to={targetUrl}
                                >
                                    {cat.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <button onClick={() => navigate('/tenant/discover')} className="flex items-center gap-2 text-[#434655] hover:text-[#004ac6]">
                        <ArrowLeft size={18} />
                        <span className="text-[14px] font-medium">Quay lại danh sách</span>
                    </button>
                    <div className="flex gap-3">
                        <button onClick={() => setIsReportModalOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-full border border-red-200 text-red-500 hover:bg-red-50" title="Báo cáo xấu">
                            <TriangleAlert size={18} />
                        </button>
                        <button onClick={() => setIsShareModalOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c3c6d7] text-[#434655] hover:bg-[#ededf9]" title="Chia sẻ"><Share2 size={18} /></button>
                        <button onClick={handleToggleSave} className={`flex h-10 w-10 items-center justify-center rounded-full border ${isSaved ? 'border-[#ba1a1a] bg-[#ba1a1a] text-white' : 'border-[#c3c6d7] text-[#434655] hover:bg-[#ededf9]'}`}>
                            <Heart size={18} className={isSaved ? 'fill-white' : ''} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6 items-start">
                    <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-8">
                        <section className="space-y-4">
                            <div className="aspect-[16/9] w-full overflow-hidden rounded-[14px] border border-[#c3c6d7] bg-[#ededf9]">
                                <img className="h-full w-full object-cover cursor-zoom-in" src={images[activeImage]} alt={listing.title} onClick={() => setShowLightbox(true)} />
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                {images.slice(0, 4).map((img, idx) => (
                                    <button key={idx} onClick={() => setActiveImage(idx)} className={`aspect-square overflow-hidden rounded-[8px] border ${activeImage === idx ? 'border-[#004ac6] ring-2 ring-[#004ac6]/20' : 'border-[#c3c6d7] opacity-70 hover:opacity-100'}`}>
                                        <img src={img} className="h-full w-full object-cover" alt="" />
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section>
                            <div className="mb-4 flex flex-wrap gap-2">
                                {tags.map(tag => <span key={tag} className="rounded-full bg-[#ededf9] px-3 py-1 text-[12px] font-medium text-[#4e5b7e]">{tag}</span>)}
                            </div>
                            <h1 className="mb-6 text-[30px] font-semibold leading-10 text-[#191b23] md:text-[36px] md:leading-[44px]">{listing.title}</h1>
                            <div className="grid grid-cols-2 gap-6 border-y border-[#c3c6d7] py-6 md:grid-cols-4">
                                {stats.map(stat => (
                                    <div key={stat.label} className="flex flex-col">
                                        <span className="mb-1 text-[12px] font-medium uppercase tracking-wider text-[#434655]">{stat.label}</span>
                                        <span className={`text-[24px] font-semibold ${stat.accent ? 'text-[#004ac6]' : 'text-[#191b23]'}`}>{stat.value}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="mb-4 text-[24px] font-semibold text-[#191b23]">Mô tả chi tiết</h2>
                            <p className="text-[16px] leading-7 text-[#434655] whitespace-pre-line">{listing.description || 'Chủ nhà chưa cập nhật mô tả.'}</p>
                            <button className="mt-4 flex items-center gap-1 text-[14px] font-medium text-[#004ac6]">
                                Xem thêm <ChevronRight size={18} />
                            </button>
                        </section>

                        <section>
                            <h2 className="mb-6 text-[24px] font-semibold text-[#191b23]">Tiện nghi căn hộ</h2>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                {amenityEntries.length > 0 ? amenityEntries.map(([key]) => {
                                    const meta = AMENITY_MAP[key] || { label: key, icon: CircleCheck };
                                    const Icon = meta.icon;
                                    return (
                                        <div key={key} className="flex items-center gap-3 rounded-[14px] border border-[#c3c6d7] bg-[#f3f3fe] p-4">
                                            <Icon size={18} className="text-[#004ac6]" />
                                            <span className="text-[14px] font-medium text-[#191b23]">{meta.label}</span>
                                        </div>
                                    );
                                }) : <p className="text-[14px] text-[#737686]">Chưa có tiện nghi được cập nhật.</p>}
                            </div>
                        </section>

                        <section>
                            <h2 className="mb-4 text-[24px] font-semibold text-[#191b23]">Vị trí bản đồ</h2>
                            <div className="relative h-80 overflow-hidden rounded-[14px] border border-[#c3c6d7] bg-[#ededf9]">
                                <iframe
                                    title="map"
                                    width="100%"
                                    height="100%"
                                    loading="lazy"
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(listing.address || 'Vietnam')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                />
                                <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                                    <div className="rounded-full bg-[#004ac6] p-3 text-white shadow-lg"><MapPin size={18} /></div>
                                    <div className="mt-2 rounded-[8px] border border-[#c3c6d7] bg-white px-3 py-1 text-[12px] font-medium text-[#434655]">{listing.building_name || listing.address || 'Vị trí tin đăng'}</div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-6 lg:sticky lg:top-24">
                        <aside className="space-y-6 mb-8">
                            <h3 className="text-[18px] font-semibold text-[#191b23]">Tin nổi bật</h3>
                            <div className="space-y-4">
                                {vipListings.slice(0, 3).map(vip => {
                                    const vipImages = splitImages(vip.images);
                                    const cover = vipImages[0] || images[0];
                                    return (
                                        <Link key={vip.listing_id} to={`/tenant/room/${vip.room_id}`} className="flex gap-3 rounded-[14px] border border-[#c3c6d7] bg-white p-2 hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] hover:border-[#004ac6] transition-all block">
                                            <img alt="Featured property" className="h-16 w-16 rounded-[8px] object-cover shrink-0" src={cover} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="truncate text-[14px] font-semibold text-[#191b23] hover:text-[#004ac6]">{vip.title}</h4>
                                                    <span className="rounded-full bg-[#004ac6] px-1.5 py-0.5 text-[8px] font-bold uppercase text-white shrink-0">Mới</span>
                                                </div>
                                                <div className="flex items-center justify-between mt-1 text-[12px]">
                                                    <span className="font-bold text-[#004ac6]">{formatCurrency(vip.rent_price)} đ</span>
                                                    <span className="text-gray-400 font-medium text-[11px]">{timeAgo(vip.created_at)}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </aside>

                        <CostEstimator
                            rentPrice={listing.rent_price}
                            electricPrice={listing.electricity_price}
                            waterPrice={listing.water_price}
                            servicePrice={listing.service_price}
                        />

                        <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-6 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)]">
                            <div className="mb-8 flex items-center gap-4">
                                <div className="h-16 w-16 overflow-hidden rounded-full border border-[#c3c6d7] bg-[#f3f3fe]">
                                    <img className="h-full w-full object-cover" src={listing.landlord_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.landlord_name || 'Host')}&background=004ac6&color=fff`} alt="landlord" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="truncate text-[20px] font-semibold text-[#191b23]">{listing.landlord_name || 'Minh Nguyen'}</h4>
                                    <div className="mt-1 flex items-center gap-1 text-[#943700]">
                                        <Star size={16} fill="currentColor" />
                                        <span className="text-[14px] font-medium">4.9 (42 đánh giá)</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <button onClick={handleBooking} disabled={hasBooking} className={`flex w-full items-center justify-center gap-2 rounded-[14px] px-4 py-4 text-[14px] font-semibold transition-colors ${hasBooking ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-[#2563eb] text-white hover:opacity-90'}`}>
                                    <Calendar size={18} /> Đặt lịch & Đặt cọc
                                </button>
                                <div className="grid grid-cols-2 gap-3">
                                    <a href={`tel:${listing.landlord_phone || ''}`} className="flex items-center justify-center gap-2 rounded-[14px] border border-[#c3c6d7] px-4 py-3 text-[14px] font-semibold text-[#004ac6] hover:bg-[#f3f3fe]">
                                        <Phone size={18} /> Gọi điện
                                    </a>
                                    <button className="flex items-center justify-center gap-2 rounded-[14px] border border-[#c3c6d7] px-4 py-3 text-[14px] font-semibold text-[#004ac6] hover:bg-[#f3f3fe]">
                                        <MessageCircle size={18} /> Zalo
                                    </button>
                                </div>
                            </div>
                            <p className="mt-4 text-center text-[12px] font-medium text-[#737686]">Chủ nhà xác thực từ 2021</p>
                        </div>
                    </div>
                </div>

                {/* Horizontal sliders */}
                <div className="border-t border-[#e2e8f0] pt-10 mt-12 space-y-12">
                    <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
                    
                    {/* Tin cùng khu vực */}
                    {sameAreaListings.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-[22px] font-bold text-[#191b23]">Tin đăng cùng khu vực</h2>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => scroll(sameAreaRef, 'left')} 
                                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c3c6d7] text-gray-600 hover:bg-gray-100 hover:text-black hover:border-black transition-all cursor-pointer"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button 
                                        onClick={() => scroll(sameAreaRef, 'right')} 
                                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c3c6d7] text-gray-600 hover:bg-gray-100 hover:text-black hover:border-black transition-all cursor-pointer"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                            <div ref={sameAreaRef} className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4">
                                {sameAreaListings.map(item => {
                                    const itemImages = splitImages(item.images);
                                    const cover = itemImages[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600';
                                    return (
                                        <div key={item.listing_id} className="w-[calc((100%-72px)/4)] min-w-[260px] lg:min-w-[calc((100%-72px)/4)] flex-shrink-0 group">
                                            <Link to={`/tenant/room/${item.room_id}`} className="block">
                                                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 mb-3 shadow-sm border border-gray-100">
                                                    <img src={cover} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                                        📷 {itemImages.length}
                                                    </div>
                                                </div>
                                                <h4 className="text-[15px] font-bold text-[#004ac6] hover:underline line-clamp-2 leading-snug mb-1 transition-colors min-h-[40px]">
                                                    {item.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[15px] font-bold text-[#10b981]">
                                                        {formatCompactPrice(item.rent_price)}
                                                    </span>
                                                    <span className="text-gray-300">·</span>
                                                    <span className="text-[13px] font-medium text-gray-500">
                                                        {item.area}m²
                                                    </span>
                                                </div>
                                                <p className="text-[12px] text-gray-400 line-clamp-1">
                                                    {item.address || 'Khu vực trung tâm'}
                                                </p>
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tin mới cập nhật */}
                    {newListings.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-[22px] font-bold text-[#191b23]">Tin đăng mới cập nhật</h2>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => scroll(newUpdatedRef, 'left')} 
                                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c3c6d7] text-gray-600 hover:bg-gray-100 hover:text-black hover:border-black transition-all cursor-pointer"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button 
                                        onClick={() => scroll(newUpdatedRef, 'right')} 
                                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c3c6d7] text-gray-600 hover:bg-gray-100 hover:text-black hover:border-black transition-all cursor-pointer"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                            <div ref={newUpdatedRef} className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4">
                                {newListings.map(item => {
                                    const itemImages = splitImages(item.images);
                                    const cover = itemImages[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600';
                                    return (
                                        <div key={item.listing_id} className="w-[calc((100%-72px)/4)] min-w-[260px] lg:min-w-[calc((100%-72px)/4)] flex-shrink-0 group">
                                            <Link to={`/tenant/room/${item.room_id}`} className="block">
                                                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 mb-3 shadow-sm border border-gray-100">
                                                    <img src={cover} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                                        📷 {itemImages.length}
                                                    </div>
                                                </div>
                                                <h4 className="text-[15px] font-bold text-[#004ac6] hover:underline line-clamp-2 leading-snug mb-1 transition-colors min-h-[40px]">
                                                    {item.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[15px] font-bold text-[#10b981]">
                                                        {formatCompactPrice(item.rent_price)}
                                                    </span>
                                                    <span className="text-gray-300">·</span>
                                                    <span className="text-[13px] font-medium text-gray-500">
                                                        {item.area}m²
                                                    </span>
                                                </div>
                                                <p className="text-[12px] text-gray-400 line-clamp-1">
                                                    {item.address || 'Khu vực trung tâm'}
                                                </p>
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </main>
            {showLightbox && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4" onClick={() => setShowLightbox(false)}>
                    <button className="absolute right-6 top-6 text-white/70 hover:text-white" onClick={() => setShowLightbox(false)}>
                        <TriangleAlert className="rotate-45" size={40} />
                    </button>
                    <div className="relative max-h-[85vh] max-w-[1100px]" onClick={(e) => e.stopPropagation()}>
                        <img src={images[activeImage]} alt="preview" className="max-h-[85vh] w-full rounded-[14px] object-contain" />
                        <button onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev - 1 + images.length) % images.length); }} className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev + 1) % images.length); }} className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {listing && (
                <BookingModal
                    isOpen={isBookingModalOpen}
                    onClose={() => setIsBookingModalOpen(false)}
                    roomId={listing.room_id}
                    roomNumber={listing.room_number}
                    buildingName={listing.building_name}
                    onSuccess={async () => {
                        try {
                            const result = await bookingService.checkRoomBookingStatus(listing.room_id);
                            setHasBooking(Boolean(result?.hasBooking));
                        } catch {
                            // ignore
                        }
                    }}
                />
            )}

            {/* Share Modal */}
            {isShareModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-[450px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                            <h3 className="text-[20px] font-bold text-gray-900">Chia sẻ</h3>
                            <button onClick={() => setIsShareModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-1">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm font-semibold text-gray-700">Chia sẻ đường dẫn tin đăng</p>
                            <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-600 break-all select-all font-mono leading-relaxed">
                                {window.location.href}
                            </div>
                            <button 
                                onClick={handleCopyLink}
                                className="w-full bg-[#f75b00] hover:bg-[#e05200] text-white py-3.5 rounded-xl font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 active:scale-98"
                            >
                                <Copy size={16} /> Sao chép
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {isReportModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                            <h3 className="text-[20px] font-bold text-gray-900">Phản ánh tin đăng</h3>
                            <button onClick={() => setIsReportModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-1">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleReportSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Lý do phản ánh:</label>
                                <div className="space-y-2">
                                    {[
                                        'Tin có dấu hiệu lừa đảo',
                                        'Tin trùng lặp nội dung',
                                        'Không liên hệ được chủ tin đăng',
                                        'Thông tin không đúng thực tế (giá, diện tích, hình ảnh...)',
                                        'Lý do khác'
                                    ].map((reason, index) => (
                                        <label key={index} className="flex items-center gap-3 cursor-pointer select-none">
                                            <input 
                                                type="radio" 
                                                name="reportReason" 
                                                value={reason} 
                                                checked={reportReason === reason} 
                                                onChange={() => setReportReason(reason)}
                                                className="h-4.5 w-4.5 border-gray-300 text-blue-600 focus:ring-blue-500" 
                                            />
                                            <span className="text-sm font-semibold text-gray-700">{reason}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <textarea 
                                    rows="3" 
                                    placeholder="Mô tả thêm" 
                                    value={reportDesc} 
                                    onChange={(e) => setReportDesc(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-400"
                                />
                            </div>

                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                <h4 className="text-sm font-bold text-gray-800">Thông tin liên hệ</h4>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Họ tên của bạn</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={reportName} 
                                        onChange={(e) => setReportName(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Số điện thoại của bạn</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={reportPhone} 
                                        onChange={(e) => setReportPhone(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex items-center justify-between border border-gray-200 rounded-lg p-3 bg-gray-50 max-w-[300px]">
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="checkbox" 
                                            id="captcha-check" 
                                            checked={captchaChecked} 
                                            onChange={(e) => setCaptchaChecked(e.target.checked)} 
                                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                                        />
                                        <label htmlFor="captcha-check" className="text-xs font-bold text-gray-600 cursor-pointer select-none">
                                            I'm not a robot
                                        </label>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" className="w-8 h-8 object-contain" alt="reCAPTCHA" />
                                        <span className="text-[8px] text-gray-400 font-bold mt-1">reCAPTCHA</span>
                                        <div className="flex gap-1 text-[7px] text-gray-400">
                                            <a href="#" className="hover:underline">Privacy</a>
                                            <span>-</span>
                                            <a href="#" className="hover:underline">Terms</a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button 
                                    type="submit" 
                                    className="w-full bg-[#f75b00] hover:bg-[#e05200] text-white py-3.5 rounded-xl font-bold text-sm transition shadow-lg active:scale-98"
                                >
                                    Gửi phản ánh
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomDetail;
