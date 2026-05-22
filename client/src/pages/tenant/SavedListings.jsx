import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  ArrowRight,
  Bath,
  ChevronDown,
  Heart,
  Loader,
  MapPin,
  Bed,
  Ruler,
} from 'lucide-react';
import { toggleSaveListing } from '../../features/savedListings/savedListingsSlice';
import savedListingService from '../../services/savedListingService';

const defaultHeroImage = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2670&auto=format&fit=crop';

const formatMoney = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

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

const SavedListings = () => {
  const dispatch = useDispatch();
  const { savedIds } = useSelector(state => state.savedListings);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  const fetchSavedListings = async () => {
    try {
      setLoading(true);
      const data = await savedListingService.getSavedListings();
      setListings(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Lỗi khi tải danh sách đã lưu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSavedListings(); }, []);
  useEffect(() => { setListings(prev => prev.filter(item => savedIds.includes(item.listing_id))); }, [savedIds]);

  const handleRemove = async (e, listingId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await dispatch(toggleSaveListing(listingId)).unwrap();
      toast.success('Đã xóa khỏi danh sách đã lưu');
    } catch {
      toast.error('Lỗi khi xóa tin');
    }
  };

  const sortedListings = useMemo(() => {
    const clone = [...listings];
    if (sortBy === 'price-asc') return clone.sort((a, b) => Number(a.rent_price || 0) - Number(b.rent_price || 0));
    if (sortBy === 'price-desc') return clone.sort((a, b) => Number(b.rent_price || 0) - Number(a.rent_price || 0));
    if (sortBy === 'area-desc') return clone.sort((a, b) => Number(b.area || 0) - Number(a.area || 0));
    return clone;
  }, [listings, sortBy]);

  if (loading) {
    return <div className="flex min-h-[400px] items-center justify-center bg-[#faf8ff]"><Loader className="animate-spin text-[#c3c6d7]" /></div>;
  }

  return (
    <main className="min-h-screen bg-[#faf8ff] text-[#191b23] font-['Be_Vietnam_Pro',sans-serif]">
      <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-8 md:py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h2 className="text-[30px] font-semibold leading-[38px] tracking-[-0.01em] text-[#191b23]">Phòng đã lưu</h2>
              <span className="rounded-full bg-[#2563eb] px-3 py-1 text-[14px] font-medium text-[#eeefff]">{sortedListings.length} phòng</span>
            </div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#737686]">Đã lưu {sortedListings.length} tin</p>
            <p className="mt-2 text-[16px] leading-6 text-[#434655]">Quản lý và theo dõi các căn hộ bạn đang quan tâm.</p>
          </div>
          <div className="relative">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="cursor-pointer appearance-none rounded-lg border border-[#c3c6d7] bg-white px-4 py-2.5 pr-10 text-[14px] font-medium outline-none transition-all focus:border-[#004ac6] focus:ring-2 focus:ring-[#004ac6]/20">
              <option value="newest">Mới lưu nhất</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
              <option value="area-desc">Diện tích lớn nhất</option>
            </select>
            <ChevronDown size={20} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#737686]" />
          </div>
        </div>

        {sortedListings.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedListings.map((item) => {
              const images = splitImages(item.images);
              const coverImage = images[0] || defaultHeroImage;
              return (
                <div key={item.listing_id} className="group overflow-hidden rounded-[14px] border border-[#c3c6d7] bg-white transition-all duration-300 hover:border-[#004ac6]/30">
                  <Link to={`/tenant/room/${item.room_id}`} className="block">
                    <div className="relative h-56 overflow-hidden">
                      <img src={coverImage} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute bottom-4 left-4">
                        <span className="rounded bg-[#0c1a3acc] px-2 py-1 text-[12px] font-semibold text-white backdrop-blur-md">{item.category_name || item.room_type || 'Phòng trọ'}</span>
                      </div>
                      <button onClick={(e) => handleRemove(e, item.listing_id)} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#004ac6] shadow-md transition-colors hover:bg-[#004ac6] hover:text-white" aria-label="Bỏ lưu">
                        <Heart size={18} fill="currentColor" />
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h3 className="text-[24px] font-semibold leading-8 text-[#191b23]">{item.title}</h3>
                        <span className="text-[24px] font-bold text-[#004ac6]">{formatMoney(item.rent_price)}<span className="text-[14px] font-normal text-[#434655]">/tháng</span></span>
                      </div>
                      <div className="mb-4 flex items-center text-[14px] text-[#434655]"><MapPin size={18} className="mr-1" />{item.building_name || item.address || 'Đang cập nhật'}</div>
                      <div className="flex items-center gap-4 border-t border-[#c3c6d7] py-4">
                        <div className="flex items-center gap-1"><Bed size={18} className="text-[#515d81]" /><span className="text-[14px] font-medium">{item.bedrooms || 1}</span></div>
                        <div className="flex items-center gap-1"><Bath size={18} className="text-[#515d81]" /><span className="text-[14px] font-medium">{item.bathrooms || 1}</span></div>
                        <div className="flex items-center gap-1"><Ruler size={18} className="text-[#515d81]" /><span className="text-[14px] font-medium">{item.area || '—'}m²</span></div>
                      </div>
                      <button className="mt-2 w-full rounded-lg bg-[#2563eb] py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#004ac6]">Xem Chi Tiết</button>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#e7e7f3]"><Heart size={48} className="text-[#737686]" /></div>
            <h3 className="mb-2 text-[24px] font-semibold leading-8 text-[#191b23]">Chưa có phòng nào được lưu</h3>
            <p className="mb-8 max-w-sm text-[16px] leading-6 text-[#434655]">Hãy khám phá các phòng đang cho thuê và nhấn vào biểu tượng trái tim để lưu lại những nơi bạn yêu thích.</p>
            <Link to="/tenant/discover" className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-8 py-3 text-[14px] font-medium text-white transition-all hover:bg-[#004ac6]"><ArrowRight size={18} /> Khám phá ngay</Link>
          </div>
        )}

        {sortedListings.length > 0 && <div className="mt-12 flex justify-center"><button className="rounded-full border border-[#c3c6d7] px-6 py-2 text-[14px] font-medium text-[#434655] transition-colors hover:bg-[#f3f3fe]">Xem thêm kết quả</button></div>}
      </div>
    </main>
  );
};

export default SavedListings;
