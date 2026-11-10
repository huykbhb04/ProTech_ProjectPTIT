"""
Web Crawler for Real-World Rental Room Data (phongtro123.com)
Extracts 10 ML features + price_vnd for Smart PropTech AI Pricing Model.

Target Columns:
- district (str)
- area_m2 (float)
- room_type (str)
- furniture_level (str)
- has_ac (int: 0/1)
- has_water_heater (int: 0/1)
- has_parking (int: 0/1)
- has_wifi (int: 0/1)
- floor (int)
- max_occupants (int)
- price_vnd (int)
"""

import os
import sys
import re
import time
import json
import random
import argparse
from typing import List, Dict, Optional, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from bs4 import BeautifulSoup
import pandas as pd

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "https://phongtro123.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
}

HN_DISTRICTS = [
    'Cầu Giấy', 'Đống Đa', 'Thanh Xuân', 'Nam Từ Liêm', 'Bắc Từ Liêm',
    'Ba Đình', 'Hai Bà Trưng', 'Hoàng Mai', 'Hà Đông', 'Tây Hồ',
    'Long Biên', 'Hoàn Kiếm', 'Gia Lâm', 'Hoài Đức', 'Thanh Trì', 'Đông Anh'
]

HCM_DISTRICTS = [
    'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8',
    'Quận 10', 'Quận 11', 'Quận 12', 'Bình Thạnh', 'Tân Bình', 'Tân Phú',
    'Phú Nhuận', 'Gò Vấp', 'Bình Tân', 'Thủ Đức'
]


def extract_district(address_str: str, text_str: str, city: str = "ha-noi") -> str:
    combined = f"{address_str} {text_str}".lower()
    districts = HN_DISTRICTS if "ha-noi" in city else HCM_DISTRICTS
    
    for d in districts:
        pattern = r'\b' + re.escape(d.lower()) + r'\b'
        if re.search(pattern, combined):
            return d
            
    # Substring check fallback
    for d in districts:
        if d.lower() in combined:
            return d
            
    return 'Cầu Giấy' if "ha-noi" in city else 'Quận 10'


def parse_price(price_ld: Any, price_text: str) -> Optional[int]:
    if price_ld:
        try:
            val = int(price_ld)
            if 500_000 <= val <= 50_000_000:
                return val
        except (ValueError, TypeError):
            pass
            
    if price_text:
        text_lower = price_text.lower()
        m_trieu = re.search(r'([\d\.,]+)\s*triệu', text_lower)
        if m_trieu:
            try:
                num = float(m_trieu.group(1).replace(',', '.'))
                val = int(num * 1_000_000)
                if 500_000 <= val <= 50_000_000:
                    return val
            except ValueError:
                pass
                
        m_nghin = re.search(r'([\d\.,]+)\s*(?:nghìn|ngàn|k)\b', text_lower)
        if m_nghin:
            try:
                num = float(m_nghin.group(1).replace(',', '.'))
                val = int(num * 1_000)
                if 500_000 <= val <= 50_000_000:
                    return val
            except ValueError:
                pass
                
    return None


def parse_area(area_text: str, text_str: str) -> float:
    if area_text:
        m = re.search(r'([\d\.,]+)\s*m', area_text.lower())
        if m:
            try:
                val = float(m.group(1).replace(',', '.'))
                if 10.0 <= val <= 150.0:
                    return round(val, 1)
            except ValueError:
                pass
                
    m2 = re.search(r'([\d\.,]+)\s*(?:m2|m²)', text_str.lower())
    if m2:
        try:
            val = float(m2.group(1).replace(',', '.'))
            if 10.0 <= val <= 150.0:
                return round(val, 1)
        except ValueError:
            pass
            
    return 25.0


def parse_room_type(text: str) -> str:
    t = text.lower()
    if any(k in t for k in ['chung cư mini', 'ccmn']):
        return 'Chung cư mini'
    if any(k in t for k in ['căn hộ dịch vụ', 'chdv', 'studio', 'căn hộ cao cấp', 'can ho']):
        return 'Căn hộ dịch vụ'
    if any(k in t for k in ['nguyên căn', 'nhà riêng', 'nguyen can']):
        return 'Nhà nguyên căn'
    if any(k in t for k in ['homestay', 'ktx', 'ký túc xá', 'sleepbox', 'ở ghép', 'o ghep']):
        return 'Homestay'
    return 'Phòng trọ'


def parse_furniture(text: str) -> str:
    t = text.lower()
    if any(k in t for k in ['full nội thất', 'full đồ', 'đủ đồ', 'đầy đủ nội thất', 'nội thất cao cấp', 'tiện nghi đầy đủ', 'full option']):
        return 'Nội thất đầy đủ'
    if any(k in t for k in ['nhà trống', 'không đồ', 'không nội thất', 'chưa có đồ', 'phòng trống']):
        return 'Không nội thất'
    return 'Nội thất cơ bản'


