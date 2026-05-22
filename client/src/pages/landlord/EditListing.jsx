import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Loader, Sparkles, CalendarClock, ShieldCheck, BadgePlus, RotateCw, CheckCircle2 } from 'lucide-react';
import listingService from '../../services/listingService';
import propertyService from '../../services/propertyService';
import { getBuilding, getRooms } from '../../features/properties/propertySlice';

const RENEWAL_OPTIONS = [
  { id: 7, label: '7 ngày' },
  { id: 15, label: '15 ngày' },
  { id: 30, label: '30 ngày' },
  { id: 60, label: '60 ngày' },
];

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

const EditListing = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { buildingId, roomId } = useParams();
  const { currentBuilding, rooms } = useSelector((state) => state.properties);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [room, setRoom] = useState(null);
  const [listing, setListing] = useState(null);
  const [renewDays, setRenewDays] = useState(30);
  const [form, setForm] = useState({ title: '', description: '', rent_price: 0, deposit_amount: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [roomDetails, listingData] = await Promise.all([
          propertyService.getRoomDetails(roomId),
          listingService.getListingByRoom(roomId)
        ]);
        setRoom(roomDetails);
        setListing(listingData);
        const basePrice = roomDetails?.base_price || 0;
        setForm({
          title: listingData?.title || `Phòng ${roomDetails?.room_number || roomId} tại ${roomDetails?.building_name || 'Tòa nhà'}`,
          description: listingData?.description || roomDetails?.description || '',
          rent_price: listingData?.rent_price || basePrice,
          deposit_amount: listingData?.deposit_amount || basePrice
        });
        if (buildingId) {
          dispatch(getBuilding(buildingId));
          dispatch(getRooms(buildingId));
        }
      } catch (err) {
        console.error(err);
        toast.error('Không tải được dữ liệu phòng/tin đăng');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [roomId, buildingId, dispatch]);

  const relatedRooms = useMemo(() => (Array.isArray(rooms) ? rooms : []).filter(r => String(r.building_id) === String(buildingId)), [rooms, buildingId]);
  const canSubmit = useMemo(() => form.title.trim() && form.description.trim() && Number(form.rent_price) > 0, [form]);
  const isPremium = !!listing?.premium_until && new Date(listing.premium_until) > new Date();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (listing?.listing_id) {
        await listingService.updateListing(listing.listing_id, {
          ...form,
          status: listing.status || 'active'
        });
        toast.success('Cập nhật tin đăng thành công');
      } else {
        const payload = {
          room_id: Number(roomId),
          title: form.title,
          description: form.description,
          rent_price: Number(form.rent_price),
          deposit_amount: Number(form.deposit_amount),
          category_id: null,
          electricity_price: room?.electricity_price || 0,
          water_price: room?.water_price || 0,
          service_price: room?.service_price || 0,
          amenities: room?.amenities || {}
        };
        const res = await listingService.createListing(payload);
        toast.success('Tạo tin đăng thành công');
        if (res?.listingId) {
          navigate('/landlord/listings');
          return;
        }
      }
      navigate('/landlord/listings');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể lưu tin đăng');
    } finally {
      setSaving(false);
    }
  };

  const handleRenewListing = async () => {
    if (!listing?.listing_id) {
      toast.error('Chưa có tin đăng để gia hạn');
      return;
    }

    try {
      setSaving(true);
      const expiresAt = new Date(Date.now() + renewDays * 24 * 60 * 60 * 1000).toISOString();
      await listingService.updateListing(listing.listing_id, {
        ...form,
        status: 'active',
        expires_at: expiresAt,
      });
      setListing(prev => ({ ...prev, status: 'active', expires_at: expiresAt }));
      toast.success(`Đã gia hạn tin đăng ${renewDays} ngày`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể gia hạn tin đăng');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader className="animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-medium text-[#1e293b] hover:border-indigo-200 hover:text-indigo-600">
          <ArrowLeft size={16} /> Quay lại
        </button>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-[#e2e8f0] bg-white p-6 md:p-8 shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Đăng tin thật từ dữ liệu phòng</p>
              <h1 className="mt-2 text-2xl font-bold text-[#0f172a]">{room?.building_name} · Phòng {room?.room_number}</h1>
              <p className="mt-1 text-sm text-[#64748b]">{room?.address}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1e293b]">Tiêu đề tin đăng</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-2xl border border-[#e2e8f0] px-4 py-3 outline-none focus:border-indigo-500"
                  placeholder="Nhập tiêu đề"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#1e293b]">Mô tả</label>
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600"><Sparkles size={12} /> Dùng dữ liệu thật của phòng</span>
                </div>
                <textarea
                  rows={8}
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-2xl border border-[#e2e8f0] px-4 py-3 outline-none focus:border-indigo-500"
                  placeholder="Mô tả chi tiết"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1e293b]">Giá thuê</label>
                  <input
                    type="number"
                    value={form.rent_price}
                    onChange={(e) => setForm(prev => ({ ...prev, rent_price: e.target.value }))}
                    className="w-full rounded-2xl border border-[#e2e8f0] px-4 py-3 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1e293b]">Tiền cọc</label>
                  <input
                    type="number"
                    value={form.deposit_amount}
                    onChange={(e) => setForm(prev => ({ ...prev, deposit_amount: e.target.value }))}
                    className="w-full rounded-2xl border border-[#e2e8f0] px-4 py-3 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-[#f8fafc] p-4 text-sm text-[#475569] space-y-1">
                <p><strong>Tòa:</strong> {currentBuilding?.name || room?.building_name}</p>
                <p><strong>Phòng:</strong> {room?.room_number}</p>
                <p><strong>Trạng thái phòng:</strong> {room?.status === 'available' ? 'Trống' : room?.status === 'occupied' ? 'Đã thuê' : room?.status}</p>
                <p><strong>Trạng thái tin:</strong> {listing ? (listing.status === 'active' ? 'Đang hiển thị' : 'Đã tạm dừng') : 'Chưa có tin đăng'}</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => navigate(-1)} className="rounded-2xl border border-[#e2e8f0] px-5 py-3 font-semibold text-[#334155] hover:border-[#cbd5e1]">Hủy</button>
                <button disabled={!canSubmit || saving} type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? <Loader size={16} className="animate-spin" /> : null}
                  {listing ? 'Lưu tin đăng' : 'Tạo tin đăng'}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]"><ShieldCheck size={16} className="text-emerald-600" /> Gia hạn tin đăng</div>
              <p className="mt-2 text-sm text-[#64748b]">Gia hạn giúp tin tiếp tục hiển thị. Nếu backend chưa có cột ngày hết hạn, hệ thống vẫn kích hoạt lại tin về trạng thái hoạt động.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {RENEWAL_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRenewDays(opt.id)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${renewDays === opt.id ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-[#e2e8f0] text-[#334155] hover:border-indigo-200'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button onClick={handleRenewListing} disabled={!listing?.listing_id || saving} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                <RotateCw size={16} /> Gia hạn tin
              </button>
              {isPremium && (
                <div className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                  Tin đang là premium đến: {new Date(listing.premium_until).toLocaleString('vi-VN')}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]"><CalendarClock size={16} className="text-indigo-600" /> Thông tin phòng thật</div>
              <div className="mt-4 space-y-2 text-sm text-[#475569]">
                <p><strong>Giá gốc:</strong> {formatCurrency(room?.base_price)} đ</p>
                <p><strong>Diện tích:</strong> {room?.area} m²</p>
                <p><strong>Điện:</strong> {formatCurrency(room?.electricity_price || 0)} đ</p>
                <p><strong>Nước:</strong> {formatCurrency(room?.water_price || 0)} đ</p>
                <p><strong>Dịch vụ:</strong> {formatCurrency(room?.service_price || 0)} đ</p>
                <p><strong>Tiện ích:</strong> {room?.amenities ? 'Đã có dữ liệu' : 'Chưa có dữ liệu'}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]"><BadgePlus size={16} className="text-indigo-600" /> Phòng cùng tòa</div>
              <div className="mt-4 max-h-64 overflow-auto space-y-2">
                {relatedRooms.length > 0 ? relatedRooms.map(r => (
                  <button
                    key={r.room_id}
                    type="button"
                    onClick={() => navigate(`/landlord/properties/${buildingId}/rooms/${r.room_id}/edit-listing`)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${String(r.room_id) === String(roomId) ? 'border-indigo-500 bg-indigo-50' : 'border-[#e2e8f0] hover:border-indigo-200'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-[#0f172a]">Phòng {r.room_number}</span>
                      <span className="text-xs text-[#64748b]">{r.status === 'available' ? 'Trống' : r.status === 'occupied' ? 'Đã thuê' : r.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#64748b]">{r.area} m² · {formatCurrency(r.base_price)} đ</p>
                  </button>
                )) : <p className="text-sm text-[#64748b]">Chưa có dữ liệu phòng trong tòa này.</p>}
              </div>
            </div>

            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]"><CheckCircle2 size={16} className="text-emerald-600" /> Logic gia hạn tin</div>
              <ul className="mt-3 space-y-2 text-sm text-[#64748b] list-disc pl-5">
                <li>Nếu tin chưa có, hệ thống tạo tin từ dữ liệu thật của phòng.</li>
                <li>Nếu tin đã có, bấm lưu sẽ cập nhật nội dung hiện tại.</li>
                <li>Nút gia hạn sẽ kích hoạt lại tin và đặt `expires_at` theo số ngày chọn.</li>
                <li>Nếu backend chưa hỗ trợ `expires_at`, tin vẫn được bật về trạng thái hoạt động.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditListing;
