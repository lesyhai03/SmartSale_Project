# SmartSales Suite

Nền tảng vận hành bán hàng bằng React, TypeScript và Vite. Giao diện hỗ trợ tiếng Việt/Anh, có chế độ Demo và backend Live Node.js/SQLite.

## Chức năng chính

- **Vận hành:** Tổng quan, hộp thư, khách hàng, chăm sóc, đơn hàng và vận chuyển.
- **Quản trị:** báo cáo bán hàng/chăm sóc/nhân sự, tài khoản và phân quyền.
- **Kho & báo giá:** SKU, tồn kho, nhập/xuất/chuyển/kiểm kê và tạo báo giá PDF.
- **Phân tích thị trường:** nghiên cứu có nguồn dẫn bằng SerpAPI và Google Gemini khi đã cấu hình API.
- **Sản phẩm & báo cáo:** có một số chức năng nền; thuộc tính nâng cao và bộ tạo báo cáo còn đang phát triển.

Inbox và một số luồng Demo dùng dữ liệu mô phỏng; không nhập dữ liệu khách hàng thật. Tích hợp kênh bán hàng, thanh toán và vận chuyển thật chưa hoàn chỉnh. Xem [lộ trình và giới hạn](docs/IMPLEMENTATION_ROADMAP.md).

Hộp thư không tự đồng bộ theo chu kỳ. Tin nhắn mới chỉ được tải khi người dùng bấm **Đồng bộ** tại kết nối kênh hoặc tải lại trang.

## Tải và chạy Demo

1. Tải ZIP của dự án từ trang lưu mã nguồn, giải nén và mở thư mục bằng Terminal.
2. Cài [Node.js 22.12 trở lên](https://nodejs.org/) và npm.
3. Cài dependencies và tạo cấu hình local:

   ```powershell
   npm ci
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   ```

4. Mở `.env`, đặt `VITE_APP_MODE=demo`, rồi chạy:

   ```powershell
   npm run dev
   ```

5. Mở `http://127.0.0.1:5173`.

Demo lưu dữ liệu trong trình duyệt; có thể dùng **Cài đặt** để khôi phục dữ liệu mẫu.

## Chạy backend và AI thị trường

Đặt `VITE_APP_MODE=live` trong `.env`. Mở hai terminal trong thư mục dự án:

```powershell
# Terminal 1: API kho và phân tích thị trường
npm run server:inventory
```

```powershell
# Terminal 2: giao diện
npm run dev
```

Tạo tài khoản tại `/register`, đăng nhập bằng owner/admin. Trong **Cài đặt**, nhập và kiểm tra API key Gemini/SerpAPI hoặc bot token Telegram. Để lưu key mã hóa, tạo `INTEGRATION_ENCRYPTION_KEY` một lần trong `.env` bằng lệnh:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Khởi động lại API sau khi đổi `.env`. Có thể tiếp tục cấu hình khóa mặc định bằng `SERPAPI_API_KEY`, `GEMINI_API_KEY` và `TELEGRAM_BOT_TOKEN`. **Không chia sẻ hoặc đưa các key vào `VITE_*` hay source control.** Xem [hướng dẫn API và AI](docs/inventory-api.md).

Trong **Cài đặt → Sàn thương mại điện tử**, owner/admin có thể nhập API credentials và access token do Shopee, Lazada hoặc TikTok Shop cấp, kiểm tra API seller chỉ đọc, lưu mã hóa hoặc ngắt cấu hình. Luồng OAuth/callback, tự làm mới token và đồng bộ đơn hàng/sản phẩm chưa được triển khai; kiểm tra thành công không có nghĩa là dữ liệu sàn đã đồng bộ.

## Lệnh kiểm tra

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Tài liệu chi tiết: [API](docs/api-contract.md) · [kiến trúc](docs/architecture.md) · [hướng dẫn kho](docs/inventory-api.md) · [kịch bản Demo](docs/demo-walkthrough.md).