def parse_features_from_post(title: str, desc: str, address: str, price_ld: Any, price_text: str, area_text: str, city: str) -> Optional[Dict[str, Any]]:
    combined = f"{title} {desc}".lower()
    
    price_vnd = parse_price(price_ld, price_text)
    if not price_vnd:
        return None
        
    area_m2 = parse_area(area_text, combined)
    if area_m2 < 10.0 or area_m2 > 120.0:
        return None
        
    district = extract_district(address, combined, city)
    room_type = parse_room_type(f"{title} {desc}")
    furniture_level = parse_furniture(combined)
    
    has_ac = 1 if re.search(r'\b(điều hòa|máy lạnh|dieu hoa|may lanh|ac)\b', combined) else 0
    has_water_heater = 1 if re.search(r'\b(nóng lạnh|bình nóng lạnh|nong lanh|binh nong lanh|máy nước nóng|nl)\b', combined) else 0
    has_parking = 1 if re.search(r'\b(để xe|gửi xe|chỗ để xe|bãi xe|hầm xe|hầm để xe|de xe|gui xe|giữ xe)\b', combined) else 0
    has_wifi = 1 if re.search(r'\b(wifi|internet|mạng|wifi free|mạng cap quang)\b', combined) else 0
    
    # If full furniture is detected, typically AC and water heater are present
    if furniture_level == 'Nội thất đầy đủ':
        has_ac = 1
        has_water_heater = 1

    # Floor extraction
    m_floor = re.search(r'\btầng\s*(\d+)\b', combined)
    if m_floor:
        floor = min(max(int(m_floor.group(1)), 1), 10)
    elif 'tầng 1' in combined or 'tầng trệt' in combined or 'trệt' in combined:
        floor = 1
    elif 'tầng 2' in combined or 'gác lửng' in combined:
        floor = 2
    else:
        floor = random.choice([2, 3, 4])
        
    # Max occupants extraction
    m_occ = re.search(r'(\d+)\s*(?:người|bạn|ng)\b', combined)
    if m_occ:
        max_occupants = min(max(int(m_occ.group(1)), 1), 6)
    else:
        if area_m2 < 20:
            max_occupants = 2
        elif area_m2 <= 32:
            max_occupants = 3
        else:
            max_occupants = 4
            
    return {
        'district': district,
        'area_m2': area_m2,
        'room_type': room_type,
        'furniture_level': furniture_level,
        'has_ac': has_ac,
        'has_water_heater': has_water_heater,
        'has_parking': has_parking,
        'has_wifi': has_wifi,
        'floor': floor,
        'max_occupants': max_occupants,
        'price_vnd': price_vnd
    }


