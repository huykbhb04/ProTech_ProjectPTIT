# Mô tả luồng chi tiết và các chức năng của Smart PropTech

## 1. Tổng quan hệ thống
Smart PropTech là nền tảng cho thuê bất động sản theo mô hình marketplace, kết nối 3 nhóm người dùng chính:
- **Người thuê**: tìm kiếm, xem chi tiết, lưu tin, đặt lịch, theo dõi hợp đồng và hóa đơn.
- **Chủ nhà**: đăng và quản lý tin, nhận booking, theo dõi doanh thu, tối ưu hiển thị.
- **Quản trị viên**: kiểm duyệt nội dung, quản lý danh mục, banner, theme, SEO và thống kê.

Dự án có nhiều đặc điểm giống một hệ thống thương mại điện tử dịch vụ:
- trưng bày “sản phẩm” là tin đăng phòng / căn hộ
- tìm kiếm và lọc giống trang mua sắm
- wishlist / lưu tin giống giỏ yêu thích
- đặt lịch / giữ chỗ giống đặt hàng
- cọc giữ phòng / hóa đơn / thanh toán giống checkout và post-order management
- tin VIP / quảng cáo / featured listings giống upsell và sponsored products

---

## 2. Luồng tổng quát của hệ thống

### 2.1 Luồng khám phá
1. Người dùng vào trang `Discover Rooms`.
2. Hệ thống tải danh sách tin đăng đang hoạt động.
3. Người dùng tìm kiếm theo từ khóa hoặc lọc theo giá, diện tích, loại hình, danh mục, tiện nghi.
4. Danh sách hiển thị dưới dạng card để người dùng dễ so sánh.
5. Người dùng mở một tin để xem chi tiết.

### 2.2 Luồng đánh giá tin đăng
1. Người dùng xem ảnh, giá, diện tích, vị trí, mô tả, tiện nghi.
2. Hệ thống hiển thị thông tin chủ nhà và tin nổi bật liên quan.
3. Người dùng có thể lưu tin, chia sẻ, liên hệ hoặc đặt lịch.
4. Nếu phù hợp, người dùng tiến tới booking hoặc giữ chỗ.

### 2.3 Luồng giao dịch
1. Người dùng đặt lịch xem phòng.
2. Hệ thống lưu booking và cập nhật trạng thái.
3. Khi hai bên đồng ý, hệ thống hỗ trợ cọc giữ phòng / hợp đồng.
4. Tiếp theo là quản lý hóa đơn, chi phí phát sinh và thanh toán.

### 2.4 Luồng vận hành quản lý
1. Chủ nhà và quản trị viên quản lý dữ liệu theo phân quyền.
2. Hệ thống ghi nhận lượt xem, booking, doanh thu, quảng cáo, tỉ lệ chuyển đổi.
3. Admin cấu hình danh mục, banner, SEO, theme, thống kê toàn nền tảng.

---

## 3. Luồng chi tiết theo từng vai trò

## 3.1 Luồng của người thuê

### 3.1.1 Truy cập và khám phá
- Người thuê vào website không cần đăng nhập để xem danh sách và xem chi tiết tin đăng.
- Hệ thống hiển thị giao diện khám phá với hero search, danh sách tin, filter và banner nổi bật.
- Người thuê có thể duyệt tin theo khu vực, loại hình, mức giá, diện tích và tiện nghi.

### 3.1.2 Tìm kiếm và lọc
**Chức năng riêng biệt:**
- tìm theo từ khóa (tên tin, tòa nhà, địa chỉ)
- lọc theo danh mục
- lọc theo khoảng giá
- lọc theo diện tích
- lọc theo loại hình phòng
- lọc theo tiện nghi
- sắp xếp theo mới nhất / giá tăng / giá giảm

**Giá trị thương mại điện tử:**
- giảm thời gian tìm kiếm
- giúp người dùng ra quyết định nhanh hơn
- tăng tỷ lệ click vào tin chi tiết

### 3.1.3 Xem chi tiết tin đăng
**Chức năng riêng biệt:**
- xem ảnh chính và ảnh phụ
- xem tag nổi bật như loại phòng, tòa nhà, khu vực
- xem giá thuê, diện tích, đặt cọc, sức chứa
- xem mô tả chi tiết
- xem tiện nghi
- xem bản đồ vị trí
- xem tin nổi bật / tin quảng cáo liên quan
- xem thông tin chủ nhà
- ước tính tổng chi phí hàng tháng

**Giá trị thương mại điện tử:**
- trình bày rõ ràng như một “product detail page”
- tăng độ tin cậy
- tăng khả năng chuyển đổi sang booking

