# Kịch bản trình bày SmartSales Suite

## Chuẩn bị

Dùng Node 22, chạy `npm ci`, `npm run dev`, mở `http://127.0.0.1:5173`. Giữ `VITE_APP_MODE=demo`. Dữ liệu mẫu có 10 khách hàng, 15 hội thoại, 12 đơn, 7 vận đơn, 8 ticket và 6 sản phẩm. Chuyển VI/EN ở thanh trên cùng.

Nếu cần làm lại bài trình bày, **Cài đặt → Khôi phục dữ liệu vận hành Demo** trong CRM/Đơn hàng đặt lại đơn, kho, vận đơn, ticket và profile mở rộng, giữ liên hệ/hội thoại. Khôi phục Inbox chỉ đặt lại hội thoại mẫu và bản nháp; không xóa các khách đã tạo. Chỉ dùng dữ liệu tổng hợp.

## Khách hàng → đơn hàng → vận chuyển

1. Mở **Khách hàng**, tìm `mai anh` không dấu; kết hợp vòng đời, hạng và người phụ trách. Mở một hồ sơ để xem đơn, ticket, hội thoại và hoạt động liên quan.
2. Chọn **Thêm khách hàng**, nhập tên, số điện thoại/email duy nhất và địa chỉ đầy đủ. Lưu, thêm nhãn, ghi chú và phân công phụ trách. Email/điện thoại trùng sẽ bị từ chối và giữ nguyên form.
3. Từ hồ sơ chọn **Tạo đơn hàng**. Khách và địa chỉ được điền sẵn. Chọn sản phẩm còn hàng, số lượng, giảm giá/phí giao và COD; tạo đơn nháp. Đơn nháp chưa giữ kho.
4. Mở chi tiết đơn, **Xác nhận** để giữ kho, rồi **Đóng gói**. Tổng tiền tính bằng VND từ giá sản phẩm chuẩn. Có thể kiểm tra hủy một đơn khác để xác nhận kho được trả một lần.
5. Chọn **Tạo vận đơn**, dùng Demo Express (1 ngày) hoặc Demo Economy (3 ngày). Hiển thị rõ hãng Mock; không có kết nối hãng thật.
6. Mở vận đơn, mô phỏng **Đang giao**, rồi **Đã giao**. Timeline có sự kiện; đơn chuyển sang đã giao và COD Demo được ghi nhận đã thanh toán. Đây là sổ Demo, không có tiền được chuyển.
7. Quay lại hồ sơ khách để thấy đơn mới. Tải lại trang để kiểm tra lưu trữ. Với vận đơn khác, thử sự cố → giao lại hoặc hoàn hàng; hoàn hàng trả kho, hoàn tiền là bước riêng.

## Chăm sóc khách hàng

1. Từ hồ sơ hoặc đơn hàng, chọn **Tạo yêu cầu hỗ trợ**. Khách/đơn liên quan được điền sẵn. Nhập tiêu đề, mô tả, nhóm vấn đề, ưu tiên và người phụ trách.
2. Mở ticket mới, xem SLA ban đầu: Khẩn cấp 2 giờ, Cao 4 giờ, Bình thường 24 giờ, Thấp 48 giờ. Đổi ưu tiên không tự dời hạn; có thể chỉnh hạn có chủ đích.
3. Chuyển **Đang xử lý**, thêm ghi chú nội bộ. Nhập kết quả xử lý trước khi **Đã giải quyết**, sau đó đóng. Nếu cần, mở lại ticket theo chuyển trạng thái được cho phép.
4. Dùng liên kết quay về đơn, khách hoặc hội thoại. Service từ chối ticket gắn đơn/hội thoại thuộc khách khác.

## Inbox và hồ sơ thống nhất

Mở **Hộp thư**, lọc kênh/trạng thái/nhân viên, gửi phản hồi Demo rồi thêm Note. Sửa tên/email trong CRM và quay lại Inbox để thấy cùng hồ sơ đã cập nhật. AI là gợi ý mẫu theo quy tắc; mọi tin nhắn chỉ lưu trong trình duyệt.

## Nghiệm thu

Chạy `npm run lint`, `npm test`, `npm run build`, `npm run format:check`. Kiểm tra 1440px, laptop và mobile: mở/đóng chi tiết, bộ lọc, modal, bàn phím và thông báo lỗi. Computer Use trong phiên triển khai bị chặn vì không xác minh được URL, nên chưa xác nhận trực quan các kích thước này.

Backend, đăng nhập/phân quyền, tích hợp nhà cung cấp và đồng bộ thời gian thực chưa triển khai. Xem [kiến trúc](architecture.md), [API vận hành](operations-api.md) và [API Inbox](api-contract.md).
