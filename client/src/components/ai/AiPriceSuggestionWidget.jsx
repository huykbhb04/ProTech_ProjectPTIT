import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  ArrowRight,
  Check,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';
import aiService from '../../services/aiService';

export const ALL_DISTRICTS = [
  'Cầu Giấy', 'Đống Đa', 'Thanh Xuân', 'Nam Từ Liêm', 
  'Bắc Từ Liêm', 'Hoàng Mai', 'Hai Bà Trưng', 'Ba Đình', 
  'Tây Hồ', 'Hoàn Kiếm', 'Hà Đông', 'Long Biên',
  'Thanh Trì', 'Hoài Đức', 'Gia Lâm', 'Đông Anh'
];

export const ROOM_TYPES = ['Phòng trọ', 'Chung cư mini', 'Căn hộ dịch vụ', 'Nhà nguyên căn', 'Homestay'];
export const FURNITURE_LEVELS = ['Nội thất đầy đủ', 'Nội thất cơ bản', 'Không nội thất'];

const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(Number(num || 0));

/**
 * Chuẩn hóa chuỗi so sánh không dấu
 */
const removeDiacritics = (str = '') => {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Phân tích trích xuất thông minh tất cả 10 đặc trưng từ mọi nguồn:
 * address, address_full, district, amenities, title, description, area, floor, type...
 */
export const parseRoomFeatures = (data = {}) => {
  if (!data) data = {};

  // Ghép toàn bộ văn bản để tìm kiếm ngữ nghĩa
  const allText = [
    data.district,
    data.address,
    data.address_full,
    data.location,
    data.building_name,
    data.title,
    data.description,
  ].filter(Boolean).join(' ');
  const normText = removeDiacritics(allText);

  // 1. QUẬN / HUYỆN
  let detectedDistrict = 'Cầu Giấy';
  for (const d of ALL_DISTRICTS) {
    const dNorm = removeDiacritics(d);
    if (normText.includes(dNorm)) {
      detectedDistrict = d;
      break;
    }
  }

  // 2. PHÂN TÍCH TIỆN ÍCH (amenities)
  let rawAmenities = data.amenities || [];
  if (typeof rawAmenities === 'string') {
    try {
      rawAmenities = JSON.parse(rawAmenities);
    } catch {
      rawAmenities = [];
    }
  }

  let amenityTokens = [];
  if (Array.isArray(rawAmenities)) {
    amenityTokens = rawAmenities.map(item => (typeof item === 'string' ? item : JSON.stringify(item)));
  } else if (typeof rawAmenities === 'object' && rawAmenities !== null) {
    Object.entries(rawAmenities).forEach(([k, v]) => {
      const isTrue = v === true || v === 1 || (v && typeof v === 'object' && v.verified !== false);
      if (isTrue) {
        amenityTokens.push(k);
        if (typeof v === 'string') amenityTokens.push(v);
        if (v?.name) amenityTokens.push(v.name);
      }
    });
  }
  const amenityStr = removeDiacritics(amenityTokens.join(' '));
  const fullSearchStr = `${normText} ${amenityStr}`;

  // 3. ĐIỀU HÒA
  const hasAc = (
    fullSearchStr.includes('dieu hoa') ||
    fullSearchStr.includes('may lanh') ||
    fullSearchStr.includes('air_conditioner') ||
    fullSearchStr.includes('air conditioner') ||
    /\b(ac|dhk)\b/i.test(fullSearchStr)
  );

  // 4. BÌNH NÓNG LẠNH
  const hasWaterHeater = (
    fullSearchStr.includes('nong lanh') ||
    fullSearchStr.includes('binh nong lanh') ||
    fullSearchStr.includes('nuoc nong') ||
    fullSearchStr.includes('water_heater') ||
    fullSearchStr.includes('water heater') ||
    fullSearchStr.includes('hot_water') ||
    fullSearchStr.includes('hot water') ||
    /\b(nl|binh nl)\b/i.test(fullSearchStr)
  );

  // 5. WIFI / INTERNET
  const hasWifi = (
    fullSearchStr.includes('wifi') ||
    fullSearchStr.includes('wi-fi') ||
    fullSearchStr.includes('internet') ||
    fullSearchStr.includes('mang') ||
    fullSearchStr.includes('cap quang')
  );

  // 6. CHỖ ĐỂ XE
  const hasParking = (
    fullSearchStr.includes('de xe') ||
    fullSearchStr.includes('cho de xe') ||
    fullSearchStr.includes('bai xe') ||
    fullSearchStr.includes('ham xe') ||
    fullSearchStr.includes('gui xe') ||
    fullSearchStr.includes('nha xe') ||
    fullSearchStr.includes('parking')
  );

  // 7. MỨC ĐỘ NỘI THẤT
  let furniture = 'Nội thất cơ bản';
  const hasBed = fullSearchStr.includes('giuong') || fullSearchStr.includes('bed');
  const hasWardrobe = fullSearchStr.includes('tu quan ao') || fullSearchStr.includes('tu ao') || fullSearchStr.includes('wardrobe');
  const hasFridge = fullSearchStr.includes('tu lanh') || fullSearchStr.includes('fridge');
  const isFullFurniture = (
    fullSearchStr.includes('full noi that') ||
    fullSearchStr.includes('day du noi that') ||
    fullSearchStr.includes('full do') ||
    fullSearchStr.includes('du do') ||
    (hasBed && hasWardrobe && (hasFridge || hasAc))
  );
  const isEmptyRoom = (
    fullSearchStr.includes('phong trong') ||
    fullSearchStr.includes('khong noi that') ||
    fullSearchStr.includes('khong do') ||
    fullSearchStr.includes('nha trong') ||
    (!hasAc && !hasBed && !hasWardrobe && !hasFridge)
  );

  if (data.furniture_level) {
    furniture = data.furniture_level;
  } else if (isFullFurniture) {
    furniture = 'Nội thất đầy đủ';
  } else if (isEmptyRoom) {
    furniture = 'Không nội thất';
  } else {
    furniture = 'Nội thất cơ bản';
  }

  // 8. DIỆN TÍCH (m²)
  let area = parseFloat(data.area || data.area_m2);
  if (!area || isNaN(area) || area <= 0) {
    const areaMatch = allText.match(/(?:diện\s*tích|dt|rộng|phòng)?\s*(\d+(?:[.,]\d+)?)\s*(?:m2|m²)/i);
    area = areaMatch ? parseFloat(areaMatch[1].replace(',', '.')) : 25;
  }
  area = Math.max(10, Math.min(Math.round(area), 150));

  // 9. TẦNG
  let floor = parseInt(data.floor);
  if (!floor || isNaN(floor) || floor <= 0) {
    const floorMatch = allText.match(/(?:tầng|lầu)\s*(\d+)/i);
    floor = floorMatch ? parseInt(floorMatch[1]) : 2;
  }
  floor = Math.max(1, Math.min(floor, 30));

  // 10. LOẠI PHÒNG
  let roomType = 'Phòng trọ';
  if (data.room_type) {
    roomType = data.room_type;
  } else if (data.type === 'apartment' || data.type === 'mini_apartment' || fullSearchStr.includes('chung cu mini') || fullSearchStr.includes('ccmn') || fullSearchStr.includes('mini apartment')) {
    roomType = 'Chung cư mini';
  } else if (data.type === 'serviced' || fullSearchStr.includes('can ho dich vu') || fullSearchStr.includes('chdv')) {
    roomType = 'Căn hộ dịch vụ';
  } else if (fullSearchStr.includes('nha nguyen can') || fullSearchStr.includes('nguyen can')) {
    roomType = 'Nhà nguyên căn';
  } else if (fullSearchStr.includes('homestay')) {
    roomType = 'Homestay';
  }

  // 11. SỐ NGƯỜI Ở TỐI ĐA
  let occupants = parseInt(data.max_occupants);
  if (!occupants || isNaN(occupants)) {
    occupants = area < 20 ? 2 : area < 35 ? 3 : 4;
  }

  return {
    district: detectedDistrict,
    area_m2: area,
    room_type: roomType,
    furniture_level: furniture,
    max_occupants: occupants,
    has_ac: hasAc ? 1 : 0,
    has_water_heater: hasWaterHeater ? 1 : 0,
    has_parking: hasParking ? 1 : 0,
    has_wifi: hasWifi ? 1 : 0,
    floor: floor,
  };
};

/**
 * Widget Gợi ý giá thuê phòng bằng Machine Learning (CatBoost)
 */
const AiPriceSuggestionWidget = ({
  initialData = {},
  currentPrice = 0,
  onApplyPrice,
  className = ''
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [applied, setApplied] = useState(false);

  // Dữ liệu đặc trưng đưa vào mô hình ML
  const [features, setFeatures] = useState(() => parseRoomFeatures(initialData));

  // Tự động đồng bộ và đọc thông tin chính xác mỗi khi initialData thay đổi
  useEffect(() => {
    if (!initialData) return;
    const extracted = parseRoomFeatures(initialData);
    setFeatures(extracted);
  }, [
    initialData?.address,
    initialData?.address_full,
    initialData?.district,
    initialData?.area,
    initialData?.area_m2,
    initialData?.floor,
    initialData?.title,
    initialData?.description,
    JSON.stringify(initialData?.amenities || {})
  ]);

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
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
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
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">CatBoost ML</span>
            </h4>
            <p className="text-xs text-slate-500">Tự động đọc thông tin thực tế từ phòng & địa chỉ tòa nhà</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <Sliders size={13} />
          {showAdvanced ? 'Thu gọn' : 'Tùy chỉnh thông số'}
          {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Tóm tắt các đặc trưng đã nhận diện từ phòng (có thể click để bật/tắt nhanh) */}
      <div className="mb-4">
        <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
          <span>Thông số phòng đã nhận diện:</span>
          <span className="text-[10px] text-indigo-500 font-normal">(bấm vào tiện ích để bật/tắt nhanh)</span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-700 font-medium">
            📍 {features.district}
          </span>
          <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-700 font-medium">
            📐 {features.area_m2} m²
          </span>
          <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-700 font-medium">
            🏢 Tầng {features.floor}
          </span>
          <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-700 font-medium">
            🛋 {features.furniture_level}
          </span>

          {/* Quick Toggle: Điều hòa */}
          <button
            type="button"
            onClick={() => setFeatures(f => ({ ...f, has_ac: f.has_ac === 1 ? 0 : 1 }))}
            className={`rounded-lg border px-2.5 py-1 font-medium transition-all flex items-center gap-1 ${
              features.has_ac === 1
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
            }`}
            title="Bấm để bật/tắt Điều hòa"
          >
            <span>❄️ Điều hòa:</span>
            <span className="font-bold">{features.has_ac === 1 ? 'Có' : 'Không'}</span>
          </button>

          {/* Quick Toggle: Bình nóng lạnh */}
          <button
            type="button"
            onClick={() => setFeatures(f => ({ ...f, has_water_heater: f.has_water_heater === 1 ? 0 : 1 }))}
            className={`rounded-lg border px-2.5 py-1 font-medium transition-all flex items-center gap-1 ${
              features.has_water_heater === 1
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
            }`}
            title="Bấm để bật/tắt Bình nóng lạnh"
          >
            <span>🔥 Nóng lạnh:</span>
            <span className="font-bold">{features.has_water_heater === 1 ? 'Có' : 'Không'}</span>
          </button>

          {/* Quick Toggle: Chỗ để xe */}
          <button
            type="button"
            onClick={() => setFeatures(f => ({ ...f, has_parking: f.has_parking === 1 ? 0 : 1 }))}
            className={`rounded-lg border px-2.5 py-1 font-medium transition-all flex items-center gap-1 ${
              features.has_parking === 1
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
            }`}
            title="Bấm để bật/tắt Chỗ để xe"
          >
            <span>🏍️ Để xe:</span>
            <span className="font-bold">{features.has_parking === 1 ? 'Có' : 'Không'}</span>
          </button>

          {/* Quick Toggle: Wifi */}
          <button
            type="button"
            onClick={() => setFeatures(f => ({ ...f, has_wifi: f.has_wifi === 1 ? 0 : 1 }))}
            className={`rounded-lg border px-2.5 py-1 font-medium transition-all flex items-center gap-1 ${
              features.has_wifi === 1
                ? 'bg-purple-50 border-purple-200 text-purple-700'
                : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
            }`}
            title="Bấm để bật/tắt Wifi"
          >
            <span>📶 Wifi:</span>
            <span className="font-bold">{features.has_wifi === 1 ? 'Có' : 'Không'}</span>
          </button>
        </div>
      </div>

      {/* Bảng chỉnh sửa thông số đầu vào chi tiết */}
      {showAdvanced && (
        <div className="mb-4 rounded-2xl border border-indigo-100 bg-white p-4 text-xs space-y-3">
          <p className="font-semibold text-slate-700">Chỉnh sửa thông số mô hình CatBoost (10 đặc trưng):</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Khu vực / Quận (Hà Nội)</label>
              <select
                value={features.district}
                onChange={(e) => setFeatures(f => ({ ...f, district: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-indigo-500"
              >
                {ALL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
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
            Giá hiện tại: <strong className="text-slate-700">{formatVND(currentPrice)} đ/tháng</strong>
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
                Giá gợi ý tối ưu (CatBoost ML):
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

          <div className="mt-3 pt-3 border-t border-emerald-200/60 text-[11px] text-emerald-900/80 leading-relaxed flex items-start gap-1.5">
            <Info size={14} className="shrink-0 mt-0.5 text-emerald-700" />
            <p>
              Giá gợi ý được ước tính bởi mô hình <strong>CatBoost Machine Learning</strong> huấn luyện trên <strong>~1,186 tin đăng thực tế tại Hà Nội (phongtro123.com)</strong>. Mức giá mang tính tham khảo hỗ trợ ra quyết định.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiPriceSuggestionWidget;
