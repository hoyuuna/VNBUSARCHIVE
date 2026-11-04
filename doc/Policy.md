# Điều khoản dịch vụ và chính sách bảo mật thông tin

---

## Chương I: Điều khoản dịch vụ

### Điều 1. Phạm vi áp dụng và giải thích từ ngữ
1. **Phạm vi điều chỉnh:** Văn bản này xác lập các quyền, nghĩa vụ và trách nhiệm pháp lý giữa Ban Quản trị VNBUSARCHIVE (sau đây gọi là "Ban Quản trị" hoặc "Hệ thống") và các cá nhân, tổ chức truy cập, đăng ký tài khoản, gửi dữ liệu hoặc khai thác thông tin trên nền tảng số VNBUSARCHIVE (sau đây gọi là "Người dùng").
2. **Bản chất dịch vụ:** VNBUSARCHIVE là nền tảng số lưu trữ tư liệu cộng đồng phi lợi nhuận, vận hành với mục đích bảo tồn các giá trị lịch sử và cung cấp kho dữ liệu hình ảnh, thông số kỹ thuật mở về mạng lưới giao thông vận tải hành khách tại Việt Nam.
3. **Hiệu lực thỏa thuận:** Việc truy cập hoặc đăng ký sử dụng bất kỳ dịch vụ nào trên hệ thống đồng nghĩa với việc Người dùng đã đọc, hiểu và cam kết tuân thủ vô điều kiện toàn bộ các điều khoản được quy định tại văn bản này.

---

### Điều 2. Quản trị và bảo mật tài khoản người dùng
1. **Khởi tạo định danh:** Người dùng thực hiện việc tạo lập tài khoản thông qua thư điện tử cá nhân hoặc xác thực liên kết danh tính từ các dịch vụ bên thứ ba được hỗ trợ (Google, Discord, GitHub...). Hệ thống áp dụng công nghệ Cloudflare Turnstile nhằm thẩm tra danh tính số và ngăn chặn các hành vi tấn công tự động từ mạng máy tính ma (botnet).
2. **Độ tuổi tối thiểu:** Người dùng tham gia hệ thống bắt buộc phải từ **đủ 14 tuổi trở lên**. Ban Quản trị sẽ tiến hành khóa tài khoản vĩnh viễn và xóa bỏ toàn bộ dữ liệu định danh khi phát hiện hành vi cung cấp sai lệch độ tuổi theo quy định này.
3. **Trách nhiệm bảo mật tài khoản:** Người dùng có nghĩa vụ tự bảo quản bí mật mật khẩu và kiểm soát quyền truy cập trên các thiết bị cá nhân. Mỗi tài khoản được gán một mã định danh kỹ thuật duy nhất (User ID); Người dùng chỉ cung cấp thông tin này khi có yêu cầu bằng văn bản từ các kênh tiếp nhận hỗ trợ chính thức của Ban Quản trị.
4. **Quyền điều chỉnh hồ sơ:** Người dùng có quyền thay đổi tên hiển thị, ảnh đại diện và liên kết cá nhân tại mục Cài đặt. Việc thay đổi tên hiển thị không làm phát sinh nghĩa vụ thay đổi dấu bản quyền đã được xác lập trên các tác phẩm hình ảnh đã được phê duyệt xuất bản trước thời điểm thay đổi.
5. **Đình chỉ và chấm dứt tư cách thành viên:** Ban Quản trị bảo lưu toàn quyền đình chỉ có thời hạn hoặc chấm dứt vĩnh viễn tư cách thành viên mà không cần báo trước đối với các tài khoản có hành vi: tấn công kỹ thuật, phá hoại cấu trúc dữ liệu, xâm phạm quyền sở hữu trí tuệ, hoặc vi phạm quy chuẩn an toàn tác nghiệp thực địa quy định tại Điều 7 văn bản này...

---

### Điều 3. Cơ chế Điểm uy tín và phân bổ hạn mức tải ảnh hàng ngày
Nhằm tối ưu hóa tài nguyên máy chủ và duy trì chất lượng kiểm duyệt, hệ thống vận hành cơ chế quản lý bằng **Điểm uy tín (Reputation Score)** để tự động điều tiết hạn mức gửi tác phẩm mỗi ngày của từng tài khoản.

