"""
FastAPI Service: Gợi ý giá thuê phòng trọ bằng Machine Learning.
Chạy tại port 8001.

Endpoints:
  - GET  /health          : Trạng thái service và model
  - GET  /valid-options   : Danh mục quận, loại phòng, nội thất hợp lệ
  - POST /predict-price   : Gợi ý giá thuê phòng (JSON -> VNĐ/tháng)
"""

import os
import sys
import joblib
import pandas as pd
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any

# Đảm bảo in unicode trên terminal Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# -------------------------------------------------------------------
# Khởi tạo FastAPI App
# -------------------------------------------------------------------
app = FastAPI(
    title="Smart PropTech - Price Suggestion ML Service",
    description="""
    ## ⚠️ Tuyên bố kỹ thuật
    Mô hình được huấn luyện trên **dữ liệu thực tế thu thập từ phongtro123.com** (~1,186 tin đăng Hà Nội).
    Giá trả về chỉ mang tính **tham khảo hỗ trợ ra quyết định**, người đăng tin
    toàn quyền quyết định mức giá cho thuê thực tế.
    """,
    version="1.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# Load model khi khởi động
# -------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "price_model.pkl"
price_model = None

def load_price_model():
    global price_model
    if MODEL_PATH.exists():
        try:
            price_model = joblib.load(str(MODEL_PATH))
            print(f"[PriceAPI] ✅ Model loaded successfully from {MODEL_PATH}")
        except Exception as e:
            print(f"[PriceAPI] ❌ Load model thất bại: {e}")
            price_model = None
    else:
        print(f"[PriceAPI] ⚠️  Model CHƯA TỒN TẠI tại {MODEL_PATH}")
        print("[PriceAPI]    Hãy chạy: python ai_service/ml/train_model.py")
        price_model = None

load_price_model()

# -------------------------------------------------------------------
# Danh mục hợp lệ (Tất cả 16 quận/huyện trong tập dữ liệu mô hình)
# -------------------------------------------------------------------
VALID_DISTRICTS = [
    "Cầu Giấy", "Đống Đa", "Thanh Xuân", "Nam Từ Liêm",
    "Bắc Từ Liêm", "Hoàng Mai", "Hai Bà Trưng", "Ba Đình",
    "Tây Hồ", "Hoàn Kiếm", "Hà Đông", "Long Biên",
    "Thanh Trì", "Hoài Đức", "Gia Lâm", "Đông Anh",
]
VALID_ROOM_TYPES = ["Phòng trọ", "Chung cư mini", "Căn hộ dịch vụ", "Nhà nguyên căn", "Homestay"]
VALID_FURNITURE  = ["Không nội thất", "Nội thất cơ bản", "Nội thất đầy đủ"]

# -------------------------------------------------------------------
# Pydantic Schemas
# -------------------------------------------------------------------
class PricePredictRequest(BaseModel):
    district: str = Field(
        ...,
        description="Quận/Huyện (Hà Nội)",
        examples=["Cầu Giấy"]
    )
    area_m2: float = Field(
        ...,
        gt=5, lt=200,
        description="Diện tích phòng (m²), phải từ 5 đến 200",
        examples=[25.0]
    )
    room_type: str = Field(
        ...,
        description="Loại phòng",
        examples=["Chung cư mini"]
    )
    furniture_level: str = Field(
        ...,
        description="Mức độ nội thất",
        examples=["Nội thất đầy đủ"]
    )
    max_occupants: int = Field(
        ...,
        ge=1, le=10,
        description="Số người ở tối đa (1-10)",
        examples=[2]
    )
    has_ac: int = Field(
        ...,
        ge=0, le=1,
        description="Có điều hoà không (0=Không, 1=Có)",
        examples=[1]
    )
    has_water_heater: int = Field(
        ...,
        ge=0, le=1,
        description="Có bình nóng lạnh không (0=Không, 1=Có)",
        examples=[1]
    )
    has_parking: int = Field(
        ...,
        ge=0, le=1,
        description="Có chỗ để xe không (0=Không, 1=Có)",
        examples=[1]
    )
    has_wifi: int = Field(
        ...,
        ge=0, le=1,
        description="Có internet/wifi không (0=Không, 1=Có)",
        examples=[1]
    )
    floor: int = Field(
        ...,
        ge=1, le=50,
        description="Tầng số mấy (1-50)",
        examples=[3]
    )

    @field_validator("has_ac", "has_water_heater", "has_parking", "has_wifi", mode="before")
    @classmethod
    def coerce_binary(cls, v: Any) -> Any:
        if isinstance(v, bool):
            return 1 if v else 0
        if isinstance(v, str):
            clean = v.strip().lower()
            if clean in ("1", "true", "yes", "co", "có"):
                return 1
            if clean in ("0", "false", "no", "khong", "không"):
                return 0
        try:
            val = int(v)
            if val in (0, 1):
                return val
        except Exception:
            pass
        return 1 if v else 0

    @field_validator("district")
    @classmethod
    def validate_district(cls, v: str) -> str:
        if not v:
            return "Cầu Giấy"
        v_clean = str(v).strip().lower()
        # Tìm quận phù hợp
        for d in VALID_DISTRICTS:
            d_lower = d.lower()
            if d_lower in v_clean or v_clean in d_lower:
                return d
        # Xử lý trường hợp có prefix 'quận ', 'huyện ', 'q.'
        for d in VALID_DISTRICTS:
            pure = d.lower().replace("bắc ", "").replace("nam ", "")
            if pure in v_clean:
                return d
        # Fallback an toàn thay vì crash 422
        return "Cầu Giấy"

    @field_validator("room_type")
    @classmethod
    def validate_room_type(cls, v: str) -> str:
        if not v:
            return "Phòng trọ"
        mapping = {
            "căn hộ dịch vụ": "Căn hộ dịch vụ",
            "can ho dich vu": "Căn hộ dịch vụ",
            "chdv": "Căn hộ dịch vụ",
            "chung cư mini": "Chung cư mini",
            "chung cu mini": "Chung cư mini",
            "ccmn": "Chung cư mini",
            "mini apartment": "Chung cư mini",
            "nhà nguyên căn": "Nhà nguyên căn",
            "nha nguyen can": "Nhà nguyên căn",
            "phòng trọ": "Phòng trọ",
            "phong tro": "Phòng trọ",
            "homestay": "Homestay",
        }
        normalized = mapping.get(str(v).lower().strip())
        if normalized:
            return normalized
        for rt in VALID_ROOM_TYPES:
            if rt.lower() in str(v).lower():
                return rt
        return "Phòng trọ"

    @field_validator("furniture_level")
    @classmethod
    def validate_furniture(cls, v: str) -> str:
        if not v:
            return "Nội thất cơ bản"
        mapping = {
            "đầy đủ": "Nội thất đầy đủ",
            "day du": "Nội thất đầy đủ",
            "full": "Nội thất đầy đủ",
            "nội thất đầy đủ": "Nội thất đầy đủ",
            "noi that day du": "Nội thất đầy đủ",
            "cơ bản": "Nội thất cơ bản",
            "co ban": "Nội thất cơ bản",
            "nội thất cơ bản": "Nội thất cơ bản",
            "noi that co ban": "Nội thất cơ bản",
            "trống": "Không nội thất",
            "trong": "Không nội thất",
            "không nội thất": "Không nội thất",
            "khong noi that": "Không nội thất",
            "không đồ": "Không nội thất",
            "khong do": "Không nội thất",
        }
        normalized = mapping.get(str(v).lower().strip())
        if normalized:
            return normalized
        for f in VALID_FURNITURE:
            if f.lower() in str(v).lower():
                return f
        return "Nội thất cơ bản"

    model_config = {
        "json_schema_extra": {
            "example": {
                "district": "Cầu Giấy",
                "area_m2": 28.0,
                "room_type": "Chung cư mini",
                "furniture_level": "Nội thất đầy đủ",
                "max_occupants": 2,
                "has_ac": 1,
                "has_water_heater": 1,
                "has_parking": 1,
                "has_wifi": 1,
                "floor": 3
            }
        }
    }


class PricePredictResponse(BaseModel):
    success: bool
    predicted_price_vnd: int
    price_display: str
    price_range: dict
    disclaimer: str
    valid_options: dict


# -------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------
@app.get("/", tags=["Info"])
def root():
    return {
        "service": "Smart PropTech - Price Suggestion ML Service",
        "status": "running",
        "model_loaded": price_model is not None,
        "docs": "/docs",
        "port": 8001
    }


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"], include_in_schema=False)
def health_check():
    """Kiểm tra trạng thái service và model"""
    return {
        "status": "healthy" if price_model is not None else "degraded",
        "model_loaded": price_model is not None,
        "model_path": str(MODEL_PATH),
        "valid_districts": VALID_DISTRICTS,
        "valid_room_types": VALID_ROOM_TYPES,
        "valid_furniture": VALID_FURNITURE,
    }


@app.get("/valid-options", tags=["Info"])
@app.get("/api/valid-options", tags=["Info"], include_in_schema=False)
def get_valid_options():
    """Trả về các giá trị danh mục hợp lệ"""
    return {
        "districts": VALID_DISTRICTS,
        "room_types": VALID_ROOM_TYPES,
        "furniture_levels": VALID_FURNITURE,
    }


@app.post("/reload-model", tags=["Admin"])
@app.get("/reload-model", tags=["Admin"], include_in_schema=False)
def reload_model_endpoint():
    """Reload model file từ đĩa mà không cần khởi động lại server"""
    load_price_model()
    return {
        "success": price_model is not None,
        "status": "reloaded" if price_model is not None else "failed",
        "model_path": str(MODEL_PATH),
    }


@app.post("/predict-price", response_model=PricePredictResponse, tags=["Prediction"])
@app.post("/predict-price/", response_model=PricePredictResponse, include_in_schema=False)
@app.post("/api/predict-price", response_model=PricePredictResponse, tags=["Prediction"])
@app.post("/api/predict-price/", response_model=PricePredictResponse, include_in_schema=False)
@app.post("/predict_price", response_model=PricePredictResponse, include_in_schema=False)
async def predict_price(request: PricePredictRequest):
    """
    Gợi ý giá thuê phòng dựa trên 10 đặc trưng đầu vào.

    Mô hình CatBoost huấn luyện trên ~1,186 tin đăng thực tế từ phongtro123.com (Hà Nội).
    Giá trả về mang tính tham khảo; người dùng tự quyết định giá đăng tin.
    """
    if price_model is None:
        load_price_model()
        if price_model is None:
            raise HTTPException(
                status_code=503,
                detail="Mô hình Machine Learning chưa được tải. Vui lòng chạy lệnh: python ai_service/ml/train_model.py"
            )

    try:
        # Tạo DataFrame đúng thứ tự các cột mà ColumnTransformer yêu cầu
        input_df = pd.DataFrame([{
            "district":         request.district,
            "room_type":        request.room_type,
            "furniture_level":  request.furniture_level,
            "area_m2":          request.area_m2,
            "max_occupants":    request.max_occupants,
            "has_ac":           request.has_ac,
            "has_water_heater": request.has_water_heater,
            "has_parking":      request.has_parking,
            "has_wifi":         request.has_wifi,
            "floor":            request.floor,
        }])

        # Dự đoán
        raw_pred = float(price_model.predict(input_df)[0])

        # Làm tròn tới 50.000 VNĐ cho sát thực tế thuê phòng
        predicted_price = int(round(raw_pred / 50_000) * 50_000)
        predicted_price = max(800_000, min(predicted_price, 25_000_000))

        # Khoảng giá khuyến nghị ±10%
        low = int(round(predicted_price * 0.90 / 50_000) * 50_000)
        high = int(round(predicted_price * 1.10 / 50_000) * 50_000)

        return PricePredictResponse(
            success=True,
            predicted_price_vnd=predicted_price,
            price_display=f"{predicted_price:,} VNĐ/tháng",
            price_range={
                "low": low,
                "high": high,
                "min_price": low,
                "max_price": high,
                "low_display": f"{low:,} VNĐ",
                "high_display": f"{high:,} VNĐ",
            },
            disclaimer=(
                "⚠️ Giá này được ước tính bởi mô hình CatBoost huấn luyện trên "
                "~1,186 tin đăng thực tế từ phongtro123.com (Hà Nội). Giá mang tính tham khảo, "
                "bạn hoàn toàn có quyền tự quyết định giá đăng tin thực tế."
            ),
            valid_options={
                "districts": VALID_DISTRICTS,
                "room_types": VALID_ROOM_TYPES,
                "furniture_levels": VALID_FURNITURE,
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi dự đoán giá: {str(e)}"
        )


# -------------------------------------------------------------------
# Chạy trực tiếp
# -------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("🚀 Khởi động Price Suggestion ML Service")
    print("=" * 60)
    print("📌 Port  : 8001")
    print("📖 Docs  : http://localhost:8001/docs")
    print("❤️ Health: http://localhost:8001/health")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
