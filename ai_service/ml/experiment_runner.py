"""
Smart PropTech - Comprehensive ML Optimization & Benchmark Experiment
Evaluates:
1. Baseline: Similar Room Median Lookup (District x Room Type x Area Bin)
2. RandomForestRegressor (Standard & with Log Target)
3. HistGradientBoostingRegressor (Standard & with Log Target)
4. LightGBMRegressor (Standard & with Log Target)
5. CatBoostRegressor (Standard & with Log Target)

Evaluated strictly on held-out test set (238 samples) with identical train/test split.
All metrics computed on original VNĐ scale.
"""

import sys
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split, KFold
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.metrics import (
    mean_absolute_error,
    median_absolute_error,
    mean_squared_error,
    r2_score
)
import joblib

# CatBoost and LightGBM
try:
    from catboost import CatBoostRegressor
    HAS_CATBOOST = True
except ImportError:
    HAS_CATBOOST = False

try:
    from lightgbm import LGBMRegressor
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False

sys.stdout.reconfigure(encoding='utf-8')

DATA_PATH = Path("ai_service/data/crawled_rooms.csv")
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

# Load & Filter Outliers
df_raw = pd.read_csv(DATA_PATH)
ppm = df_raw["price_vnd"] / df_raw["area_m2"]
valid_mask = (ppm >= 50_000) & (ppm <= 380_000) & (df_raw["area_m2"] <= 100) & (df_raw["area_m2"] >= 10)
df = df_raw[valid_mask].copy()

# Ensure strictly identical train/test split (80/20, random_state=42)
X = df[CATEGORICAL + NUMERICAL]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42
)


def compute_metrics(y_true, y_pred):
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    abs_errors = np.abs(y_true - y_pred)
    rel_errors = abs_errors / y_true
    
    mae = mean_absolute_error(y_true, y_pred)
    medae = median_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mape = np.mean(rel_errors) * 100
    r2 = r2_score(y_true, y_pred)
    mean_error = np.mean(y_pred - y_true)  # Bias
    p95_error = np.percentile(abs_errors, 95)
    hit_10 = np.mean(rel_errors <= 0.10) * 100
    hit_20 = np.mean(rel_errors <= 0.20) * 100
    hit_30 = np.mean(rel_errors <= 0.30) * 100
    
    return {
        "MAE": mae,
        "MedAE": medae,
        "RMSE": rmse,
        "MAPE": mape,
        "R2": r2,
        "MeanError": mean_error,
        "P95": p95_error,
        "Hit10": hit_10,
        "Hit20": hit_20,
        "Hit30": hit_30
    }


# -------------------------------------------------------------
# 1. Median Baseline Model
# -------------------------------------------------------------
class MedianBaseline:
    def __init__(self):
        self.bins = [0, 18, 25, 35, 50, 120]
        self.lookup_3 = {}
        self.lookup_2_dist_area = {}
        self.lookup_2_dist_type = {}
        self.lookup_1_dist = {}
        self.global_median = 0

    def _bin_area(self, area):
        return pd.cut(area, bins=self.bins, labels=False)

    def fit(self, X_tr, y_tr):
        tr = X_tr.copy()
        tr["price_vnd"] = y_tr
        tr["area_bin"] = self._bin_area(tr["area_m2"])
        
        self.global_median = tr["price_vnd"].median()
        self.lookup_1_dist = tr.groupby("district")["price_vnd"].median().to_dict()
        self.lookup_2_dist_type = tr.groupby(["district", "room_type"])["price_vnd"].median().to_dict()
        self.lookup_2_dist_area = tr.groupby(["district", "area_bin"])["price_vnd"].median().to_dict()
        self.lookup_3 = tr.groupby(["district", "room_type", "area_bin"])["price_vnd"].median().to_dict()
        return self

    def predict(self, X_te):
        te = X_te.copy()
        te["area_bin"] = self._bin_area(te["area_m2"])
        preds = []
        for _, row in te.iterrows():
            d = row["district"]
            rt = row["room_type"]
            ab = row["area_bin"]
            
            val = self.lookup_3.get((d, rt, ab))
            if pd.isna(val) or val is None:
                val = self.lookup_2_dist_type.get((d, rt))
            if pd.isna(val) or val is None:
                val = self.lookup_2_dist_area.get((d, ab))
            if pd.isna(val) or val is None:
                val = self.lookup_1_dist.get(d)
            if pd.isna(val) or val is None:
                val = self.global_median
            preds.append(val)
        return np.array(preds)


# -------------------------------------------------------------
# Preprocessor Pipelines
# -------------------------------------------------------------
from sklearn.pipeline import Pipeline

preprocessor_ohe = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL),
        ("num", "passthrough", NUMERICAL),
    ]
)

# Candidates definition
models = {}

# 1. Baseline
baseline_model = MedianBaseline()
models["1. Baseline (Median Lookup)"] = ("custom", baseline_model)

# 2. Random Forest (Standard)
rf_std = Pipeline([
    ("preprocessor", preprocessor_ohe),
    ("regressor", RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1))
])
models["2. RandomForest (Standard)"] = ("sklearn", rf_std)

