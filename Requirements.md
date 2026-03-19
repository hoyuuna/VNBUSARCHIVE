# 🚌 QUY CHUẨN VÀ HƯỚNG DẪN ĐĂNG TẢI ẢNH

Tài liệu này quy định các tiêu chuẩn khắt khe về nhiếp ảnh và cách thức điền thông tin nhằm xây dựng một cơ sở dữ liệu hình ảnh xe buýt/xe khách chất lượng cao. Vui lòng đọc kỹ trước khi đóng góp.

---

## PHẦN 1: TIÊU CHUẨN HÌNH ẢNH (UPLOAD)

Hệ thống áp dụng bộ tiêu chuẩn duyệt ảnh nghiêm ngặt. Ảnh tải lên bắt buộc phải đáp ứng các tiêu chí sau:

### 1. Tính chủ đích & Bố cục (Intention & Composition)
Chúng tôi tìm kiếm những bức ảnh **có chủ đích nhiếp ảnh rõ ràng**, được tác giả canh góc và chuẩn bị kỹ lưỡng.
* **KHÔNG chấp nhận ảnh "Snapshot":** Tuyệt đối từ chối các bức ảnh chụp vội vã, chụp ngẫu nhiên/tiện tay khi đang đi đường, góc máy méo mó hoặc ảnh thiếu sự chuẩn bị.
* **Đúng chủ thể & Trọn vẹn:** Xe phải là đối tượng chính của bức ảnh. Khung hình phải lấy trọn vẹn chiếc xe, **không bị cắt xén** các bộ phận quan trọng (đầu, đuôi, nóc, bánh xe). Trừ khi nó tạo nên chất riêng cho bức ảnh.
* **Không bị che khuất:** Chủ thể không bị che lấp đáng kể bởi các phương tiện khác, người đi đường, cột điện, biển báo hay cây cối.
* **Khung hình ngay ngắn:** Ảnh không bị nghiêng lệch. Tỉ lệ khung hình bắt buộc là ảnh ngang: `16:9`, `3:2`, hoặc `4:3`.

### 2. Yêu cầu nhận diện (Bắt buộc)
* **Biển kiểm soát (BKS) phải có thể đọc được (Visible):** Khung hình bắt buộc phải thể hiện rõ biển số của phương tiện để phục vụ việc tra cứu dữ liệu.
* Chấp nhận biển số kim loại (biển cứng) ở đầu/đuôi xe hoặc phần biển số được dán decal (in chữ) trên thân xe/kính xe, miễn là có thể đọc rõ bằng mắt thường.

### 3. Chất lượng kỹ thuật (Technical Quality)
* Ảnh phải sắc nét, đủ sáng và có độ tương phản tốt.
* **Không mờ nhòe (Blurry):** Không chấp nhận ảnh bị mờ do rung tay, out-net, hoặc xe di chuyển quá nhanh gây nhòe mờ không mong muốn.
* **Ảnh nguyên bản:** Giữ nguyên tính chân thực của ảnh chụp. Tuyệt đối **KHÔNG** sử dụng các công cụ Upscale AI để làm nét hoặc can thiệp thay đổi chi tiết xe.

### 4. Bản quyền & Siêu dữ liệu
* **Ảnh chính chủ:** Chỉ đăng tải hình ảnh do **chính tay bạn chụp**. Nghiêm cấm sử dụng ảnh từ các nguồn khác.
* **Metadata:** File ảnh gốc bắt buộc phải giữ lại thông tin EXIF (Thông số máy ảnh, thời gian chụp).
* **Không Watermark:** Vui lòng không chèn logo/chữ ký cá nhân, hệ thống sẽ tự động đóng dấu bản quyền khi xuất bản.
* **Quyền riêng tư:** Nếu ảnh chụp cận cảnh và nhận diện rõ khuôn mặt người (hành khách, tài xế), bạn cần đảm bảo sự cho phép của họ hoặc dùng tính năng che vật thể có sẵn để làm mờ.

---

## PHẦN 2: QUY CHUẨN ĐIỀN THÔNG TIN

### 1. Biển kiểm soát
Chỉ chấp nhận nhập biển số viết liền, không chứa khoảng trắng hay ký tự đặc biệt.
* **Biển số thường:** `29A1234`, `29A12345`
* **Biển số tạm:** `T1234567`
* **Nếu có 2 xe mang cùng 1 biển số:** `29A12345-1` *(theo thứ tự từ 1-9)*

### 2. Ngày chụp
* Hệ thống sẽ **tự động trích xuất** ngày chụp từ metadata (EXIF) của ảnh. 
* Nếu hệ thống không nhận diện được (do lỗi thiết bị hoặc phần mềm xuất ảnh), vui lòng nhập thủ công chính xác ngày chụp thực tế.

### 3. Đơn vị vận hành
Vui lòng chọn tên đơn vị từ **Gợi ý có sẵn**. Nếu phải nhập tay, cần nhập đầy đủ tên đơn vị (VD: *Vinbus* -> *Công ty TNHH Vận tải sinh thái Vinbus*).

> ⚠️ **Quy chuẩn viết tắt (BẮT BUỘC):**

| Từ gốc | Viết chuẩn thành |
| :--- | :--- |
| Xí nghiệp | **XN** |
| Cổ phần | **CP** |
| Hợp tác xã | **HTX** |
| Bus | **Xe buýt** |

*💡 **Ví dụ:** `Xí nghiệp Bus Hà Nội` -> `XN Xe buýt Hà Nội`*

### 4. Loại xe
Phân loại rõ ràng giữa **Xe buýt** và **Xe khách**.
> **Lưu ý:** Xe tư nhân vận chuyển hành khách nhưng **KHÔNG có 2 cửa lên/xuống** thì không được coi là Xe buýt (phải chọn là Xe khách).

### 5. Tuyến đường
* **Xe buýt:** Chỉ nhập số tuyến. *Ví dụ: `01`*. (Lộ trình chi tiết ghi tại phần **Ghi chú**).
* **Xe khách:** Ghi Điểm đầu - Điểm cuối. *Ví dụ: `Hà Nội - Cẩm Phả`*.
* **Nếu xe đã dừng hoạt động:** Ghi `Dừng hoạt động`.

### 6. Dòng xe
Ưu tiên chọn từ gợi ý có sẵn. Nếu không có, vui lòng nhập tên chi tiết của dòng xe .
* *Ví dụ: `THACO Garden` -> `THACO Garden TB79CT`.*

### 7. Vị trí chụp
Nhập **địa chỉ đoạn đường mà xe đang di chuyển qua** trong khung hình (KHÔNG phải vị trí nơi người chụp đang đứng bấm máy).

> 📍 **Lưu ý:** Định vị tọa độ (Map) có thể sai lệch, hệ thống luôn **ưu tiên thông tin địa chỉ bằng chữ** do bạn tự nhập.
