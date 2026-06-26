# JS Map: Bản đồ mã nguồn Javascript

Hiện tại, toàn bộ mã nguồn Javascript của dự án đã được chia nhỏ và cấu trúc lại để dễ dàng bảo trì. Dưới đây là bản đồ chi tiết về vị trí và chức năng của từng file:

## 1. Thư mục `src/js/` (Mã nguồn chính)
Đây là nơi lưu trữ 5 file JS cốt lõi của Frontend. Khi chạy lệnh Build, 5 file này sẽ được gộp lại theo đúng thứ tự.

*   **`1_init.js`**
    *   **Nhiệm vụ:** Khởi tạo biến toàn cục `window.app`, chứa các hàm tiện ích (`app.utils`), thông báo (`app.toast`, `app.loadingBar`), chế độ bảo trì (`app.maintenance`) và logic định tuyến (Routing).
    *   **Đóng vai trò:** Khung xương cơ bản của hệ thống.

*   **`2_auth.js`**
    *   **Nhiệm vụ:** Xử lý xác thực người dùng (`app.auth`), đăng nhập, đăng xuất, lấy hồ sơ (`app.user`), đổi Avatar và xác minh Captcha/QR Code.
    *   **Đóng vai trò:** Cửa ngõ bảo mật người dùng.

*   **`3_views.js`**
    *   **Nhiệm vụ:** Quản lý giao diện hiển thị (`app.views`), load ảnh ra màn hình chính, hệ thống tìm kiếm mở rộng (`app.search`), hiển thị danh sách nhà xe và mẫu xe. 
    *   **Đóng vai trò:** Hiển thị nội dung ra Frontend (Gọi API `/api/recommendations` để lấy gợi ý).

*   **`4_content.js`**
    *   **Nhiệm vụ:** Khu vực quản lý tính năng tải lên (`app.upload`), xử lý cắt/nén ảnh gốc bằng Cropper.js, chỉnh sửa thông tin ảnh, bình luận (`app.comments`) và theo dõi thay đổi thông tin phương tiện (`app.vehicle`).
    *   **Đóng vai trò:** Xử lý dữ liệu đầu vào của người dùng.

*   **`5_admin.js`**
    *   **Nhiệm vụ:** Bảng điều khiển riêng dành cho Admin/Manager (`app.admin`). Xử lý duyệt/từ chối/báo cáo ảnh, quản lý yêu cầu chỉnh sửa thông tin và thống kê BXH (Leaderboard).
    *   **Đóng vai trò:** Khu vực nhạy cảm (Gọi API `/api/admin/action` để thay đổi Database an toàn).

---

## 2. Thư mục `functions/api/` (Cloudflare Backend)
Nơi chứa các API chạy trên môi trường Serverless của Cloudflare Pages. Chịu trách nhiệm thực thi các logic giấu kín và bảo mật cơ sở dữ liệu.

*   **`_core.js`**
    *   **Nhiệm vụ:** Chứa chuỗi mã hóa Base64 của file `_core.html` (đã được gộp 5 file JS trên).
    *   **Sinh ra từ đâu:** Được tự động tạo ra bởi file `build-core.js`.

*   **`recommendations.js`**
    *   **Nhiệm vụ:** API trả về danh sách ảnh gợi ý ngoài trang chủ và ảnh liên quan trong trang chi tiết. Chấm điểm (scoring) ưu tiên tuyến/nhà xe/model dựa trên thói quen của user.

*   **`admin/action.js`**
    *   **Nhiệm vụ:** Xác thực token JWT, chạy với quyền của Admin/Manager để thực hiện chèn dữ liệu bảng `vehicles` và `vehicle_history` thông qua `supabase-js`, qua mặt Row-Level Security (RLS) hợp lệ.

---

## 3. Các file build ở thư mục gốc
*   **`build-core.js`**: Script chạy trên NodeJS. Dùng lệnh `node build-core.js` để đọc 5 file trong thư mục `src/js/`, gộp chúng vào thẻ `<!-- INJECT_JS -->` của `_core.html`, sau đó mã hóa Base64 và ghi đè vào `functions/api/_core.js`.
*   **`_core.html`**: Bản gốc của trang web trước khi bị Base64 hóa. Chứa CSS và cấu trúc thẻ HTML. Không chứa logic JS (JS đã bị tách ra ngoài `src/js/`).