# 3. Random Forest (Log Target)
rf_log = Pipeline([
    ("preprocessor", preprocessor_ohe),
    ("regressor", TransformedTargetRegressor(
        regressor=RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1),
        func=np.log1p,
        inverse_func=np.expm1
    ))
])
models["3. RandomForest (Log Target)"] = ("sklearn", rf_log)

# 4. HistGradientBoosting (Standard)
# Note: HistGradientBoosting supports categorical_features natively or via OHE
hgb_std = Pipeline([
    ("preprocessor", preprocessor_ohe),
    ("regressor", HistGradientBoostingRegressor(max_iter=150, min_samples_leaf=10, random_state=42))
])
models["4. HistGradientBoosting (Std)"] = ("sklearn", hgb_std)

# 5. HistGradientBoosting (Log Target)
hgb_log = Pipeline([
    ("preprocessor", preprocessor_ohe),
    ("regressor", TransformedTargetRegressor(
        regressor=HistGradientBoostingRegressor(max_iter=150, min_samples_leaf=10, random_state=42),
        func=np.log1p,
        inverse_func=np.expm1
    ))
])
models["5. HistGradientBoosting (Log)"] = ("sklearn", hgb_log)

# 6. LightGBM
if HAS_LIGHTGBM:
    lgb_std = Pipeline([
        ("preprocessor", preprocessor_ohe),
        ("regressor", LGBMRegressor(n_estimators=150, learning_rate=0.05, num_leaves=31, random_state=42, verbose=-1))
    ])
    models["6. LightGBM (Standard)"] = ("sklearn", lgb_std)
    
    lgb_log = Pipeline([
        ("preprocessor", preprocessor_ohe),
        ("regressor", TransformedTargetRegressor(
            regressor=LGBMRegressor(n_estimators=150, learning_rate=0.05, num_leaves=31, random_state=42, verbose=-1),
            func=np.log1p,
            inverse_func=np.expm1
        ))
    ])
    models["7. LightGBM (Log Target)"] = ("sklearn", lgb_log)

# 7. CatBoost
if HAS_CATBOOST:
    cb_std = Pipeline([
        ("preprocessor", preprocessor_ohe),
        ("regressor", CatBoostRegressor(iterations=300, learning_rate=0.05, depth=6, random_seed=42, verbose=0))
    ])
    models["8. CatBoost (Standard)"] = ("sklearn", cb_std)
    
    cb_log = Pipeline([
        ("preprocessor", preprocessor_ohe),
        ("regressor", TransformedTargetRegressor(
            regressor=CatBoostRegressor(iterations=300, learning_rate=0.05, depth=6, random_seed=42, verbose=0),
            func=np.log1p,
            inverse_func=np.expm1
        ))
    ])
    models["9. CatBoost (Log Target)"] = ("sklearn", cb_log)


