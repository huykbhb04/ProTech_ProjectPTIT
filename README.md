# Smart PropTech

Smart PropTech là một nền tảng bất động sản cho thuê tập trung vào trải nghiệm của **người thuê**, **chủ nhà** và **quản trị viên**. Dự án gồm 2 phần chính:

- `client/` — giao diện web React + Vite + Tailwind CSS
- `server/` — API Node.js + Express + MySQL

## Tính năng chính

### Người thuê
- Tìm kiếm và khám phá phòng trọ / căn hộ
- Xem chi tiết tin đăng với thư viện ảnh, tiện nghi, bản đồ và ước tính chi phí
- Đặt lịch xem phòng, lưu tin yêu thích
- Xem hóa đơn, hợp đồng, chat và các thông báo liên quan

### Chủ nhà
- Quản lý danh sách bất động sản và phòng cho thuê
- Quản lý đặt phòng, hợp đồng, hóa đơn và ví
- Theo dõi doanh thu, quảng cáo và hiệu quả tin đăng

### Quản trị viên
- Quản lý người dùng, danh mục, banner, theme, SEO
- Cấu hình hệ thống monetization và thống kê vận hành
- Kiểm soát nội dung và dữ liệu của toàn nền tảng

## Công nghệ sử dụng

### Frontend
- React 19
- Vite
- React Router
- Redux Toolkit
- Axios
- Tailwind CSS
- MUI
- Lucide React
- React Hot Toast
- Recharts
- React Leaflet / Leaflet

### Backend
- Node.js
- Express
- MySQL / mysql2
- JWT
- bcrypt
- Multer
- Cloudinary
- dotenv
- node-cron

## Cấu trúc thư mục

```text
E:/DoAn
├─ client
│  ├─ src
│  │  ├─ components
│  │  ├─ features
│  │  ├─ layouts
│  │  ├─ pages
│  │  ├─ services
│  │  ├─ store.js
│  │  └─ main.jsx
│  └─ package.json
├─ server
│  ├─ src
│  │  ├─ app.js
│  │  ├─ config
│  │  ├─ controllers
│  │  ├─ middleware
│  │  ├─ models
│  │  ├─ routes
│  │  └─ services
│  └─ package.json
└─ README.md
```

## Yêu cầu hệ thống

- Node.js 18+ (khuyến nghị)
- npm hoặc yarn
- MySQL 8+
- Tài khoản Cloudinary nếu dùng upload ảnh lên cloud

## Cài đặt

### 1. Clone dự án

```bash
git clone <repository-url>
cd DoAn
```

### 2. Cài đặt dependencies

Cài đặt cho frontend:

```bash
cd client
npm install
```

Cài đặt cho backend:

```bash
cd ../server
npm install
```

## Cấu hình môi trường

Tạo file `.env` trong thư mục `server/`.

Ví dụ:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_proptech
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Nếu frontend cần cấu hình API, kiểm tra file `client/src/services/api.js` để xác nhận base URL.

## Chạy dự án

### Chạy backend

```bash
cd server
npm run dev
```

API mặc định chạy ở:

```text
http://localhost:3000
```

### Chạy frontend

```bash
cd client
npm run dev
```

Frontend mặc định chạy ở:

```text
http://localhost:5173
```

## Scripts hữu ích

### Client
- `npm run dev` — chạy môi trường phát triển
- `npm run build` — build production
- `npm run lint` — kiểm tra lỗi lint
- `npm run preview` — xem bản build

### Server
- `npm run dev` — chạy backend với nodemon
- `npm start` — chạy backend bằng node

## API chính

Một số nhóm route hiện có:

- `/api/auth`
- `/api/users`
- `/api/properties`
- `/api/upload`
- `/api/tenant`
- `/api/listings`
- `/api/monetization`
- `/api/ai`
- `/api/admin`
- `/api/bookings`
- `/api/notifications`
- `/api/contracts`
- `/api/bills`
- `/api/saved-listings`
- `/api/roommates`
- `/api/categories`
- `/api/landlord/banners`
- `/api/landlord/stats`
- `/api/admin/stats`

## Ghi chú thiết kế

Giao diện hiện được tối ưu theo hướng:
- sạch, hiện đại, chuyên nghiệp
- đồng bộ hệ màu xanh dương / navy
- ưu tiên trải nghiệm đọc và thao tác của người thuê
- phù hợp cho các màn hình desktop lẫn mobile

## Đóng góp

1. Tạo branch mới
2. Thực hiện thay đổi
3. Kiểm tra lint / build
4. Gửi pull request

## Giấy phép

Dự án hiện chưa khai báo giấy phép cụ thể.