class RentalCrawler:
    def __init__(self, city: str = "ha-noi", workers: int = 5):
        self.city = city
        self.workers = workers
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.visited_urls = set()
        
    def fetch_page(self, page_num: int) -> List[Dict[str, Any]]:
        url = f"{BASE_URL}/tinh-thanh/{self.city}?page={page_num}" if page_num > 1 else f"{BASE_URL}/tinh-thanh/{self.city}"
        try:
            resp = self.session.get(url, timeout=12)
            if resp.status_code != 200:
                print(f"[!] Page {page_num} returned status {resp.status_code}")
                return []
                
            soup = BeautifulSoup(resp.text, 'html.parser')
            items = soup.select('ul.post__listing > li')
            
            page_records = []
            for it in items:
                # 1. JSON-LD
                ld_data = {}
                script = it.find('script', type='application/ld+json')
                if script and script.string:
                    try:
                        ld_data = json.loads(script.string)
                    except Exception:
                        pass
                        
                detail_url = ld_data.get('url', '')
                if not detail_url:
                    a_tag = it.select_one('h3 a, a.line-clamp-2')
                    if a_tag and a_tag.get('href'):
                        href = a_tag['href']
                        detail_url = BASE_URL + href if href.startswith('/') else href
                        
                if detail_url in self.visited_urls:
                    continue
                self.visited_urls.add(detail_url)
                
                title = ld_data.get('name', '')
                if not title:
                    t_el = it.select_one('h3 a, a.line-clamp-2')
                    title = t_el.get_text(strip=True) if t_el else ''
                    
                desc = ld_data.get('description', '')
                if not desc:
                    d_el = it.select_one('p.line-clamp-2, .post__summary')
                    desc = d_el.get_text(strip=True) if d_el else ''
                    
                addr_obj = ld_data.get('address', {})
                address = addr_obj.get('streetAddress', '') if isinstance(addr_obj, dict) else ''
                if not address:
                    a_el = it.select_one('a[href*="quan-"]')
                    address = a_el.get_text(strip=True) if a_el else ''
                    
                price_ld = ld_data.get('priceRange')
                p_el = it.select_one('.text-green')
                price_text = p_el.get_text(strip=True) if p_el else ''
                
                area_text = ''
                for span in it.find_all('span'):
                    if 'm' in span.get_text() and ('2' in span.get_text() or span.find('sup')):
                        area_text = span.get_text(strip=True)
                        break
                        
                page_records.append({
                    'detail_url': detail_url,
                    'title': title,
                    'desc': desc,
                    'address': address,
                    'price_ld': price_ld,
                    'price_text': price_text,
                    'area_text': area_text
                })
                
            return page_records
        except Exception as e:
            print(f"[!] Error fetching page {page_num}: {e}")
            return []

    def enrich_detail(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Fetch detail page if available to get full description and amenities."""
        detail_url = item.get('detail_url')
        full_desc = item.get('desc', '')
        
        if detail_url:
            try:
                r = self.session.get(detail_url, timeout=8)
                if r.status_code == 200:
                    sp = BeautifulSoup(r.text, 'html.parser')
                    for h2 in sp.find_all('h2'):
                        if 'mô tả' in h2.get_text().lower():
                            parent = h2.parent
                            if parent:
                                full_desc = parent.get_text(separator=' ', strip=True)
                                break
            except Exception:
                pass # Fallback to card summary
                
        record = parse_features_from_post(
            title=item['title'],
            desc=full_desc,
            address=item['address'],
            price_ld=item['price_ld'],
            price_text=item['price_text'],
            area_text=item['area_text'],
            city=self.city
        )
        return record

    def run(self, target_count: int = 1500, fetch_details: bool = True) -> pd.DataFrame:
        print(f"[*] Starting crawl for '{self.city}' (target: {target_count} samples, workers: {self.workers})...")
        print(f"[*] Detail page enrichment: {'ENABLED' if fetch_details else 'DISABLED (Fast mode)'}")
        
        valid_records: List[Dict[str, Any]] = []
        page = 1
        max_pages = (target_count // 15) + 30
        
        start_time = time.time()
        
        while len(valid_records) < target_count and page <= max_pages:
            print(f"[*] Fetching listing page {page}...")
            items = self.fetch_page(page)
            if not items:
                print(f"[!] No items on page {page}, stopping or retry.")
                break
                
            if fetch_details:
                with ThreadPoolExecutor(max_workers=self.workers) as executor:
                    futures = [executor.submit(self.enrich_detail, it) for it in items]
                    for fut in as_completed(futures):
                        res = fut.result()
                        if res:
                            valid_records.append(res)
            else:
                for it in items:
                    res = parse_features_from_post(
                        title=it['title'],
                        desc=it['desc'],
                        address=it['address'],
                        price_ld=it['price_ld'],
                        price_text=it['price_text'],
                        area_text=it['area_text'],
                        city=self.city
                    )
                    if res:
                        valid_records.append(res)
                        
            print(f"    -> Progress: {len(valid_records)}/{target_count} valid samples collected.")
            page += 1
            time.sleep(0.3)
            
        dur = time.time() - start_time
        df = pd.DataFrame(valid_records[:target_count])
        print(f"[+] Crawl finished in {dur:.1f}s. Collected {len(df)} samples.")
        return df


def main():
    parser = argparse.ArgumentParser(description="Rental Room Data Crawler (phongtro123.com)")
    parser.add_argument("--count", type=int, default=1500, help="Target number of records (default: 1500)")
    parser.add_argument("--city", type=str, default="ha-noi", help="City slug: ha-noi or ho-chi-minh (default: ha-noi)")
    parser.add_argument("--workers", type=int, default=6, help="Thread pool worker count (default: 6)")
    parser.add_argument("--fast", action="store_true", help="Fast mode: skip detail pages, parse listing summaries only")
    parser.add_argument("--out", type=str, default="ai_service/data/crawled_rooms.csv", help="Output CSV path")
    parser.add_argument("--merge-training", action="store_true", help="Directly update ai_service/data/crawled_rooms.csv")
    
    args = parser.parse_args()
    
    crawler = RentalCrawler(city=args.city, workers=args.workers)
    df = crawler.run(target_count=args.count, fetch_details=not args.fast)
    
    if df.empty:
        print("[!] No records scraped.")
        return
        
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    df.to_csv(args.out, index=False, encoding='utf-8')
    print(f"[+] Saved crawled data to: {args.out}")
    
    print("\n--- SAMPLE EXTRACTED DATA ---")
    print(df.head(5).to_string())
    
    print("\n--- DATA DISTRIBUTION ---")
    print(df.describe().to_string())
    print("\nDistrict breakdown:")
    print(df['district'].value_counts().to_string())
    print("\nRoom type breakdown:")
    print(df['room_type'].value_counts().to_string())
    print("\nFurniture breakdown:")
    print(df['furniture_level'].value_counts().to_string())
    
    if args.merge_training:
        train_path = "ai_service/data/crawled_rooms.csv"
        df.to_csv(train_path, index=False, encoding='utf-8')
        print(f"[+] Replaced training dataset at {train_path} with {len(df)} real crawled records!")


if __name__ == "__main__":
    main()