1. **Nguyên tắc phân bổ điểm số:**
   * **Điểm khởi tạo:** Mỗi tài khoản sau khi hoàn tất xác thực đăng ký được cấp mức điểm cơ sở là **100 điểm**. Hạn mức điểm tối đa có thể tích lũy là **220 điểm**.
   * **Cơ chế cộng điểm khi tác phẩm được phê duyệt:**
     * Tác phẩm đạt chuẩn kỹ thuật xuất bản: Cộng **+3 điểm** (trường hợp tệp tin lưu giữ nguyên vẹn thông số EXIF: cộng bổ sung +1 điểm, tổng là **+4 điểm**).
     * Tác phẩm thuộc diện tư liệu lịch sử được phê duyệt: Cộng **+6 điểm** (lưu giữ đầy đủ EXIF: cộng **+7 điểm**).
   * **Cơ chế trừ điểm khi tác phẩm bị từ chối phê duyệt:**
     * *Nhóm vi phạm định dạng nhẹ* (`[B1.4]` Giá trị lưu trữ, `[B2.3]` Nghiêng khung hình, `[C1/C2/C3]` Sai lệch nhập liệu...): Khấu trừ **-3 điểm** đối với mỗi mã lỗi.
     * *Nhóm vi phạm kỹ thuật quang học và bố cục* (`[B2.1]` Khuyết thiếu bộ phận, `[B2.2]` Cự ly/vị trí không đạt, `[B2.4]` Sai góc chụp, `[B2.5]` Có vật cản che khuất, `[B3.1]` Nhòe nét/lỗi phơi sáng, `[B3.4]` Dấu bản quyền cá nhân, `[B3.5]` Méo góc tiêu cự, `[B4.2]` Bỏ sót làm mờ khuôn mặt, `[B4.3]` Làm mờ phạm vào kết cấu xe, `[B4.4]` Bỏ sót làm mờ biển số vi phạm...): Khấu trừ **-5 điểm** đối với mỗi mã lỗi.
     * *Nhóm vi phạm tiêu chuẩn chủ thể và tính chân thực* (`[B1.1]` Ngoài phạm vi Việt Nam, `[B1.2]` Sai chủng loại chủ thể, `[B1.3]` Bối cảnh phản cảm, `[B3.2]` Lạm dụng AI hoặc hậu kỳ sai thực tế, `[B4.1]` Biển số không nhận diện được, `[B5.3]` Ghi hình tại khu vực cấm...): Khấu trừ **-10 điểm** đối với mỗi mã lỗi.
     * *Nhóm vi phạm quy chuẩn tác nghiệp và sở hữu trí tuệ* (`[B5.1]` Xâm phạm bản quyền tác giả, `[B5.2]` Xâm nhập trái phép công trình giao thông, `[B5.4]` Tác nghiệp gây nguy hiểm giao thông...): Khấu trừ **-15 điểm** đối với mỗi mã lỗi.
     * *Chế tài đối với hành vi gian lận nhãn tư liệu:* Cố ý tích chọn sai thuộc tính "Ảnh tư liệu" đối với phương tiện đời mới đang hoạt động bình thường sẽ bị khấu trừ trực tiếp **-50 điểm**.

2. **Bảng phân bổ hạn mức tải ảnh hàng ngày căn cứ theo Điểm uy tín:**

| Điểm uy tín tại thời điểm đăng tải | Hạn mức tải ảnh tối đa / 24 giờ |
| :--- | :---: |
| **Từ 200 điểm trở lên** | **50 tác phẩm / ngày** |
| **Từ 161 đến 199 điểm** | **40 tác phẩm / ngày** |
| **Từ 131 đến 160 điểm** | **30 tác phẩm / ngày** |
| **Từ 101 đến 130 điểm** | **20 tác phẩm / ngày** |
| **Đạt 100 điểm (Mức cơ sở)** | **15 tác phẩm / ngày** |
| **Từ 50 đến 99 điểm** | **12 tác phẩm / ngày** |
| **Từ 1 đến 49 điểm** | **8 tác phẩm / ngày** |
| **Từ -50 đến 0 điểm** | **5 tác phẩm / ngày** |
| **Dưới -50 điểm** | **1 tác phẩm / ngày** |

