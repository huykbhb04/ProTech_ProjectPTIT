import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  Copy,
  Eye,
  Loader,
  ListFilter,
  Pencil,
  Plus,
  RotateCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import listingService from '../../services/listingService';
import propertyService from '../../services/propertyService';
import monetizationService from '../../services/monetizationService';
import PromoteModal from '../../components/landlord/PromoteModal';
import { Spinner } from '../../components/ui/Loading';

const CircularProgress = ({ value, max, size = 80, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="white" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold leading-none text-white">{value}</span>
        <span className="mt-0.5 text-[9px] text-white/70">Tổng tin</span>
      </div>
    </div>
  );
};

const DonutChart = ({ confirmed, total, size = 60 }) => {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const confirmedRatio = total > 0 ? confirmed / total : 0;
  const pendingRatio = 1 - confirmedRatio;
  const confirmedLength = circumference * confirmedRatio;
  const pendingLength = circumference * pendingRatio;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#16a34a" strokeWidth={8} strokeDasharray={`${confirmedLength} ${pendingLength}`} strokeLinecap="round" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#fbbf24" strokeWidth={8} strokeDasharray={`${pendingLength} ${confirmedLength}`} strokeDashoffset={-confirmedLength} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-white">{confirmed}</span>
      </div>
    </div>
  );
};

const Sparkline = ({ data, color = 'rgba(255,255,255,0.35)', width = 80, height = 30 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return <svg width={width} height={height}><polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
};

const MiniSparkline = ({ data, color = '#1a6b5a' }) => {
  const width = 36;
  const height = 14;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return <svg width={width} height={height} className="ml-1 inline-block align-middle"><polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
};

const DotsProgress = ({ value, max = 100 }) => {
  const dots = Array.from({ length: 7 }, (_, i) => i);
  const activeCount = Math.round((value / max) * dots.length);
  return <div className="flex items-center gap-0.5">{dots.map((_, i) => <div key={i} className={`rounded-full transition-all ${i < activeCount ? 'h-2 w-2 bg-white' : 'h-1.5 w-1.5 bg-white/30'} ${i === dots.length - 1 && activeCount > 0 ? 'w-2.5 h-2.5' : ''}`} />)}</div>;
};

const MultiColorProgress = ({ values }) => {
  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) return <div className="h-2 w-full rounded-full bg-gray-100" />;
  const colors = ['#22c55e', '#f59e0b', '#ef4444'];
  return <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100">{values.map((val, i) => <div key={i} className="h-full" style={{ width: `${(val / total) * 100}%`, backgroundColor: colors[i] }} />)}</div>;
};

const Star3D = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="drop-shadow-sm">
    <defs><linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fcd34d" /><stop offset="100%" stopColor="#f59e0b" /></linearGradient></defs>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#starGradient)" stroke="#d97706" strokeWidth="1" />
  </svg>
);

const DropdownFilter = ({ label, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm font-medium text-[#1e293b] transition-colors hover:border-[#cbd5e1]">
        <span className={value ? 'text-[#1e293b]' : 'text-[#94a3b8]'}>{value || label}</span>
        <ChevronDown size={14} className={`text-[#94a3b8] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-[#e2e8f0] bg-white py-1 shadow-xl"><button onClick={() => { onChange(''); setIsOpen(false); }} className="w-full px-4 py-2 text-left text-sm text-[#94a3b8] transition-colors hover:bg-gray-50">Tất cả</button>{options.map(opt => <button key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${value === opt.value ? 'bg-[#f0fdf9] font-medium text-[#1a6b5a]' : 'text-[#1e293b]'}`}>{opt.label}</button>)}</div>}
    </div>
  );
};

