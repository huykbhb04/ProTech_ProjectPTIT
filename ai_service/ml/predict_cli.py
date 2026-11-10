"""
Công cụ chạy thử mô hình Machine Learning trực tiếp trên Terminal.
Cho phép kiểm tra nhanh hoặc nhập thông số tùy ý để dự đoán.
"""

import sys
from pathlib import Path
import joblib
import pandas as pd

# Đảm bảo in unicode trên terminal Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "price_model.pkl"

DISTRICTS = [
    "Cầu Giấy", "Đống Đa", "Thanh Xuân", "Nam Từ Liêm",
    "Bắc Từ Liêm", "Hoàng Mai", "Hai Bà Trưng", "Ba Đình",
    "Hà Đông", "Tây Hồ"
]

ROOM_TYPES = ["Phòng trọ", "Chung cư mini", "CHDV", "Mini apartment"]
FURNITURE_LEVELS = ["Không nội thất", "Nội thất cơ bản", "Nội thất đầy đủ"]

def load_model():
    if not MODEL_PATH.exists():
        print(f"❌ Không tìm thấy model tại: {MODEL_PATH}")
        print("Vui lòng chạy lệnh: python ai_service/ml/train_model.py")
        sys.exit(1)
    return joblib.load(str(MODEL_PATH))

def format_vnd(amount):
    return f"{int(amount):,} VNĐ/tháng".replace(",", ".")

def predict(model, data: dict):
    df = pd.DataFrame([data])
    raw_pred = float(model.predict(df)[0])
    
    price = int(round(raw_pred / 50000.0) * 50000)
    low = int(round((price * 0.90) / 50000.0) * 50000)
    high = int(round((price * 1.10) / 50000.0) * 50000)
    
    return price, low, high

def run_demo_cases(model):
    print("\n" + "="*65)
    print("  🚀 CHẠY THỬ 3 TRƯỜNG HỢP PHÒNG TRỌ ĐIỂN HÌNH")
    print("="*65)
    
    cases = [
        {
            "ten": "Phòng trọ sinh viên giá rẻ (Bắc Từ Liêm)",
            "data": {
                "district": "Bắc Từ Liêm",
                "area_m2": 18.0,
                "room_type": "Phòng trọ",
                "furniture_level": "Không nội thất",
                "max_occupants": 2,
                "has_ac": 0,
                "has_water_heater": 1,
                "has_parking": 1,
                "has_wifi": 1,
                "floor": 2
            }
        },
        {
            "ten": "Chung cư mini hiện đại (Cầu Giấy, full nội thất)",
            "data": {
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
        },
        {
            "ten": "Căn hộ dịch vụ cao cấp (Tây Hồ, view đẹp)",
            "data": {
                "district": "Tây Hồ",
                "area_m2": 45.0,
                "room_type": "CHDV",
                "furniture_level": "Nội thất đầy đủ",
                "max_occupants": 3,
                "has_ac": 1,
                "has_water_heater": 1,
                "has_parking": 1,
                "has_wifi": 1,
                "floor": 5
            }
        }
    ]
    
    for idx, c in enumerate(cases, 1):
        d = c["data"]
        price, low, high = predict(model, d)
        print(f"\n[Trường hợp {idx}]: {c['ten']}")
        print(f"  • Đặc điểm: {d['district']} | {d['area_m2']} m² | Tầng {d['floor']} | {d['furniture_level']}")
        ac_str = "Có" if d["has_ac"] else "Không"
        nl_str = "Có" if d["has_water_heater"] else "Không"
        print(f"  • Tiện ích: Điều hòa: {ac_str} | Nóng lạnh: {nl_str} | Số người: {d['max_occupants']}")
        print(f"  👉 Giá AI đề xuất: {format_vnd(price)}")
        print(f"  📊 Khoảng khuyến nghị: {format_vnd(low)}  đến  {format_vnd(high)}")

def main():
    print("\n" + "="*65)
    print("  🤖 SMART PROPTECH - DỰ ĐOÁN GIÁ THUÊ PHÒNG BẰNG MACHINE LEARNING")
    print("     RandomForestRegressor (200 cây quyết định, n_jobs=-1)")
    print("="*65)
    
    print("\nĐang nạp mô hình...")
    model = load_model()
    print("✅ Đã nạp mô hình thành công từ price_model.pkl")
    
    run_demo_cases(model)
    
    if "--interactive" in sys.argv or "-i" in sys.argv:
        print("\n" + "="*65)
        print("  ✍️ NHẬP THÔNG TIN PHÒNG TÙY CHỌN ĐỂ DỰ ĐOÁN")
        print("="*65)
        try:
            print("Danh sách quận:", ", ".join(DISTRICTS))
            district = input("Quận (mặc định Cầu Giấy): ").strip() or "Cầu Giấy"
            area = float(input("Diện tích m² (mặc định 25): ").strip() or 25)
            print("Loại phòng:", ", ".join(ROOM_TYPES))
            rtype = input("Loại phòng (mặc định Phòng trọ): ").strip() or "Phòng trọ"
            print("Nội thất:", ", ".join(FURNITURE_LEVELS))
            furn = input("Nội thất (mặc định Nội thất cơ bản): ").strip() or "Nội thất cơ bản"
            ac = 1 if input("Có điều hòa không? (y/n, mặc định y): ").strip().lower() != "n" else 0
            heater = 1 if input("Có nóng lạnh không? (y/n, mặc định y): ").strip().lower() != "n" else 0
            floor = int(input("Tầng mấy (mặc định 2): ").strip() or 2)
            
            custom_data = {
                "district": district,
                "area_m2": area,
                "room_type": rtype,
                "furniture_level": furn,
                "max_occupants": 2 if area < 25 else 3,
                "has_ac": ac,
                "has_water_heater": heater,
                "has_parking": 1,
                "has_wifi": 1,
                "floor": floor
            }
            p, l, h = predict(model, custom_data)
            print("\n" + "-"*40)
            print(f"👉 Giá AI đề xuất cho phòng của bạn: {format_vnd(p)}")
            print(f"📊 Khoảng giá thị trường: {format_vnd(l)} đến {format_vnd(h)}")
            print("-"*40)
        except Exception as e:
            print("Lỗi khi nhập liệu:", e)

    print("\n" + "="*65)
    print("  💡 LƯU Ý KỸ THUẬT:")
    print("  Mô hình được huấn luyện trên 2.000 mẫu dữ liệu giả lập (simulated)")
    print("  mô phỏng thị trường Hà Nội phục vụ mục đích kỹ thuật và demo.")
    print("  Giá dự đoán mang tính tham khảo, người đăng tin tự quyết định giá.")
    print("="*65 + "\n")

if __name__ == "__main__":
    main()