*Ghi chú chu kỳ:* Hạn mức tải ảnh được hệ thống tự động làm mới vào lúc **07:00:00 (GMT+7) hàng ngày**.

---

### Điều 4. Quyền sở hữu trí tuệ và phạm vi cấp phép sử dụng tác phẩm
1. **Xác lập quyền tác giả:** Tác giả giữ toàn bộ quyền nhân thân và quyền tác giả đối với tệp ảnh gốc do mình trực tiếp ghi nhận. Người đăng tải tự chịu trách nhiệm pháp lý trước pháp luật về tính hợp pháp và quyền sở hữu đối với tệp tin đóng góp.
2. **Cấp phép không hủy ngang cho hệ thống:** Khi gửi hình ảnh và được phê duyệt xuất bản vào kho lưu trữ, Người dùng cấp cho VNBUSARCHIVE giấy phép sử dụng không độc quyền, miễn phí bản quyền, có hiệu lực trên toàn thế giới, vĩnh viễn và không hủy ngang để thực hiện các hành vi: lưu trữ số, biên tập kỹ thuật, lập chỉ mục tra cứu, hiển thị công khai và đóng dấu bản quyền chuẩn của dự án nhằm phục vụ mục đích nghiên cứu, giáo dục và lưu trữ tư liệu cộng đồng phi thương mại. Giấy phép này tiếp tục duy trì hiệu lực vô thời hạn kể cả khi Người dùng chấm dứt tư cách thành viên hoặc yêu cầu xóa tài khoản.
3. **Quy định trích dẫn và sử dụng thứ cấp:** Các bên thứ ba khi khai thác, trích dẫn hình ảnh hoặc số liệu từ hệ thống bắt buộc phải thực hiện việc viện dẫn nguồn rõ ràng theo định dạng `Nguồn: VNBUSARCHIVE / [Tên Tác Giả]`. Nghiêm cấm hành vi tự ý sử dụng các công cụ trích xuất dữ liệu tự động (data crawling, scraping...) nhằm mục đích thương mại hóa dữ liệu mà không có sự đồng thuận bằng văn bản của Ban Quản trị.
4. **Bảo vệ tính toàn vẹn của tác phẩm:** Nghiêm cấm mọi hành vi sử dụng hình ảnh từ hệ thống để cắt ghép, chỉnh sửa nhằm mục đích công kích, xúc phạm danh dự của đơn vị vận tải, người lao động hoặc tán phát các thông tin xuyên tạc. Ban Quản trị giữ quyền áp dụng các biện pháp bảo vệ bản quyền quốc tế (DMCA) và đề nghị cơ quan có thẩm quyền xử lý theo quy định của pháp luật.

---

### Điều 5. Quy trình kiểm duyệt và thủ tục kháng cáo quyết định từ chối
Toàn bộ tác phẩm đóng góp được thẩm định độc lập theo các tiêu chí kỹ thuật quy định tại văn bản `Requirements.md`.

Trường hợp tác giả nhận thấy tác phẩm đáp ứng đầy đủ tiêu chuẩn nhưng bị từ chối do sai sót nghiệp vụ của kiểm duyệt viên, tác giả có quyền kích hoạt thủ tục kháng cáo chính thức:
1. **Điều kiện thụ lý kháng cáo:**
   * Người gửi kháng cáo bắt buộc phải đăng nhập chính xác tài khoản đã tải lên tác phẩm đó.
   * Tác phẩm kháng cáo bắt buộc phải đang ở trạng thái **Bị từ chối** (`denied`). Hệ thống tự động từ chối thụ lý đối với các tệp tin đang trong hàng đợi thẩm định hoặc tệp tin đã được phê duyệt xuất bản.
2. **Trình tự nộp hồ sơ kháng cáo:**
   * **Bước 1:** Truy cập cổng tiếp nhận tại mục **Hỗ trợ** (đường dẫn hệ thống: `/contact`).
   * **Bước 2:** Tại danh mục *Chủ đề cần hỗ trợ*, chọn chính xác: **`Thắc mắc kiểm duyệt / Kháng cáo ảnh từ chối`**.
   * **Bước 3:** Cung cấp liên kết chính thức của tác phẩm bị từ chối trên hệ thống vào ô xác thực để máy chủ truy xuất dữ liệu.
   * **Bước 4:** Trình bày đầy đủ các luận điểm kỹ thuật chứng minh tác phẩm thỏa mãn quy chuẩn tại mục *Lý do bạn cho rằng ảnh hợp lệ* và tiến hành xác nhận gửi.
