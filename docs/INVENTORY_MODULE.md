# Giai đoạn 1 — Quản lý kho

## Mục tiêu và phạm vi

Xây nền dữ liệu kho thực sự độc lập ngành hàng: nhiều kho/vị trí, SKU, nhà cung cấp, chứng từ, tồn thực tế/khả dụng/giữ chỗ/chờ nhập/lỗi/bảo hành/điều chuyển, ledger, kiểm kê, serial, audit và quyền. Ưu tiên tính đúng giao dịch trước các màn nâng cao. Danh sách kết quả thực thi và giới hạn sẽ cập nhật sau kiểm thử; không đồng nghĩa mọi nghiệp vụ thương mại đã nghiệm thu.

## Schema

Theo DATABASE_DESIGN.md và migration SQL trong server/migrations. Các bảng tồn là projection có kiểm soát của nghiệp vụ đã ghi sổ. Không nhận PATCH số lượng tồn. Chi phí nhập và giá vốn khác giá bán; giá trị chưa biết phải thể hiện thiếu dữ liệu.

## API specification

Base `/api/v1/inventory`. Tài khoản nhân viên và cookie phiên xác định tenant/người thao tác; không yêu cầu nhân viên dùng mã truy cập riêng. `GET /snapshot` trả dữ liệu kho được phân quyền. `POST /commands` nhận `{action,input}` và header `Idempotency-Key` cho mọi mutation. Nhóm command: warehouse/location/supplier/sku/config; document.create/approve/post/cancel; reservation.create/release; count.create/record/approve; warranty.create/transition. Action không hỗ trợ bị từ chối, không silent success. Các field chi tiết và ví dụ triển khai bổ sung trong docs/inventory-api.md.

Lỗi JSON `{error:{code,message}}`; 400 validation, 401 chưa xác thực, 403 quyền/module tắt, 404 không tìm thấy trong tenant, 409 xung đột version/trạng thái/idempotency/tồn, 413 body lớn. Pagination/retention cần hoàn thiện trước lượng dữ liệu lớn.

## Business logic

- Draft không đổi tồn. Approval kiểm tra quyền; posting kiểm lại tồn và version trong transaction. Draft/approved có thể hủy; posted phải bù bằng chứng từ mới.
- Receipt tăng tồn và giá trị theo chi phí thực nhận. Issue giảm khả dụng, không vượt tồn khi cấu hình không cho phép. Không dùng giá bán làm giá vốn.
- Transfer có xuất nguồn và nhận đích riêng; theo dõi lượng đang đi, không đồng thời tính vào hai kho.
- Reservation giữ khả dụng nhưng không làm giảm onHand. Release có chứng từ/audit và không trả hai lần.
- Kiểm kê lưu snapshot/version; nếu phát sinh giao dịch sau khi đếm phải đối soát lại, không overwrite số mới. Chênh lệch được ghi bằng adjustment đã duyệt.
- Serial bắt buộc nếu SKU bật theo dõi; mỗi serial chỉ có một vị trí/trạng thái hợp lệ. Không nhận serial trùng hoặc serial sản phẩm khác.
- Bảo hành cần lịch sử trạng thái và chuyển nhóm tồn có audit. Bảo hành khách ngoài kho không được tự tăng tồn bán được. Quy trình thay mới/trả khách cần chứng từ tương ứng.
- Dashboard chỉ dùng số thực tế, phép tính rõ ràng và thời gian lọc rõ nghĩa. Gợi ý nhập/điều chuyển là quy tắc minh bạch, không giả danh AI.

## Phân quyền

Chủ doanh nghiệp/quản trị viên tạo tài khoản nhân viên tại **Quản trị → Tài khoản & phân quyền** (`/admin/team`). Khu quản trị có các trang theo dõi riêng tại `/admin`, `/admin/sales`, `/admin/care` và `/admin/work`; những trang này không hiển thị thao tác tuyến đầu. Vai trò `receiver` (Nhân viên kho) mặc định được thêm/sửa SKU và lập/duyệt/ghi sổ phiếu nhập hoặc chuyển kho; không được xuất/điều chỉnh tồn hay cấu hình kho. Owner/admin có thể đặt lại mật khẩu, xem lịch sử đăng nhập và tùy chỉnh quyền thao tác của từng nhân viên. Menu và route nghiệp vụ được lọc theo quyền phiên; API tiếp tục kiểm tra quyền ở server. Thay đổi vai trò/quyền thu hồi phiên cũ. Không lấy role/tenant do client tự khai. Phân quyền truy cập từng kho và quản lý vai trò tùy chỉnh vẫn chưa triển khai.

