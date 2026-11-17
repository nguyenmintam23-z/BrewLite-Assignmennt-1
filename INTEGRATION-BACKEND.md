# Hướng dẫn ghép Frontend Phúc với Backend Assignment 1

## Nguồn đối chiếu

- **Đề Assignment 1**: `BrewLite-CongNghePhanMem.pdf`, mục 4–5, 8–12. API yêu cầu `GET /products`, `GET /products/:id`, `POST /orders`, `POST /payments`, `GET /orders/me`, `POST /auth/register`, `POST /auth/login`.
- **Assignment 2 tham khảo**: https://github.com/nguyenmintam23-z/CNPM/tree/main/apps/web và https://github.com/nguyenmintam23-z/CNPM/tree/main/apps/api. Chưa xác minh trực tiếp từng file mã nguồn trong lần đóng gói này.

## Bộ định tuyến hiện tại

| Trên giao diện | Khi demo | Khi có NestJS |
|---|---|---|
| Menu | `lib/demo-data.ts` | `GET /products` |
| Chi tiết | tìm theo id trong data demo | `GET /products/:id`, thử lại từ danh sách nếu 404/405 |
| Tạo đơn | `lib/demo-store.ts` | `POST /orders`, thử `POST /orders/checkout` khi 404/405 |
| Thanh toán | `demoPay` | `POST /payments` + header `Idempotency-Key` |
| Lịch sử | localStorage | `GET /orders/me`, thử `GET /orders` khi 404/405 |
| Đăng nhập | lưu email vào sessionStorage | `POST /auth/login` thông qua proxy Next.js |

Proxy `app/api/backend/[...path]/route.ts` chỉ gửi request tới `API_UPSTREAM_URL` mà người vận hành cấu hình. Không cho client quyết định máy chủ đích.

## Giả định request cần Duy/Tâm xác nhận

**Tạo đơn** (`lib/api.ts#createOrder`):

```json
{
  "items": [
    {"productId": 1, "size": "M", "toppingIds": ["cream"], "qty": 2}
  ]
}
```

**Thanh toán** (`lib/api.ts#payOrder`):

```json
{"orderId": "123", "method": "WALLET"}
```

Header: `Idempotency-Key: <UUID>` (giữ key qua lỗi mạng chưa rõ kết quả). Chỉ backend mới có quyền tính giá cuối cùng, khóa kho, kiểm idempotency và chuyển trạng thái.

Nếu DTO của backend khác (ví dụ `quantity` thay `qty`, `sizeId`, `toppingOptionIds`, `paymentMethod`, `orderId` số), **chỉnh lớp adapter `lib/api.ts`**, không chỉnh toàn bộ giao diện.

## Những điểm cần chốt trước khi quay demo E2E thật

1. **Đăng nhập:** A1 minh họa xem menu trước rồi login khi thanh toán, giao diện này làm theo A1. Nếu backend A2 bắt buộc login mới xem products, Duy/Tâm cần cho phép public menu (theo nhóm thống nhất) hoặc nhóm điều chỉnh và ghi chú phạm vi.
2. **JWT:** Proxy hỗ trợ phản hồi token trong JSON (`accessToken`, `access_token`, `token`) bằng cách đổi sang cookie `HttpOnly`, và forward cookie do NestJS đặt sẵn. Phần **logout token/cookie** phải xác nhận lại với Tâm trước khi nghiệm thu bảo mật.
3. **Size/topping:** Dữ liệu A1 tối thiểu chỉ yêu cầu id/name/price/image, nhưng Task 4 cần giá tùy chọn. Khi API không trả danh sách size, UI mặc định hiển thị S/M/L phụ thu 0 đồng để không bị lỗi, **không được coi là giá backend đúng**. Duy phải cấp option/price chính thức để test tích hợp.
4. **Trạng thái:** A1 yêu cầu `PENDING`, `PAID`, `PAYMENT_FAILED`. Frontend hỗ trợ hiển thị `CONFIRMED` (A2) như `PAID` để tương thích UI nhưng **không chứng minh** DB của A1 đã đúng State Machine.
5. **Thanh toán lỗi:** Frontend giữ nguyên giỏ nếu payment không thành công. Nếu API trả `PROCESSING` (ví dụ 202), UI **chưa tự polling**; cần chốt cơ chế xác nhận cuối với Tâm (refresh lịch sử hoặc bổ sung endpoint trạng thái).
6. **Lịch sử:** Backend phải lọc đúng người dùng dựa trên JWT; `sessionStorage` ở frontend chỉ dùng để hiển thị email, tuyệt đối không phải cơ chế bảo vệ API.
7. **Tích hợp thực:** Cần mở DevTools → Network, chứng minh request proxy `/api/backend/products` đã trả dữ liệu từ NestJS thật và chụp ảnh màn hình không có ribbon DEMO.
8. **Bảo mật dữ liệu:** Không commit `.env.local`, cookie, token, khóa bí mật. Không dùng dữ liệu thanh toán thật trong mock gateway.

## Phân chia trách nhiệm

- **Phúc:** kiểm thử UI Task 3–5, UI Task 9, adapter frontend sau khi Duy/Tâm thông báo DTO.
- **Duy:** contract GET products/details, POST orders, order status, giá server.
- **Tâm:** login/JWT, payment, trạng thái cuối, idempotency, CORS/cookie.
- **Đại:** chạy monorepo, cấu hình API upstream, tích hợp Docker/DB.
- **Hoàng:** test chéo, Scrum, chụp minh chứng và PR review.
