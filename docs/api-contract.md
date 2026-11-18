# BrewLite A1 – API contract

> Người soạn: Duy (Task 2, 6, 10). Trạng thái: **v0.2 – đã cập nhật theo phản hồi của Tâm (18/11/2026)**. Mục 5 còn chờ chốt.
> Nhãn nguồn: **[Đề]** = BrewLite-CongNghePhanMem.pdf · **[FE]** = `INTEGRATION-BACKEND.md` trên nhánh `feature/phuc-frontend` · **[A2]** = repo CNPM · **[Tâm]** = Tâm đã đồng ý · **[Đề xuất]** = Duy đề xuất, chưa chốt.

## 1. Quy ước chung

- Base URL: `http://localhost:3001` (frontend gọi qua proxy `/api/backend/*`) **[FE]**. Cổng: chờ Đại chốt ở Task 1.
- JSON, tiền là **số nguyên VND** (ví dụ `45000`) **[Đề xuất]**.
- Lỗi theo format NestJS, lỗi nghiệp vụ thêm `code`:
  ```json
  { "statusCode": 409, "code": "OUT_OF_STOCK", "message": "...", "error": "Conflict" }
  ```

### 1.1 Xác thực **[Tâm]**

- JWT nằm trong **cookie HttpOnly** như A2. Frontend gọi qua proxy Next.js, proxy chuyển tiếp `Cookie`/`Set-Cookie`.
- Guard của route cần đăng nhập đọc JWT **từ cookie** (không đọc `Authorization`).
- **Tâm thông báo** cho Duy và Phúc: tên cookie, thời hạn JWT, cấu hình cookie khi chạy local (`Secure` tắt trên http), cách logout.
  Đề xuất tên `brewlite_a1_access_token` để trùng tên proxy FE đang dùng **[Đề xuất]**.