### 3.1.4 Lưu tin yêu thích
**Chức năng riêng biệt:**
- người dùng lưu tin để xem lại sau
- danh sách tin đã lưu giúp so sánh giữa nhiều lựa chọn

**Giá trị thương mại điện tử:**
- giống wishlist trong e-commerce
- kéo người dùng quay lại nền tảng
- tăng khả năng ra quyết định muộn hơn

### 3.1.5 Chia sẻ tin đăng
**Chức năng riêng biệt:**
- chia sẻ đường dẫn tin đăng
- hỗ trợ lan truyền tự nhiên qua mạng xã hội / chat

**Giá trị thương mại điện tử:**
- tăng traffic không tốn quảng cáo
- tăng lượt mở tin và khả năng booking

### 3.1.6 Đặt lịch xem phòng
**Chức năng riêng biệt:**
- người dùng chọn đặt lịch xem phòng
- hệ thống tạo booking
- chủ nhà nhận booking để xử lý
- người thuê theo dõi trạng thái booking trong tài khoản

**Giá trị thương mại điện tử:**
- tương tự bước “đặt hàng” trong thương mại điện tử
- biến hành vi quan tâm thành hành vi cam kết

### 3.1.7 Cọc giữ phòng
**Chức năng riêng biệt:**
- người thuê có thể cọc giữ phòng theo chính sách hệ thống
- tiền cọc giúp hạn chế booking ảo
- hỗ trợ giữ chỗ cho khách có nhu cầu thật

**Giá trị thương mại điện tử:**
- tương tự “reserve now” hoặc “deposit payment”
- tăng tỉ lệ giao dịch thành công

### 3.1.8 Theo dõi hợp đồng
**Chức năng riêng biệt:**
- xem hợp đồng thuê
- theo dõi trạng thái ký kết
- lưu lịch sử giao dịch

**Giá trị thương mại điện tử:**
- biến hệ thống từ giai đoạn tìm kiếm sang giai đoạn sử dụng sau mua
- tăng vòng đời khách hàng

### 3.1.9 Theo dõi hóa đơn
**Chức năng riêng biệt:**
- xem hóa đơn thuê phòng
- xem hóa đơn điện nước / dịch vụ
- xem chi tiết từng kỳ thanh toán

**Giá trị thương mại điện tử:**
- tăng tính minh bạch
- hình thành chuỗi giao dịch định kỳ

### 3.1.10 Chat và liên hệ
**Chức năng riêng biệt:**
- liên hệ chủ nhà qua điện thoại / chat / Zalo
- hỗ trợ trao đổi trước và sau booking

**Giá trị thương mại điện tử:**
- thúc đẩy chốt giao dịch nhanh hơn
- tăng tỉ lệ chuyển đổi giữa khách quan tâm và khách thực

---

## 3.2 Luồng của chủ nhà

### 3.2.1 Đăng tin
**Chức năng riêng biệt:**
- tạo tin đăng mới
- nhập tên phòng, giá, diện tích, mô tả, địa chỉ, tiện nghi
- upload ảnh phòng
- gán danh mục / loại hình

**Giá trị thương mại điện tử:**
- tạo “sản phẩm” để bán trên marketplace
- quyết định trực tiếp chất lượng hiển thị và tỉ lệ chuyển đổi

### 3.2.2 Quản lý tin đăng
**Chức năng riêng biệt:**
- sửa tin
- ẩn / hiện tin
- xoá tin
- nâng cấp tin lên VIP / featured

**Giá trị thương mại điện tử:**
- giống quản lý catalog trong thương mại điện tử
- cho phép tối ưu hàng hóa theo nhu cầu thị trường

### 3.2.3 Quản lý booking
**Chức năng riêng biệt:**
- xem danh sách booking
- xác nhận hoặc từ chối lịch xem
- theo dõi người đã đặt lịch

**Giá trị thương mại điện tử:**
- giống xử lý đơn hàng
- giúp chủ nhà quản lý nhu cầu khách hàng theo luồng rõ ràng

### 3.2.4 Quản lý hợp đồng
**Chức năng riêng biệt:**
- theo dõi hợp đồng đang hiệu lực
- xem chi tiết từng hợp đồng
- quản lý thông tin khách thuê

**Giá trị thương mại điện tử:**
- tương tự hệ thống quản lý đơn sau bán
- tăng khả năng vận hành dài hạn

