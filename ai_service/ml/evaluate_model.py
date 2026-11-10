"""
Script danh gia chi tiet theo phan khuc gia (vi du: 3 - 4 trieu)
Chay truc tiep:
    python ai_service/ml/evaluate_model.py --min-price 3000000 --max-price 4000000
    hoac chay mac dinh de xem toan bo + bang phan ra theo khoang gia:
    python ai_service/ml/evaluate_model.py
"""

import sys
import argparse
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    median_absolute_error,
    r2_score,
)
from sklearn.model_selection import train_test_split

# Ho tro in Unicode tieng Viet tren Windows Terminal
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

parser = argparse.ArgumentParser(description="Danh gia chi so mo hinh ML theo phan khuc gia")
parser.add_argument("--min-price", type=float, default=None, help="Gia toi thieu (VND), vi du: 3000000")
parser.add_argument("--max-price", type=float, default=None, help="Gia toi da (VND), vi du: 4000000")
args = parser.parse_args()

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR.parent / "data" / "crawled_rooms.csv"
MODEL_PATH = BASE_DIR.parent / "models" / "price_model.pkl"

if not DATA_PATH.exists() or not MODEL_PATH.exists():
    print("❌ Thieu file du lieu hoac file model.")
    sys.exit(1)

# Doc du lieu & loc ngoai lai
df = pd.read_csv(DATA_PATH)
ppm = df["price_vnd"] / df["area_m2"]
valid_mask = (ppm >= 50_000) & (ppm <= 380_000) & (df["area_m2"] <= 100) & (df["area_m2"] >= 10)
df = df[valid_mask].copy()

CATEGORICAL = ["district", "room_type", "furniture_level"]
NUMERICAL = ["area_m2", "max_occupants", "has_ac", "has_water_heater", "has_parking", "has_wifi", "floor"]
TARGET = "price_vnd"

X = df[CATEGORICAL + NUMERICAL]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42
)

# Nạp model và dự đoán
model = joblib.load(str(MODEL_PATH))
y_pred = model.predict(X_test)
y_pred_clipped = np.clip(y_pred, 800_000, 25_000_000)

def compute_metrics(y_true, y_hat):
    if len(y_true) == 0:
        return None
    r2 = r2_score(y_true, y_hat) if len(y_true) > 1 else 0.0
    mae = mean_absolute_error(y_true, y_hat)
    rmse = np.sqrt(mean_squared_error(y_true, y_hat))
    medae = median_absolute_error(y_true, y_hat)
    
    abs_err = np.abs(y_true.values - y_hat)
    pct_err = abs_err / y_true.values
    mape = np.mean(pct_err) * 100
    mean_bias = np.mean(y_hat - y_true.values)
    p95 = np.percentile(abs_err, 95)
    
    hit_10 = np.mean(pct_err <= 0.10) * 100
    hit_20 = np.mean(pct_err <= 0.20) * 100
    hit_30 = np.mean(pct_err <= 0.30) * 100
    
    return {
        "n": len(y_true),
        "r2": r2,
        "mae": mae,
        "rmse": rmse,
        "medae": medae,
        "mape": mape,
        "bias": mean_bias,
        "p95": p95,
        "hit_10": hit_10,
        "hit_20": hit_20,
        "hit_30": hit_30,
    }