- Logout: frontend gọi `POST /auth/logout` của backend và xóa **đúng** cookie do backend đặt (lỗi đang có ở PR #1 của Phúc).

## 2. Endpoint

| Endpoint | Auth | Chủ | Nguồn |
|---|---|---|---|
| `GET /products` | Công khai | Duy | [Đề] mục 12.1, Task 2 |
| `GET /products/:id` | Công khai | Duy | [Đề] mục 12.1 |
| `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` | Công khai | Tâm | [Đề] Task 7 |
| `POST /orders` | Cookie JWT | Duy | [Đề] Task 6 |
| `POST /orders/:id/cancel` | Cookie JWT | Duy | [Tâm] cần endpoint hủy để hoàn kho; [A2] có sẵn |
| `POST /payments` | Cookie JWT + `Idempotency-Key` | Tâm (Duy idempotency) | [Đề] Task 8, 10 |
| `GET /orders/me` | Cookie JWT | Duy/Hoàng | [Đề] Task 9 |

Menu **công khai** **[Đề]** mục 5 (khác A2, A2 bắt đăng nhập trước).

### 2.1 `GET /products` (Task 2)

`200 OK`, mảng rỗng `[]` khi chưa có sản phẩm:

```json
[
  {
    "id": "8f0c…-uuid",
    "name": "Cappuccino",
    "description": "Espresso, sữa nóng, bọt sữa",
    "price": 45000,
    "imageUrl": "/img/cappuccino.svg",
    "stock": 30,
    "sizes": [ { "code": "S", "extra": 0 }, { "code": "M", "extra": 5000 }, { "code": "L", "extra": 10000 } ],
    "toppings": [ { "id": "…uuid", "name": "Trân châu", "price": 7000 } ]
  }
]
```

- Bắt buộc theo [Đề]: `id`, `name`, `price`, `imageUrl`, `stock`. `sizes`, `toppings`, `description`: [FE] cần cho Task 4.
- Chỉ trả món `isActive = true`; `imageUrl` có thể `null`. Code: `apps/api/src/products/product.mapper.ts`.

### 2.2 `GET /products/:id`

`200` cùng cấu trúc; `400` nếu `id` không phải UUID; `404` nếu không có hoặc đã ẩn.

### 2.3 `POST /orders` (Task 6)

Request **[FE]**:

```json
{
  "items": [ { "productId": "…uuid", "size": "M", "toppingIds": ["…uuid"], "qty": 2 } ],
  "couponCode": "GIAM10"
}
```

Validate (`apps/api/src/orders/dto/create-order.dto.ts`): `items` 1–20 · `productId` UUID · `size` S/M/L · `toppingIds` tùy chọn, UUID, không trùng, ≤ 5 · `qty` nguyên 1–20 · `couponCode` tùy chọn ≤ 32 ký tự. Trường lạ (ví dụ `price`, `total`) → `400`.

**Server tự tính giá** (`apps/api/src/orders/order-pricing.ts`):
`unitPrice = price + size.extra + Σ topping.price` · `lineTotal = unitPrice × qty` · `subtotal = Σ lineTotal` · `total = subtotal − discount` (mục 3.2).

**Trừ kho ngay khi tạo đơn** trong cùng transaction (mục 3.1) **[Tâm]**.

`201 Created`:

```json
{
  "id": "…uuid",
  "code": "BL-1042",
  "status": "PENDING",
  "subtotal": 123000,
  "discount": 12300,
  "total": 110700,
  "couponCode": "GIAM10",
  "expiresAt": "2026-11-18T08:15:00.000Z",
  "createdAt": "2026-11-18T08:00:00.000Z",
  "items": [
    { "productId": "…", "name": "Cappuccino", "size": "M", "toppings": [ { "id": "…", "name": "Kem sữa", "price": 9000 } ],
      "qty": 1, "unitPrice": 59000, "lineTotal": 59000 }
  ]
}
```

`total` có thể bằng `0` khi coupon giảm hết; FE phải hiển thị đúng số server trả, kể cả `0` **[Tâm]**.

| Mã | Khi nào |
|---|---|
| `400` | DTO sai; size hoặc topping không thuộc món; coupon không hợp lệ/hết hạn (`code: INVALID_COUPON`) |
| `401` | chưa đăng nhập [Đề Task 7] |
| `404` | `productId` không tồn tại hoặc đã ẩn |
| `409 OUT_OF_STOCK` | một món không đủ tồn → **rollback cả đơn**, trả danh sách món thiếu |
| `409 CONCURRENT_UPDATE` | hết số lần thử lại khi xung đột `version` (mục 3.1) |

### 2.4 `POST /orders/:id/cancel`

- Chỉ chủ đơn. Cho phép từ `PENDING`, `PAYMENT_FAILED`, `PAID` theo state machine (mục 4).
- Chuyển `CANCELLED` và **hoàn kho đúng một lần** (mục 3.1). Đơn `PAID` bị hủy: hoàn tiền mock và trừ lại điểm đã cộng **[Đề xuất]**, cần Tâm chốt.
- `200` trả đơn sau khi hủy · `404` không phải đơn của mình · `409 INVALID_TRANSITION`.

### 2.5 `POST /payments` (Task 8, Tâm chủ)

Header `Idempotency-Key: <uuid>` bắt buộc. Body:

```json
{ "orderId": "…uuid", "method": "WALLET", "simulateFailure": true }
```

- `simulateFailure` tùy chọn, **chỉ nhận khi backend bật chế độ mock** (biến môi trường, ví dụ `PAYMENT_MOCK_FAILURE_ENABLED=true` ở dev/test). Khi tắt, request có trường này → `400` **[Tâm]**.
- Số tiền **lấy từ `Order.total` trên server**, không nhận từ client **[Tâm]**.
- Mock xử lý **đồng bộ trong một transaction**: tạo `Payment` và đổi `Order.status` cùng lúc, nhất quán **[Tâm]**.
  - Thành công: `Payment SUCCEEDED`, đơn `PENDING → PAID`, cộng loyalty (mục 3.3).
  - Thất bại: `Payment FAILED`, đơn `PENDING → PAYMENT_FAILED`, **giữ kho**, không cộng điểm; FE giữ giỏ **[Đề] US-05**.
- Response: `{ "paymentId": "…", "orderId": "…", "status": "PAID" | "PAYMENT_FAILED", "total": 110700 }`.

**Idempotency và thử lại** **[Tâm]**:

| Tình huống | Client | Backend |
|---|---|---|
| Mất mạng, chưa biết kết quả | gửi lại **cùng key, cùng body** | kiểm người gọi là chủ đơn, rồi trả **đúng kết quả cũ**, không tạo payment mới [Đề Task 10 (b)] |
| Cùng key nhưng body khác (ví dụ đổi Ví → Thẻ) | — | `422 IDEMPOTENCY_KEY_REUSED` (so `requestHash`) |
| Đã nhận `PAYMENT_FAILED`, muốn thử lại | dùng **key mới** | đơn `PAYMENT_FAILED → PENDING → PAID` (hoặc lại `PAYMENT_FAILED`), không trừ thêm kho |
| Key khác nhưng đơn đã `PAID` | — | `409 ORDER_NOT_PAYABLE`; **không bao giờ có 2 payment SUCCEEDED cho một đơn** |
| Đơn đã hết hạn/hủy | — | `409 ORDER_NOT_PAYABLE` |

Chặn trả 2 lần bằng **cập nhật có điều kiện** `UPDATE orders SET status='PAID' … WHERE id=? AND status='PENDING'` trong transaction: chỉ 1 request thắng; thêm partial unique index `payments(order_id) WHERE status='SUCCEEDED'` làm chốt chặn ở DB **[Đề xuất]**.

### 2.6 `GET /orders/me` (Task 9)

`200`, đơn của người đăng nhập (lọc theo JWT), mới nhất trước, cùng dạng 2.3, thêm `method` nếu đã thanh toán.

## 3. Quy tắc nghiệp vụ (Task 10)

### 3.1 Tồn kho – transaction + optimistic locking **[Đề] Task 10.3, [Tâm]**

| Sự kiện | Xử lý kho |
|---|---|
| Tạo đơn `PENDING` | trừ kho trong **cùng transaction** với lưu đơn |
| Thanh toán thành công | giữ nguyên (không trừ thêm) |
| Thanh toán thất bại, cho thử lại | giữ phần kho của đơn trong thời gian chờ |
| Hủy đơn hoặc hết thời gian chờ | **hoàn kho đúng một lần** |
| Gửi lại yêu cầu thanh toán | không trừ thêm |

Cách trừ (mỗi sản phẩm, trong transaction):

```sql
UPDATE products SET stock = stock - :qty, version = version + 1
WHERE id = :id AND version = :versionĐãĐọc AND stock >= :qty
```

- 0 dòng bị đổi → đọc lại: hết hàng thì `409 OUT_OF_STOCK`; đổi `version` thì thử lại cả transaction tối đa 3 lần, quá thì `409 CONCURRENT_UPDATE`.
- Một món hết hàng → **rollback toàn bộ đơn** **[Tâm]**.
- Hoàn kho đúng một lần: chuyển trạng thái bằng `UPDATE orders SET status='CANCELLED' WHERE id=? AND status IN ('PENDING','PAYMENT_FAILED','PAID')`; chỉ khi đổi được 1 dòng mới cộng kho lại. `CANCELLED` là trạng thái kết thúc nên không hoàn lần hai.
- **Hết hạn**: đơn có `expiresAt` = lúc tạo + **15 phút** **[Đề xuất]**. Đơn `PENDING`/`PAYMENT_FAILED` quá hạn được hủy (hoàn kho) bởi job định kỳ, và kiểm lại ngay khi có request thanh toán đơn đó.

### 3.2 Coupon **[Đề] Task 10.4, Tâm chủ**

- Mỗi mã **đúng một kiểu giảm**: `percentOff` (1–100) **hoặc** `amountOff` (> 0), ràng buộc CHECK ở DB **[Tâm]**.
- Mã phải `isActive` và chưa quá `expiresAt`.
- `discount = floor(subtotal × percentOff / 100)` hoặc `min(amountOff, subtotal)`; làm tròn **xuống** đến đồng **[Đề xuất]**.
- `total = subtotal − discount ≥ 0` **[Tâm]**.

### 3.3 Loyalty **[Đề] Task 10.4, Tâm chủ**

- Cộng khi đơn chuyển sang `PAID`, **đúng một lần mỗi đơn**: ghi `Order.loyaltyPointsEarned` trong cùng transaction với `PENDING → PAID` **[Tâm]**.
- Công thức đề xuất: `floor(total / 10000)` điểm (1 điểm mỗi 10.000đ) **[Đề xuất]**, Tâm chốt.
- Hủy đơn `PAID`: trừ lại đúng `loyaltyPointsEarned` của đơn đó **[Đề xuất]**.

## 4. Order State Machine (Task 10.1, Duy)

Theo [Đề] mục 9.1. Code: `apps/api/src/orders/order-state.ts`. `assertTransition(from, to)` ném lỗi → `409 INVALID_TRANSITION`.

| Từ | Được phép sang |
|---|---|
| `PENDING` | `PAID`, `PAYMENT_FAILED`, `CANCELLED` |
| `PAYMENT_FAILED` | `PENDING` (thử lại), `CANCELLED` |
| `PAID` | `PREPARING`, `CANCELLED` |
| `PREPARING` | `READY` |
| `READY` | `COMPLETED` |
| `COMPLETED`, `CANCELLED` | (kết thúc) |

## 5. Còn chờ chốt

1. **Tâm:** tên cookie, thời hạn JWT, cấu hình cookie local; công thức loyalty; xử lý tiền/điểm khi hủy đơn `PAID`; tên biến môi trường bật `simulateFailure`.
2. **Tâm + Duy:** thời gian chờ 15 phút; job hết hạn chạy bao lâu một lần.
3. **Đại:** cổng backend, khung `apps/api`, Prisma + PostgreSQL.
4. **Phúc** (PR #1, theo góp ý của Tâm): logout gọi backend và xóa đúng cookie; `createOrder()` gửi `couponCode`; `payOrder()` gửi `simulateFailure` khi bật mock; giữ nguyên body (cả `method`) khi gửi lại cùng key sau lỗi mạng; dùng đúng `order.total` server trả, kể cả `0`.