## Test cases và acceptance criteria

1. Nhập → duyệt → ghi sổ đúng một lần, lượng/giá trị/ledger/audit khớp; replay không tăng tồn.
2. Hai yêu cầu xuất cạnh tranh không làm âm khả dụng; lỗi dòng cuối rollback toàn chứng từ.
3. Giữ chỗ và hàng không bán được giảm available; không trừ onHand hai lần.
4. Xuất chuyển → transit → nhận đích giữ tổng lượng và giá trị; không nhận hai lần.
5. Kiểm kê ghi adjustment, phát hiện snapshot stale; không chỉnh balance trực tiếp.
6. Tenant B không đọc/tham chiếu/sửa ID tenant A; viewer không ghi, receiver không duyệt trái quyền.
7. Payload sai/field lạ/số lẻ/số không an toàn/idempotency reused bị từ chối.
8. Serial trùng, thiếu, sai SKU/trạng thái bị từ chối; bảo hành/đổi trả không nhân đôi tồn.
9. Database mở lại giữ dữ liệu; migration lặp an toàn; rollback lỗi không có audit thành công giả.
10. UI desktop 1440px/mobile, Tab/Escape, loading, thành công/lỗi; API mất kết nối không fallback Demo.

Nghiệm thu yêu cầu tests, lint, typecheck, build và rà soát thực tế. Chỉ sang Giai đoạn 2 sau khi người dùng nghiệm thu.

## Kết quả thực thi và phần còn thiếu

Đã có server Node/SQLite và migrations, đăng ký doanh nghiệp/tài khoản chủ, đăng nhập email/mật khẩu, tự đổi mật khẩu sau khi xác minh mật khẩu hiện tại, tạo/khóa tài khoản nhân viên, cookie phiên HttpOnly, role presets, quyền thao tác tùy chỉnh theo nhân viên, lịch sử đăng nhập và thu hồi phiên. Đổi mật khẩu cập nhật hash, thu hồi phiên cũ và cấp cookie mới cho phiên hiện tại. `/inventory` và `/products` yêu cầu phiên hợp lệ; nếu chưa đăng nhập, UI chuyển tới `/login` và quay về trang đã yêu cầu sau đăng nhập/đăng ký. Giao diện không yêu cầu token truy cập riêng; CLI cấp token vẫn dành cho vận hành/API cũ. Vai trò receiver mặc định cho phép quản lý sản phẩm và nhập/chuyển kho; server kiểm tra quyền thao tác. API thực thi nhiều kho/vị trí, nhà cung cấp, SKU tối thiểu, draft/approve/post/cancel, nhập/xuất/điều chỉnh/chuyển xuất và nhận riêng, giữ/giải phóng, kiểm kê có phát hiện stale, serial và hàng trả gắn nguồn xuất/giá vốn, hồ sơ bảo hành và phân loại lỗi/bảo hành, immutable ledger/audit, idempotency. Dashboard và quy tắc gợi ý tính từ toàn ledger; UI không fallback Demo.

Chưa hoàn tất toàn bộ tiêu chí Giai đoạn 1: `/orders` và Inbox tạo đơn bán qua API kho với giá server-side; đơn chưa lưu thông tin thanh toán/vận đơn như adapter Orders Demo cũ. Chưa phân trang tất cả danh sách; chưa có quản lý lô/batch/IMEI/barcode scanner/QR, công nợ/đánh giá/giá nhà cung cấp theo lịch sử, purchase order và phần nhập một phần/chi phí phụ phân bổ, phân công kiểm kê theo khu vực, thời hạn bảo hành/thay mới/thanh lý và workflow tùy biến hoàn chỉnh. Chứng từ có reference, nhưng chưa phải liên kết kế toán/PO đầy đủ. Negative stock luôn bị chặn; chưa có tùy chọn bật âm kho. Phân quyền hiện là role presets, chưa phải permission editor theo doanh nghiệp.

Không tuyên bố sẵn sàng bán production hoặc đã nghiệm thu. SQLite chỉ một máy chủ bền vững; enterprise identity/SSO, backup/restore diễn tập, quan sát vận hành, retention, load test và triển khai quy mô lớn vẫn là gate tiếp theo của Giai đoạn 1. Browser/Windows UI tool chưa truy cập thành công nên chưa có manual visual QA desktop/narrow hoặc screenshot; automated component tests không thay thế kiểm tra này.