# 1. Trường hợp người dùng chỉ định khoảng giá cụ thể (ví dụ 3 - 4 triệu)
if args.min_price is not None or args.max_price is not None:
    min_p = args.min_price if args.min_price is not None else 0
    max_p = args.max_price if args.max_price is not None else float("inf")
    
    mask = (y_test >= min_p) & (y_test <= max_p)
    sub_y_true = y_test[mask]
    sub_y_hat = y_pred_clipped[mask.values]
    
    res = compute_metrics(sub_y_true, sub_y_hat)
    
    print("=" * 65)
    print(f"📊 CHỈ SỐ ĐÁNH GIÁ RIÊNG PHÂN KHÚC: {min_p:,.0f} VNĐ - {max_p:,.0f} VNĐ")
    print("=" * 65)
    if res is None or res["n"] == 0:
        print("⚠️ Không có mẫu nào trong khoảng giá này!")
    else:
        print(f"  • Số lượng mẫu trong phân khúc   : {res['n']} mẫu (chiếm {res['n']/len(y_test)*100:.1f}% tập test)")
        print(f"  • Giá trung bình thực tế          : {sub_y_true.mean():>12,.0f} VNĐ")
        print(f"  • Giá AI dự đoán trung bình       : {sub_y_hat.mean():>12,.0f} VNĐ")
        print("-" * 65)
        print(f"  • MAE (Sai số tuyệt đối TB)       : {res['mae']:>12,.0f} VNĐ")
        print(f"  • MedAE (Sai số tuyệt đối trung vị): {res['medae']:>12,.0f} VNĐ")
        print(f"  • RMSE (Độ lệch chuẩn sai số)    : {res['rmse']:>12,.0f} VNĐ")
        print(f"  • MAPE (Sai số phần trăm TB)      : {res['mape']:>11.2f}%")
        print(f"  • Mean Error (Độ lệch thiên vị)  : {res['bias']:>12,.0f} VNĐ")
        print(f"  • P95 Error (Sai số ngưỡng 95%)  : {res['p95']:>12,.0f} VNĐ")
        print(f"  • R² Score (Hệ số xác định)      : {res['r2']:>12.4f}")
        print("-" * 65)
        print("🎯 TỶ LỆ DỰ ĐOÁN CHÍNH XÁC (HIT RATE):")
        print(f"  • Dung sai ±10%: {res['hit_10']:>6.1f}% số phòng")
        print(f"  • Dung sai ±20%: {res['hit_20']:>6.1f}% số phòng")
        print(f"  • Dung sai ±30%: {res['hit_30']:>6.1f}% số phòng")
    print("=" * 65)
    sys.exit(0)

# 2. Mặc định: in toàn bộ + bảng phân rã các khoảng giá phổ thông
total_res = compute_metrics(y_test, y_pred_clipped)

print("=" * 65)
print("📊 ĐÁNH GIÁ MÔ HÌNH MACHINE LEARNING HIỆN TẠI (CatBoost Log Target)")
print("=" * 65)
print(f"✂️  Tổng số lượng mẫu tập Test: {total_res['n']} mẫu")
print(f"  • R² Score                 : {total_res['r2']:>12.4f}")
print(f"  • MAE                      : {total_res['mae']:>12,.0f} VNĐ")
print(f"  • MedAE                    : {total_res['medae']:>12,.0f} VNĐ")
print(f"  • RMSE                     : {total_res['rmse']:>12,.0f} VNĐ")
print(f"  • MAPE                     : {total_res['mape']:>11.2f}%")
print(f"  • Hit Rate ±10%            : {total_res['hit_10']:>11.1f}%")
print(f"  • Hit Rate ±20%            : {total_res['hit_20']:>11.1f}%")
print()

# Phân rã theo các khoảng giá
price_bins = [
    ("< 2.5 triệu", 0, 2_500_000),
    ("2.5 - 3.0 triệu", 2_500_000, 3_000_000),
    ("3.0 - 4.0 triệu (Trọng tâm)", 3_000_000, 4_000_000),
    ("4.0 - 6.0 triệu", 4_000_000, 6_000_000),
    ("> 6.0 triệu", 6_000_000, float("inf")),
]

print("📋 PHÂN RÃ CHỈ SỐ THEO TỪNG PHÂN KHÚC GIÁ:")
print(f"{'Khoảng giá':<28} | {'Số mẫu':>6} | {'MAE (VNĐ)':>11} | {'MedAE (VNĐ)':>11} | {'MAPE':>7} | {'Hit ±20%':>8}")
print("-" * 85)
for name, low, high in price_bins:
    m = (y_test >= low) & (y_test < high)
    sub_y = y_test[m]
    sub_hat = y_pred_clipped[m.values]
    if len(sub_y) > 0:
        sub_res = compute_metrics(sub_y, sub_hat)
        print(f"{name:<28} | {sub_res['n']:>6} | {sub_res['mae']:>11,.0f} | {sub_res['medae']:>11,.0f} | {sub_res['mape']:>6.1f}% | {sub_res['hit_20']:>7.1f}%")
print("=" * 85)
print("💡 Mẹo: Để lọc riêng bất kỳ khoảng giá nào, chạy lệnh:")
print("   python ai_service/ml/evaluate_model.py --min-price 3000000 --max-price 4000000")
