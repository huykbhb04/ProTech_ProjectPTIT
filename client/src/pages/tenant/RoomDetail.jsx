import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import listingService from '../../services/listingService';
import bookingService from '../../services/bookingService';
import BookingModal from '../../components/tenant/BookingModal';
import { toggleSaveListing } from '../../features/savedListings/savedListingsSlice';

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

const CostEstimator = ({ rentPrice = 0, electricPrice = 0, waterPrice = 0, servicePrice = 0 }) => {
    const [electricUsage, setElectricUsage] = useState(50);
    const [waterUsage, setWaterUsage] = useState(4);

    const total = Number(rentPrice || 0)
        + electricUsage * Number(electricPrice || 0)
        + waterUsage * Number(waterPrice || 0)
        + Number(servicePrice || 0);

    return (
        <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dae2ff] text-[#004ac6]">
                    <Calculator size={24} />
                </div>
                <div>
                    <h3 className="text-[24px] font-semibold leading-8 text-[#191b23]">Cost Estimator</h3>
                    <p className="text-[14px] text-[#737686]">Dự tính chi phí hàng tháng</p>
                </div>
            </div>
            <div className="space-y-5">
                <div>
                    <div className="mb-2 flex justify-between text-[14px] text-[#434655]">
                        <span>Electricity (Est.)</span>
                        <span className="font-semibold text-[#191b23]">{electricUsage} kWh</span>
                    </div>
                    <input type="range" min="0" max="500" step="5" value={electricUsage} onChange={(e) => setElectricUsage(Number(e.target.value))} className="w-full accent-[#004ac6]" />
                </div>
                <div>
                    <div className="mb-2 flex justify-between text-[14px] text-[#434655]">
                        <span>Water (Est.)</span>
                        <span className="font-semibold text-[#191b23]">{waterUsage} m³</span>
                    </div>
                    <input type="range" min="0" max="30" step="1" value={waterUsage} onChange={(e) => setWaterUsage(Number(e.target.value))} className="w-full accent-[#004ac6]" />
                </div>
                <div className="space-y-3 border-t border-[#e2e8f0] pt-5 text-[14px]">
                    <div className="flex justify-between text-[#434655]"><span>Monthly Rent</span><span className="font-semibold text-[#191b23]">{formatCurrency(rentPrice)}₫</span></div>
                    <div className="flex justify-between text-[#434655]"><span>Fixed Service</span><span className="font-semibold text-[#191b23]">{formatCurrency(servicePrice)}₫</span></div>
                    <div className="flex items-end justify-between border-t border-dashed border-[#c3c6d7] pt-4">
                        <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#737686]">Estimated Total</span>
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
    const [systemConfigs, setSystemConfigs] = useState({ viewing_deposit_amount: 200000 });

    const isSaved = listing ? savedIds.includes(listing.listing_id) : false;

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
                    const vips = allListings.filter(item => item.room_id !== Number(id) && item.premium_until && new Date(item.premium_until) > new Date());
                    setVipListings(vips.slice(0, 4));
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
            if (!user || user.role !== 'tenant' || !listing) return;
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
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        if (user.role !== 'tenant') {
            toast.error('Chức năng này chỉ dành cho người thuê.');
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
        } catch {
            toast.error('Có lỗi xảy ra');
        }
    };

    if (loading) return <div className="flex min-h-[400px] items-center justify-center bg-[#faf8ff]"><div className="h-10 w-10 animate-spin rounded-full border-2 border-[#004ac6] border-t-transparent" /></div>;
    if (!listing) return <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 bg-[#faf8ff] px-4 text-center"><TriangleAlert size={40} className="text-amber-500" /><h2 className="text-[24px] font-semibold text-[#191b23]">Không tìm thấy phòng trọ này</h2><Link to="/tenant/discover" className="rounded-[8px] bg-[#004ac6] px-5 py-3 text-[14px] font-semibold text-white">Quay lại tìm kiếm</Link></div>;

    const isVip = listing.premium_until && new Date(listing.premium_until) > new Date();
    const tags = [listing.category_name || 'Master Suite', listing.building_name || 'Vinhomes Central Park', listing.address || 'District 1, HCMC'];
    const stats = [
        { label: 'Monthly Price', value: `${formatCurrency(listing.rent_price)} VNĐ`, accent: true },
        { label: 'Area', value: `${listing.area || '—'} m²` },
        { label: 'Deposit', value: `${formatCurrency(listing.deposit_amount || systemConfigs.viewing_deposit_amount)} VNĐ` },
        { label: 'Residents', value: `Max ${listing.max_occupants || 2}` },
    ];
    const amenityEntries = Object.entries(amenities).filter(([, value]) => Boolean(value));

    return (
        <div className="min-h-screen bg-[#faf8ff] text-[#191b23]">
            <header className="sticky top-0 z-50 border-b border-[#c3c6d7] bg-[#faf8ff]">
                <nav className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-8">
                    <div className="flex items-center gap-8">
                        <span className="text-[24px] font-bold text-[#0c1a3a]">PropTech</span>
                        <div className="hidden md:flex gap-6">
                            <a className="text-[14px] font-medium text-[#434655] hover:text-[#004ac6]" href="#">Listings</a>
                            <a className="text-[14px] font-medium text-[#434655] hover:text-[#004ac6]" href="#">Communities</a>
                            <a className="text-[14px] font-medium text-[#434655] hover:text-[#004ac6]" href="#">Services</a>
                            <a className="text-[14px] font-medium text-[#434655] hover:text-[#004ac6]" href="#">Help</a>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <Link to={`/${user.role}/profile`} className="flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-2 text-[14px] font-medium text-[#191b23] hover:border-[#004ac6] hover:text-[#004ac6]">
                                    <User size={16} /> {user.full_name || user.fullName || 'Tài khoản'}
                                </Link>
                                <button onClick={async () => { await dispatch(logout()); dispatch(reset()); navigate('/'); }} className="rounded-[8px] bg-[#0c1a3a] px-6 py-2 text-[14px] font-medium text-white hover:opacity-90">
                                    Đăng xuất
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-[14px] font-medium text-[#434655] hover:text-[#004ac6]">Sign In</Link>
                                <Link to="/register" className="rounded-[8px] bg-[#2563eb] px-6 py-2 text-[14px] font-medium text-white">Sign Up</Link>
                            </>
                        )}
                    </div>
                </nav>
            </header>

            <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <button onClick={() => navigate('/tenant/discover')} className="flex items-center gap-2 text-[#434655] hover:text-[#004ac6]">
                        <ArrowLeft size={18} />
                        <span className="text-[14px] font-medium">Back to Listings</span>
                    </button>
                    <div className="flex gap-3">
                        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c3c6d7] text-[#434655] hover:bg-[#ededf9]"><Share2 size={18} /></button>
                        <button onClick={handleToggleSave} className={`flex h-10 w-10 items-center justify-center rounded-full border ${isSaved ? 'border-[#ba1a1a] bg-[#ba1a1a] text-white' : 'border-[#c3c6d7] text-[#434655] hover:bg-[#ededf9]'}`}>
                            <Heart size={18} className={isSaved ? 'fill-white' : ''} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6 items-start">
                    <aside className="hidden xl:block xl:col-span-2 space-y-6">
                        <h3 className="text-[18px] font-semibold text-[#191b23]">Tin được quảng cáo</h3>
                        <div className="space-y-4">
                            {vipListings.slice(0, 3).map(vip => {
                                const vipImages = splitImages(vip.images);
                                const cover = vipImages[0] || images[0];
                                return (
                                    <Link key={vip.listing_id} to={`/tenant/room/${vip.room_id}`} className="block overflow-hidden rounded-[14px] border border-[#c3c6d7] bg-white hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)]">
                                        <img alt="Promoted property" className="h-24 w-full object-cover" src={cover} />
                                        <div className="space-y-1 p-3">
                                            <span className="text-[10px] font-bold uppercase text-[#004ac6]">Quảng cáo</span>
                                            <h4 className="line-clamp-1 text-[14px] font-medium text-[#191b23]">{vip.title}</h4>
                                            <p className="text-[14px] font-bold text-[#004ac6]">{formatCurrency(vip.rent_price)} VNĐ</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </aside>

                    <div className="col-span-12 lg:col-span-8 xl:col-span-7 space-y-8">
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
                            <h2 className="mb-4 text-[24px] font-semibold text-[#191b23]">Description</h2>
                            <p className="text-[16px] leading-7 text-[#434655] whitespace-pre-line">{listing.description || 'Chủ nhà chưa cập nhật mô tả.'}</p>
                            <button className="mt-4 flex items-center gap-1 text-[14px] font-medium text-[#004ac6]">
                                See more <ChevronRight size={18} />
                            </button>
                        </section>

                        <section>
                            <h2 className="mb-6 text-[24px] font-semibold text-[#191b23]">Amenities</h2>
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
                            <h2 className="mb-4 text-[24px] font-semibold text-[#191b23]">Location</h2>
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
                                {vipListings.slice(0, 2).map(vip => {
                                    const vipImages = splitImages(vip.images);
                                    const cover = vipImages[0] || images[0];
                                    return (
                                        <div key={vip.listing_id} className="flex gap-3 rounded-[14px] border border-[#c3c6d7] bg-white p-2 hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)]">
                                            <img alt="Featured property" className="h-16 w-16 rounded-[8px] object-cover" src={cover} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="truncate text-[14px] font-medium text-[#191b23]">{vip.title}</h4>
                                                    <span className="rounded-full bg-[#004ac6] px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">New</span>
                                                </div>
                                                <p className="text-[14px] font-bold text-[#004ac6]">{formatCurrency(vip.rent_price)} VNĐ</p>
                                            </div>
                                        </div>
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
                                        <span className="text-[14px] font-medium">4.9 (42 reviews)</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <button onClick={handleBooking} disabled={hasBooking} className={`flex w-full items-center justify-center gap-2 rounded-[14px] px-4 py-4 text-[14px] font-semibold transition-colors ${hasBooking ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-[#2563eb] text-white hover:opacity-90'}`}>
                                    <Calendar size={18} /> Book & Deposit
                                </button>
                                <div className="grid grid-cols-2 gap-3">
                                    <a href={`tel:${listing.landlord_phone || ''}`} className="flex items-center justify-center gap-2 rounded-[14px] border border-[#c3c6d7] px-4 py-3 text-[14px] font-semibold text-[#004ac6] hover:bg-[#f3f3fe]">
                                        <Phone size={18} /> Call
                                    </a>
                                    <button className="flex items-center justify-center gap-2 rounded-[14px] border border-[#c3c6d7] px-4 py-3 text-[14px] font-semibold text-[#004ac6] hover:bg-[#f3f3fe]">
                                        <MessageCircle size={18} /> Zalo
                                    </button>
                                </div>
                            </div>
                            <p className="mt-4 text-center text-[12px] font-medium text-[#737686]">Verified Landlord since 2021</p>
                        </div>
                    </div>
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
        </div>
    );
};

export default RoomDetail;