3. **Quy trình giải quyết và chế độ phục hồi quyền lợi:**
   * Yêu cầu kháng cáo được chuyển tiếp trực tiếp đến cấp quản lý độc lập để tiến hành rà soát chuyên môn.
   * Trường hợp kháng cáo được chấp thuận và tác phẩm được phê duyệt xuất bản: Hệ thống tự động **hoàn trả 100% số điểm uy tín đã bị khấu trừ**, đồng thời **áp dụng mức nhân đôi điểm thưởng** (+6 điểm đối với ảnh thông thường, +12 điểm đối với ảnh tư liệu lịch sử).
   * Quyết định của Ban Quản trị tại vòng thẩm định kháng cáo là quyết định cuối cùng có hiệu lực thi hành.

---

### Điều 6. An ninh mạng và giới hạn khai thác hệ thống
Dữ liệu trên nền tảng được tối ưu hóa phục vụ nhu cầu tra cứu trực tuyến phi thương mại. Hệ thống hiện không mở cổng giao diện lập trình ứng dụng (API) công khai cho bên thứ ba. Nghiêm cấm các hành vi gửi yêu cầu dồn dập (DDoS), can thiệp luồng dữ liệu, khai thác lỗ hổng bảo mật hoặc sử dụng phần mềm tự động gây ảnh hưởng tiêu cực đến hiệu năng vận hành của máy chủ... Toàn bộ các địa chỉ mạng (IP) phát sinh hành vi phá hoại sẽ bị chặn truy cập vĩnh viễn thông qua hệ thống tường lửa Cloudflare.

---

### Điều 7. Giới hạn trách nhiệm pháp lý và quy chuẩn an toàn tác nghiệp
1. **Giá trị pháp lý của dữ liệu:** Dữ liệu lịch sử, chủng loại phương tiện và luồng tuyến được tổng hợp từ nguồn lực đóng góp của cộng đồng. Ban Quản trị nỗ lực tối đa trong công tác xác minh nhưng không đưa ra cam kết về tính chính xác tuyệt đối của dữ liệu trong mọi thời kỳ. Dữ liệu trên hệ thống không mang giá trị thay thế văn bản quy phạm pháp luật hoặc kết luận chính thức của cơ quan nhà nước.
2. **Quy chuẩn không gian tác nghiệp:** VNBUSARCHIVE không thuê mướn, chỉ định hay điều phối bất kỳ cá nhân nào thực hiện hoạt động ghi hình thực địa. Toàn bộ hoạt động thu thập tư liệu do Người dùng tự giác thực hiện dưới tư cách cá nhân độc lập.
   * **Khu vực hợp chuẩn:** Người dùng chỉ thực hiện việc chụp ảnh tại các địa điểm công cộng theo quy định của pháp luật (vỉa hè đường bộ, cầu vượt đi bộ, nhà chờ xe buýt, sảnh đón trả khách công cộng của bến xe khách...).
   * **Khu vực nghiêm cấm tác nghiệp:** Nghiêm cấm hành vi đột nhập, trèo tường rào, vượt chốt an ninh, hoặc tiếp cận trái phép vào bên trong khu vực xưởng bảo dưỡng, depot xe buýt/đường sắt đô thị, bãi đỗ xe nội bộ của doanh nghiệp, các mục tiêu an ninh quốc phòng hoặc nơi có biển cấm ghi hình... Tác giả tự chịu hoàn toàn trách nhiệm hành chính và hình sự trước cơ quan chức năng về phương thức tác nghiệp của mình.
3. **Tính chất công cộng của phương tiện:** Phương tiện vận tải hành khách và biển kiểm soát khi tham gia lưu thông trên mạng lưới giao thông đường bộ công cộng không cấu thành phạm vi bí mật đời tư cá nhân theo quy định pháp luật.
4. **Miễn trừ trách nhiệm kỹ thuật:** Hệ thống được miễn trừ trách nhiệm bồi thường trong các tình huống bất khả kháng dẫn đến gián đoạn dịch vụ, tấn công mạng diện rộng hoặc sự cố đường truyền viễn thông quốc tế. Người dùng có trách nhiệm tự bảo quản bản sao tác phẩm gốc.

