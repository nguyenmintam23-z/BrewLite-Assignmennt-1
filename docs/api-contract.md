# BrewLite A1 – API contract (bản nháp để nhóm chốt)

> Người soạn: Duy (Task 2, 6, 10). Trạng thái: **NHÁP**, chờ Tâm, Phúc, Đại xác nhận.
> Nhãn nguồn: **[Đề]** = BrewLite-CongNghePhanMem.pdf · **[FE]** = `INTEGRATION-BACKEND.md` trên nhánh `feature/phuc-frontend` · **[A2]** = repo CNPM · **[Đề xuất]** = Duy đề xuất, cần chốt.

## 1. Quy ước chung

- Base URL: `http://localhost:3001` (frontend gọi qua proxy `/api/backend/*`) **[FE]**. Cổng: chờ Đại chốt ở Task 1.
- JSON, tiền là **số nguyên VND** (ví dụ `45000`), không dùng chuỗi Decimal **[Đề xuất]**.
- Lỗi theo format mặc định NestJS **[Đề xuất]**:
  ```json
  { "statusCode": 400, "message": ["items must contain at least 1 elements"], "error": "Bad Request" }
  ```
  Lỗi nghiệp vụ thêm trường `code`, ví dụ `{"statusCode":409,"code":"OUT_OF_STOCK","message":"..."}`.
- Route cần đăng nhập: JWT qua cookie HttpOnly hoặc `Authorization: Bearer` (Tâm chốt). Proxy FE hỗ trợ cả hai **[FE]**.

## 2. Endpoint

| Endpoint | Auth | Chủ | Nguồn |
|---|---|---|---|
| `GET /products` | Công khai | Duy | [Đề] mục 12.1, Task 2 |
| `GET /products/:id` | Công khai | Duy | [Đề] mục 12.1 |
| `POST /auth/register`, `POST /auth/login` | Công khai | Tâm | [Đề] Task 7 |
| `POST /orders` | JWT | Duy | [Đề] Task 6 |
| `POST /payments` | JWT + `Idempotency-Key` | Tâm (Duy idempotency) | [Đề] Task 8, 10 |
| `GET /orders/me` | JWT | Duy/Hoàng | [Đề] Task 9 |

Menu **công khai, không cần đăng nhập**: [Đề] mục 5 (xem menu trước, đăng nhập khi thanh toán). Khác A2 (A2 bắt đăng nhập trước).

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
    "toppings": [ { "id": "…uuid", "name": "Trân châu", "price": 5000 } ]
  }
]
```

- Bắt buộc theo [Đề]: `id`, `name`, `price`, `imageUrl` (đề ghi "ảnh"), `stock` (thực thể Product mục 12.2).
- `sizes`, `toppings`, `description`: [FE] cần để tính giá Task 4 (`lib/types.ts`).
- Chỉ trả sản phẩm `isActive = true` **[Đề xuất]**.

### 2.2 `GET /products/:id`

- `200` cùng cấu trúc một phần tử ở trên.
- `400` nếu `id` không phải UUID, `404` nếu không có hoặc đã ẩn.

### 2.3 `POST /orders` (Task 6)

Request **[FE]** (`lib/api.ts#createOrder`):

```json
{
  "items": [ { "productId": "…uuid", "size": "M", "toppingIds": ["…uuid"], "qty": 2 } ],
  "couponCode": "GIAM10"
}
```

Validate bằng class-validator **[Đề]**:

| Trường | Ràng buộc |
|---|---|
| `items` | mảng, 1–20 phần tử |
| `productId` | UUID |
| `size` | `S` \| `M` \| `L` |
| `toppingIds` | không bắt buộc, mảng UUID không trùng, tối đa 5 |
| `qty` | số nguyên 1–20 |
| `couponCode` | không bắt buộc, chuỗi ≤ 32 ký tự (Task 10, Tâm) |

Trường lạ bị từ chối (`whitelist` + `forbidNonWhitelisted`) **[Đề xuất]**.

