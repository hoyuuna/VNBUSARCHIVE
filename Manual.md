# 🚍 VNBUSARCHIVE - HƯỚNG DẪN SỬ DỤNG CHI TIẾT

Chào mừng bạn đến với **VNBUSARCHIVE**, hệ thống cơ sở dữ liệu hình ảnh và lịch sử xe buýt/xe khách hàng đầu. Để giúp bạn làm chủ mọi tính năng trên website, bản hướng dẫn này sẽ đi sâu vào từng chi tiết nhỏ nhất.

---

## 📑 Mục lục
1. [Phân quyền Người dùng](#phân-quền-người-dùng)
2. [Tài khoản & Bảo mật](#tài-khoản--bảo-mật)
3. [Khám phá & Tìm kiếm](#khám-phá--tìm-kiếm)
4. [Đăng tải Ảnh (Upload) - Quy trình chi tiết](#đăng-tải-ảnh-upload)
5. [Hồ sơ Phương tiện & Lịch sử](#hồ-sơ-phương-tiện--lịch-sử)
6. [Hệ thống Huy hiệu & Discord](#hệ-thống-huy-hiệu--discord)
7. [Dành cho Admin (Kiểm duyệt viên)](#dành-cho-admin)
8. [Dành cho Manager (Quản lý cấp cao)](#dành-cho-manager)
9. [Các giới hạn kỹ thuật cần lưu ý](#các-giới-hạn-kỹ-thuật)

---

## 👥 Phân quyền Người dùng

Hệ thống chia làm 4 cấp độ người dùng chính:
*   **Khách (Guest):** Chỉ có thể xem ảnh, xem lịch sử xe và tìm kiếm.
*   **Thành viên (User):** Có đầy đủ quyền của Khách + Đăng ảnh, Thích ảnh, Yêu cầu sửa thông tin, Đổi thông tin cá nhân.
*   **Admin (Kiểm duyệt viên):** Có quyền duyệt ảnh mới, duyệt yêu cầu sửa thông tin, từ chối ảnh lỗi.
*   **Manager (Quản lý):** Quyền cao nhất. Có thể đóng/mở server, thay đổi giới hạn hệ thống, xem nhật ký hành động của Admin, duyệt lại các ảnh đã bị từ chối.

---

## 🔑 Tài khoản & Bảo mật

### 1. Đăng ký & Đăng nhập
*   **Cách thực hiện:** Bấm vào biểu tượng **Tài khoản** trên Header -> Chọn **Đăng nhập/Đăng ký**.
*   **Các phương thức hỗ trợ:**
    *   Email & Mật khẩu (Yêu cầu xác thực Email, hãy kiểm tra hòm thư *Spam*).
    *   Đăng nhập nhanh qua **Google** hoặc **Discord**.
*   **Quên mật khẩu:** Trong trang đăng nhập, bấm "Quên mật khẩu", hệ thống sẽ gửi link đặt lại về Email của bạn.

### 2. Thiết lập tài khoản
Vào **Cài đặt tài khoản** (nằm trong menu thả xuống ở tên của bạn):
*   **Hồ sơ:** Thay đổi ảnh đại diện (Avatar) và tên hiển thị công khai.
*   **Bảo mật:** Thay đổi Email hoặc Mật khẩu hiện tại.
*   **Mã định danh (UUID):** Mỗi tài khoản có 1 mã UUID riêng (dạng chuỗi ký tự dài). Chỉ cung cấp mã này cho BQT khi cần hỗ trợ kỹ thuật. *Tuyệt đối không đưa cho người lạ.*

---

## 🔍 Khám phá & Tìm kiếm

### 1. Xem ảnh
*   **Ảnh nổi bật:** Tại trang chủ, 5 ảnh có lượt xem cao nhất sẽ được đưa lên khu vực Hero (đầu trang).
*   **Dành cho bạn (AI gợi ý):** Hệ thống sẽ tự động đề xuất ảnh dựa trên thói quen xem/thích của bạn về Tuyến xe, Đơn vị vận hành hoặc Dòng xe.

### 2. Tìm kiếm nâng cao
*   **Phím tắt nhanh:** Nhấn `Ctrl + K` (hoặc `Cmd + K` trên Mac) để focus nhanh vào ô tìm kiếm bất cứ lúc nào.
*   **Bộ lọc (Filter):** Bấm vào icon phễu để chọn tìm kiếm theo:
    *   Biển kiểm soát (BKS).
    *   Số tuyến.
    *   Đơn vị vận hành.
    *   Dòng xe (Model).
    *   Vị trí chụp.
    *   Người đăng / Thiết bị chụp.
*   **Gợi ý thông minh:** Khi bạn gõ, hệ thống sẽ hiện ra danh sách các xe hoặc đơn vị đã có sẵn trong database để bạn chọn nhanh.

---

## 📤 Đăng tải Ảnh (Upload)

Đây là tính năng quan trọng nhất và có quy trình kiểm soát chặt chẽ.

### Bước 1: Chọn tệp & Kiểm tra EXIF
*   **Yêu cầu:** Ảnh phải là ảnh gốc, có chứa dữ liệu EXIF (thông tin máy ảnh/ngày chụp). Nếu ảnh đã qua chỉnh sửa làm mất EXIF, hệ thống sẽ từ chối ngay lập tức.
*   **Độ phân giải:** Chiều cao ảnh tối thiểu phải đạt **1080px**.

### Bước 2: Công cụ chỉnh sửa (Editor)
Sau khi chọn ảnh, một bảng xem trước sẽ hiện ra với các công cụ:
*   **Cắt ảnh (Crop):** Nếu ảnh không đúng tỉ lệ (4:3, 3:2, 16:9), bạn phải dùng công cụ này để cắt lại cho chuẩn.
*   **Đóng dấu bản quyền (Watermark):** 
    *   Dòng chữ `© Tên của bạn` sẽ hiện giữa ảnh. Bạn có thể **nhấn giữ và kéo thả** nó đến vị trí bất kỳ (thường là góc ảnh để không che xe).
    *   Có thể tích chọn "Màu đen" nếu nền ảnh quá sáng.
*   **Làm mờ (Blur):** 
    *   Dùng để che mặt người hoặc biển số xe cá nhân không liên quan.
    *   **Giới hạn:** Tối đa 3 vùng làm mờ.
    *   **Thao tác:** Kéo thả để di chuyển, kéo góc dưới bên phải khung để đổi kích thước.

### Bước 3: Nhập thông tin xe
*   **Biển kiểm soát:** Nhập dạng viết liền (VD: 29B12345). 
    *   *Lưu ý xe định danh:* Nếu xe lên đời, hãy thêm `-1`, `-2` vào sau biển số (VD: 29B12345-1). Hệ thống sẽ báo lỗi nếu bạn nhập sai thứ tự.
*   **Vị trí chụp:** Bạn có thể gõ địa chỉ hoặc **bấm trực tiếp lên bản đồ** phía dưới để lấy vị trí chính xác.
*   **Dòng xe (Model):** Nếu xe đã tồn tại trong database, Model sẽ bị khóa (không cho sửa) để đảm bảo tính đồng nhất.

### Bước 4: Giới hạn (Quota)
*   Để tránh rác dữ liệu, mỗi người dùng có một giới hạn upload hàng ngày (do Manager thiết lập).
*   Giới hạn này sẽ **reset vào lúc 7:00 sáng** hàng ngày.

---

## 🚌 Hồ sơ Phương tiện & Lịch sử

Mỗi chiếc xe có một "Hồ sơ cá nhân" riêng:
*   **Thông tin cơ bản:** Đơn vị hiện tại, Tuyến hiện tại, Dòng xe.
*   **Lịch sử hoạt động:** Ghi lại các mốc thời gian xe đổi chủ, đổi tuyến hoặc đổi biển số.
*   **Sửa thông tin:** Nếu thấy thông tin xe bị sai, bạn có thể bấm "Sửa thông tin" -> Nhập thông tin đúng -> Gửi yêu cầu. Admin sẽ xem xét và phê duyệt.
*   **Chỉnh sửa lịch sử:** Bạn có thể thêm các mốc lịch sử cũ (ngày xưa xe chạy tuyến nào) bằng cách nhập ngày và đơn vị.

---

## 🏅 Hệ thống Huy hiệu & Discord

Hệ thống tích hợp sâu với Server Discord:
*   **Liên kết:** Vào Cài đặt -> Liên kết -> Kết nối với Discord.
*   **Điều kiện nhận Huy hiệu:**
    *   **Cột mốc (50, 100, 500, 1000 ảnh):** Khi đạt số lượng ảnh, bạn vào tab "Huy hiệu" để bấm "Nhận Role". Bạn sẽ được cấp Role tương ứng trên Discord.
    *   **Custom Role (1500 ảnh):** Khi đạt mốc này, bạn có quyền tự tạo tên Role và màu sắc riêng cho mình trên Discord thông qua web.

---

## 👮 Dành cho Admin

Admin có quyền truy cập vào trang `/admin` để quản lý các yêu cầu:
1.  **Duyệt ảnh:**
    *   Xem ảnh, soi chi tiết bằng công cụ Zoom.
    *   Có thể sửa lại thông tin người dùng nhập sai trước khi bấm **Duyệt**.
    *   Nếu ảnh xấu hoặc vi phạm, bấm **Từ chối** và chọn lý do (có sẵn danh sách lý do nhanh).
2.  **Duyệt yêu cầu sửa:** Xem sự khác biệt giữa dữ liệu cũ và dữ liệu mới mà người dùng gửi lên để phê duyệt.
3.  **Hàng đợi:** Ảnh của Admin và Manager luôn được đưa lên đầu danh sách chờ để duyệt nhanh hơn.
4.  **Lưu ý:** Admin không thể tự duyệt ảnh của chính mình (Trừ khi là Manager).

---

## 👑 Dành cho Manager

Manager có thêm tab **Quản lý (Manager)** trong trang Admin:
1.  **Cầu chì hệ thống (Maintenance):**
    *   Có thể tắt/mở từng phần: Toàn hệ thống, Đăng nhập, hoặc Upload.
    *   Hẹn giờ tự động mở lại: Hệ thống sẽ đếm ngược và tự mở khi hết giờ.
2.  **Quản lý giới hạn (Quota):** Thiết lập số ảnh tối đa mỗi người được đăng trong ngày. Nếu set bằng 0, hệ thống sẽ ngừng nhận ảnh mới.
3.  **Nhật ký Admin (Audit Logs):** Xem tất cả hành động của các Admin khác (Ai đã duyệt ảnh nào, ai đã xóa ảnh nào) để tránh lạm quyền.
4.  **Duyệt lại (Reapprove):** Manager có thể vào các ảnh đã bị Admin khác từ chối để "cứu" ảnh đó nếu thấy Admin kia từ chối sai.

---

## 📊 Các giới hạn kỹ thuật

| Thông số | Giới hạn |
| :--- | :--- |
| Dung lượng ảnh tối đa | 20MB |
| Chiều cao ảnh tối thiểu | 1080px |
| Số vùng làm mờ tối đa | 3 vùng |
| Độ dài tên hiển thị | 3 - 20 ký tự |
| Số thông báo lưu trữ | 10 thông báo gần nhất |
| Tỉ lệ ảnh hỗ trợ | 4:3, 3:2, 16:9 |

---

*Nếu gặp khó khăn, bạn đừng ngại [liên hệ hỗ trợ](https://www.vnbusarchive.io.vn/contact) nhé!*