---

### Điều 8. Quy chuẩn hồ sơ cá nhân và nhận diện người dùng
1. **Tiêu chuẩn tên hiển thị:** Độ dài quy định từ 3 đến 20 ký tự; cho phép sử dụng chữ cái tiếng Việt có dấu, chữ số và khoảng trắng. Nghiêm cấm đặt tên gây nhầm lẫn với ban điều hành hệ thống, cơ quan quản lý nhà nước hoặc các pháp nhân vận tải; không chèn số điện thoại, đường dẫn quảng cáo thương mại hoặc từ ngữ vi phạm thuần phong mỹ tục...
2. **Tiêu chuẩn ảnh đại diện:** Nghiêm cấm sử dụng hình ảnh nhận diện rõ khuôn mặt của cá nhân khác khi chưa có văn bản chấp thuận; không sử dụng con dấu, biểu trưng của cơ quan nhà nước, lực lượng vũ trang hoặc thương hiệu các doanh nghiệp vận tải; không sử dụng hình ảnh có nội dung phản cảm, bạo lực hoặc trái pháp luật...

---

### Điều 9. Thủ tục tiếp nhận và xử lý khiếu nại quyền riêng tư
1. **Quyền yêu cầu bảo vệ quyền riêng tư:** Trường hợp cá nhân nhận thấy khuôn mặt của mình xuất hiện rõ ràng trong tác phẩm lưu trữ trên hệ thống, cá nhân đó có quyền gửi thông báo đề nghị hỗ trợ qua mục **Liên hệ** (chọn danh mục: *Khiếu nại quyền riêng tư*).
2. **Thời hạn giải quyết:** Ban Quản trị tiếp nhận, xác minh và áp dụng biện pháp kỹ thuật làm mờ nhận diện danh tính trực tiếp trên tệp ảnh lưu trữ trong thời hạn từ 24 đến 72 giờ làm việc kể từ thời điểm nhận đủ thông tin hợp lệ.
3. **Nguyên tắc đối với hình ảnh phương tiện:** Hệ thống bảo lưu quyền từ chối các yêu cầu gỡ bỏ hình ảnh phương tiện giao thông vận tải được ghi nhận hợp pháp tại không gian công cộng, trừ trường hợp có văn bản yêu cầu chính thức từ cơ quan quản lý nhà nước có thẩm quyền theo quy định của pháp luật Việt Nam.

---

### Điều 10. Quyền sở hữu trí tuệ đối với thương hiệu dự án
Biểu trưng (logo), nhãn hiệu đồ họa và kiểu chữ nhận diện VNBUSARCHIVE thuộc quyền sở hữu trí tuệ của dự án. Mọi hành vi tự ý sử dụng các yếu tố nhận diện này để gắn lên ấn phẩm thương mại, sản phẩm truyền thông ngoài hệ thống hoặc phát hành thông cáo mạo danh Ban Quản trị khi chưa được chấp thuận bằng văn bản đều bị coi là hành vi xâm phạm quyền sở hữu công nghiệp.

---

## Chương II: Chính sách bảo mật dữ liệu cá nhân

### Điều 11. Phạm vi thu thập dữ liệu cá nhân
Hệ thống chỉ thu thập các trường thông tin kỹ thuật phục vụ trực tiếp cho hoạt động quản trị và thẩm định dữ liệu:
1. **Dữ liệu đăng ký định danh:** Địa chỉ thư điện tử cá nhân, mật khẩu được mã hóa một chiều qua thuật toán băm an toàn, tên hiển thị công khai và định danh tài khoản liên kết (Google ID, Discord ID, GitHub ID...).
2. **Dữ liệu tác phẩm:** Tệp tin hình ảnh tải lên, siêu dữ liệu EXIF trích xuất từ phần cứng máy ảnh (thông số quang học, thời gian ghi nhận thực tế...), lịch sử thẩm định và dữ liệu đóng góp định danh phương tiện.
3. **Dữ liệu nhật ký máy chủ:** Địa chỉ mạng (IP) và chuỗi định danh trình duyệt (User-Agent) trong mỗi phiên truy cập, phục vụ việc đối soát bảo mật và thiết lập hàng rào ngăn ngừa tấn công mạng qua Cloudflare.