**Server tự tính giá**, không nhận giá từ client **[FE]**:
`unitPrice = price + size.extra + Σ topping.price`, `lineTotal = unitPrice × qty`, `total = Σ lineTotal − giảm giá`.

`201 Created`:

```json
{
  "id": "…uuid",
  "code": "BL-1042",
  "status": "PENDING",
  "total": 123000,
  "createdAt": "2026-11-18T08:00:00.000Z",
  "items": [
    { "productId": "…", "name": "Cappuccino", "size": "M", "toppings": [ { "id": "…", "name": "Kem", "price": 5000 } ],
      "qty": 1, "unitPrice": 55000, "lineTotal": 55000 }
  ]
}
```

| Mã | Khi nào |
|---|---|
| `400` | DTO sai; size hoặc topping không thuộc sản phẩm |
| `401` | chưa đăng nhập [Đề Task 7: guard bảo vệ route đặt đơn] |
| `404` | `productId` không tồn tại hoặc đã ẩn |
| `409 OUT_OF_STOCK` | không đủ tồn kho (Task 10, optimistic locking) |

Trạng thái khởi tạo là `PENDING` **[Đề]** (A2 dùng `PENDING_PAYMENT` → A1 đổi tên).
Đường dẫn `POST /orders` **[Đề]** (A2 dùng `/orders/checkout`; FE chỉ gọi lại đường cũ khi 404/405).

### 2.4 `POST /payments` (Task 8, Tâm chốt)

Header `Idempotency-Key: <uuid>` bắt buộc **[Đề] Task 10, [FE]**. Body `{ "orderId": "…", "method": "WALLET" | "CARD" }`.

- Thành công: đơn `PENDING → PAID`; lỗi: `PENDING → PAYMENT_FAILED`, giỏ hàng giữ nguyên ở FE **[Đề] US-05**.
- Gửi lại cùng key: trả **đúng kết quả lần đầu**, không tạo payment mới **[Đề] Task 10 (b)**.
- Cùng key nhưng body khác: `422` **[Đề xuất]**.
- Response đề xuất: `{ "paymentId": "…", "orderId": "…", "status": "PAID" | "PAYMENT_FAILED" }`.
- **Cần Tâm chốt:** cách mock ra lỗi để demo (ví dụ field `simulateFailure: true` chỉ bật ở môi trường dev).

### 2.5 `GET /orders/me` (Task 9)

`200`, mảng đơn của người đang đăng nhập (lọc theo JWT), mới nhất trước, mỗi phần tử cùng dạng response 2.3 (thêm `method` nếu đã thanh toán).

## 3. Order State Machine (Task 10, Duy)

Theo [Đề] mục 9.1. Hàm `assertTransition(from, to)` ném `409 INVALID_TRANSITION` cho mọi cặp không có trong bảng.

| Từ | Được phép sang |
|---|---|
| `PENDING` | `PAID`, `PAYMENT_FAILED`, `CANCELLED` |
| `PAYMENT_FAILED` | `PENDING` (thử lại), `CANCELLED` |
| `PAID` | `PREPARING`, `CANCELLED` |
| `PREPARING` | `READY` |
| `READY` | `COMPLETED` |
| `COMPLETED`, `CANCELLED` | (kết thúc) |

Cộng điểm loyalty chỉ khi đơn vào `PAID` **[Đề] Task 10.4** (Tâm).

## 4. Việc cần chốt

1. Tâm: JWT cookie hay Bearer; mock lỗi thanh toán; response `/payments`.
2. Tâm + Duy: trừ tồn kho lúc tạo đơn (`PENDING`) và hoàn lại khi `CANCELLED` **[Đề xuất]**, hay trừ lúc `PAID`.
3. Đại: cổng backend, cấu trúc `apps/api`, Prisma + PostgreSQL.
4. Phúc: đổi adapter nếu có khác (ví dụ `code` thay vì `id` để hiển thị mã đơn).