### 3.2.5 Quản lý hóa đơn và doanh thu
**Chức năng riêng biệt:**
- xem hóa đơn của từng phòng
- theo dõi doanh thu
- kiểm tra tình trạng thanh toán
- thống kê chi phí / lợi nhuận

**Giá trị thương mại điện tử:**
- hỗ trợ business intelligence cho chủ nhà
- biến nền tảng thành công cụ quản trị kinh doanh

### 3.2.6 Mua quảng cáo / VIP
**Chức năng riêng biệt:**
- đăng tin nổi bật
- trả phí để lên vị trí ưu tiên
- dùng banner quảng cáo để tăng hiển thị

**Giá trị thương mại điện tử:**
- tạo nguồn doanh thu cho nền tảng
- giống sponsored listing trong marketplace

### 3.2.7 Theo dõi hiệu suất
**Chức năng riêng biệt:**
- xem lượt xem tin
- xem tỷ lệ booking
- đánh giá hiệu quả tin đăng

**Giá trị thương mại điện tử:**
- giúp chủ nhà tối ưu giá, nội dung, ảnh và chiến lược marketing

---

## 3.3 Luồng của quản trị viên

### 3.3.1 Quản lý người dùng
**Chức năng riêng biệt:**
- xem danh sách người dùng
- phân quyền tenant / landlord / admin
- khóa hoặc kích hoạt tài khoản

### 3.3.2 Quản lý danh mục
**Chức năng riêng biệt:**
- tạo danh mục cha / con
- chỉnh sửa tên, slug, mô tả, icon, màu sắc
- bật / tắt danh mục

**Giá trị thương mại điện tử:**
- giúp phân loại sản phẩm rõ ràng
- tăng chất lượng tìm kiếm và chuyển đổi

### 3.3.3 Quản lý banner
**Chức năng riêng biệt:**
- thêm banner trang chủ / sidebar
- sắp xếp banner theo vị trí
- gắn banner với listing cụ thể

### 3.3.4 Quản lý theme và SEO
**Chức năng riêng biệt:**
- đổi màu giao diện
- cấu hình layout hiển thị
- quản lý metadata SEO

**Giá trị thương mại điện tử:**
- tăng khả năng hiển thị trên công cụ tìm kiếm
- hỗ trợ chiến dịch marketing

### 3.3.5 Thống kê hệ thống
**Chức năng riêng biệt:**
- xem tổng số user, listing, booking, doanh thu
- theo dõi xu hướng tăng trưởng
- phân tích hiệu quả nền tảng

**Giá trị thương mại điện tử:**
- hỗ trợ ra quyết định quản trị
- phục vụ tối ưu chuyển đổi và doanh thu

---

## 4. Các chức năng “ăn điểm” về thương mại điện tử

### 4.1 Search / Filter / Sort
Đây là nhóm chức năng quan trọng nhất vì giúp người dùng tìm đúng phòng nhanh hơn.

### 4.2 Product Detail Page giống trang sản phẩm
Trang chi tiết tin đăng được xây dựng như một trang sản phẩm cao cấp:
- ảnh đẹp
- badge nổi bật
- thông tin giá rõ
- CTA rõ ràng
- tin liên quan bên cạnh

### 4.3 Wishlist / Save listing
Người dùng có thể lưu tin để quay lại sau, rất gần với mô hình thương mại điện tử.

### 4.4 Booking as Reservation
Booking hoạt động như một bước đặt chỗ / giữ chỗ trước khi giao dịch chính thức.

### 4.5 Deposit / Cọc giữ phòng
Đây là cơ chế thương mại rất mạnh vì tăng cam kết của khách và giảm booking ảo.

### 4.6 Billing / Contract lifecycle
Sau booking không dừng lại ở xem phòng, hệ thống còn có hóa đơn, hợp đồng, thanh toán định kỳ.

### 4.7 Sponsored listings / VIP
Chủ nhà có thể trả phí để được hiển thị nổi bật, tạo dòng doanh thu cho nền tảng.

### 4.8 Analytics / Stats
Dữ liệu vận hành giúp chủ nhà và admin tối ưu chiến lược kinh doanh.

---

## 5. Kết luận
Smart PropTech là một marketplace bất động sản có đầy đủ các luồng quan trọng của thương mại điện tử:
- khám phá
- đánh giá
- lưu tin
- đặt lịch
- cọc giữ chỗ
- hợp đồng
- hóa đơn
- quảng cáo trả phí
- thống kê và tối ưu

Điều này giúp project không chỉ là website đăng tin, mà là một hệ thống kinh doanh số có thể trình bày rất tốt trong đồ án hoặc buổi bảo vệ.