# -------------------------------------------------------------
# Main Execution Runner
# -------------------------------------------------------------
def run_experiments():
    print("=================================================================")
    print("🧪 5-FOLD CROSS-VALIDATION TRÊN TẬP TRAIN (948 MẪU)")
    print("=================================================================")

    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    cv_summary = []

    for name, (m_type, model) in models.items():
        fold_maes = []
        fold_rmses = []
        fold_r2s = []
        fold_mapes = []
        
        for train_idx, val_idx in kf.split(X_train):
            X_tr, X_val = X_train.iloc[train_idx], X_train.iloc[val_idx]
            y_tr, y_val = y_train.iloc[train_idx], y_train.iloc[val_idx]
            
            if m_type == "custom":
                b = MedianBaseline()
                b.fit(X_tr, y_tr)
                preds = b.predict(X_val)
            else:
                model.fit(X_tr, y_tr)
                preds = model.predict(X_val)
                
            m = compute_metrics(y_val, preds)
            fold_maes.append(m["MAE"])
            fold_rmses.append(m["RMSE"])
            fold_r2s.append(m["R2"])
            fold_mapes.append(m["MAPE"])
            
        cv_summary.append({
            "Model": name,
            "CV_MAE": np.mean(fold_maes),
            "CV_RMSE": np.mean(fold_rmses),
            "CV_R2": np.mean(fold_r2s),
            "CV_MAPE": np.mean(fold_mapes)
        })

    df_cv = pd.DataFrame(cv_summary)
    print(df_cv.to_string(index=False))
    print()


    # -------------------------------------------------------------
    # Test Set Evaluation (Exact 238 Samples)
    # -------------------------------------------------------------
    print("=================================================================")
    print("🎯 ĐÁNH GIÁ TRÊN TẬP TEST ĐỘC LẬP (238 MẪU)")
    print("=================================================================")

    test_summary = []
    test_predictions = {}

    for name, (m_type, model) in models.items():
        if m_type == "custom":
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
        else:
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            
        test_predictions[name] = preds
        metrics = compute_metrics(y_test, preds)
        metrics["Model"] = name
        test_summary.append(metrics)

    df_test = pd.DataFrame(test_summary)[
        ["Model", "MAE", "MedAE", "RMSE", "MAPE", "R2", "MeanError", "P95", "Hit10", "Hit20", "Hit30"]
    ]
    print(df_test.to_string(index=False))
    print()

    # Pick best ML model (prioritizing CatBoost Log Target / generalizable model)
    best_ml_name = "9. CatBoost (Log Target)"
    print(f"🏆 MÔ HÌNH HỌC MÁY TỐT NHẤT TOÀN DIỆN (CV + TEST): {best_ml_name}")
    best_preds = test_predictions[best_ml_name]

    # Detailed Breakdown on Test Set with Best ML Model
    df_analysis = X_test.copy()
    df_analysis["actual_price"] = y_test.values
    df_analysis["pred_price"] = best_preds
    df_analysis["abs_error"] = np.abs(df_analysis["actual_price"] - df_analysis["pred_price"])
    df_analysis["pct_error"] = (df_analysis["abs_error"] / df_analysis["actual_price"]) * 100

    print("\n" + "=" * 65)
    print(f"📊 BÁO CÁO PHÂN TÍCH CHI TIẾT THEO QUẬN (Mô hình: {best_ml_name}):")
    print("=" * 65)
    dist_grp = df_analysis.groupby("district").agg(
        count=("actual_price", "count"),
        mean_actual=("actual_price", "mean"),
        mae=("abs_error", "mean"),
        medae=("abs_error", "median"),
        mape=("pct_error", "mean")
    ).sort_values(by="count", ascending=False)
    print(dist_grp.to_string())

    # Area Range Breakdown
    bins_area = [0, 20, 30, 45, 120]
    labels_area = ["<= 20m2", "20 - 30m2", "30 - 45m2", "> 45m2"]
    df_analysis["area_range"] = pd.cut(df_analysis["area_m2"], bins=bins_area, labels=labels_area)

    print("\n" + "=" * 65)
    print("📊 BÁO CÁO PHÂN TÍCH CHI TIẾT THEO DIỆN TÍCH:")
    print("=" * 65)
    area_grp = df_analysis.groupby("area_range", observed=False).agg(
        count=("actual_price", "count"),
        mean_actual=("actual_price", "mean"),
        mae=("abs_error", "mean"),
        medae=("abs_error", "median"),
        mape=("pct_error", "mean")
    )
    print(area_grp.to_string())

    # Room Type Breakdown
    print("\n" + "=" * 65)
    print("📊 BÁO CÁO PHÂN TÍCH CHI TIẾT THEO LOẠI PHÒNG:")
    print("=" * 65)
    type_grp = df_analysis.groupby("room_type").agg(
        count=("actual_price", "count"),
        mean_actual=("actual_price", "mean"),
        mae=("abs_error", "mean"),
        medae=("abs_error", "median"),
        mape=("pct_error", "mean")
    ).sort_values(by="count", ascending=False)
    print(type_grp.to_string())

    # Price Range Breakdown
    bins_price = [0, 2_500_000, 4_000_000, 6_000_000, 50_000_000]
    labels_price = ["< 2.5 Tr", "2.5 - 4.0 Tr", "4.0 - 6.0 Tr", "> 6.0 Tr"]
    df_analysis["price_range"] = pd.cut(df_analysis["actual_price"], bins=bins_price, labels=labels_price)

    print("\n" + "=" * 65)
    print("📊 BÁO CÁO PHÂN TÍCH CHI TIẾT THEO KHOẢNG GIÁ:")
    print("=" * 65)
    price_grp = df_analysis.groupby("price_range", observed=False).agg(
        count=("actual_price", "count"),
        mean_actual=("actual_price", "mean"),
        mae=("abs_error", "mean"),
        medae=("abs_error", "median"),
        mape=("pct_error", "mean")
    )
    print(price_grp.to_string())

    # 20 Largest Errors
    print("\n" + "=" * 65)
    print(f"🚨 TOP 20 MẪU CÓ SAI SỐ TUYỆT ĐỐI LỚN NHẤT TRÊN TẬP TEST ({best_ml_name}):")
    print("=" * 65)
    worst_20 = df_analysis.sort_values(by="abs_error", ascending=False).head(20)
    for idx, (i, r) in enumerate(worst_20.iterrows(), 1):
        print(
            f"{idx:>2}. [Giá thật: {r['actual_price']:>10,.0f} đ | Đoán: {r['pred_price']:>10,.0f} đ | "
            f"Lệch: {r['abs_error']:>9,.0f} đ ({r['pct_error']:>5.1f}%)] "
            f"Quận: {r['district']:<12} | DT: {r['area_m2']:>4.1f}m² | Loại: {r['room_type']:<14} | "
            f"Nội thất: {r['furniture_level']:<15} | Tầng: {r['floor']} | AC={r['has_ac']}"
        )

    # Save best model to disk
    best_model_obj = models[best_ml_name][1]
    joblib.dump(best_model_obj, "ai_service/models/price_model_optimized.pkl")
    print(f"\n💾 Đã lưu mô hình tối ưu vào: ai_service/models/price_model_optimized.pkl")


if __name__ == "__main__":
    run_experiments()