---

### Điều 12. Mục đích xử lý dữ liệu cá nhân
Toàn bộ dữ liệu thu thập được xử lý nhằm các mục đích sau:
1. Duy trì tính liên tục của phiên đăng nhập, phân quyền chức năng và xác thực danh tính Người dùng.
2. Hiển thị thông số kỹ thuật và bảo hộ tên tác giả bên cạnh tác phẩm hình ảnh được phê duyệt xuất bản.
3. Vận hành thuật toán tính toán Điểm uy tín và phân bổ hạn mức tải ảnh tự động định kỳ.
4. Lưu trữ nhật ký kỹ thuật phục vụ công tác đối soát, xử lý sự cố an ninh thông tin và điều tra các hành vi phá hoại dữ liệu...

---

### Điều 13. Nguyên tắc bảo vệ và lưu trữ dữ liệu
1. **Cam kết không thương mại hóa:** Hệ thống cam kết không kinh doanh, chuyển nhượng hoặc cung cấp dữ liệu cá nhân của Người dùng cho bất kỳ tổ chức quảng cáo hoặc bên thứ ba nào vì mục đích thương mại.
2. **Bảo mật kênh truyền:** Toàn bộ luồng dữ liệu trao đổi giữa thiết bị của Người dùng và hệ thống máy chủ được bảo vệ bằng giao thức mã hóa đường truyền an toàn HTTPS (TLS 1.3). Mật khẩu của Người dùng được băm ở tầng máy chủ, Ban Quản trị không thể tiếp cận mật khẩu gốc.
3. **Cơ sở hạ tầng lưu trữ:** Tệp tin hình ảnh được lưu trữ trên hạ tầng lưu trữ đám mây chuyên dụng kết hợp mạng lưới phân phối nội dung (CDN) nhằm bảo đảm tốc độ truy xuất và tính sẵn sàng cao của hệ thống.

---

### Điều 14. Quyền của chủ thể dữ liệu đối với thông tin cá nhân
1. **Quyền chỉnh sửa dữ liệu:** Người dùng có quyền truy cập, tra cứu và hiệu chỉnh thông tin hồ sơ cá nhân tại giao diện Cài đặt vào bất kỳ thời điểm nào.
2. **Quyền thu hồi tác phẩm chờ duyệt:** Người dùng có quyền chủ động hủy bỏ tệp tin tác phẩm khi tác phẩm vẫn đang trong hàng đợi thẩm định và chưa được kiểm duyệt viên tiếp nhận xử lý.
3. **Quy chế xử lý dữ liệu khi xóa tài khoản:** Khi Người dùng gửi yêu cầu chấm dứt tài khoản, toàn bộ dữ liệu định danh cá nhân (địa chỉ email, mật khẩu, liên kết định danh...) sẽ bị xóa bỏ vĩnh viễn khỏi cơ sở dữ liệu xác thực. Theo thỏa thuận cấp phép sử dụng vĩnh viễn và không hủy ngang quy định tại Khoản 2 Điều 4 văn bản này, các tác phẩm hình ảnh và dữ liệu phương tiện đã được xuất bản sẽ tiếp tục được lưu trữ công khai nhằm bảo vệ tính toàn vẹn của kho dữ liệu lịch sử phục vụ cộng đồng; tên tác giả hiển thị sẽ được chuyển sang định danh "Người dùng ẩn danh" và dấu bản quyền đã tích hợp trên ảnh được giữ nguyên vẹn.

---

### Điều 15. Hiệu lực thi hành và sửa đổi quy chế
1. Ban Quản trị giữ quyền sửa đổi, bổ sung các điều khoản trong văn bản này nhằm bảo đảm sự phù hợp với định hướng phát triển kỹ thuật của nền tảng và các quy định pháp luật hiện hành.
2. Mọi nội dung điều chỉnh trọng yếu sẽ được công bố công khai trên trang chủ hoặc mục tin tức hệ thống tối thiểu 03 (ba) ngày trước thời điểm chính thức áp dụng. Việc Người dùng tiếp tục sử dụng hệ thống sau thời điểm điều chỉnh đồng nghĩa với việc chấp thuận toàn bộ nội dung sửa đổi đó.
