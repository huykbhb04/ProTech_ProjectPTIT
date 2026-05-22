import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  Award,
  BadgeCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Heart,
  Home,
  LogOut,
  MapPin,
  MoveRight,
  ParkingCircle,
  Refrigerator,
  Ruler,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  User,
  WashingMachine,
  Wifi,
  Wind,
} from 'lucide-react';
import api from '../../services/api';
import listingService from '../../services/listingService';
import { toggleSaveListing } from '../../features/savedListings/savedListingsSlice';
import { logout, reset } from '../../features/auth/authSlice';

const PRICE_RANGES = [
  { id: 'all', label: 'Mọi mức giá' },
  { id: 'under_3', label: 'Dưới 3 triệu', min: 0, max: 3000000 },
  { id: '3_to_5', label: '3 - 5 triệu', min: 3000000, max: 5000000 },
  { id: '5_to_10', label: '5 - 10 triệu', min: 5000000, max: 10000000 },
  { id: '10_to_20', label: '10 - 20 triệu', min: 10000000, max: 20000000 },
  { id: 'over_20', label: 'Trên 20 triệu', min: 20000000, max: Infinity },
];

const ROOM_TYPES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'apartment', label: 'Căn hộ' },
  { id: 'room', label: 'Phòng trọ' },
  { id: 'studio', label: 'Studio' },
  { id: 'house', label: 'Nhà nguyên căn' },
];

const AMENITIES = [
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'air_conditioner', label: 'Điều hòa', icon: Wind },
  { id: 'refrigerator', label: 'Tủ lạnh', icon: Refrigerator },
  { id: 'washing_machine', label: 'Máy giặt', icon: WashingMachine },
  { id: 'parking', label: 'Để xe', icon: ParkingCircle },
];

const COMMITMENTS = [
  { icon: BadgeCheck, title: 'Thông tin xác thực', desc: 'Tin đăng được kiểm duyệt trước khi hiển thị.' },
  { icon: Clock3, title: 'Hỗ trợ 24/7', desc: 'Đội ngũ hỗ trợ sẵn sàng trong quá trình thuê.' },
  { icon: ShieldCheck, title: 'Hợp đồng pháp lý', desc: 'Quy trình an toàn cho thuê dài hạn và ngắn hạn.' },
  { icon: Award, title: 'Thủ tục nhanh gọn', desc: 'Đặt lịch, giữ phòng và xác nhận thuê nhanh.' },
];

const defaultHeroImage = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2670&auto=format&fit=crop';

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

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

