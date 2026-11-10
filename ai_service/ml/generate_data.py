"""
Script sinh dữ liệu giả lập cho mô hình gợi ý giá thuê phòng.

⚠️ TUYÊN BỐ QUAN TRỌNG:
Dữ liệu này do phần mềm TỰ SINH RA theo công thức giả định.
KHÔNG phản ánh giá thuê thực tế trên thị trường Hà Nội hay bất kỳ thành phố nào.
Chỉ dùng để minh họa kỹ thuật Machine Learning hồi quy (Regression).
"""

import os
import sys
import numpy as np
import pandas as pd
from pathlib import Path

# Đảm bảo in unicode trên terminal Windows mà không lỗi cp1252
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Cố định seed để kết quả luôn nhất quán mỗi lần chạy (Khả năng tái lập - Reproducibility)
np.random.seed(42)
N = 2000  # Số lượng mẫu

# -------------------------------------------------------------------
# Hệ số giá nền theo khu vực (VNĐ/m²/tháng)
# ⚠️ Đây là GIẢ ĐỊNH để tạo ra sự phân biệt địa lý, không phải giá thật
# -------------------------------------------------------------------
DISTRICT_BASE = {
    "Đống Đa":      130_000,
    "Cầu Giấy":     140_000,
    "Ba Đình":      145_000,
    "Hoàn Kiếm":    160_000,
    "Tây Hồ":       150_000,
    "Hai Bà Trưng": 120_000,
    "Hoàng Mai":    100_000,
    "Thanh Xuân":   115_000,
    "Nam Từ Liêm":  105_000,
    "Bắc Từ Liêm":   95_000,
}

# Hệ số nhân theo loại phòng
ROOM_TYPE_FACTOR = {
    "Phòng trọ":      1.00,
    "Chung cư mini":  1.25,
    "CHDV":           1.50,
    "Mini apartment": 1.40,
}

# Hệ số nhân theo mức nội thất
FURNITURE_FACTOR = {
    "Không nội thất":   1.00,
    "Nội thất cơ bản":  1.15,
    "Nội thất đầy đủ":  1.35,
}

# -------------------------------------------------------------------
# Sinh dữ liệu ngẫu nhiên (10 biến đầu vào)
# -------------------------------------------------------------------
districts = np.random.choice(list(DISTRICT_BASE.keys()), N)
room_types = np.random.choice(
    list(ROOM_TYPE_FACTOR.keys()), N, p=[0.45, 0.25, 0.15, 0.15]
)
furniture = np.random.choice(
    list(FURNITURE_FACTOR.keys()), N, p=[0.30, 0.40, 0.30]
)
area_m2 = np.round(np.random.uniform(12, 55, N), 1)

# Số người ở tối đa tương quan với diện tích phòng (thực tế: phòng lớn ở được nhiều người hơn)
# 12-20m2: 1-2 người; 20-35m2: 2-3 người; >35m2: 3-4 người
base_occupants = np.clip(np.round(area_m2 / 14).astype(int), 1, 4)
# Thêm chút biến động tự nhiên (-1, 0, +1)
occupant_noise = np.random.choice([-1, 0, 1], N, p=[0.2, 0.6, 0.2])
max_occupants = np.clip(base_occupants + occupant_noise, 1, 4)

has_ac = np.random.binomial(1, 0.60, N)
has_water_heater = np.random.binomial(1, 0.70, N)
has_parking = np.random.binomial(1, 0.50, N)
has_wifi = np.random.binomial(1, 0.75, N)
floor = np.random.randint(1, 11, N)

# -------------------------------------------------------------------
# Tính giá theo công thức logic (không phải ngẫu nhiên hoàn toàn)
#
# Công thức:
#   price = base_price_per_m2
#           × area_m2
#           × room_type_factor
#           × furniture_factor
#           × (1 + amenity_bonus)
#           × floor_bonus
#           × occupant_bonus
#           × noise
# -------------------------------------------------------------------
base_prices = np.array([DISTRICT_BASE[d] for d in districts])
rt_factors = np.array([ROOM_TYPE_FACTOR[r] for r in room_types])
fu_factors = np.array([FURNITURE_FACTOR[f] for f in furniture])

amenity_bonus = (
    has_ac           * 0.05 +
    has_water_heater * 0.03 +
    has_parking      * 0.05 +
    has_wifi         * 0.02
)
floor_bonus = 1.0 + (floor - 1) * 0.005  # +0.5% mỗi tầng
occupant_bonus = 1.0 + (max_occupants - 1) * 0.02  # +2% cho mỗi suất người ở tối đa tăng thêm

price_raw = (
    base_prices
    * area_m2
    * rt_factors
    * fu_factors
    * (1.0 + amenity_bonus)
    * floor_bonus
    * occupant_bonus
)

# Thêm nhiễu Gaussian ±10% mô phỏng biến động thực tế
noise = np.random.normal(1.0, 0.10, N)
price_final = price_raw * noise

# Giới hạn giá hợp lý và làm tròn 100.000 VNĐ
price_final = np.clip(price_final, 800_000, 25_000_000)
price_final = np.round(price_final / 100_000) * 100_000

# -------------------------------------------------------------------
# Tạo DataFrame (đúng 10 đặc trưng + 1 nhãn mục tiêu)
# -------------------------------------------------------------------
df = pd.DataFrame({
    "district":         districts,
    "area_m2":          area_m2,
    "room_type":        room_types,
    "furniture_level":  furniture,
    "max_occupants":    max_occupants.astype(int),
    "has_ac":           has_ac.astype(int),
    "has_water_heater": has_water_heater.astype(int),
    "has_parking":      has_parking.astype(int),
    "has_wifi":         has_wifi.astype(int),
    "floor":            floor.astype(int),
    "price_vnd":        price_final.astype(int),
})

# -------------------------------------------------------------------
# Lưu file CSV tại data/simulated_rooms.csv
# -------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

path_primary = DATA_DIR / "simulated_rooms.csv"
df.to_csv(path_primary, index=False, encoding="utf-8-sig")

# -------------------------------------------------------------------
# In thống kê để kiểm tra
# -------------------------------------------------------------------
print("=" * 60)
print("✅ SINH DỮ LIỆU THÀNH CÔNG")
print("=" * 60)
print(f"📁 Output Path  : {path_primary}")
print(f"📊 Số mẫu       : {len(df):,}")
print(f"📋 Số cột       : {len(df.columns)}")
print(f"❓ Giá trị thiếu (NaN): {df.isna().sum().sum()}")
print()
print("📈 Thống kê giá (price_vnd):")
print(f"  Min : {df['price_vnd'].min():>15,.0f} VNĐ")
print(f"  Max : {df['price_vnd'].max():>15,.0f} VNĐ")
print(f"  Mean: {df['price_vnd'].mean():>15,.0f} VNĐ")
print(f"  Std : {df['price_vnd'].std():>15,.0f} VNĐ")
print("=" * 60)
