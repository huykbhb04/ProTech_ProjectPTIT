"""
Script huấn luyện mô hình ML gợi ý giá thuê phòng.

Mô hình chính thức: CatBoost (Log Target)
Dữ liệu: crawled_rooms.csv (~1,186 mẫu từ phongtro123.com)

Cách dùng:
    python ai_service/ml/train_model.py                        # dùng dữ liệu mặc định
    python ai_service/ml/train_model.py --data path/to/data.csv
    python ai_service/ml/train_model.py --out-model path/to/model.pkl
"""

import argparse
import os
import sys
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

# Đảm bảo in unicode trên terminal Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# -------------------------------------------------------------------
# CLI Arguments
# -------------------------------------------------------------------
parser = argparse.ArgumentParser(description="Huấn luyện mô hình CatBoost gợi ý giá thuê phòng")
parser.add_argument("--data", "-d", type=str, default=None, help="Đường dẫn tới file CSV dữ liệu")
parser.add_argument("--out-model", "-m", type=str, default=None, help="Đường dẫn lưu file model .pkl")
cli_args, _ = parser.parse_known_args()

# -------------------------------------------------------------------
# Đường dẫn file
# -------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR.parent / "data"
MODEL_DIR = BASE_DIR.parent / "models"
MODEL_PATH = MODEL_DIR / "price_model.pkl"

if cli_args.out_model:
    MODEL_PATH = Path(cli_args.out_model)

CRAWLED_DATA_PATH = DATA_DIR / "crawled_rooms.csv"
FALLBACK_DATA_PATH = DATA_DIR / "simulated_rooms.csv"

# -------------------------------------------------------------------
# Chọn nguồn dữ liệu
# -------------------------------------------------------------------
data_path = None
if cli_args.data:
    custom_path = Path(cli_args.data)
    if not custom_path.exists():
        raise FileNotFoundError(f"❌ Không tìm thấy file dữ liệu tại {custom_path}")
    data_path = custom_path
elif CRAWLED_DATA_PATH.exists():
    data_path = CRAWLED_DATA_PATH
elif FALLBACK_DATA_PATH.exists():
    data_path = FALLBACK_DATA_PATH
else:
    raise FileNotFoundError(
        f"❌ Không tìm thấy file dữ liệu tại {CRAWLED_DATA_PATH} hoặc {FALLBACK_DATA_PATH}!\n"
        "   Hãy chạy: python ai_service/crawler/crawler.py hoặc python ai_service/ml/generate_data.py trước."
    )

print("=" * 65)
print("🤖 HUẤN LUYỆN MÔ HÌNH CATBOOST GỢI Ý GIÁ THUÊ PHÒNG")
print("=" * 65)
print(f"📊 Đọc dữ liệu từ: {data_path}")

df = pd.read_csv(data_path)
print(f"📋 Kích thước dữ liệu gốc: {df.shape[0]:,} mẫu, {df.shape[1]} cột")
print(f"❓ Giá trị thiếu (Missing values): {df.isna().sum().sum()}")

# -------------------------------------------------------------------
# Lọc mẫu bất thường
# -------------------------------------------------------------------
initial_len = len(df)
ppm = df["price_vnd"] / df["area_m2"]
valid_mask = (ppm >= 50_000) & (ppm <= 380_000) & (df["area_m2"] <= 100) & (df["area_m2"] >= 10)
df = df[valid_mask].copy()
removed = initial_len - len(df)
if removed > 0:
    print(f"🧹 Đã lọc {removed} mẫu bất thường/outlier. Còn lại: {len(df):,} mẫu sạch.")
print()

# -------------------------------------------------------------------
# Phân chia Features và Target
# -------------------------------------------------------------------
CATEGORICAL = ["district", "room_type", "furniture_level"]
NUMERICAL = [
    "area_m2",
    "max_occupants",
    "has_ac",
    "has_water_heater",
    "has_parking",
    "has_wifi",
    "floor",
]
TARGET = "price_vnd"

X = df[CATEGORICAL + NUMERICAL]
y = df[TARGET]

# -------------------------------------------------------------------
# Chia tập train/test (80/20) — đảm bảo khả năng tái lập
# -------------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42
)
print(f"✂️  Phân chia dữ liệu: Train = {len(X_train):,} mẫu | Test = {len(X_test):,} mẫu")
print()

# -------------------------------------------------------------------
# Xây dựng mô hình CatBoost (Log Target)
# -------------------------------------------------------------------
try:
    from catboost import CatBoostRegressor
    USE_CATBOOST = True
except ImportError:
    USE_CATBOOST = False
    print("⚠️  CatBoost chưa cài. Fallback sang HistGradientBoosting.")
    print("   Để cài: pip install catboost")
    print()

# CatBoost với log(price) target
log_y_train = np.log1p(y_train)
log_y_test = np.log1p(y_test)

if USE_CATBOOST:
    cat_feature_indices = [X_train.columns.get_loc(c) for c in CATEGORICAL]
    model = CatBoostRegressor(
        iterations=800,
        learning_rate=0.05,
        depth=7,
        loss_function="RMSE",
        random_seed=42,
        verbose=100,
        cat_features=cat_feature_indices,
    )
    print("🚀 Đang huấn luyện CatBoostRegressor (800 iterations, log target)...")
    model.fit(
        X_train, log_y_train,
        eval_set=(X_test, log_y_test),
        early_stopping_rounds=50,
    )