const ListingCard = ({ item, saved, onToggleSave }) => {
  const images = splitImages(item.images);
  const cover = images[0] || defaultHeroImage;
  const isVip = item.premium_until && new Date(item.premium_until) > new Date();

  return (
    <div className="group overflow-hidden rounded-[14px] border border-[#e2e8f0] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
      <Link to={`/tenant/room/${item.room_id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
          <img src={cover} alt={item.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1a3a]/70 via-transparent to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {isVip && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#943700] px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                <Sparkles size={12} fill="currentColor" /> VIP
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#0c1a3a] shadow-sm backdrop-blur">
              {item.category_name || item.type_name || item.room_type || 'Tin đăng'}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSave(item.listing_id);
            }}
            className={`absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 backdrop-blur-md transition-colors ${saved ? 'bg-[#ba1a1a] text-white' : 'bg-white/90 text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white'}`}
            aria-label={saved ? 'Bỏ lưu tin' : 'Lưu tin'}
          >
            <Heart size={18} className={saved ? 'fill-white' : ''} />
          </button>
          <div className="absolute bottom-4 left-4 right-4 text-white text-[12px] font-medium flex items-center gap-2">
            <MapPin size={14} />
            <span className="line-clamp-1">{item.building_name || item.address || 'Đang cập nhật địa chỉ'}</span>
          </div>
        </div>
      </Link>
      <div className="p-4 md:p-5">
        <Link to={`/tenant/room/${item.room_id}`}>
          <h3 className="mb-2 line-clamp-2 text-[18px] font-semibold leading-7 text-[#191b23] transition-colors group-hover:text-[#004ac6]">{item.title}</h3>
        </Link>
        <div className="mb-4 flex flex-wrap items-center gap-4 text-[14px] text-[#434655]">
          <span className="inline-flex items-center gap-1"><Ruler size={16} /> {item.area ? `${item.area}m²` : 'Đang cập nhật'}</span>
          <span className="inline-flex items-center gap-1"><Home size={16} /> {item.bedrooms ? `${item.bedrooms} PN` : '1 PN'}</span>
        </div>
        <div className="mb-4 flex items-center gap-2 text-[12px] text-[#515d81]">
          <Star size={14} className="fill-[#943700] text-[#943700]" />
          <span className="font-semibold text-[#191b23]">4.9</span>
          <span>·</span>
          <span className="line-clamp-1">{item.address || item.building_name || 'Khu vực trung tâm'}</span>
        </div>
        <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-4">
          <div>
            <p className="text-[12px] font-medium text-[#737686]">Giá thuê</p>
            <p className="text-[24px] font-bold tracking-tight text-[#004ac6]">
              {formatCurrency(item.rent_price || 0)}<span className="text-[14px] font-medium text-[#737686]">/tháng</span>
            </p>
          </div>
          <Link to={`/tenant/room/${item.room_id}`} className="inline-flex h-11 w-11 items-center justify-center rounded-[8px] bg-[#dae2ff] text-[#0c1a3a] transition-colors hover:bg-[#004ac6] hover:text-white" aria-label="Xem chi tiết">
            <MoveRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};

const DiscoverRooms = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { savedIds } = useSelector(state => state.savedListings);

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedRoomType, setSelectedRoomType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [listings, setListings] = useState([]);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [themeConfig, setThemeConfig] = useState({ primary_color: '#004ac6' });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    const load = async () => {
      try {
        const [listingRes, bannerRes, themeRes, categoriesRes] = await Promise.allSettled([
          listingService.getActiveListings(),
          listingService.getActiveBanners(),
          api.get('/listings/theme'),
          api.get('/categories'),
        ]);

        if (listingRes.status === 'fulfilled') setListings(Array.isArray(listingRes.value) ? listingRes.value : []);
        if (bannerRes.status === 'fulfilled') setBanners(Array.isArray(bannerRes.value) ? bannerRes.value : []);
        if (themeRes.status === 'fulfilled' && themeRes.value?.data) setThemeConfig(themeRes.value.data);
        if (categoriesRes.status === 'fulfilled') setCategories(Array.isArray(categoriesRes.value.data) ? categoriesRes.value.data : []);
      } catch (error) {
        console.error('DiscoverRooms load failed:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const s = searchParams.get('search');
    if (s) setSearchTerm(s);
  }, [searchParams]);

  const handleLogout = async () => {
    await dispatch(logout());
    dispatch(reset());
    navigate('/');
  };

  const filtered = useMemo(() => {
    let result = listings.filter(item => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = (item.title || '').toLowerCase().includes(q) || (item.building_name || '').toLowerCase().includes(q) || (item.address || '').toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'all' || item.category_id === Number(selectedCategory);
      const matchesRoomType = selectedRoomType === 'all' || (item.room_type || item.type || '').toLowerCase() === selectedRoomType;
      const priceRange = PRICE_RANGES.find(r => r.id === selectedPrice);
      const matchesPrice = selectedPrice === 'all' || (priceRange && (item.rent_price || 0) >= priceRange.min && (item.rent_price || 0) <= priceRange.max);
      let itemAm = {};
      try {
        itemAm = typeof item.amenities === 'string' ? JSON.parse(item.amenities) : (item.amenities || {});
      } catch {
        itemAm = {};
      }
      const matchesAmenities = selectedAmenities.length === 0 || selectedAmenities.every(am => itemAm[am]);
      return matchesSearch && matchesCategory && matchesRoomType && matchesPrice && matchesAmenities;
    });

    if (sortBy === 'price_asc') result = [...result].sort((a, b) => (a.rent_price || 0) - (b.rent_price || 0));
    else if (sortBy === 'price_desc') result = [...result].sort((a, b) => (b.rent_price || 0) - (a.rent_price || 0));
    else result = [...result].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return result;
  }, [listings, searchTerm, selectedCategory, selectedPrice, selectedAmenities, selectedRoomType, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const visibleListings = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedPrice, selectedAmenities, selectedRoomType, itemsPerPage, sortBy]);

  const heroBanner = banners.find(b => b.type === 'home_banner');
  const heroImage = splitImages(heroBanner?.image_url)[0] || defaultHeroImage;
  const heroTitle = heroBanner?.listing_title || 'Khám phá không gian sống hoàn hảo';
  const heroSubtitle = heroBanner?.description || 'Hơn 5,000+ phòng trọ và căn hộ cao cấp đang chờ bạn.';
  const sidebarBanners = banners.filter(b => b.type === 'sidebar_banner');
  const primary = themeConfig.primary_color || '#004ac6';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedPrice('all');
    setSelectedRoomType('all');
    setSelectedAmenities([]);
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#191b23]">
      <style>{`:root { --primary: ${primary}; } .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      <nav className="sticky top-0 z-50 border-b border-[#e2e8f0] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-[24px] font-semibold tracking-tight text-[#0c1a3a]">SmartProp</Link>
            <div className="hidden lg:flex items-center gap-6 text-[14px] font-medium text-[#515d81]">
              <a href="#discover" className="border-b-2 border-[var(--primary)] pb-1 text-[var(--primary)]">Khám phá</a>
              <a href="#commitments" className="transition-colors hover:text-[var(--primary)]">Dịch vụ</a>
              <a href="#footer" className="transition-colors hover:text-[var(--primary)]">Hỗ trợ</a>
            </div>
          </div>

          {user?.role === 'tenant' ? (
            <div className="flex items-center gap-2 md:gap-3">
              <Link to="/tenant/saved" className="hidden sm:flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] px-4 py-2 text-[14px] font-medium text-[#191b23] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]">
                <Heart size={16} className="text-[#ba1a1a]" />
                Tin đã lưu
                {savedIds.length > 0 && <span className="ml-1 rounded-full bg-[#ba1a1a] px-2 py-0.5 text-[11px] font-bold text-white">{savedIds.length}</span>}
              </Link>
              <Link to="/tenant/bookings" className="hidden sm:flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] px-4 py-2 text-[14px] font-medium text-[#191b23] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]">
                <Calendar size={16} className="text-[#737686]" />
                Lịch hẹn
              </Link>
              <Link to="/tenant/profile" className="flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[14px] font-medium text-[#191b23] hover:border-[var(--primary)] hover:text-[var(--primary)]">
                <User size={16} />
                <span className="hidden md:inline">{user.full_name || user.fullName || 'Tài khoản'}</span>
              </Link>
              <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-[8px] bg-[#0c1a3a] px-4 py-2 text-[14px] font-medium text-white hover:opacity-90">
                <LogOut size={16} /> <span className="hidden md:inline">Đăng xuất</span>
              </button>
            </div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link to={`/${user.role}/profile`} className="flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] px-4 py-2 text-[14px] font-medium text-[#191b23] hover:border-[var(--primary)] hover:text-[var(--primary)]">
                <User size={16} /> {user.full_name || user.fullName || 'Tài khoản'}
              </Link>
              <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-[8px] bg-[#0c1a3a] px-4 py-2 text-[14px] font-medium text-white hover:opacity-90">
                <LogOut size={16} /> Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="rounded-[8px] px-4 py-2 text-[14px] font-medium text-[#191b23] transition-colors hover:bg-[#f3f3fe]">Đăng nhập</Link>
              <Link to="/register" className="rounded-[8px] bg-[var(--primary)] px-5 py-2 text-[14px] font-medium text-white shadow-sm transition-opacity hover:opacity-90">Đăng ký</Link>
            </div>
          )}
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImage} alt="Discover rooms hero" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c1a3a]/85 via-[#0c1a3a]/55 to-transparent" />
          </div>
          <div className="relative mx-auto flex min-h-[500px] max-w-[1280px] items-center px-4 py-16 md:px-8">
            <div className="max-w-2xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
                <Sparkles size={14} /> Danh sách phòng
              </span>
              <h1 className="mb-5 text-[32px] font-bold leading-[40px] tracking-[-0.01em] text-white md:text-[48px] md:leading-[56px]">{heroTitle}</h1>
              <p className="mb-8 max-w-xl text-[16px] leading-7 text-white/80 md:text-[18px] md:leading-8">{heroSubtitle}</p>
              <div className="rounded-[14px] border border-white/15 bg-white p-2 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.12)]">
                <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                  <div className="flex items-center gap-3 rounded-[8px] border border-[#e2e8f0] px-4 py-3">
                    <MapPin size={18} className="text-[#737686]" />
                    <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Khu vực (Quận, Phường...)" className="w-full border-none bg-transparent p-0 text-[16px] outline-none placeholder:text-[#737686]" />
                  </div>
                  <div className="flex items-center gap-3 rounded-[8px] border border-[#e2e8f0] px-4 py-3">
                    <SlidersHorizontal size={18} className="text-[#737686]" />
                    <select value={selectedPrice} onChange={(e) => setSelectedPrice(e.target.value)} className="w-full border-none bg-transparent p-0 text-[16px] outline-none">
                      {PRICE_RANGES.map(range => <option key={range.id} value={range.id}>{range.label}</option>)}
                    </select>
                  </div>
                  <button onClick={() => document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-[8px] bg-[var(--primary)] px-6 py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90">
                    Tìm kiếm ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="sticky top-16 z-40 border-b border-[#e2e8f0] bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-4 md:px-8">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
              <button onClick={resetFilters} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--primary)] bg-[var(--primary)]/5 px-4 py-2 text-[14px] font-semibold text-[var(--primary)]">
                <Filter size={18} /> Tất cả bộ lọc
              </button>
              <div className="h-6 w-px shrink-0 bg-[#c3c6d7]" />
              {ROOM_TYPES.map(type => (
                <button key={type.id} onClick={() => setSelectedRoomType(type.id)} className={`shrink-0 rounded-full border px-4 py-2 text-[14px] font-medium transition-colors ${selectedRoomType === type.id ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]' : 'border-[#c3c6d7] hover:border-[var(--primary)] hover:text-[var(--primary)]'}`}>
                  {type.label}
                </button>
              ))}
              <div className="h-6 w-px shrink-0 bg-[#c3c6d7]" />
              {categories.slice(0, 8).map(cat => (
                <button key={cat.category_id} onClick={() => setSelectedCategory(String(cat.category_id))} className={`shrink-0 rounded-full border px-4 py-2 text-[14px] font-medium transition-colors ${selectedCategory === String(cat.category_id) ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]' : 'border-[#c3c6d7] hover:border-[var(--primary)] hover:text-[var(--primary)]'}`}>
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              <span className="text-[14px] text-[#737686]">Sắp xếp:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="cursor-pointer border-none bg-transparent text-[14px] font-semibold outline-none">
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá thấp đến cao</option>
                <option value="price_desc">Giá cao đến thấp</option>
              </select>
            </div>
          </div>
        </div>

        <section id="discover" className="mx-auto max-w-[1280px] px-4 py-8 md:px-8 md:py-10 pb-24 md:pb-10">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr_280px]">
            <aside className="hidden lg:block">
              <div className="sticky top-[140px] space-y-6">
                <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-6">
                  <h3 className="mb-4 text-[24px] font-semibold leading-8 text-[#191b23]">Khoảng giá</h3>
                  <div className="space-y-3">
                    {PRICE_RANGES.map(range => (
                      <label key={range.id} className="group flex cursor-pointer items-center gap-3">
                        <input type="radio" name="price" checked={selectedPrice === range.id} onChange={() => setSelectedPrice(range.id)} className="h-4 w-4 border-[#c3c6d7] text-[var(--primary)] focus:ring-[var(--primary)]" />
                        <span className={`text-[14px] transition-colors group-hover:text-[var(--primary)] ${selectedPrice === range.id ? 'font-semibold text-[#191b23]' : 'text-[#434655]'}`}>{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-6">
                  <h3 className="mb-4 text-[24px] font-semibold leading-8 text-[#191b23]">Tiện nghi</h3>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.map(am => {
                      const Icon = am.icon;
                      const active = selectedAmenities.includes(am.id);
                      return (
                        <button
                          key={am.id}
                          onClick={() => setSelectedAmenities(prev => prev.includes(am.id) ? prev.filter(x => x !== am.id) : [...prev, am.id])}
                          className={`inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[14px] transition-colors ${active ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]' : 'border-[#c3c6d7] hover:border-[var(--primary)]'}`}
                        >
                          <Icon size={14} /> {am.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-6">
                  <h3 className="mb-4 text-[24px] font-semibold leading-8 text-[#191b23]">Loại hình</h3>
                  <div className="space-y-3">
                    {ROOM_TYPES.filter(t => t.id !== 'all').map(type => (
                      <label key={type.id} className="group flex cursor-pointer items-center gap-3">
                        <input type="radio" name="roomTypeSide" checked={selectedRoomType === type.id} onChange={() => setSelectedRoomType(type.id)} className="h-4 w-4 border-[#c3c6d7] text-[var(--primary)] focus:ring-[var(--primary)]" />
                        <span className={`text-[14px] transition-colors group-hover:text-[var(--primary)] ${selectedRoomType === type.id ? 'font-semibold text-[#191b23]' : 'text-[#434655]'}`}>{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-6">
                  <h3 className="mb-4 text-[24px] font-semibold leading-8 text-[#191b23]">Danh mục</h3>
                  <div className="space-y-2">
                    <button onClick={() => setSelectedCategory('all')} className={`block w-full rounded-[8px] border px-3 py-2 text-left text-[14px] transition-colors ${selectedCategory === 'all' ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)] font-semibold' : 'border-[#e2e8f0] text-[#434655] hover:border-[var(--primary)] hover:text-[var(--primary)]'}`}>Tất cả</button>
                    {categories.map(cat => (
                      <div key={cat.category_id} className="space-y-2">
                        <button onClick={() => setSelectedCategory(String(cat.category_id))} className={`block w-full rounded-[8px] border px-3 py-2 text-left text-[14px] transition-colors ${selectedCategory === String(cat.category_id) ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)] font-semibold' : 'border-[#e2e8f0] text-[#434655] hover:border-[var(--primary)] hover:text-[var(--primary)]'}`}>{cat.name}</button>
                        {(cat.children || []).length > 0 && (
                          <div className="pl-3">
                            {(cat.children || []).map(sub => (
                              <button key={sub.category_id} onClick={() => setSelectedCategory(String(sub.category_id))} className={`block w-full rounded-[8px] px-3 py-2 text-left text-[13px] transition-colors ${selectedCategory === String(sub.category_id) ? 'bg-[#f3f3fe] text-[var(--primary)] font-semibold' : 'text-[#737686] hover:text-[var(--primary)]'}`}>
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            <main>
              <div className="mb-8 flex flex-col gap-4 border-b border-[#e2e8f0] pb-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#737686]">{filtered.length} kết quả</p>
                  <h2 className="text-[30px] font-semibold leading-10 text-[#191b23] md:text-[36px] md:leading-[44px]">Danh sách hiện có</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#737686]">Hiển thị</span>
                  {[6, 12, 24, 48].map(size => (
                    <button
                      key={size}
                      onClick={() => setItemsPerPage(size)}
                      className={`h-10 w-10 rounded-full border text-[12px] font-semibold transition-colors ${itemsPerPage === size ? 'border-[var(--primary)] bg-[var(--primary)] text-white' : 'border-[#e2e8f0] text-[#434655] hover:border-[var(--primary)] hover:text-[var(--primary)]'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-24"><div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" /></div>
              ) : visibleListings.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {visibleListings.map(item => (
                      <ListingCard
                        key={item.listing_id}
                        item={item}
                        saved={savedIds.includes(item.listing_id)}
                        onToggleSave={async (listingId) => {
                          if (!user) {
                            toast.error('Vui lòng đăng nhập để lưu tin');
                            return;
                          }
                          try {
                            await dispatch(toggleSaveListing(listingId)).unwrap();
                          } catch {
                            toast.error('Có lỗi xảy ra');
                          }
                        }}
                      />
                    ))}
                  </div>

                  <div className="mt-8 grid gap-4 rounded-[14px] border border-[#e2e8f0] bg-white p-5 md:grid-cols-3">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#737686]">Danh mục đang lọc</p>
                      <p className="mt-1 text-[16px] font-semibold text-[#191b23]">{selectedCategory === 'all' ? 'Tất cả danh mục' : (categories.find(cat => String(cat.category_id) === String(selectedCategory))?.name || 'Danh mục')}</p>
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#737686]">Loại hình</p>
                      <p className="mt-1 text-[16px] font-semibold text-[#191b23]">{ROOM_TYPES.find(t => t.id === selectedRoomType)?.label || 'Tất cả'}</p>
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#737686]">Bộ lọc tiện nghi</p>
                      <p className="mt-1 text-[16px] font-semibold text-[#191b23]">{selectedAmenities.length > 0 ? `${selectedAmenities.length} tiện nghi` : 'Không giới hạn'}</p>
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-2">
                      <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e2e8f0] text-[#191b23] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40">
                        <ChevronLeft size={18} />
                      </button>
                      {Array.from({ length: totalPages }).map((_, index) => {
                        const page = index + 1;
                        if (totalPages > 7 && page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 2) {
                          if (page === 2 || page === totalPages - 1) return <span key={page} className="px-1 text-[#c3c6d7]">…</span>;
                          return null;
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border text-[14px] font-semibold transition-colors ${currentPage === page ? 'border-[var(--primary)] bg-[var(--primary)] text-white' : 'border-[#e2e8f0] text-[#434655] hover:border-[var(--primary)] hover:text-[var(--primary)]'}`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e2e8f0] text-[#191b23] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-[14px] border border-dashed border-[#c3c6d7] bg-white p-12 text-center">
                  <p className="mb-2 text-[18px] font-semibold text-[#191b23]">Không tìm thấy phòng phù hợp</p>
                  <p className="text-[14px] text-[#737686]">Thử xóa bộ lọc hoặc thay đổi từ khóa tìm kiếm.</p>
                  <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <button onClick={resetFilters} className="rounded-[8px] bg-[var(--primary)] px-5 py-3 text-[14px] font-semibold text-white">Xóa bộ lọc</button>
                    <Link to="/tenant/saved" className="rounded-[8px] border border-[#e2e8f0] px-5 py-3 text-[14px] font-semibold text-[#191b23] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]">Tin đã lưu</Link>
                    <Link to="/tenant/bookings" className="rounded-[8px] border border-[#e2e8f0] px-5 py-3 text-[14px] font-semibold text-[#191b23] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]">Lịch hẹn</Link>
                  </div>
                </div>
              )}
            </main>

            <aside className="hidden lg:block">
              <div className="sticky top-[140px] space-y-6">
                {sidebarBanners.length > 0 ? sidebarBanners.slice(0, 3).map(banner => {
                  const images = splitImages(banner.image_url);
                  const cover = images[0] || defaultHeroImage;
                  return (
                    <Link key={banner.request_id} to={`/tenant/room/${banner.room_id}`} className="group block overflow-hidden rounded-[14px] border border-[#e2e8f0] bg-white">
                      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                        <img src={cover} alt={banner.listing_title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1a3a]/75 via-transparent to-transparent" />
                        <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#0c1a3a] backdrop-blur">
                          <Star size={12} className="fill-[#943700] text-[#943700]" /> Featured
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#737686]">{banner.building_name}</p>
                        <h4 className="line-clamp-2 text-[16px] font-semibold leading-6 text-[#191b23] group-hover:text-[var(--primary)]">{banner.listing_title}</h4>
                      </div>
                    </Link>
                  );
                }) : (
                  <div className="rounded-[14px] border border-dashed border-[#c3c6d7] bg-white p-6 text-center text-[14px] text-[#737686]">Chưa có banner nổi bật.</div>
                )}
              </div>
            </aside>
          </div>
        </section>

        <section id="commitments" className="border-y border-[#e2e8f0] bg-white py-16">
          <div className="mx-auto max-w-[1280px] px-4 md:px-8">
            <div className="mb-10 text-center">
              <h2 className="text-[30px] font-semibold leading-10 text-[#191b23] md:text-[36px] md:leading-[44px]">Cam kết dịch vụ từ SmartProp</h2>
              <p className="mx-auto mt-3 max-w-2xl text-[16px] leading-7 text-[#434655]">Chúng tôi mang lại trải nghiệm thuê nhà minh bạch, an toàn và thuận tiện cho người thuê.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {COMMITMENTS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-[14px] border border-[#e2e8f0] bg-[#faf8ff] p-6 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#dae2ff] text-[#004ac6]"><Icon size={28} /></div>
                  <h3 className="mb-2 text-[18px] font-semibold text-[#191b23]">{title}</h3>
                  <p className="text-[14px] leading-6 text-[#434655]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer id="footer" className="bg-[#0c1a3a] py-12 text-white">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 md:grid-cols-4 md:px-8">
          <div className="md:col-span-2">
            <div className="mb-4 text-[24px] font-semibold tracking-tight">SmartProp</div>
            <p className="max-w-md text-[14px] leading-6 text-[#c7d3fd]">Hệ sinh thái công nghệ bất động sản giúp việc tìm kiếm và quản lý không gian sống trở nên dễ dàng hơn.</p>
          </div>
          <div>
            <h4 className="mb-4 text-[14px] font-semibold uppercase tracking-[0.16em] text-[#dae2ff]">Khám phá</h4>
            <ul className="space-y-3 text-[14px] text-[#c7d3fd]">
              <li><a className="transition-colors hover:text-white" href="#discover">Danh sách phòng</a></li>
              <li><a className="transition-colors hover:text-white" href="#commitments">Cam kết</a></li>
              <li><a className="transition-colors hover:text-white" href="#footer">Liên hệ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-[14px] font-semibold uppercase tracking-[0.16em] text-[#dae2ff]">Liên hệ</h4>
            <ul className="space-y-3 text-[14px] text-[#c7d3fd]">
              <li>info@proptech.com</li>
              <li>1900 6789</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-[1280px] border-t border-white/10 px-4 pt-6 text-center text-[12px] text-[#c7d3fd] md:px-8">© 2024 SmartProp. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default DiscoverRooms;