const RenewalModal = ({ isOpen, onClose, listing, onConfirm, plans = [], walletBalance = 0, loadingPlans = false }) => {
  const [plan, setPlan] = useState('standard');
  const [days, setDays] = useState(30);
  const [step, setStep] = useState('choose');

  useEffect(() => {
    if (isOpen) {
      setPlan('standard');
      setDays(30);
      setStep('choose');
    }
  }, [isOpen]);

  if (!isOpen || !listing) return null;

  const selectedPlan = plans.find(p => p.id === plan) || plans[0] || { label: 'Gia hạn thường', price_per_day: 10000, base_fee: 0 };
  const basePerDay = Number(selectedPlan?.price_per_day || 10000);
  const planFee = Number(selectedPlan?.base_fee || 0);
  const total = basePerDay * days + planFee;
  const now = new Date();
  const currentEnd = listing.expires_at && new Date(listing.expires_at) > now ? new Date(listing.expires_at) : now;
  const newEnd = new Date(currentEnd);
  newEnd.setDate(newEnd.getDate() + days);
  const remainingAfterPay = Number(walletBalance || 0) - total;
  const formatMoney = (n) => new Intl.NumberFormat('vi-VN').format(Number(n || 0));

  const planOptions = plans.length > 0 ? plans : [{ id: 'standard', label: 'Gia hạn thường', desc: 'Kéo dài thời hạn hiển thị', base_fee: 0, price_per_day: 10000, icon: 'RotateCw' }];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md">
      <div className="w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
        <div className="border-b border-slate-200 bg-gradient-to-r from-[#0f6e56] via-[#1a6b5a] to-[#3aa882] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">Gia hạn tin đăng</p>
              <h3 className="mt-1 text-2xl font-bold leading-tight">{step === 'choose' ? 'Chọn gói gia hạn' : 'Xác nhận thanh toán'}</h3>
              <p className="mt-1 text-sm text-white/80">Giao diện gọn hơn, dễ chọn gói và xác nhận trước khi thanh toán.</p>
            </div>
            <button onClick={onClose} className="rounded-full border border-white/20 bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20"><X size={18} /></button>
          </div>
        </div>

        {step === 'choose' ? (
          <div className="space-y-5 p-6">
            <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <label className="mb-3 block text-sm font-semibold text-slate-900">Chọn gói</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-[#0f6e56]"
                >
                  {planOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} — {formatMoney(p.base_fee)}đ + {formatMoney(p.price_per_day)}đ/ngày
                    </option>
                  ))}
                </select>
                <div className="mt-3 rounded-2xl bg-white p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">{selectedPlan?.label}</p>
                  <p className="mt-1">{selectedPlan?.desc}</p>
                  <p className="mt-2 text-xs text-slate-500">Phí gói: <strong>{formatMoney(planFee)} đ</strong> · Giá/ngày: <strong>{formatMoney(basePerDay)} đ</strong></p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <label className="mb-3 block text-sm font-semibold text-slate-900">Số ngày</label>
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-[#0f6e56]"
                >
                  {[7, 15, 30, 60].map((d) => <option key={d} value={d}>{d} ngày</option>)}
                </select>
                <div className="mt-3 rounded-2xl bg-white p-4 text-sm text-slate-600">
                  <p><strong>Hiện tại:</strong> {currentEnd.toLocaleString('vi-VN')}</p>
                  <p className="mt-1"><strong>Mới:</strong> {newEnd.toLocaleString('vi-VN')}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tin đăng</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{listing.title}</p>
                <p className="mt-1 text-sm text-slate-500">{listing.building_name} · {listing.room_number}</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tổng tiền</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between"><span>Phí gói</span><strong>{formatMoney(planFee)} đ</strong></div>
                  <div className="flex justify-between"><span>Tiền theo ngày</span><strong>{formatMoney(basePerDay * days)} đ</strong></div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base"><span>Tổng cộng</span><strong className="text-[#0f6e56]">{formatMoney(total)} đ</strong></div>
                  <div className="flex justify-between rounded-2xl bg-slate-50 px-3 py-2"><span className="text-slate-500">Số dư ví</span><strong className={walletBalance >= total ? 'text-emerald-600' : 'text-red-500'}>{formatMoney(walletBalance)} đ</strong></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button onClick={onClose} className="rounded-2xl border border-[#e2e8f0] px-5 py-3 font-semibold text-[#334155] transition-colors hover:bg-slate-50">Hủy</button>
              <button onClick={() => setStep('confirm')} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0f6e56] px-5 py-3 font-semibold text-white shadow-lg shadow-[#0f6e56]/15 transition-all hover:translate-y-[-1px] hover:bg-[#0d5e49]"><BadgeCheck size={16} /> Tiếp tục xác nhận</button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Thông tin xác nhận</p>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between gap-4"><span className="text-slate-500">Tin</span><strong className="text-right text-slate-900">{listing.title}</strong></div>
                  <div className="flex justify-between gap-4"><span className="text-slate-500">Gói</span><strong className="text-right text-slate-900">{selectedPlan?.label || 'Gói gia hạn'}</strong></div>
                  <div className="flex justify-between gap-4"><span className="text-slate-500">Số ngày</span><strong className="text-slate-900">{days} ngày</strong></div>
                  <div className="flex justify-between gap-4"><span className="text-slate-500">Bắt đầu</span><strong className="text-right text-slate-900">{currentEnd.toLocaleString('vi-VN')}</strong></div>
                  <div className="flex justify-between gap-4"><span className="text-slate-500">Hết hạn mới</span><strong className="text-right text-slate-900">{newEnd.toLocaleString('vi-VN')}</strong></div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Thanh toán</p>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between"><span>Phí gói</span><strong>{formatMoney(planFee)} đ</strong></div>
                  <div className="flex justify-between"><span>Tiền theo ngày</span><strong>{formatMoney(basePerDay * days)} đ</strong></div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base"><span>Tổng cộng</span><strong className="text-[#0f6e56]">{formatMoney(total)} đ</strong></div>
                  <div className="flex justify-between rounded-2xl bg-slate-50 px-3 py-2"><span className="text-slate-500">Số dư ví hiện tại</span><strong className={walletBalance >= total ? 'text-emerald-600' : 'text-red-500'}>{formatMoney(walletBalance)} đ</strong></div>
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">Sau khi xác nhận, hệ thống mới trừ ví và cộng thêm thời hạn hiển thị cho tin.</div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3"><button onClick={() => setStep('choose')} className="rounded-2xl border border-[#e2e8f0] px-5 py-3 font-semibold text-[#334155] transition-colors hover:bg-slate-50">Quay lại</button><button onClick={() => onConfirm({ plan, days, total })} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-600/15 transition-all hover:translate-y-[-1px] hover:bg-emerald-700"><RotateCw size={16} /> Xác nhận & Thanh toán</button></div>
          </div>
        )}
      </div>
    </div>
  );
};

