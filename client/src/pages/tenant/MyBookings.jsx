import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Info,
  MapPin,
  Phone,
  Search,
  ShieldAlert,
  User,
  CircleDashed,
  CircleCheck,
  Bell,
} from 'lucide-react';
import bookingService from '../../services/bookingService';
import contractService from '../../services/contractService';
import { StatusBadge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Loading';

const defaultHeroImage = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2670&auto=format&fit=crop';

const formatDateTime = (date, time) => {
  try {
    const d = new Date(date);
    const dateText = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeText = time ? String(time).substring(0, 5) : '--:--';
    return `${timeText}, ${dateText}`;
  } catch {
    return `${time || '--:--'}, --/--/----`;
  }
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getTenantBookings();
      const safeData = Array.isArray(data) ? data : [];
      setBookings(safeData);
      if (!selectedBooking && safeData.length > 0) setSelectedBooking(safeData[0]);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Không tải được danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateContract = async (bookingId) => {
    try {
      const result = await contractService.createFromBooking(bookingId);
      if (result?.success) {
        navigate(`/tenant/contract/${result.contractId}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi khởi tạo hợp đồng.');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;
    try {
      await bookingService.cancelBooking(bookingId);
      toast.success('Đã hủy lịch hẹn thành công');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi hủy lịch hẹn.');
    }
  };



  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'rejected' || b.status === 'cancelled').length,
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const statusMatch = filter === 'all' || 
        (filter === 'rejected' ? (b.status === 'rejected' || b.status === 'cancelled') : b.status === filter);
      const q = searchTerm.trim().toLowerCase();
      const text = `${b.room_number || ''} ${b.building_name || ''} ${b.location_detail || ''}`.toLowerCase();
      const searchMatch = !q || text.includes(q);
      return statusMatch && searchMatch;
    });
  }, [bookings, filter, searchTerm]);

  const navTabs = [
    { id: 'all', label: 'Tất cả', count: stats.total },
    { id: 'pending', label: 'Chờ xác nhận', count: stats.pending, tone: 'amber' },
    { id: 'confirmed', label: 'Đã xác nhận', count: stats.confirmed, tone: 'green' },
    { id: 'rejected', label: 'Đã hủy', count: stats.cancelled, tone: 'red' },
  ];

  const getToneClass = (status) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
      case 'deposited':
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-100';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-100';
      default:
        return 'bg-[#e7e7f3] text-[#434655] border-[#c3c6d7]';
    }
  };

  const BookingCard = ({ booking }) => {
    const active = selectedBooking?.booking_id === booking.booking_id;
    const image = booking.image_url || booking.room_image || defaultHeroImage;

    return (
      <button
        type="button"
        onClick={() => setSelectedBooking(booking)}
        className={`w-full rounded-xl border bg-white p-4 text-left transition-all hover:border-[#2563eb] hover:shadow-sm ${active ? 'border-[#2563eb] shadow-[0_10px_30px_rgba(37,99,235,0.08)] ring-4 ring-[#2563eb]/5' : 'border-[#c3c6d7]'}`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-[60px] w-[80px] overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#f3f3fe] flex-shrink-0">
              <img src={image} alt={booking.building_name || 'Room'} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[16px] font-bold leading-6 text-[#191b23] md:text-[18px]">
                Phòng {booking.room_number || '—'} <span className="mx-1 text-[#c3c6d7]">|</span> <span className="text-[12px] font-semibold uppercase tracking-wide text-[#737686]">{booking.building_name || 'Đang cập nhật'}</span>
              </h3>
              <div className="mt-1 flex items-center gap-2 text-[14px] text-[#434655]">
                <MapPin size={14} className="text-[#737686]" />
                <span className="line-clamp-1">{booking.location_detail || 'Vị trí sẽ được cập nhật'}</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-[12px] font-medium text-[#737686]">
                <span className="inline-flex items-center gap-1"><Calendar size={14} /> {formatDateTime(booking.booking_date, booking.booking_time)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 md:justify-end">
            <StatusBadge status={booking.status} />
            <ArrowRight size={18} className={`hidden text-[#2563eb] md:block ${active ? 'opacity-100' : 'opacity-30 group-hover:opacity-100'}`} />
          </div>
        </div>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-[#faf8ff]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8ff] text-[#191b23] font-['Be_Vietnam_Pro',sans-serif]">
      <div className="mx-auto max-w-[1280px] px-margin-desktop py-8 md:py-10">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-[#c3c6d7] pb-6 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h2 className="text-[30px] font-semibold leading-[38px] tracking-[-0.01em] text-[#191b23] md:text-[30px]">Lịch hẹn của tôi</h2>
              <span className="rounded-full bg-[#2563eb] px-3 py-1 text-[14px] font-medium text-[#eeefff]">{stats.total} lịch hẹn</span>
            </div>
            <p className="text-[16px] leading-6 text-[#434655]">Theo dõi, xác nhận và quản lý các cuộc hẹn xem phòng của bạn.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[#c3c6d7] bg-white px-4 py-3 text-center">
              <p className="text-xl font-black text-[#191b23]">{stats.total}</p>
              <p className="text-[12px] text-[#737686]">Tổng cộng</p>
            </div>
            <div className="rounded-xl border border-[#c3c6d7] bg-white px-4 py-3 text-center">
              <p className="text-xl font-black text-amber-500">{stats.pending}</p>
              <p className="text-[12px] text-[#737686]">Chờ duyệt</p>
            </div>
            <div className="rounded-xl border border-[#c3c6d7] bg-white px-4 py-3 text-center">
              <p className="text-xl font-black text-emerald-500">{stats.confirmed}</p>
              <p className="text-[12px] text-[#737686]">Đã chốt</p>
            </div>
            <div className="rounded-xl border border-[#c3c6d7] bg-white px-4 py-3 text-center">
              <p className="text-xl font-black text-[#ba1a1a]">{stats.cancelled}</p>
              <p className="text-[12px] text-[#737686]">Đã hủy</p>
            </div>
          </div>
        </div>

        <div className="mb-8 flex items-center gap-4 overflow-x-auto border-b border-[#c3c6d7] no-scrollbar">
          {navTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 text-[14px] font-medium transition-colors ${filter === tab.id ? 'border-[#004ac6] text-[#004ac6]' : 'border-transparent text-[#434655] hover:text-[#004ac6]'}`}
            >
              {tab.label}
              {tab.count > 0 && tab.id !== 'all' && (
                <span className={`rounded-full px-2 py-0.5 text-[12px] font-bold ${tab.tone === 'amber' ? 'bg-amber-100 text-amber-700' : tab.tone === 'green' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-4">
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#c3c6d7] bg-white px-4 py-3">
              <Search size={18} className="text-[#737686]" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo phòng, tòa nhà, địa chỉ..."
                className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#737686]"
              />
            </div>

            {filteredBookings.length > 0 ? (
              filteredBookings.map(booking => (
                <BookingCard key={booking.booking_id} booking={booking} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-[#c3c6d7] bg-white px-8 py-20 text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#f3f3fe] text-[#737686]">
                  <Info size={42} />
                </div>
                <h3 className="mb-2 text-[24px] font-semibold leading-8 text-[#191b23]">Không tìm thấy lịch hẹn</h3>
                <p className="mb-8 max-w-sm text-[16px] leading-6 text-[#434655]">Bạn có thể đổi bộ lọc hoặc tiếp tục khám phá các phòng đang hot nhất hiện nay.</p>
                <Link to="/tenant/discover" className="rounded-lg bg-[#004ac6] px-8 py-3 text-[14px] font-bold text-white transition-all hover:bg-[#2563eb]">
                  Tiếp tục tìm phòng
                </Link>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="overflow-hidden rounded-[24px] border border-[#c3c6d7] bg-white shadow-[0_20px_40px_-16px_rgba(0,0,0,0.08)]">
              <div className="relative flex h-40 flex-col justify-end overflow-hidden bg-gradient-to-br from-[#004ac6] to-[#0c1a3a] p-6">
                <div className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                  ID: #{selectedBooking?.booking_id || '—'}
                </div>
                <h2 className="text-[24px] font-semibold leading-8 text-white">Chi tiết cuộc hẹn</h2>
                <p className="mt-1 text-[12px] font-medium text-[#dae2ff]">
                  {selectedBooking ? `Cập nhật lúc ${new Date(selectedBooking.updated_at || selectedBooking.created_at || Date.now()).toLocaleTimeString('vi-VN')}` : 'Chọn một lịch hẹn để xem chi tiết'}
                </p>
              </div>

              {selectedBooking ? (
                <div className="space-y-6 p-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#c3c6d7] bg-[#f3f3fe] p-4">
                      <div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-[#737686]">
                        <Calendar size={12} /> Ngày xem
                      </div>
                      <div className="text-[14px] font-bold text-[#191b23]">{new Date(selectedBooking.booking_date).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <div className="rounded-xl border border-[#c3c6d7] bg-[#f3f3fe] p-4">
                      <div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-[#737686]">
                        <Clock3 size={12} /> Giờ xem
                      </div>
                      <div className="text-[14px] font-bold text-[#191b23]">{String(selectedBooking.booking_time || '--:--').substring(0, 5)}</div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-[#c3c6d7] bg-[#faf8ff] p-5">
                    <div className="mb-2 text-[12px] font-bold uppercase tracking-widest text-[#737686]">Thông tin căn phòng</div>
                    <div className="text-[18px] font-bold text-[#191b23]">
                      Phòng {selectedBooking.room_number || '—'} <span className="mx-2 text-[#c3c6d7]">|</span> <span className="uppercase text-[#434655]">{selectedBooking.building_name || 'Đang cập nhật'}</span>
                    </div>
                    <div className="mt-3 flex items-start gap-2 text-[14px] font-medium leading-6 text-[#434655]">
                      <MapPin size={16} className="mt-0.5 text-[#004ac6]" />
                      <span>{selectedBooking.location_detail || 'Địa chỉ đang được cập nhật bởi hệ thống'}</span>
                    </div>
                  </div>

                  {selectedBooking.status === 'confirmed' ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-widest text-green-700">
                        <CircleCheck size={18} /> Lịch hẹn đã sẵn sàng
                      </div>
                      <div className="rounded-[24px] border border-[#c3c6d7] bg-white p-4 shadow-sm">
                        <div className="mb-1 text-[12px] font-bold uppercase tracking-widest text-[#737686]">Người dẫn xem</div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#004ac6] text-white">
                            <User size={22} />
                          </div>
                          <div>
                            <div className="text-[16px] font-bold text-[#191b23]">{selectedBooking.lead_person_name || 'Đang cập nhật'}</div>
                            <div className="flex items-center gap-2 text-[14px] font-medium text-[#004ac6]">
                              <Phone size={14} /> {selectedBooking.lead_person_phone || '—'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedBooking.landlord_notes && (
                        <div className="rounded-[24px] border border-dashed border-[#c3c6d7] bg-[#faf8ff] p-4">
                          <div className="mb-2 text-[12px] font-bold uppercase tracking-widest text-[#004ac6]">Ghi chú</div>
                          <p className="text-[14px] italic leading-6 text-[#434655]">{selectedBooking.landlord_notes}</p>
                        </div>
                      )}

                      <a href={`tel:${selectedBooking.lead_person_phone || ''}`} className="flex items-center justify-center gap-2 rounded-xl border border-[#c3c6d7] bg-white px-4 py-3 text-[14px] font-bold text-[#004ac6] transition-colors hover:bg-[#f3f3fe]">
                        <Phone size={18} /> Gọi điện ngay
                      </a>

                      <button
                        onClick={() => handleCreateContract(selectedBooking.booking_id)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#004ac6] px-4 py-3 text-[14px] font-bold text-white transition-colors hover:bg-[#2563eb]"
                      >
                        <FileText size={18} /> Ký hợp đồng online
                      </button>

                      <button
                        onClick={() => handleCancelBooking(selectedBooking.booking_id)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-[14px] font-bold text-red-600 transition-colors hover:bg-red-50"
                      >
                        Hủy lịch hẹn
                      </button>
                    </div>
                  ) : selectedBooking.status === 'pending' ? (
                    <div className="rounded-[24px] border border-amber-100 bg-amber-50 p-6 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-amber-500 shadow-sm ring-8 ring-amber-50">
                        <CircleDashed size={30} className="animate-spin-slow" />
                      </div>
                      <h4 className="mb-2 text-[18px] font-bold text-amber-900">Đang chờ phản hồi</h4>
                      <p className="text-[14px] leading-6 text-amber-700">Chủ trọ sẽ nhận được thông báo về yêu cầu của bạn. Thông tin liên hệ sẽ hiển thị khi lịch được xác nhận.</p>
                      
                      <button
                        onClick={() => handleCancelBooking(selectedBooking.booking_id)}
                        className="mt-4 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-[14px] font-bold text-red-600 transition-colors hover:bg-red-50"
                      >
                        Hủy lịch hẹn
                      </button>
                    </div>

                  ) : (
                    <div className="rounded-[24px] border border-[#c3c6d7] bg-[#faf8ff] p-6 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#737686] shadow-sm ring-8 ring-[#f3f3fe]">
                        <ShieldAlert size={30} />
                      </div>
                      <h4 className="mb-2 text-[18px] font-bold text-[#191b23]">Lịch hẹn đã kết thúc / bị hủy</h4>
                      <p className="text-[14px] leading-6 text-[#434655]">Bạn có thể tiếp tục khám phá các phòng khác hoặc tạo một cuộc hẹn mới.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-[14px] text-[#434655]">Chọn một lịch hẹn để xem thông tin chi tiết.</div>
              )}
            </div>

            <div className="relative overflow-hidden rounded-[24px] bg-[#004ac6] p-6 text-white w-full">
              <div className="relative z-10 max-w-lg">
                <p className="text-[12px] font-bold uppercase tracking-widest text-white/70">Tổng quan hàng tháng</p>
                <h4 className="mt-2 text-[24px] font-semibold leading-8">{stats.confirmed + stats.pending} lịch hẹn sắp tới</h4>
                <p className="mt-2 text-[14px] leading-6 text-white/85">Bạn có các cuộc gặp gỡ đang chờ xử lý trong tháng này. Hãy chuẩn bị giấy tờ cần thiết trước khi đến xem phòng.</p>
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-20">
                <Bell size={160} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MyBookings;
