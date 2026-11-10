import React, { useState, useEffect } from 'react';
import { Sparkles, Bot, ArrowRight, Check, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Sliders } from 'lucide-react';
import aiService from '../../services/aiService';

const DISTRICTS = [
  'Cầu Giấy', 'Đống Đa', 'Thanh Xuân', 'Nam Từ Liêm', 
  'Bắc Từ Liêm', 'Hoàng Mai', 'Hai Bà Trưng', 'Ba Đình', 
  'Hà Đông', 'Tây Hồ'
];

const ROOM_TYPES = ['Phòng trọ', 'Chung cư mini', 'Căn hộ dịch vụ', 'Nhà nguyên căn'];
const FURNITURE_LEVELS = ['Đầy đủ', 'Cơ bản', 'Trống'];

const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(Number(num || 0));

/**
 * Trích xuất quận từ chuỗi địa chỉ
 */
const detectDistrict = (address) => {
  if (!address) return 'Cầu Giấy';
  const addrLower = address.toLowerCase();
  for (const d of DISTRICTS) {
    if (addrLower.includes(d.toLowerCase())) return d;
  }
  return 'Cầu Giấy';
};

/**
 * Widget Gợi ý giá thuê phòng bằng Machine Learning
 * Đọc trực tiếp dữ liệu từ form và thông tin phòng trên web
 */