const Listings = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isSelectRoomOpen, setIsSelectRoomOpen] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [selectedListingToPromote, setSelectedListingToPromote] = useState(null);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [renewingListing, setRenewingListing] = useState(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [selectedRenewListing, setSelectedRenewListing] = useState(null);
  const [renewalQuote, setRenewalQuote] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [renewalPlans, setRenewalPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);

  const fetchListings = async () => {
    try { setListings(Array.isArray(await listingService.getLandlordListings()) ? await listingService.getLandlordListings() : []); }
    catch (err) { console.error(err); setListings([]); }
    finally { setLoading(false); }
  };

  const fetchAvailableRooms = async () => {
    try { setRoomsLoading(true); setAvailableRooms(Array.isArray(await propertyService.getAvailableRoomsAll()) ? await propertyService.getAvailableRoomsAll() : []); }
    catch (err) { console.error(err); setAvailableRooms([]); }
    finally { setRoomsLoading(false); }
  };

  useEffect(() => { fetchListings(); }, []);
  useEffect(() => { if (isSelectRoomOpen) fetchAvailableRooms(); }, [isSelectRoomOpen]);
  useEffect(() => {
    const loadRenewalData = async () => {
      try {
        setPlansLoading(true);
        const [packages, services, wallet] = await Promise.all([
          monetizationService.getPackages(token),
          monetizationService.getPremiumServices(token),
          monetizationService.getWalletInfo(token),
        ]);
        const normalizedPackages = Array.isArray(packages) ? packages.map((p) => ({
          id: p.package_id ? `package_${p.package_id}` : p.id,
          label: p.name || p.label || 'Gói gia hạn',
          desc: p.description || 'Gia hạn hiển thị tiêu chuẩn',
          base_fee: Number(p.base_fee || p.price || 0),
          price_per_day: Number(p.price_per_day || p.daily_price || p.price || 0),
          icon: 'RotateCw',
        })) : [];
        const normalizedServices = Array.isArray(services) ? services.map((s) => ({
          id: s.service_id ? `service_${s.service_id}` : s.id,
          label: s.name || s.label || 'Gói nổi bật',
          desc: s.description || 'Đẩy nổi bật / VIP',
          base_fee: Number(s.base_fee || s.price || 0),
          price_per_day: Number(s.price_per_day || s.daily_price || s.price || 0),
          icon: s.badge_type === 'vip' ? 'Star' : 'Sparkles',
        })) : [];
        const merged = [
          { id: 'standard', label: 'Gia hạn thường', desc: 'Kéo dài thời hạn hiển thị', base_fee: 0, price_per_day: 10000, icon: 'RotateCw' },
          ...normalizedPackages,
          ...normalizedServices,
        ];
        setRenewalPlans(merged);
        setWalletBalance(Number(wallet?.balance || 0));
      } catch (err) {
        console.error(err);
        setRenewalPlans([
          { id: 'standard', label: 'Gia hạn thường', desc: 'Kéo dài thời hạn hiển thị', base_fee: 0, price_per_day: 10000, icon: 'RotateCw' },
        ]);
      } finally {
        setPlansLoading(false);
      }
    };
    loadRenewalData();
  }, [token]);

  const stats = useMemo(() => {
    const totalListings = listings.length;
    const activeListings = listings.filter(l => l.status === 'active').length;
    const totalBookings = listings.reduce((acc, curr) => acc + (curr.booking_count || 0), 0);
    const totalConfirmed = listings.reduce((acc, curr) => acc + (curr.confirmed_count || 0), 0);
    const totalViews = listings.reduce((acc, curr) => acc + (curr.views || 0), 0);
    const conversionRate = totalViews > 0 ? parseFloat(((totalBookings / totalViews) * 100).toFixed(1)) : 0;
    return { totalListings, activeListings, totalBookings, totalConfirmed, totalViews, conversionRate, sparklineData: [12, 19, 15, 25, 22, 30, 28] };
  }, [listings]);

  const filteredListings = useMemo(() => listings.filter(l => {
    const matchSearch = (l.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (l.building_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || l.status === statusFilter;
    const matchBuilding = !buildingFilter || l.building_name === buildingFilter;
    return matchSearch && matchStatus && matchBuilding;
  }), [listings, searchTerm, statusFilter, buildingFilter]);

  const buildings = useMemo(() => [...new Set(listings.map(l => l.building_name))].filter(Boolean).map(b => ({ value: b, label: b })), [listings]);
  const statusOptions = [{ value: 'active', label: 'Hoạt động' }, { value: 'paused', label: 'Tạm dừng' }];

  const getDaysRemaining = (expiresAt) => !expiresAt ? 0 : Math.max(0, Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24)));
  const handleEdit = (item) => navigate(`/landlord/properties/${item.building_id || 1}/rooms/${item.room_id || 1}/edit-listing`);
  const handleDuplicate = (item) => toast.success(`Đã sao chép: ${item.title}`);
  const handleDelete = (item) => { if (confirm(`Xóa tin "${item.title}"?`)) { setListings(listings.filter(l => l.listing_id !== item.listing_id)); toast.success('Đã xóa tin đăng'); } };
  const handleRoomSelect = (room) => navigate(`/landlord/properties/${room.building_id}/rooms/${room.room_id}/edit-listing`);

  const handleOpenRenew = async (item) => {
    setSelectedRenewListing(item);
    setShowRenewalModal(true);
  };

  const handleConfirmRenew = async ({ days, total }) => {
    try {
      setRenewingListing(selectedRenewListing.listing_id);
      const { balance } = await monetizationService.getWalletInfo(token);
      if (Number(balance || 0) < Number(total || 0)) {
        toast.error('Số dư ví không đủ để gia hạn tin này');
        return;
      }
      await monetizationService.processPayment({
        listingId: selectedRenewListing.listing_id,
        paymentType: 'listing_renewal',
        referenceId: selectedRenewListing.listing_id,
        amount: total,
        paymentMethod: 'wallet',
        durationDays: days,
      }, token);
      toast.success(`Đã gia hạn tin thêm ${days} ngày`);
      setShowRenewalModal(false);
      setSelectedRenewListing(null);
      await fetchListings();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể gia hạn nhanh');
    } finally {
      setRenewingListing(null);
    }
  };

  if (loading) return <div className="flex min-h-[400px] items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-[#f7faf6] pb-20 font-['Be_Vietnam_Pro',sans-serif]">
      <div className="mx-auto max-w-[1400px] px-4 pt-20 md:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-wider text-[#6f7a74]">Quảng cáo</p>
            <h1 className="text-[24px] font-semibold leading-8 text-[#181d1a]">Tin đăng của tôi</h1>
          </div>
          <button onClick={() => setIsSelectRoomOpen(true)} className="flex items-center gap-2 rounded-lg bg-[#0f6e56] px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"><Plus size={16} /> Thêm tin đăng mới</button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-[14px] border border-[#bec9c3] bg-white p-4"><div className="flex items-start justify-between"><span className="text-sm font-semibold text-[#3f4944]">Tổng tin</span><div className="rounded-lg bg-[#ebefeb] p-2"><Building2 size={18} className="text-[#0f6e56]" /></div></div><p className="mt-2 text-[24px] font-semibold text-[#181d1a]">{stats.totalListings}</p><p className="text-[11.5px] text-[#6f7a74]">Đang quản lý</p></div>
          <div className="rounded-[14px] border border-[#bec9c3] bg-white p-4"><div className="flex items-start justify-between"><span className="text-sm font-semibold text-[#3f4944]">Hoạt động</span><div className="rounded-lg bg-[#e6f7f2] p-2"><BadgeCheck size={18} className="text-[#0f6e56]" /></div></div><p className="mt-2 text-[24px] font-semibold text-[#181d1a]">{stats.activeListings}</p><p className="text-[11.5px] text-[#6f7a74]">Đang hiển thị</p></div>
          <div className="rounded-[14px] border border-[#bec9c3] bg-white p-4"><div className="flex items-start justify-between"><span className="text-sm font-semibold text-[#3f4944]">Lịch hẹn</span><div className="rounded-lg bg-[#eef2ff] p-2"><Calendar size={18} className="text-[#4f46e5]" /></div></div><p className="mt-2 text-[24px] font-semibold text-[#181d1a]">{stats.totalBookings}</p><p className="text-[11.5px] text-[#6f7a74]">{stats.totalConfirmed} đã xác nhận</p></div>
          <div className="rounded-[14px] border border-[#bec9c3] bg-white p-4"><div className="flex items-start justify-between"><span className="text-sm font-semibold text-[#3f4944]">Lượt xem</span><div className="rounded-lg bg-[#fffbeb] p-2"><Eye size={18} className="text-[#f59e0b]" /></div></div><p className="mt-2 text-[24px] font-semibold text-[#181d1a]">{stats.totalViews.toLocaleString()}</p><p className="text-[11.5px] text-[#6f7a74]">Tỷ lệ chuyển đổi {stats.conversionRate}%</p></div>
        </div>

        <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-[#e8ecf0] bg-white p-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input type="text" placeholder="Tìm kiếm tin đăng theo tiêu đề, tòa nhà..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg bg-transparent py-1.5 pl-9 pr-4 text-sm text-[#1e293b] outline-none" />
          </div>
          <button className="rounded-lg p-2 text-[#94a3b8] transition-colors hover:text-[#1e293b]"><ListFilter size={18} /></button>
          <DropdownFilter label="Lọc theo trạng thái" value={statusFilter ? statusOptions.find(o => o.value === statusFilter)?.label : ''} options={statusOptions} onChange={setStatusFilter} />
          <DropdownFilter label="Lọc theo tòa nhà" value={buildingFilter} options={buildings} onChange={setBuildingFilter} />
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e8ecf0] bg-white">
          <div className="flex items-center border-b border-[#e8ecf0] px-4 py-3">
            <div className="flex-[2] flex items-center gap-2"><Building2 size={14} className="text-[#9aa5b4]" /><span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9aa5b4]">Tên tin đăng / Tòa nhà</span></div>
            <div className="flex-[1] px-3"><span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9aa5b4]">Giá thuê/tháng</span></div>
            <div className="flex-[1] px-3"><span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9aa5b4]">Thời hạn gói</span></div>
            <div className="flex-[0.8] px-3 text-center"><span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9aa5b4]">Lượt xem</span></div>
            <div className="flex-[0.8] px-3 text-center"><span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9aa5b4]">Lịch hẹn</span></div>
            <div className="flex-[0.7] px-3 text-center"><span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9aa5b4]">Xác nhận</span></div>
            <div className="flex-[1] px-3 text-center"><span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9aa5b4]">Trạng thái</span></div>
            <div className="flex-[0.7] px-3 text-right"><span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9aa5b4]">Hành động</span></div>
          </div>

          <div className="divide-y divide-[#f1f5f9]">
            {filteredListings.map((item, index) => {
              const daysLeft = getDaysRemaining(item.expires_at);
              const progressPercent = Math.min(100, (daysLeft / 30) * 100);
              const isVIP = item.is_vip;
              const confirmed = item.confirmed_count || 0;
              const pending = (item.booking_count || 0) - confirmed;
              const cancelled = Math.max(0, 3 - confirmed - pending);
              return (
                <div key={item.listing_id} className={`flex items-center px-4 py-3.5 transition-colors hover:bg-gray-50/50 ${isVIP && index === 0 ? 'bg-[#fffbeb]' : ''}`}>
                  <div className="flex-[2] flex items-center gap-3">
                    <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-[#f1f5f9] bg-gray-100">{item.images?.[0] ? <img src={item.images[0]} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><Building2 size={18} className="text-gray-300" /></div>}</div>
                    <div className="min-w-0 flex-1"><div className="flex items-center gap-2">{isVIP && <Star3D size={16} />}<p className="truncate text-sm font-semibold text-[#1e293b]">{item.title}</p></div><p className="mt-0.5 text-xs text-[#94a3b8]">{item.building_name} · {item.room_number}</p></div>
                  </div>
                  <div className="flex-[1] px-3"><p className="text-sm font-bold text-[#3b2870]">{new Intl.NumberFormat('vi-VN').format(item.rent_price)}đ</p></div>
                  <div className="flex-[1] px-3"><div className="mb-1.5 flex items-center gap-1.5"><ShieldCheck size={12} className="text-[#94a3b8]" /><span className={`text-xs font-medium ${daysLeft > 5 ? 'text-[#1e293b]' : 'text-red-500'}`}>Còn {daysLeft} ngày</span></div><div className="h-1 w-20 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-gradient-to-r from-[#1a6b5a] to-[#3aa882] transition-all duration-300" style={{ width: `${progressPercent}%` }} /></div></div>
                  <div className="flex-[0.8] px-3 text-center"><div className="flex items-center justify-center"><span className="text-sm font-bold text-[#1e293b]">{item.views?.toLocaleString() || 0}</span><MiniSparkline data={[12, 19, 15, 25, 22]} color="#1a6b5a" /></div><div className="mt-1"><MultiColorProgress values={[item.views || 0, 100, 50]} /></div></div>
                  <div className="flex-[0.8] px-3 text-center"><div className="flex items-center justify-center"><span className="text-sm font-bold text-[#1e293b]">{item.booking_count || 0}</span><MiniSparkline data={[5, 8, 6, 10, 7]} color="#8b6ec4" /></div><div className="mt-1"><MultiColorProgress values={[confirmed, pending, cancelled]} /></div></div>
                  <div className="flex-[0.7] px-3 text-center"><span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#1a6b5a] text-xs font-bold text-[#1a6b5a]">{confirmed}</span></div>
                  <div className="flex-[1] px-3 text-center"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${item.status === 'active' ? 'border-[#bbf7d0] bg-[#dcfce7] text-[#16a34a]' : item.status === 'paused' ? 'border-[#fde68a] bg-[#fef3c7] text-[#b45309]' : 'bg-gray-100 text-gray-600'}`}>{item.status === 'active' ? 'HOẠT ĐỘNG' : item.status === 'paused' ? 'TẠM DỪNG' : item.status}</span>{isVIP && <div className="mt-1"><span className="inline-flex items-center gap-0.5 rounded-full bg-[#fef9c3] px-2 py-0.5 text-[10px] font-semibold text-[#b45309]"><Star size={8} fill="currentColor" /> VIP</span></div>}</div>
                  <div className="flex-[0.7] px-3 text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => handleEdit(item)} className="rounded-lg p-1.5 text-[#94a3b8] transition-colors hover:bg-gray-100 hover:text-[#1a6b5a]" title="Chỉnh sửa"><Pencil size={15} /></button><button onClick={() => handleOpenRenew(item)} disabled={renewingListing === item.listing_id} className="rounded-lg p-1.5 text-[#94a3b8] transition-colors hover:bg-green-50 hover:text-[#0f6e56]" title="Gia hạn"><RotateCw size={15} /></button><button onClick={() => handleDuplicate(item)} className="rounded-lg p-1.5 text-[#94a3b8] transition-colors hover:bg-gray-100 hover:text-[#3b2870]" title="Sao chép"><Copy size={15} /></button><button onClick={() => handleDelete(item)} className="rounded-lg p-1.5 text-[#94a3b8] transition-colors hover:bg-red-50 hover:text-red-500" title="Xóa"><Trash2 size={15} /></button></div></div>
                </div>
              );
            })}
            {filteredListings.length === 0 && <div className="py-16 text-center"><Building2 size={40} className="mx-auto mb-3 text-gray-300" /><p className="font-medium text-[#94a3b8]">Không có tin đăng nào phù hợp</p></div>}
          </div>
        </div>
      </div>

      {isSelectRoomOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="flex max-h-[75vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] p-4">
              <div><h2 className="text-base font-bold text-[#1e293b]">Chọn phòng để đăng tin</h2><p className="mt-0.5 text-xs text-[#94a3b8]">Chỉ hiển thị phòng trống thật từ CSDL</p></div>
              <button onClick={() => setIsSelectRoomOpen(false)} className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{roomsLoading ? <div className="flex justify-center py-16"><Spinner size="md" /></div> : availableRooms.length > 0 ? <div className="grid gap-3">{availableRooms.map(room => <button key={room.room_id} onClick={() => handleRoomSelect(room)} className="flex items-center justify-between rounded-xl border border-[#e2e8f0] px-4 py-4 text-left transition-colors hover:border-[#1a6b5a] hover:bg-[#f6fffb]"><div><p className="font-bold text-[#1e293b]">{room.building_name} · Phòng {room.room_number}</p><p className="mt-1 text-sm text-[#64748b]">Tầng {room.floor || 1} · {room.area || 0}m² · {new Intl.NumberFormat('vi-VN').format(room.base_price || 0)}đ/tháng</p></div><div className="rounded-full bg-[#ecfdf5] px-3 py-1.5 text-xs font-semibold text-[#1a6b5a]">Trống</div></button>)}</div> : <div className="py-12 text-center text-[#94a3b8]"><p className="font-medium">Chưa có phòng trống để đăng tin</p><p className="mt-1 text-sm">Hãy tạo hoặc chuyển trạng thái phòng sang trống trong quản lý tòa nhà.</p></div>}</div>
          </div>
        </div>
      )}

      {showRenewalModal && selectedRenewListing && (
        <RenewalModal
          isOpen={showRenewalModal}
          onClose={() => { setShowRenewalModal(false); setSelectedRenewListing(null); }}
          listing={selectedRenewListing}
          onConfirm={handleConfirmRenew}
          plans={renewalPlans}
          walletBalance={walletBalance}
          loadingPlans={plansLoading}
        />
      )}

      {isPromoteModalOpen && <PromoteModal isOpen={isPromoteModalOpen} onClose={() => setIsPromoteModalOpen(false)} listing={selectedListingToPromote} />}
    </div>
  );
};

export default Listings;
