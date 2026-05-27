import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
import { toggleSaveListing, fetchSavedIds } from '../../features/savedListings/savedListingsSlice';
import { logout, reset } from '../../features/auth/authSlice';
import provincesData from '../../data/vietnam_provinces.json';

const removeAccents = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();
};

const cleanLocationName = (name) => {
  if (!name) return '';
  let cleaned = removeAccents(name);
  cleaned = cleaned.replace(/^(quan|huyen|thanh pho|tp|tinh|thi xa|phuong|xa)\s+/i, '');
  return cleaned.trim();
};

const LocationSelector = ({ value, onChange, onSelectLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [inputValue, setInputValue] = useState(value || '');

  // Synchronize local input value when parent value changes (like resetting filters)
  useEffect(() => {
    if (value === '') {
      setInputValue('');
      setSelectedProvince(null);
      setFilterText('');
    } else if (value && value !== inputValue && !selectedProvince) {
      setInputValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const selector = document.getElementById('location-selector-container');
      if (selector && !selector.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProvinces = useMemo(() => {
    if (!filterText) return provincesData;
    return provincesData.filter(p => 
      removeAccents(p.name).includes(removeAccents(filterText))
    );
  }, [filterText]);

  const filteredDistricts = useMemo(() => {
    if (!selectedProvince) return [];
    if (!filterText) return selectedProvince.districts;
    return selectedProvince.districts.filter(d => 
      removeAccents(d.name).includes(removeAccents(filterText))
    );
  }, [selectedProvince, filterText]);

  const handleSelectProvince = (prov) => {
    setSelectedProvince(prov);
    setFilterText('');
    setInputValue(''); // Clear input text so they can type district name
    onSelectLocation({ province: prov.name, district: null });
  };

  const handleSelectDistrict = (dist) => {
    if (dist === 'all') {
      onSelectLocation({ province: selectedProvince.name, district: null });
      setInputValue(selectedProvince.name);
    } else {
      onSelectLocation({ province: selectedProvince.name, district: dist.name });
      setInputValue(`${dist.name}, ${selectedProvince.name}`);
    }
    setIsOpen(false);
    setSelectedProvince(null);
    setFilterText('');
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setFilterText(val);
    setIsOpen(true);
    
    // Only update parent search term if they are in province selection mode
    if (!selectedProvince) {
      onChange(val);
    }
  };

  const handleBackToProvinces = () => {
    setSelectedProvince(null);
    setFilterText('');
    setInputValue('');
    onChange('');
  };

  return (
    <div id="location-selector-container" className="relative flex-1 min-w-0">
      <div className="flex items-center gap-3 rounded-[10px] border border-[#e2e8f0] px-4 py-3.5 bg-white focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/10 transition-all">
        <MapPin size={18} className="text-[#737686] shrink-0" />
        <input 
          value={inputValue} 
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Khu vực (Tỉnh thành, Quận huyện...)" 
          className="w-full border-none bg-transparent p-0 text-[16px] outline-none placeholder:text-[#737686]" 
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 mt-2 z-50 w-[290px] sm:w-[420px] max-h-[320px] overflow-y-auto rounded-[12px] border border-[#e2e8f0] bg-white p-3 shadow-[0_12px_30px_rgba(0,0,0,0.15)] no-scrollbar">
          {selectedProvince ? (
            <div>
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2 mb-2">
                <button 
                  type="button"
                  onClick={handleBackToProvinces} 
                  className="flex items-center gap-1 text-[13px] font-bold text-[var(--primary)] hover:underline"
                >
                  <ChevronLeft size={16} /> Quay lại
                </button>
                <span className="text-[12px] font-semibold text-gray-500 line-clamp-1">{selectedProvince.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                <button 
                  type="button"
                  onClick={() => handleSelectDistrict('all')}
                  className="col-span-2 text-left text-[13px] px-3 py-2.5 rounded-lg bg-[var(--primary)]/5 text-[var(--primary)] font-bold hover:bg-[var(--primary)]/10 transition-colors"
                >
                  Tất cả tại {selectedProvince.name}
                </button>
                {filteredDistricts.length > 0 ? (
                  filteredDistricts.map(d => (
                    <button 
                      key={d.code}
                      type="button"
                      onClick={() => handleSelectDistrict(d)}
                      className="text-left text-[13px] px-3 py-2 rounded-lg hover:bg-[var(--primary)]/5 hover:text-[var(--primary)] transition-colors line-clamp-1 text-gray-700 font-medium"
                    >
                      {d.name}
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-gray-400 py-4 text-[13px]">Không tìm thấy quận/huyện nào</div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Chọn Tỉnh / Thành phố</div>
              <div className="grid grid-cols-2 gap-1.5 max-h-[240px] overflow-y-auto pr-1 no-scrollbar">
                {filteredProvinces.length > 0 ? (
                  filteredProvinces.map(p => (
                    <button 
                      key={p.code}
                      type="button"
                      onClick={() => handleSelectProvince(p)}
                      className="text-left text-[13px] px-3 py-2 rounded-lg hover:bg-[var(--primary)]/5 hover:text-[var(--primary)] transition-colors line-clamp-1 text-gray-700 font-semibold"
                    >
                      {p.name}
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-gray-400 py-4 text-[13px]">Không tìm thấy tỉnh/thành nào</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PRICE_RANGES = [
  { id: 'all', label: 'Giá' },
  { id: 'under_3', label: 'Dưới 3 triệu', min: 0, max: 3000000 },
  { id: '3_to_5', label: '3 - 5 triệu', min: 3000000, max: 5000000 },
  { id: '5_to_10', label: '5 - 10 triệu', min: 5000000, max: 10000000 },
  { id: '10_to_20', label: '10 - 20 triệu', min: 10000000, max: 20000000 },
  { id: 'over_20', label: 'Trên 20 triệu', min: 20000000, max: Infinity },
];

const AREA_RANGES = [
  { id: 'all', label: 'Tất cả', min: 0, max: Infinity },
  { id: 'under_20', label: 'Dưới 20m²', min: 0, max: 20 },
  { id: '20_to_30', label: 'Từ 20m² - 30m²', min: 20, max: 30 },
  { id: '30_to_50', label: 'Từ 30m² - 50m²', min: 30, max: 50 },
  { id: '50_to_70', label: 'Từ 50m² - 70m²', min: 50, max: 70 },
  { id: '70_to_90', label: 'Từ 70m² - 90m²', min: 70, max: 90 },
  { id: 'over_90', label: 'Trên 90m²', min: 90, max: Infinity },
];

const HIGHLIGHTS = [
  { id: 'wifi', label: 'Có Wi-Fi' },
  { id: 'furnished', label: 'Đầy đủ nội thất' },
  { id: 'mezzanine', label: 'Có gác' },
  { id: 'kitchen_shelf', label: 'Kệ bếp' },
  { id: 'air_conditioner', label: 'Có máy lạnh' },
  { id: 'washing_machine', label: 'Có máy giặt' },
  { id: 'refrigerator', label: 'Có tủ lạnh' },
  { id: 'elevator', label: 'Có thang máy' },
  { id: 'no_landlord', label: 'Không chung chủ' },
  { id: 'free_time', label: 'Giờ giấc tự do' },
  { id: 'security', label: 'Có bảo vệ 24/24' },
  { id: 'parking_basement', label: 'Có hầm để xe' },
];

const COMMITMENTS = [
  { icon: BadgeCheck, title: 'Thông tin xác thực', desc: 'Tin đăng được kiểm duyệt trước khi hiển thị.' },
  { icon: Clock3, title: 'Hỗ trợ 24/7', desc: 'Đội ngũ hỗ trợ sẵn sàng trong quá trình thuê.' },
  { icon: ShieldCheck, title: 'Hợp đồng pháp lý', desc: 'Quy trình an toàn cho thuê dài hạn và ngắn hạn.' },
  { icon: Award, title: 'Thủ tục nhanh gọn', desc: 'Đặt lịch, giữ phòng và xác nhận thuê nhanh.' },
];

const defaultHeroImage = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2670&auto=format&fit=crop';

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

const formatCompactPrice = (price) => {
  const p = Number(price || 0);
  if (p >= 1000000) {
    const millions = p / 1000000;
    const formatted = millions.toFixed(1).replace('.0', '');
    return `${formatted} triệu/tháng`;
  }
  return `${formatCurrency(p)}đ/tháng`;
};

const timeAgo = (dateString, currentNow) => {
  if (!dateString) return 'Vừa xong';
  const now = currentNow || new Date();
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { savedIds } = useSelector(state => state.savedListings);

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedHighlights, setSelectedHighlights] = useState([]);
  const [activeTab, setActiveTab] = useState('recommended');
  const [sortBy, setSortBy] = useState('newest');
  const [listings, setListings] = useState([]);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [themeConfig, setThemeConfig] = useState({ primary_color: '#004ac6' });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 10000); // Cập nhật mỗi 10 giây để đảm bảo thời gian luôn chính xác theo thời gian thực
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user && (user.role === 'tenant' || user.role === 'guest')) {
      dispatch(fetchSavedIds());
    }
  }, [dispatch, user]);

  // Advanced Filter Modal States
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempPrice, setTempPrice] = useState('all');
  const [tempCategory, setTempCategory] = useState('all');
  const [tempArea, setTempArea] = useState('all');
  const [tempHighlights, setTempHighlights] = useState([]);

  const openFiltersModal = () => {
    setTempPrice(selectedPrice);
    setTempCategory(selectedCategory);
    setTempArea(selectedArea);
    setTempHighlights([...selectedHighlights]);
    setIsFilterModalOpen(true);
  };

  const applyFilters = () => {
    setSelectedPrice(tempPrice);
    setSelectedCategory(tempCategory);
    setSelectedArea(tempArea);
    setSelectedHighlights(tempHighlights);
    setIsFilterModalOpen(false);
  };

  const clearTempFilters = () => {
    setTempPrice('all');
    setTempCategory('all');
    setTempArea('all');
    setTempHighlights([]);
  };

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
    if (s) {
      setSearchTerm(s);
    } else {
      setSearchTerm('');
    }

    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
    } else {
      setSelectedCategory('all');
    }
  }, [searchParams]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/');
  };

  const filtered = useMemo(() => {
    let result = listings.filter(item => {
      let matchesSearch = true;
      if (selectedLocation) {
        const cleanAddress = removeAccents(item.address || '').toLowerCase();
        const cleanBuilding = removeAccents(item.building_name || '').toLowerCase();
        const cleanTitle = removeAccents(item.title || '').toLowerCase();
        
        const cleanProv = cleanLocationName(selectedLocation.province);
        const matchesProv = cleanAddress.includes(cleanProv) || cleanBuilding.includes(cleanProv) || cleanTitle.includes(cleanProv);
        
        if (selectedLocation.district) {
          const cleanDist = cleanLocationName(selectedLocation.district);
          const matchesDist = cleanAddress.includes(cleanDist) || cleanBuilding.includes(cleanDist) || cleanTitle.includes(cleanDist);
          matchesSearch = matchesProv && matchesDist;
        } else {
          matchesSearch = matchesProv;
        }
      } else if (searchTerm) {
        const q = searchTerm.toLowerCase();
        matchesSearch = (item.title || '').toLowerCase().includes(q) || (item.building_name || '').toLowerCase().includes(q) || (item.address || '').toLowerCase().includes(q);
      }
      
      const matchesCategory = selectedCategory === 'all' || item.category_id === Number(selectedCategory);
      const priceRange = PRICE_RANGES.find(r => r.id === selectedPrice);
      const matchesPrice = selectedPrice === 'all' || (priceRange && (item.rent_price || 0) >= priceRange.min && (item.rent_price || 0) <= priceRange.max);
      
      let itemAm = {};
      try {
        itemAm = typeof item.amenities === 'string' ? JSON.parse(item.amenities) : (item.amenities || {});
      } catch {
        itemAm = {};
      }

      const checkHighlight = (amObj, hlId) => {
        if (hlId === 'refrigerator' || hlId === 'fridge') {
          return amObj.refrigerator || amObj.fridge;
        }
        if (hlId === 'air_conditioner') {
          return amObj.air_conditioner || amObj.airConditioner || amObj.ac;
        }
        if (hlId === 'washing_machine') {
          return amObj.washing_machine || amObj.washingMachine;
        }
        if (hlId === 'kitchen_shelf') {
          return amObj.kitchen_shelf || amObj.kitchen || amObj.kitchenShelf;
        }
        if (hlId === 'no_landlord') {
          return amObj.no_landlord || amObj.noLandlord;
        }
        if (hlId === 'free_time') {
          return amObj.free_time || amObj.freeTime || amObj.hours;
        }
        if (hlId === 'parking_basement') {
          return amObj.parking_basement || amObj.parkingBasement || amObj.parking;
        }
        return amObj[hlId];
      };

      const areaRange = AREA_RANGES.find(r => r.id === selectedArea);
      const matchesArea = selectedArea === 'all' || (areaRange && (item.area || 0) >= areaRange.min && (item.area || 0) <= areaRange.max);

      const matchesHighlights = selectedHighlights.length === 0 || selectedHighlights.every(hl => checkHighlight(itemAm, hl));

      return matchesSearch && matchesCategory && matchesPrice && matchesArea && matchesHighlights;
    });

    const sortFunction = (a, b) => {
      if (sortBy === 'price_asc') return Number(a.rent_price || 0) - Number(b.rent_price || 0);
      if (sortBy === 'price_desc') return Number(b.rent_price || 0) - Number(a.rent_price || 0);

      if (activeTab === 'newest') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }

      const aVip = a.premium_until && new Date(a.premium_until) > new Date();
      const bVip = b.premium_until && new Date(b.premium_until) > new Date();
      
      if (aVip && !bVip) return -1;
      if (!aVip && bVip) return 1;
      
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    };

    return [...result].sort(sortFunction);
  }, [listings, searchTerm, selectedLocation, selectedCategory, selectedPrice, sortBy, selectedArea, selectedHighlights, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const visibleListings = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedPrice, itemsPerPage, sortBy, selectedArea, selectedHighlights, activeTab]);

  const heroBanner = banners.find(b => b.type === 'home_banner');
  const heroImage = splitImages(heroBanner?.image_url)[0] || defaultHeroImage;
  const heroTitle = heroBanner?.listing_title || 'Khám phá không gian sống hoàn hảo';
  const heroSubtitle = heroBanner?.description || 'Hơn 5,000+ phòng trọ và căn hộ cao cấp đang chờ bạn.';
  
  const newestListings = useMemo(() => {
    return [...listings]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5);
  }, [listings]);

  const primary = themeConfig.primary_color || '#004ac6';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedLocation(null);
    setSelectedCategory('all');
    setSelectedPrice('all');
    setSelectedArea('all');
    setSelectedHighlights([]);
    setSortBy('newest');
    setActiveTab('recommended');
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#191b23]">
      <style>{`:root { --primary: ${primary}; } .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      <nav className="sticky top-0 z-50 border-b border-[#e2e8f0] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-8">
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
                <Link to="/tenant/saved" className="hidden sm:flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] px-4 py-2 text-[14px] font-medium text-[#191b23] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]">
                  <Heart size={16} className="text-[#ba1a1a]" />
                  Tin đã lưu
                  {savedIds.length > 0 && <span className="ml-1 rounded-full bg-[#ba1a1a] px-2 py-0.5 text-[11px] font-bold text-white">{savedIds.length}</span>}
                </Link>
                <Link to="/tenant/bookings" className="hidden sm:flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] px-4 py-2 text-[14px] font-medium text-[#191b23] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]">
                  <Calendar size={16} className="text-[#737686]" />
                  Lịch hẹn
                </Link>
              </>
            )}
            {user ? (
              <>
                <Link to={`/${user.role === 'guest' ? 'tenant' : user.role}/profile`} className="flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[14px] font-medium text-[#191b23] hover:border-[var(--primary)] hover:text-[var(--primary)]">
                  <User size={16} />
                  <span className="hidden md:inline">{user.full_name || user.fullName || 'Tài khoản'}</span>
                </Link>
                <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-[8px] bg-[#0c1a3a] px-4 py-2 text-[14px] font-medium text-white hover:opacity-90">
                  <LogOut size={16} /> <span className="hidden md:inline">Đăng xuất</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-[8px] px-4 py-2 text-[14px] font-medium text-[#191b23] transition-colors hover:bg-[#f3f3fe]">Đăng nhập</Link>
                <Link to="/register" className="rounded-[8px] bg-[var(--primary)] px-5 py-2 text-[14px] font-medium text-white shadow-sm transition-opacity hover:opacity-90">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
        <div className="border-t border-[#e2e8f0] bg-white shadow-sm">
          <div className="mx-auto max-w-[1280px] px-4 md:px-8 py-4 flex items-center gap-8 overflow-x-auto no-scrollbar scroll-smooth">
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
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    if (cat.id === 'pricing') {
                      navigate('/services-price');
                      return;
                    }
                    setSelectedCategory(cat.id);
                    setSearchParams(prev => {
                      prev.set('category', cat.id);
                      return prev;
                    });
                  }}
                  className={`pb-1 transition-all border-b-2 whitespace-nowrap text-[13px] ${
                    isActive 
                      ? 'border-[var(--primary)] text-[var(--primary)] font-bold' 
                      : 'border-transparent text-[#515d81] hover:text-[var(--primary)] hover:border-[var(--primary)]/30 font-semibold'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main>
        <section className="relative z-[45]">
          <div className="absolute inset-0">
            <img src={heroImage} alt="Discover rooms hero" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c1a3a]/85 via-[#0c1a3a]/55 to-transparent" />
          </div>
            <div className="relative mx-auto flex min-h-[520px] max-w-[1280px] items-center px-4 py-20 md:py-24 md:px-8">
              <div className="max-w-3xl w-full">
                <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
                  <Sparkles size={14} /> Danh sách phòng
                </span>
                <h1 className="mb-6 text-[36px] font-bold leading-[44px] tracking-[-0.01em] text-white md:text-[52px] md:leading-[60px]">{heroTitle}</h1>
                <p className="mb-10 max-w-xl text-[16px] leading-7 text-white/85 md:text-[18px] md:leading-8">{heroSubtitle}</p>
                <div className="rounded-[16px] border border-white/10 bg-white/95 backdrop-blur-md p-4 shadow-[0_20px_50px_rgba(12,26,58,0.15)] md:p-5 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1.1fr_1.1fr_auto_auto] gap-4 items-center">
                    <LocationSelector 
                      value={searchTerm} 
                      onChange={(val) => {
                        setSearchTerm(val);
                        setSelectedLocation(null);
                      }}
                      onSelectLocation={(loc) => {
                        setSelectedLocation(loc);
                        setSearchTerm(loc.district ? `${loc.district}, ${loc.province}` : loc.province);
                      }}
                    />
                    <div className="flex items-center gap-3 rounded-[10px] border border-[#e2e8f0] px-4 py-3.5 bg-white hover:border-gray-300 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/10 transition-all">
                      <SlidersHorizontal size={18} className="text-[#737686]" />
                      <select value={selectedPrice} onChange={(e) => setSelectedPrice(e.target.value)} className="w-full border-none bg-transparent p-0 text-[16px] outline-none cursor-pointer font-medium text-gray-700 bg-white">
                        {PRICE_RANGES.map(range => <option key={range.id} value={range.id}>{range.label}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-3 rounded-[10px] border border-[#e2e8f0] px-4 py-3.5 bg-white hover:border-gray-300 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/10 transition-all">
                      <span className="text-[14px] text-[#737686] whitespace-nowrap font-medium">Sắp xếp:</span>
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full border-none bg-transparent p-0 text-[16px] outline-none cursor-pointer font-bold text-gray-700 bg-white">
                        <option value="newest">Mới nhất</option>
                        <option value="price_asc">Giá thấp đến cao</option>
                        <option value="price_desc">Giá cao đến thấp</option>
                      </select>
                    </div>
                    <button 
                      type="button"
                      onClick={openFiltersModal} 
                      className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[10px] border border-[var(--primary)] bg-[var(--primary)]/5 px-5 py-3.5 text-[14px] font-bold text-[var(--primary)] transition-all hover:bg-[var(--primary)]/10 hover:shadow-sm"
                    >
                      <Filter size={18} />
                      <span>Bộ lọc</span>
                      {(selectedArea !== 'all' || selectedHighlights.length > 0) && (
                        <span className="ml-1 rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {(selectedArea !== 'all' ? 1 : 0) + selectedHighlights.length}
                        </span>
                      )}
                    </button>
                    <button onClick={() => document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-[10px] bg-[var(--primary)] px-6 py-3.5 h-[52px] text-[14px] font-bold text-white transition-all hover:opacity-95 hover:shadow-md whitespace-nowrap">
                      Tìm kiếm ngay
                    </button>
                  </div>
                </div>
              </div>
            </div>
        </section>

        <section id="discover" className="mx-auto max-w-[1280px] px-4 py-12 md:px-8 md:py-16 pb-28 md:pb-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">

            <main>
              <div className="mb-8 flex items-center justify-between border-b border-[#e2e8f0]">
                <div className="flex gap-8 text-[16px] font-bold text-gray-500">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('recommended');
                      setSortBy('newest');
                    }}
                    className={`pb-3 border-b-2 transition-all ${
                      activeTab === 'recommended' && sortBy === 'newest'
                        ? 'border-[var(--primary)] text-[var(--primary)] font-extrabold'
                        : 'border-transparent hover:text-gray-800'
                    }`}
                  >
                    Đề xuất
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('newest');
                      setSortBy('newest');
                    }}
                    className={`pb-3 border-b-2 transition-all ${
                      activeTab === 'newest' && sortBy === 'newest'
                        ? 'border-[var(--primary)] text-[var(--primary)] font-extrabold'
                        : 'border-transparent hover:text-gray-800'
                    }`}
                  >
                    Mới đăng
                  </button>
                </div>
                
                <span className="text-[12px] font-semibold uppercase tracking-wider text-gray-400 pb-3">
                  {filtered.length} kết quả
                </span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-24"><div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" /></div>
              ) : visibleListings.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                    {visibleListings.map(item => (
                      <ListingCard
                        key={item.listing_id}
                        item={item}
                        saved={savedIds.includes(item.listing_id)}
                        onToggleSave={async (listingId) => {
                          if (!user) {
                            toast.error('Vui lòng đăng nhập để lưu tin');
                            navigate('/login', { state: { from: location } });
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

                  <div className="mt-12 grid gap-6 rounded-[16px] border border-[#e2e8f0] bg-white p-6 md:grid-cols-3 shadow-sm">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#737686]">Danh mục đang lọc</p>
                      <p className="mt-1.5 text-[16px] font-semibold text-[#191b23]">{selectedCategory === 'all' ? 'Tất cả danh mục' : (categories.find(cat => String(cat.category_id) === String(selectedCategory))?.name || 'Danh mục')}</p>
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#737686]">Khoảng diện tích</p>
                      <p className="mt-1.5 text-[16px] font-semibold text-[#191b23]">{AREA_RANGES.find(r => r.id === selectedArea)?.label || 'Tất cả'}</p>
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#737686]">Đặc điểm nổi bật</p>
                      <p className="mt-1.5 text-[16px] font-semibold text-[#191b23]">{selectedHighlights.length > 0 ? `${selectedHighlights.length} đặc điểm` : 'Không giới hạn'}</p>
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-14 flex items-center justify-center gap-3">
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
              <div className="sticky top-[140px] space-y-6 bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
                <h3 className="text-[18px] font-bold text-[#0c1a3a] mb-5 pb-3 border-b border-[#e2e8f0]">
                  Tin mới đăng
                </h3>
                {newestListings.length > 0 ? (
                  <div className="space-y-5">
                    {newestListings.map(item => {
                      const images = splitImages(item.images);
                      const cover = images[0] || defaultHeroImage;
                      return (
                        <div key={item.listing_id} className="flex gap-4 pb-5 border-b border-[#e2e8f0] last:border-0 last:pb-0">
                          <Link to={`/tenant/room/${item.room_id}`} className="block w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 group">
                            <img 
                              src={cover} 
                              alt={item.title} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            />
                          </Link>
                          <div className="flex flex-col justify-between flex-1 min-w-0">
                            <Link 
                              to={`/tenant/room/${item.room_id}`}
                              className="block text-[13px] font-bold text-[#004ac6] hover:text-[var(--primary)] hover:underline line-clamp-2 leading-snug transition-colors"
                            >
                              {item.title}
                            </Link>
                            <div className="flex items-center justify-between mt-2 gap-2">
                              <span className="text-[13px] font-bold text-[#10b981]">
                                {formatCompactPrice(item.rent_price)}
                              </span>
                              <span className="text-[11px] text-gray-500 font-medium">
                                {timeAgo(item.created_at, now)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-[14px] text-gray-400 py-6">
                    Không có tin mới nào.
                  </div>
                )}
              </div>
            </aside>
          </div>
        </section>

        <section id="commitments" className="border-y border-[#e2e8f0] bg-white py-20 md:py-24">
          <div className="mx-auto max-w-[1280px] px-4 md:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-[30px] font-semibold leading-10 text-[#191b23] md:text-[36px] md:leading-[44px]">Cam kết dịch vụ từ PropTech</h2>
              <p className="mx-auto mt-3 max-w-2xl text-[16px] leading-7 text-[#434655]">Chúng tôi mang lại trải nghiệm thuê nhà minh bạch, an toàn và thuận tiện cho người thuê.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {COMMITMENTS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-[16px] border border-[#e2e8f0] bg-[#faf8ff] p-8 text-center shadow-sm">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#dae2ff] text-[#004ac6]"><Icon size={28} /></div>
                  <h3 className="mb-3 text-[18px] font-semibold text-[#191b23]">{title}</h3>
                  <p className="text-[14px] leading-6 text-[#434655]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer id="footer" className="bg-[#0c1a3a] py-16 md:py-20 text-white">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-4 md:grid-cols-4 md:px-8">
          <div className="md:col-span-2">
            <div className="mb-5 text-[24px] font-bold tracking-tight">PropTech</div>
            <p className="max-w-md text-[14px] leading-6 text-[#c7d3fd]">Hệ sinh thái công nghệ bất động sản giúp việc tìm kiếm và quản lý không gian sống trở nên dễ dàng hơn.</p>
          </div>
          <div>
            <h4 className="mb-5 text-[14px] font-semibold uppercase tracking-[0.16em] text-[#dae2ff]">Khám phá</h4>
            <ul className="space-y-3.5 text-[14px] text-[#c7d3fd]">
              <li><a className="transition-colors hover:text-white" href="#discover">Danh sách phòng</a></li>
              <li><a className="transition-colors hover:text-white" href="#commitments">Cam kết</a></li>
              <li><a className="transition-colors hover:text-white" href="#footer">Liên hệ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-5 text-[14px] font-semibold uppercase tracking-[0.16em] text-[#dae2ff]">Liên hệ</h4>
            <ul className="space-y-3.5 text-[14px] text-[#c7d3fd]">
              <li>info@proptech.com</li>
              <li>1900 6789</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-14 max-w-[1280px] border-t border-white/10 px-4 pt-8 text-center text-[12px] text-[#c7d3fd] md:px-8">© 2024 PropTech. All rights reserved.</div>
      </footer>

      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-[600px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4">
              <h3 className="text-[18px] font-bold text-[#191b23]">Bộ lọc nâng cao</h3>
              <button 
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              
              <div>
                <h4 className="text-[16px] font-bold text-[#191b23] mb-3">Khoảng giá</h4>
                <div className="grid grid-cols-2 gap-3">
                  {PRICE_RANGES.map(range => (
                    <label 
                      key={range.id} 
                      className={`flex cursor-pointer items-center gap-3 p-3 rounded-xl border transition-all ${tempPrice === range.id ? 'border-[var(--primary)] bg-[var(--primary)]/5 font-semibold text-[#191b23]' : 'border-[#e2e8f0] hover:border-gray-300 text-[#434655]'}`}
                    >
                      <input 
                        type="radio" 
                        name="tempPrice" 
                        checked={tempPrice === range.id} 
                        onChange={() => setTempPrice(range.id)} 
                        className="h-4 w-4 border-[#c3c6d7] text-[var(--primary)] focus:ring-[var(--primary)]" 
                      />
                      <span className="text-[14px]">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[16px] font-bold text-[#191b23] mb-3">Khoảng diện tích</h4>
                <div className="flex flex-wrap gap-2">
                  {AREA_RANGES.map(range => (
                    <button
                      key={range.id}
                      type="button"
                      onClick={() => setTempArea(range.id)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition-all duration-200 cursor-pointer ${tempArea === range.id ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)] ring-1 ring-[var(--primary)]/30' : 'border-[#e2e8f0] bg-white text-[#434655] hover:border-gray-300'}`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[16px] font-bold text-[#191b23] mb-3">Đặc điểm nổi bật</h4>
                <div className="flex flex-wrap gap-2">
                  {HIGHLIGHTS.map(hl => {
                    const active = tempHighlights.includes(hl.id);
                    return (
                      <button
                        key={hl.id}
                        type="button"
                        onClick={() => setTempHighlights(prev => prev.includes(hl.id) ? prev.filter(x => x !== hl.id) : [...prev, hl.id])}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition-all duration-200 cursor-pointer ${active ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)] ring-1 ring-[var(--primary)]/30' : 'border-[#e2e8f0] bg-white text-[#434655] hover:border-gray-300'}`}
                      >
                        {hl.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-[16px] font-bold text-[#191b23] mb-3">Danh mục</h4>
                <div className="space-y-2">
                  <button 
                    type="button"
                    onClick={() => setTempCategory('all')} 
                    className={`block w-full rounded-xl border px-4 py-2.5 text-left text-[14px] transition-colors ${tempCategory === 'all' ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)] font-semibold' : 'border-[#e2e8f0] text-[#434655] hover:border-gray-300'}`}
                  >
                    Tất cả danh mục
                  </button>
                  {categories.map(cat => (
                    <div key={cat.category_id} className="space-y-2">
                      <button 
                        type="button"
                        onClick={() => setTempCategory(String(cat.category_id))} 
                        className={`block w-full rounded-xl border px-4 py-2.5 text-left text-[14px] transition-colors ${tempCategory === String(cat.category_id) ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)] font-semibold' : 'border-[#e2e8f0] text-[#434655] hover:border-gray-300'}`}
                      >
                        {cat.name}
                      </button>
                      {(cat.children || []).length > 0 && (
                        <div className="pl-4 grid grid-cols-2 gap-2">
                          {(cat.children || []).map(sub => (
                            <button 
                              key={sub.category_id} 
                              type="button"
                              onClick={() => setTempCategory(String(sub.category_id))} 
                              className={`block w-full rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${tempCategory === String(sub.category_id) ? 'bg-[var(--primary)]/5 text-[var(--primary)] font-semibold border border-[var(--primary)]/20' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                            >
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

            <div className="flex items-center justify-between border-t border-[#e2e8f0] px-6 py-4 bg-gray-50">
              <button 
                type="button"
                onClick={clearTempFilters}
                className="text-[14px] font-semibold text-gray-500 hover:text-red-500 transition-colors"
              >
                Xóa tất cả
              </button>
              <button 
                type="button"
                onClick={applyFilters}
                className="px-6 py-3 bg-[var(--primary)] text-white text-[14px] font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-[var(--primary)]/10"
              >
                Hoàn tất
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoverRooms;