const AiPriceSuggestionWidget = ({
  initialData = {},
  currentPrice = 0,
  onApplyPrice,
  className = ''
}) => {
  // Trạng thái mở rộng chi tiết tính toán
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [applied, setApplied] = useState(false);

  // Dữ liệu đặc trưng đưa vào mô hình ML
  const [features, setFeatures] = useState({
    district: 'Cầu Giấy',
    area_m2: 25,
    room_type: 'Phòng trọ',
    furniture_level: 'Cơ bản',
    max_occupants: 2,
    has_ac: 1,
    has_water_heater: 1,
    has_parking: 1,
    has_wifi: 1,
    floor: 2,
  });

  // Tự động đồng bộ khi initialData thay đổi từ web
  useEffect(() => {
    if (!initialData) return;

    // Phân tích tiện ích từ object, array hoặc chuỗi JSON
    let amenities = initialData.amenities || {};
    if (typeof amenities === 'string') {
      try {
        amenities = JSON.parse(amenities);
      } catch (e) {
        amenities = {};
      }
    }

    const hasAc = Boolean(
      amenities.air_conditioner || amenities.ac || amenities.dieu_hoa ||
      (Array.isArray(amenities) && (amenities.includes('air_conditioner') || amenities.includes('ac') || amenities.includes('dieu_hoa')))
    );
    const hasHeater = Boolean(
      amenities.water_heater || amenities.hot_water || amenities.nong_lanh ||
      (Array.isArray(amenities) && (amenities.includes('water_heater') || amenities.includes('hot_water') || amenities.includes('nong_lanh')))
    );
    const hasWifi = Boolean(
      amenities.wifi || amenities.internet ||
      (Array.isArray(amenities) && (amenities.includes('wifi') || amenities.includes('internet')))
    );
    const hasParking = Boolean(
      amenities.parking || amenities.xe ||
      (Array.isArray(amenities) && (amenities.includes('parking') || amenities.includes('xe')))
    );

    // Xác định mức nội thất
    let furnLevel = 'Cơ bản';
    if (amenities.bed && amenities.wardrobe && amenities.fridge) {
      furnLevel = 'Đầy đủ';
    } else if (!hasAc && !amenities.bed && !amenities.wardrobe) {
      furnLevel = 'Trống';
    }

    const area = parseFloat(initialData.area || initialData.area_m2) || 25;
    const floor = parseInt(initialData.floor) || 2;
    const maxOccupants = parseInt(initialData.max_occupants) || (area < 20 ? 2 : area < 35 ? 3 : 4);
    const detectedDist = detectDistrict(initialData.address || initialData.district);

    setFeatures({
      district: detectedDist,
      area_m2: area,
      room_type: initialData.room_type || (initialData.type === 'mini_apartment' ? 'Chung cư mini' : 'Phòng trọ'),
      furniture_level: initialData.furniture_level || furnLevel,
      max_occupants: maxOccupants,
      has_ac: hasAc ? 1 : 0,
      has_water_heater: hasHeater ? 1 : 0,
      has_parking: hasParking ? 1 : 0,
      has_wifi: hasWifi ? 1 : 0,
      floor: floor,
    });
  }, [initialData]);

  // Gọi API dự đoán giá
  const handlePredictPrice = async () => {
    try {
      setLoading(true);
      setError(null);
      setApplied(false);

      const payload = {
        district: features.district,
        area_m2: Number(features.area_m2),
        room_type: features.room_type,
        furniture_level: features.furniture_level,
        max_occupants: Number(features.max_occupants),
        has_ac: Number(features.has_ac),
        has_water_heater: Number(features.has_water_heater),
        has_parking: Number(features.has_parking),
        has_wifi: Number(features.has_wifi),
        floor: Number(features.floor),
      };

      const res = await aiService.predictPrice(payload);
      setResult(res);
    } catch (err) {
      console.error('Lỗi khi gợi ý giá:', err);
      const msg = err.response?.data?.message || err.response?.data?.detail || err.message || 'Không thể kết nối đến dịch vụ AI';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Áp dụng giá vào form
  const handleApply = () => {
    const finalPrice = result?.predicted_price_vnd ?? result?.predicted_price;
    if (!finalPrice) return;
    if (onApplyPrice) {
      onApplyPrice(finalPrice);
      setApplied(true);
    }
  };

  const finalPrice = result?.predicted_price_vnd ?? result?.predicted_price ?? 0;
  const lowPrice = result?.price_range?.low ?? result?.suggested_range?.min_price ?? 0;
  const highPrice = result?.price_range?.high ?? result?.suggested_range?.max_price ?? 0;

  return (
    <div className={`rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 p-5 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
            <Sparkles size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              AI Gợi ý giá thuê phòng
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">Machine Learning</span>
            </h4>
            <p className="text-xs text-slate-500">Đọc trực tiếp từ thông tin phòng & vị trí trên web</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <Sliders size={13} />
          {showAdvanced ? 'Thu gọn' : 'Xem thông số'}
          {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Tóm tắt các đặc trưng đã đọc từ web */}
      <div className="mb-4 flex flex-wrap gap-1.5 text-xs">
        <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-600 font-medium">
          📍 {features.district}
        </span>
        <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-600 font-medium">
          📐 {features.area_m2} m²
        </span>
        <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-600 font-medium">
          🏢 Tầng {features.floor}
        </span>
        <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-600 font-medium">
          🛋 {features.furniture_level}
        </span>
        {features.has_ac === 1 && (
          <span className="rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-blue-700 font-medium">
            ❄️ Điều hòa
          </span>
        )}
        {features.has_water_heater === 1 && (
          <span className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-amber-700 font-medium">
            🔥 Nóng lạnh
          </span>
        )}
      </div>

      {/* Bảng chỉnh sửa thông số đầu vào nếu muốn tùy biến */}
      {showAdvanced && (
        <div className="mb-4 rounded-2xl border border-indigo-100 bg-white p-4 text-xs space-y-3">
          <p className="font-semibold text-slate-700">Thông số đầu vào mô hình Machine Learning:</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Khu vực / Quận</label>
              <select
                value={features.district}
                onChange={(e) => setFeatures(f => ({ ...f, district: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-indigo-500"
              >
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1 font-medium">Loại phòng</label>
              <select
                value={features.room_type}
                onChange={(e) => setFeatures(f => ({ ...f, room_type: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-indigo-500"
              >
                {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1 font-medium">Mức nội thất</label>
              <select
                value={features.furniture_level}
                onChange={(e) => setFeatures(f => ({ ...f, furniture_level: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-indigo-500"
              >
                {FURNITURE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1 font-medium">Diện tích (m²)</label>
              <input
                type="number"
                min="5"
                max="200"
                value={features.area_m2}
                onChange={(e) => setFeatures(f => ({ ...f, area_m2: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1 font-medium">Tầng</label>
              <input
                type="number"
                min="1"
                max="50"
                value={features.floor}
                onChange={(e) => setFeatures(f => ({ ...f, floor: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1 font-medium">Số người ở tối đa</label>
              <input
                type="number"
                min="1"
                max="10"
                value={features.max_occupants}
                onChange={(e) => setFeatures(f => ({ ...f, max_occupants: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={features.has_ac === 1}
                onChange={(e) => setFeatures(f => ({ ...f, has_ac: e.target.checked ? 1 : 0 }))}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Điều hòa</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={features.has_water_heater === 1}
                onChange={(e) => setFeatures(f => ({ ...f, has_water_heater: e.target.checked ? 1 : 0 }))}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Bình nóng lạnh</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={features.has_parking === 1}
                onChange={(e) => setFeatures(f => ({ ...f, has_parking: e.target.checked ? 1 : 0 }))}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Chỗ để xe</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={features.has_wifi === 1}
                onChange={(e) => setFeatures(f => ({ ...f, has_wifi: e.target.checked ? 1 : 0 }))}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Wifi / Internet</span>
            </label>
          </div>
        </div>
      )}

      {/* Nút kích hoạt gợi ý */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePredictPrice}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Đang tính toán giá...
            </>
          ) : (
            <>
              <Bot size={14} />
              {result ? 'Tính lại giá gợi ý' : 'Tính giá gợi ý bằng AI'}
            </>
          )}
        </button>

        {currentPrice > 0 && (
          <span className="text-xs text-slate-500">
            Giá hiện tại trong tin: <strong className="text-slate-700">{formatVND(currentPrice)} đ</strong>
          </span>
        )}
      </div>

      {/* Hiển thị lỗi */}
      {error && (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
          <div>
            <p className="font-semibold">Lỗi khi gọi mô hình dự đoán</p>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Hiển thị kết quả gợi ý */}
      {result && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Giá gợi ý tối ưu (AI ML):
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-700">
                  {formatVND(finalPrice)} <span className="text-sm font-semibold">VNĐ/tháng</span>
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Khoảng giá thị trường khuyến nghị:{' '}
                <strong className="text-slate-800">
                  {formatVND(lowPrice)} - {formatVND(highPrice)} đ
                </strong>
              </p>
            </div>

            {/* Nút Áp dụng giá */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={handleApply}
                disabled={applied}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition-all ${
                  applied
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md'
                }`}
              >
                {applied ? (
                  <>
                    <Check size={14} />
                    Đã áp dụng vào tin đăng
                  </>
                ) : (
                  <>
                    <ArrowRight size={14} />
                    Áp dụng giá này
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Cảnh báo minh bạch theo đúng yêu cầu đề bài */}
          <div className="mt-3 pt-3 border-t border-emerald-200/60 text-[11px] text-emerald-900/80 leading-relaxed">
            <p>
              ℹ️ <strong>Lưu ý:</strong> Giá gợi ý được mô hình Machine Learning (Random Forest) tính toán dựa trên dữ liệu mô phỏng theo đặc điểm thị trường Hà Nội. Đây là mức giá <em>tham khảo</em>, bạn hoàn toàn có quyền tự quyết định giá cho thuê thực tế.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiPriceSuggestionWidget;
