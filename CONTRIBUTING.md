# Hướng dẫn đóng góp (Contributing Guidelines)

Chào mừng bạn đến với dự án **VNBUSARCHIVE**! Chúng tôi rất vui mừng và hoan nghênh mọi sự đóng góp từ cộng đồng để phát triển dự án ngày một tốt hơn.

Dưới đây là một số hướng dẫn cơ bản giúp bạn dễ dàng tham gia đóng góp vào dự án.

## 1. Cấu trúc dự án
Dự án được xây dựng dựa trên kiến trúc không máy chủ (Serverless) với:
- **Frontend:** Pure HTML, CSS, JavaScript thuần (Vanilla JS). Không sử dụng Framework frontend nặng nề.
- **Backend:** Cloudflare Pages Functions (`functions/api/`).
- **Database:** Supabase.

**Lưu ý quan trọng về Frontend:**
Tất cả logic UI cốt lõi nằm ở thư mục `src/js/` và file `_core.html`. 
Mỗi khi chỉnh sửa file trong `src/js/` hoặc `_core.html`, bạn **BẮT BUỘC** phải chạy lệnh:
```bash
node build-core.js
```
Lệnh này sẽ gộp và mã hóa Base64 thành payload vào file `functions/api/_core.js`. **Tuyệt đối không** chỉnh sửa trực tiếp `functions/api/_core.js` hoặc nhúng script logic vào `public/index.html`.

## 2. Quy trình đóng góp (Pull Request Process)

1. **Fork** repository này về tài khoản GitHub của bạn.
2. **Clone** repository đã fork về máy tính:
   ```bash
   git clone https://github.com/hoyuuna/VNBUSARCHIVE.git
   ```
3. **Tạo nhánh mới (Branch)** cho tính năng hoặc bản vá lỗi của bạn:
   ```bash
   git checkout -b feature/ten-tinh-nang-cua-ban
   ```
   *Hoặc nếu sửa lỗi:*
   ```bash
   git checkout -b fix/ten-loi-can-sua
   ```
4. **Phát triển và kiểm thử**: 
   - Đảm bảo tuân thủ các quy tắc bảo mật và thiết kế (xem phần dưới).
   - Nếu có thay đổi Frontend, nhớ chạy `node build-core.js`.
5. **Commit thay đổi**:
   - Viết commit message bằng **tiếng Anh**, ngắn gọn và rõ ràng.
   ```bash
   git commit -m "feat: add new feature X"
   ```
6. **Push** nhánh lên GitHub:
   ```bash
   git push origin feature/ten-tinh-nang-cua-ban
   ```
7. **Tạo Pull Request (PR)**: Mở PR từ nhánh của bạn vào nhánh `main` của dự án gốc. Mô tả chi tiết những gì bạn đã thay đổi.

## 3. Tiêu chuẩn mã nguồn (Coding Standards) & Quy tắc (Rules)

### UI và Thiết kế (Design)
- **Màu sắc:** Chỉ sử dụng đen, trắng và xám cho các UI component tiêu chuẩn. Đỏ, vàng, xanh dương chỉ dành cho các thông báo (notification modals).
- **Border Radius:** Nút bấm hành động (action buttons) phải dùng góc bo vuông (`rounded-md` hoặc `rounded-lg`), không dùng hình viên thuốc (pill-shaped / `rounded-full`), trừ các nút icon tròn hoặc avatar.
- **Tái sử dụng UI:** Tuân thủ hệ thống thiết kế HoyuUI. **Luôn đọc và sử dụng** các token thiết kế trong `public/design.md`. Không tự ý tạo CSS component mới nếu không có sự đồng ý.
- **Modal Alerts:** BẮT BUỘC dùng `app.ui.showAlert()` thay cho `alert()` hay `confirm()` mặc định của trình duyệt.

### Bảo mật (Security)
- Tham khảo kỹ `security.md`. 
- **Không tự ý thay đổi Content-Security-Policy (CSP)** trong `public/index.html` trừ khi thêm API/CDN hợp lệ.
- Dữ liệu hiển thị lên DOM (`.innerHTML`) bắt buộc phải được escape qua `app.utils.escapeHtml()`.

### Backend & Database
- Xác thực bằng token JWT trên Cloudflare Functions (`functions/api/`).
- Các hành động duyệt/hủy ảnh **phải** được thực hiện qua API `/api/admin/action`. Không trực tiếp thay đổi `photos.status` từ phía client.

## 4. Báo cáo Lỗi (Bug Reports) & Yêu cầu Tính năng (Feature Requests)
Nếu bạn không rành về code nhưng vẫn muốn đóng góp, bạn có thể tạo **Issue** trên GitHub.
- **Bug Report:** Mô tả chi tiết lỗi, các bước tái hiện, thông tin trình duyệt và ảnh chụp màn hình (nếu có).
- **Feature Request:** Trình bày ý tưởng, lý do tại sao tính năng đó cần thiết và nó sẽ giúp ích gì cho cộng đồng VNBUSARCHIVE.

Cảm ơn bạn đã quan tâm và đồng hành cùng VNBUSARCHIVE!
