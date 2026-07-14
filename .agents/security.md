# VNBUSARCHIVE - Security Guidelines

Tài liệu này đóng vai trò như một bộ quy tắc và sổ tay bảo mật (Security Rules) dành cho các Agent AI tham gia phát triển dự án `vietnam-bus-spotter-main`. Bất kỳ khi nào làm việc với dự án này, Agent **BẮT BUỘC** phải tuân thủ các quy chuẩn bảo mật dưới đây để không làm phá vỡ kiến trúc an toàn đã được thiết lập.

---

## 1. Kiến trúc Payload (Base64 Anti-Tamper)
Toàn bộ logic của giao diện (UI) nằm trong thư mục `src/js/` và `src/html/`. Tuy nhiên, mã nguồn này không được đưa trực tiếp vào `public/index.html` dưới dạng mã rõ (plain text).
- **Quy trình build:** Chạy lệnh `node build-core.js` để đóng gói toàn bộ các file JS/HTML vào `functions/api/_core.js` dưới dạng chuỗi **Base64**.
- **Quy trình load:** Trình duyệt khi tải `index.html` sẽ gọi API `/api/_core` để lấy chuỗi Base64, sau đó giải mã và sử dụng `document.write()` để chèn thẳng vào DOM.
- **Mục đích:** Ngăn chặn người dùng phổ thông (hoặc bot đơn giản) có thể xem trộm cấu trúc mã nguồn JS/HTML qua F12 hoặc `View-Source`, cũng như tăng thêm một lớp làm khó (obfuscation) để bảo vệ bản quyền giao diện.
- **Rule:** Không được phép đưa các đoạn script nhạy cảm hoặc logic xử lý cốt lõi ra dạng thẻ `<script src="...">` dạng tĩnh trong `index.html`. Mọi logic phải nằm trong `src/js/` và được build lại bằng `node build-core.js`.

## 2. Content-Security-Policy (CSP)
Tệp `public/index.html` chứa một thẻ meta Content-Security-Policy (CSP) rất nghiêm ngặt.
- **Mục đích:** Ngăn chặn các cuộc tấn công XSS (Cross-Site Scripting), chèn mã độc, exfiltration (đánh cắp dữ liệu) sang tên miền lạ.
- **Rule:** 
  - Nếu bạn thêm một API mới, thư viện CDN mới (CSS/JS), hay một nguồn ảnh bên ngoài (Cloud Storage, WSRV, Giphy...), bạn **PHẢI BỔ SUNG** domain đó vào thẻ `meta` CSP trong `public/index.html`.
  - Tuyệt đối **KHÔNG** xóa bỏ thẻ CSP hay sử dụng dấu `*` ở các directive quan trọng (trừ các dịch vụ đã whitelist như `https://*.supabase.co`).
  - Không bao giờ thêm `'unsafe-inline'` nếu không thực sự bắt buộc. Hiện tại dự án đang phải dùng nó vì thiết kế Base64 injection.

## 3. Ngăn chặn SSRF, Origin / Referer Bypass
- **Rule (Cloudflare Functions):** Mọi file trong thư mục `functions/api/` (như `discord.js`, `manager.js`, `notify.js`...) đều **PHẢI** xác minh `Origin` hoặc `Referer`.
- Nếu yêu cầu (request) đến từ một nguồn không thuộc danh sách whitelist (ví dụ: `vnbusarchive.io.vn`), hệ thống phải trả về mã lỗi 403 Forbidden. Điều này ngăn chặn hacker giả mạo lời gọi API từ bên ngoài hoặc qua Postman/cURL mà không có token hợp lệ.
- Khi gọi webhooks (Discord), các tham số URL đầu vào do người dùng gửi lên phải được xác thực nghiêm ngặt để ngăn chặn Server-Side Request Forgery (SSRF).

## 4. IP Ban & Request Rate Limiting
- Hệ thống có cơ chế ban IP và nhận diện người dùng.
- **Rule:** Bất kỳ chức năng backend nào cũng phải đọc header `CF-Connecting-IP` (hoặc `X-Real-IP`) để xác định đúng IP thực của user nằm sau proxy của Cloudflare. Không bao giờ tin tưởng hoàn toàn dữ liệu IP do user gửi trong body.

## 5. Xác thực (Authentication) & Token
- **Rule:** Tuyệt đối không gửi các Secret Key (Supabase Service Role Key, Discord Webhook, Firebase Admin Key) xuống client. Toàn bộ thông tin này phải được lưu trong **Cloudflare Environment Variables** và chỉ được gọi/truy xuất từ `functions/api/`.
- Khi client cần gửi Token của Supabase (Access Token) lên Backend để xác thực (như `api/manager.js`), **PHẢI** sử dụng HTTP Header `Authorization: Bearer <token>` thay vì truyền vào JSON Body. Việc này tuân thủ chuẩn RESTful và an toàn hơn, tránh token bị ghi vào log HTTP Body.

## 6. Bảo mật File Upload (Ngăn chặn RCE & XSS File)
- **Kiểm tra File Extension & MIME Type:** Backend phải tự đánh giá (validate) kiểu file bằng nội dung nhị phân (hoặc whitelist đuôi file nghiêm ngặt), KHÔNG được phép tin tưởng `Content-Type` do trình duyệt gửi lên.
- **Định dạng cho phép:** `image/jpeg, image/png, image/webp, image/heic, image/heif` và một số file RAW từ máy ảnh kỹ thuật số.
- Các file tiềm ẩn rủi ro như `.svg`, `.html`, `.php`, `.js` bị chặn tuyệt đối để chống lưu trữ và thực thi mã độc trên máy chủ.
- Giới hạn dung lượng: Tối đa 20MB mỗi ảnh (được thực thi ở cả Client lẫn Backend).

## 7. Chống XSS trên DOM (DOMPurify & EscapeHTML)
- **Rule:** Bất kỳ chuỗi văn bản nào được nhận từ API hoặc do người dùng nhập vào, khi hiển thị ra màn hình thông qua phương thức `.innerHTML` hoặc Template Literals, **PHẢI** được Escape (thoát các ký tự đặc biệt như `< > " '`) để thành chữ HTML.
- Sử dụng hàm `app.utils.escapeHtml()` hoặc `DOMPurify` để khử trùng dữ liệu. Không dùng `.innerHTML` với dữ liệu bẩn.

## 8. Xử lý Lỗi an toàn (Error Handling)
- **Rule:** Hệ thống Backend (`functions/api/`) khi catch (bắt) được exception, tuyệt đối không trả về `error.stack` hoặc `error.message` có chứa thông tin cấu trúc thư mục, code snippet, thông tin SQL (Information Disclosure).
- Chỉ trả về các thông báo chung chung (Generic Messages) như `"Lỗi hệ thống, vui lòng thử lại sau"`. 

---

_Tài liệu này được tạo tự động bởi AI Security Auditor. Tuân thủ nghiêm ngặt để đảm bảo sự sống còn của dự án VNBUSARCHIVE._