else:
    from sklearn.ensemble import HistGradientBoostingRegressor
    from sklearn.compose import ColumnTransformer
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import OrdinalEncoder

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1), CATEGORICAL),
            ("num", "passthrough", NUMERICAL),
        ]
    )
    model = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", HistGradientBoostingRegressor(
            max_iter=800, learning_rate=0.05, max_depth=7, random_state=42
        )),
    ])
    print("🚀 Đang huấn luyện HistGradientBoostingRegressor (800 iterations, log target)...")
    model.fit(X_train, log_y_train)

print("✅ Huấn luyện hoàn tất!")
print()

# -------------------------------------------------------------------
# Đánh giá trên tập Test (thang VNĐ gốc)
# -------------------------------------------------------------------
log_pred = model.predict(X_test)
y_pred = np.expm1(log_pred)

# Clip về khoảng hợp lý
y_pred_clipped = np.clip(y_pred, 800_000, 25_000_000)

r2   = r2_score(y_test, y_pred_clipped)
mae  = mean_absolute_error(y_test, y_pred_clipped)
rmse = np.sqrt(mean_squared_error(y_test, y_pred_clipped))
medae = median_absolute_error(y_test, y_pred_clipped)

pct_errors = np.abs((y_test.values - y_pred_clipped) / y_test.values)
mape  = np.mean(pct_errors) * 100
acc_10 = np.mean(pct_errors <= 0.10) * 100
acc_20 = np.mean(pct_errors <= 0.20) * 100
acc_30 = np.mean(pct_errors <= 0.30) * 100

print("=" * 65)
print("📈 KẾT QUẢ ĐÁNH GIÁ MÔ HÌNH (TẬP TEST)")
print("=" * 65)
print(f"  • R² Score                 : {r2:>12.4f}")
print(f"  • MAE                      : {mae:>12,.0f} VNĐ")
print(f"  • RMSE                     : {rmse:>12,.0f} VNĐ")
print(f"  • MedAE                    : {medae:>12,.0f} VNĐ")
print(f"  • MAPE                     : {mape:>11.2f}%")
print()
print("🎯 HIT RATE:")
print(f"  • ±10%: {acc_10:>6.1f}%")
print(f"  • ±20%: {acc_20:>6.1f}%")
print(f"  • ±30%: {acc_30:>6.1f}%")
print()

# -------------------------------------------------------------------
# Lưu mô hình
# -------------------------------------------------------------------
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# Wrapper giữ nguyên interface (model.predict trả về log-space nên cần unwrap)
class CatBoostLogWrapper:
    """Wrapper để price_api.py gọi .predict() ra thẳng VNĐ (không log)."""
    def __init__(self, model, cat_cols, num_cols):
        self.model = model
        self.cat_cols = cat_cols
        self.num_cols = num_cols
        self._feature_names = cat_cols + num_cols

    def predict(self, X):
        if hasattr(X, 'values'):
            X = X[self._feature_names]
        log_pred = self.model.predict(X)
        return np.expm1(log_pred)

# Kiểm tra wrapper đã tồn tại trong pkl hiện tại chưa
existing_pkl = MODEL_DIR / "price_model.pkl"
if existing_pkl.exists():
    try:
        existing_model = joblib.load(str(existing_pkl))
        if hasattr(existing_model, '_feature_names') or hasattr(existing_model, 'predict'):
            print("ℹ️  Đang ghi đè model cũ...")
    except Exception:
        pass

if USE_CATBOOST:
    wrapped = CatBoostLogWrapper(model, CATEGORICAL, NUMERICAL)
    joblib.dump(wrapped, str(MODEL_PATH))
else:
    # HistGB pipeline dùng trực tiếp nhưng cần wrapper để inverse log
    class HistGBLogWrapper:
        def __init__(self, pipeline, feature_names):
            self.pipeline = pipeline
            self._feature_names = feature_names
        def predict(self, X):
            if hasattr(X, 'values'):
                X = X[self._feature_names]
            log_pred = self.pipeline.predict(X)
            return np.expm1(log_pred)
    wrapped = HistGBLogWrapper(model, CATEGORICAL + NUMERICAL)
    joblib.dump(wrapped, str(MODEL_PATH))

model_size_mb = os.path.getsize(MODEL_PATH) / (1024 * 1024)
print("=" * 65)
print("💾 Mô hình đã lưu thành công!")
print(f"   Đường dẫn : {MODEL_PATH}")
print(f"   Dung lượng: {model_size_mb:.2f} MB")
print("=" * 65)

# Tự động reload FastAPI nếu đang chạy
try:
    import urllib.request
    req = urllib.request.Request("http://localhost:8001/reload-model", method="POST")
    with urllib.request.urlopen(req, timeout=3) as response:
        if response.status == 200:
            print("🔄 Đã tự động reload model trong FastAPI Service (port 8001)!")
except Exception:
    pass
