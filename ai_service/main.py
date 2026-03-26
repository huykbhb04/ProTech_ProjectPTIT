import torch
import torchvision.transforms as transforms
from torchvision.models import mobilenet_v2, MobileNet_V2_Weights
from PIL import Image
import io
import os
import cv2
import numpy as np
import re
import time
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from paddleocr import PaddleOCR
from sklearn.metrics.pairwise import cosine_similarity
from geopy.distance import geodesic
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

app = FastAPI(title="Smart PropTech AI Service", version="2.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
# Use Vietnamese lang for CCCD
ocr_vn = PaddleOCR(use_angle_cls=True, lang='vi')
# Use English lang for numbers/meters
ocr_en = PaddleOCR(use_angle_cls=True, lang='en')

# Load pre-trained MobileNet for amenity verification
weights = MobileNet_V2_Weights.DEFAULT
amenity_model = mobilenet_v2(weights=weights)
amenity_model.eval()
preprocess = weights.transforms()

AMENITY_MAPPING = {
    "fridge": ["refrigerator", "icebox"],
    "air_conditioner": ["air_conditioner", "ventilation"],
    "washing_machine": ["washer", "washing_machine"],
    "television": ["television", "tv"],
    "bed": ["bed"],
    "wardrobe": ["wardrobe", "closet"],
    "table": ["table", "desk"],
    "chair": ["chair", "seat"]
}

def preprocess_image(contents):
    # Convert bytes to numpy array for OpenCV
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # 1. Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 2. Adaptive Thresholding to handle lighting
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    
    # 3. Denoising
    denoised = cv2.fastNlMeansDenoising(thresh, None, 10, 7, 21)
    
    return img, gray # Return original for OCR, gray for potential analysis

@app.get("/")
def read_root():
    return {"status": "online", "capabilities": ["amenity_verification", "ocr_cccd", "ocr_meter"]}

@app.post("/ocr/cccd")
async def ocr_cccd(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        print(f"[OCR CCCD] Received file: {file.filename}, size: {len(contents)} bytes")
        
        # Original image for PaddleOCR (it handles its own preprocessing usually)
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            print("[OCR CCCD] ERROR: Failed to decode image")
            return {"success": False, "error": "Cannot decode image"}
        
        print(f"[OCR CCCD] Image decoded successfully: {img.shape}")
        
        # Run OCR
        result = ocr_vn.ocr(img)
        
        # Extract text and join into a single string for parsing
        lines = []
        full_text = ""
        for idx in range(len(result)):
            res = result[idx]
            if res:
                for line in res:
                    text = line[1][0]
                    lines.append(text)
                    full_text += text + " "
        
        print(f"[OCR CCCD] Extracted {len(lines)} text lines")
        print(f"[OCR CCCD] Raw text: {lines}")

        # Regex patterns for CCCD (Vietnamese ID Card)
        data = {
            "id_number": "",
            "full_name": "",
            "dob": "",
            "address": "",
            "raw_text": lines
        }

        # Simplified extraction logic based on keywords
        for i, line in enumerate(lines):
            line_clean = line.strip().upper()
            
            # ID Number (usually 12 digits, but also try 9 digits for old format)
            id_match = re.search(r'\b\d{12}\b', line)
            if not id_match:
                id_match = re.search(r'\b\d{9}\b', line)
            if id_match and not data["id_number"]:
                data["id_number"] = id_match.group()
                print(f"[OCR CCCD] Found ID: {data['id_number']}")
            
            # Name (Usually follows "HỌ VÀ TÊN" or similar, or contains "Name:")
            if "HỌ VÀ TÊN" in line_clean or "FULL NAME" in line_clean or "NAME:" in line_clean or "TÊN:" in line_clean:
                # Often the next 1-2 lines contain the name
                if i + 1 < len(lines):
                    data["full_name"] = lines[i+1].strip()
                    print(f"[OCR CCCD] Found name (next line): {data['full_name']}")
            
            # Also try to extract name if it's on the same line after the keyword
            if not data["full_name"]:
                name_match = re.search(r'(?:HỌ VÀ TÊN|FULL NAME|NAME:)\s*[:：]?\s*(.+)', line_clean)
                if name_match:
                    data["full_name"] = name_match.group(1).strip()
                    print(f"[OCR CCCD] Found name (same line): {data['full_name']}")
            
            # DOB (DD/MM/YYYY or DD-MM-YYYY)
            dob_match = re.search(r'\b(\d{2}[/-]\d{2}[/-]\d{4})\b', line)
            if dob_match and not data["dob"]:
                data["dob"] = dob_match.group().replace('-', '/')
                print(f"[OCR CCCD] Found DOB: {data['dob']}")
            
            # Address (Simplified - look for keywords)
            if "QUÊ QUÁN" in line_clean or "NƠI THƯỜNG TRÚ" in line_clean or "PLACE OF ORIGIN" in line_clean:
                if i + 1 < len(lines):
                    data["address"] = " ".join(lines[i+1:min(i+3, len(lines))]).strip()
                    print(f"[OCR CCCD] Found address: {data['address']}")
        
        # Check if we extracted at least some data
        has_data = any([data["id_number"], data["full_name"], data["dob"]])
        print(f"[OCR CCCD] Extraction complete. Has data: {has_data}")
        print(f"[OCR CCCD] Final data: {data}")
        
        return {"success": True, "data": data, "has_data": has_data}
    except Exception as e:
        print(f"[OCR CCCD] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

@app.post("/ocr/meter")
async def ocr_meter(file: UploadFile = File(...), previous_value: float = Form(0)):
    try:
        start_time = time.time()
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # 1. Advanced Preprocessing
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Enhance contrast significantly for LCD/mechanical displays
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # Denoise
        denoised = cv2.fastNlMeansDenoising(enhanced, None, 10, 7, 21)
        
        # 2. Run OCR with English model (better for numbers)
        result = ocr_en.ocr(denoised, cls=True)
        
        detected_numbers = []
        
        # 3. Intelligent Number Extraction
        for idx in range(len(result)):
            res = result[idx]
            if not res:
                continue
                
            for line in res:
                text = line[1][0]
                confidence = line[1][1]
                
                # Filter for numeric content
                # Look for sequences of digits, allowing for one decimal point
                # Meters often have 4-6 digits. Filter out single digits or too long strings
                nums = re.findall(r'\b\d{1,7}\b', text.replace('.', '')) # Treat as integer for now (ignore decimals often found in red box)
                
                if nums:
                    # Take the longest number sequence found in the line
                    val = max(nums, key=len)
                    # Heuristic: Meter readings are usually significant numbers
                    if len(val) >= 2: 
                        try:
                            num_val = float(val)
                            detected_numbers.append({
                                "value": num_val,
                                "text": text,
                                "confidence": confidence,
                                "box": line[0] # Coordinate box
                            })
                        except ValueError:
                            pass

        if not detected_numbers:
            return {
                "success": False, 
                "message": "Không tìm thấy số nào trong ảnh",
                "reading": 0,
                "confidence": 0
            }

        # 4. Selection Logic
        # Sort by confidence first, then by value reasonableness compared to previous
        # Bias towards numbers that are >= previous_value
        
        valid_candidates = [n for n in detected_numbers if n["value"] >= previous_value]
        
        if valid_candidates:
            # Pick highest confidence among valid candidates
            best_match = max(valid_candidates, key=lambda x: x["confidence"])
        else:
            # If no number >= previous, just pick highest confidence overall and flag it
            best_match = max(detected_numbers, key=lambda x: x["confidence"])
            
        reading = best_match["value"]
        confidence = best_match["confidence"]
        
        is_valid = reading >= previous_value
        
        process_time = time.time() - start_time
        
        return {
            "success": True,
            "reading": reading,
            "confidence": confidence,
            "previous": previous_value,
            "is_valid": is_valid,
            "debug_candidates": len(detected_numbers),
            "process_time": f"{process_time:.2f}s",
            "warning": None if is_valid else f"Chỉ số mới ({reading}) nhỏ hơn chỉ số cũ ({previous_value}). Vui lòng kiểm tra lại."
        }
        
    except Exception as e:
        print(f"[OCR Meter] Error: {str(e)}")
        return {"success": False, "error": str(e), "reading": 0, "confidence": 0}

@app.post("/verify-amenity")
async def verify_amenity(amenity_type: str = Form(...), file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        input_tensor = preprocess(image)
        input_batch = input_tensor.unsqueeze(0)
        
        with torch.no_grad():
            output = amenity_model(input_batch)
        
        probabilities = torch.nn.functional.softmax(output[0], dim=0)
        top_prob, top_catid = torch.topk(probabilities, 5)
        
        detected_labels = []
        for i in range(top_prob.size(0)):
            label = weights.meta["categories"][top_catid[i]]
            detected_labels.append({"label": label, "confidence": float(top_prob[i])})
        
        is_valid = False
        target_keywords = AMENITY_MAPPING.get(amenity_type.lower(), [amenity_type.lower()])
        
        for det in detected_labels:
            if any(kw in det["label"].lower() for kw in target_keywords) and det["confidence"] > 0.05:
                is_valid = True
                break
        
        return {"is_valid": is_valid, "detected_labels": detected_labels, "target": amenity_type}
    except Exception as e:
        return {"error": str(e), "is_valid": False}

# --- AI Matchmaking ---

class MatchRequest(BaseModel):
    user1_id: int
    user2_id: int
    user1_vector: List[float] # [smoking, pets, schedule, guests, cleanliness]
    user2_vector: List[float]
    user1_locations: List[Dict[str, float]] # [{"lat": ..., "lng": ...}, ...]
    user2_locations: List[Dict[str, float]]
    weights: Optional[Dict[str, float]] = {"lifestyle": 0.6, "location": 0.4}

@app.post("/matchmaking")
async def matchmaking(request: MatchRequest):
    try:
        # 1. Lifestyle Similarity (Cosine)
        # Reshape for sklearn: (1, n_features)
        v1 = np.array(request.user1_vector).reshape(1, -1)
        v2 = np.array(request.user2_vector).reshape(1, -1)
        
        lifestyle_score = float(cosine_similarity(v1, v2)[0][0])
        
        # 2. Location Proximity (Haversine via geopy)
        # Find minimum distance between any pair of locations
        min_dist_km = float('inf')
        
        # Default to a neutral score if no locations
        location_score = 0.5 
        
        if request.user1_locations and request.user2_locations:
            for loc1 in request.user1_locations:
                for loc2 in request.user2_locations:
                    # geopy expects (lat, lng)
                    p1 = (loc1["lat"], loc1["lng"])
                    p2 = (loc2["lat"], loc2["lng"])
                    dist = geodesic(p1, p2).kilometers
                    if dist < min_dist_km:
                        min_dist_km = dist
            
            # Scoring logic:
            if min_dist_km < 2:
                location_score = 1.0
                loc_comment = "Rất gần nhau (< 2km)"
            elif min_dist_km < 5:
                location_score = 0.8
                loc_comment = "Khá gần (2-5km)"
            elif min_dist_km < 10:
                location_score = 0.6
                loc_comment = "Khoảng cách trung bình (5-10km)"
            elif min_dist_km < 20:
                location_score = 0.4
                loc_comment = "Hơi xa (10-20km)"
            else:
                location_score = 0.2
                loc_comment = "Khá xa (> 20km)"
        else:
             loc_comment = "Chưa có dữ liệu vị trí đầy đủ"

        # 3. Total Score
        w_l = request.weights.get("lifestyle", 0.6)
        w_g = request.weights.get("location", 0.4)
        
        total_score = (w_l * lifestyle_score) + (w_g * location_score)
        
        # Reasoning
        reasoning = []
        if lifestyle_score > 0.8:
            reasoning.append("Lối sống rất hợp nhau.")
        elif lifestyle_score < 0.5:
            reasoning.append("Lối sống có nhiều điểm khác biệt.")
            
        reasoning.append(f"Vị trí: {loc_comment}.")
        
        return {
            "user1_id": request.user1_id,
            "user2_id": request.user2_id,
            "total_score": round(total_score, 2),
            "details": {
                "lifestyle_score": round(lifestyle_score, 2),
                "location_score": round(location_score, 2),
                "min_distance_km": round(min_dist_km, 2) if min_dist_km != float('inf') else None
            },
            "reasoning": " ".join(reasoning)
        }
            
    except Exception as e:
        print(f"[Matchmaking] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    # Make sure to run on 8000 as configured in Node.js
    uvicorn.run(app, host="0.0.0.0", port=8000)
