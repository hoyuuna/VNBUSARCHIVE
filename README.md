# 🚌 VNBUSARCHIVE

**VNBUSARCHIVE** là một dự án cộng đồng phi lợi nhuận nhằm mục đích lưu trữ, bảo tồn hình ảnh và lịch sử của các phương tiện xe buýt tại Việt Nam.

🌐 **Website chính thức:** [https://vnbusarchive.qzz.io/](https://vnbusarchive.qzz.io/)

---

## 📖 Giới thiệu chung

Dự án được tạo ra với mong muốn xây dựng một bách khoa toàn thư bằng hình ảnh dành cho những người yêu thích giao thông công cộng nói chung và xe buýt nói riêng. VNBUSARCHIVE cung cấp dữ liệu minh bạch, miễn phí để phục vụ cho các mục đích tra cứu, nghiên cứu hoặc tích hợp vào các nền tảng khác thông qua API.

---

## 🛠 Tài liệu API (API Documentation)

VNBUSARCHIVE cung cấp API công khai cho phép truy cập kho dữ liệu hình ảnh. Bạn có thể sử dụng API này để tích hợp dữ liệu vào các ứng dụng bên thứ ba, website cá nhân hoặc phục vụ mục đích nghiên cứu.

> **⚠️ LƯU Ý QUAN TRỌNG:** 
> - API này **có giới hạn lượt truy xuất (Rate Limit)** và hiện tại chỉ được thiết kế để phục vụ cho các **dự án cá nhân**.
> - Nếu bạn có nhu cầu sử dụng API cho dự án lớn hoặc có lưu lượng truy cập cao, vui lòng liên hệ trực tiếp qua Email: **nghoanganhtuann@gmail.com**.

### Thông tin cơ bản
- **Base URL:** `https://vnbusarchive.qzz.io/api`

---

### 1. Lấy danh sách ảnh

Trả về danh sách các hình ảnh xe buýt đã được hệ thống kiểm duyệt. API hỗ trợ lọc theo biển số xe, sắp xếp và phân trang.

**Endpoint:**
```http
GET /search
```

#### 📌 Tham số truy vấn (Query Parameters)

| Tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- |
| `plate` | `string` | `-` | Lọc theo biển kiểm soát xe (tìm kiếm gần đúng). Ví dụ: `51B` |
| `sort` | `string` | `created_at` | Tiêu chí sắp xếp. Giá trị: `views` (lượt xem) hoặc `created_at` (mới nhất). |
| `limit` | `integer` | `10` | Số lượng kết quả trả về. **Tối đa: 10**. |

#### 💻 Ví dụ Request

**Sử dụng cURL:**
```bash
curl -X GET "https://vnbusarchive.qzz.io/get-photos/search?plate=51B&sort=views&limit=5" \
-H "Accept: application/json"
```

**Sử dụng JavaScript (Fetch API):**
```javascript
fetch("https://vnbusarchive.qzz.io/get-photos/search?plate=51B&sort=views&limit=5", {
  method: "GET",
  headers: {
    "Accept": "application/json"
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error("Error:", error));
```

#### 📦 Ví dụ Response (JSON)

```json
{
  "success": true,
  "count": 1,
  "filter": {
    "plate": "51B12",
    "sort": "views",
    "limit": 5
  },
  "data":[
    {
      "photo_id": 1024,
      "image_url": "https://supabase-storage-url...",
      "license_plate": "51B12345",
      "operator": "Hợp tác xã 19/5",
      "route": "150",
      "model": "Samco City I.40",
      "stats": {
        "views": 1542,
        "likes": 0
      },
      "uploader": "bus_spotter_sg",
      "location": "Bến xe Chợ Lớn",
      "posted_at": "2024-05-20T08:30:00.000Z"
    }
  ]
}
```

---

### 2. Cấu trúc đối tượng `Photo`

Dưới đây là giải thích chi tiết cho các trường dữ liệu xuất hiện trong mảng `data` của API trả về:

| Trường | Kiểu | Mô tả |
| :--- | :--- | :--- |
| `photo_id` | `integer` | ID duy nhất của bức ảnh trong hệ thống. |
| `image_url` | `string` | Đường dẫn trực tiếp đến file ảnh. |
| `license_plate`| `string` | Biển kiểm soát của xe trong ảnh. |
| `operator` | `string` | Đơn vị vận hành (VD: VinBus, Transerco...). Trả về `"Unknown"` nếu chưa có dữ liệu. |
| `route` | `string` \| `null` | Số hiệu tuyến hoặc lộ trình đang hoạt động. |
| `model` | `string` \| `null` | Dòng xe (Model chassis / body). |
| `stats` | `object` | Chứa thông tin thống kê của ảnh: `views` (lượt xem), `likes` (lượt thích). |
| `uploader` | `string` | Tên người dùng đã đóng góp/đăng tải ảnh (hoặc `"Anonymous"`). |
| `location` | `string` | Địa điểm chụp ảnh. |
| `posted_at` | `string` | Thời gian đăng tải ảnh (Định dạng chuẩn ISO 8601). |

---

### 3. Mã lỗi (HTTP Status Codes)

API sử dụng các mã trạng thái HTTP tiêu chuẩn để thông báo kết quả của mỗi request:

| Code | Status | Mô tả |
| :--- | :--- | :--- |
| **200** | `OK` | Request thành công, dữ liệu được trả về. |
| **500** | `Internal Server Error` | Lỗi máy chủ nội bộ. Response body sẽ chứa thông báo lỗi chi tiết: <br> `{ "success": false, "error": "Message" }` |

---

## 🤝 Đóng góp & Liên hệ

Vì đây là dự án phi lợi nhuận, mọi sự đóng góp về hình ảnh, dữ liệu lịch sử hay mã nguồn đều được hoan nghênh. 

- **Tác giả / Quản trị viên:** Hoyuuna/nhanday
- **Liên hệ:** [https://vnbusarchive.qzz.io/contact](https://vnbusarchive.qzz.io/contact) hoặc nghoanganhtuann@gmail.com

**Ủng hộ dự dán một ly cà phê 👇❤️**

<img width="300" alt="photo_2026-04-16_12-45-39" src="https://github.com/user-attachments/assets/c7084939-9af7-43b9-a012-1c0f2261e4d7" />

