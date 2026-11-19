# BrewLite – Assignment 1: Frontend của Phúc

**Bộ mã nguồn này là dự án Next.js độc lập**, gồm Task 3, Task 4, Task 5 và phần **giao diện** Task 9 theo đề `BrewLite-CongNghePhanMem.pdf` (mục 8, 11, 12).

> **Tình trạng nguồn:** Chưa truy xuất trực tiếp được các file trong repository Assignment 2 tại thời điểm đóng gói. Vì vậy các file ở đây được viết mới dựa trên yêu cầu Assignment 1 và cấu trúc Next.js đã thảo luận, **không khẳng định là bản copy hoặc bản vá đúng 100% code của CNPM**. Khi nhóm có backend thật, cần đối chiếu DTO và trạng thái trước khi nghiệm thu.

## 1. Trong ZIP có gì?

```text
apps/web/
├── app/
│   ├── page.tsx                   # Task 3: Menu, loading/empty/error
│   ├── products/[id]/page.tsx     # Task 4: size, topping, giá
│   ├── cart/page.tsx              # Task 5: giỏ hàng
│   ├── login/, register/          # UI hỗ trợ luồng đặt hàng
│   ├── checkout/page.tsx          # UI checkout Task 9 (phụ thuộc backend)
│   ├── orders/page.tsx            # UI lịch sử Task 9
│   ├── orders/[id]/page.tsx       # UI xác nhận đơn Task 9
│   └── api/backend/[...path]/     # Proxy đến NestJS khi dùng API thật
├── components/                    # CartProvider, AuthProvider, Header, cards
├── lib/                           # pricing, normalize API, demoStore
├── public/img/                    # 7 hình SVG minh họa tự tạo
├── tests/                          # 7 unit tests logic frontend
├── package.json, tsconfig.json, next.config.mjs
└── .env.example
```

## 2. Đưa code vào repository Assignment 1 mới

Repository **đích**: https://github.com/nguyenmintam23-z/BrewLite-Assignmennt-1

Repository **tham khảo Assignment 2**: https://github.com/nguyenmintam23-z/CNPM

1. Tải ZIP này, chọn **Extract All**. Sau khi giải nén, tìm thư mục `apps/web`.
2. Clone repository **Assignment 1** (chỉ clone repo mới):

```powershell
git clone https://github.com/nguyenmintam23-z/BrewLite-Assignmennt-1.git
cd BrewLite-Assignmennt-1
git switch -c feature/phuc-frontend-a1
```

3. **Trước khi sao chép**, kiểm tra repository mới đã có `apps/web` do đồng đội đưa lên chưa. Nếu có, phải so sánh và ghép thay đổi, **không ghi đè tùy tiện**. Nếu chưa có, sao chép `apps/web` từ ZIP vào `apps/web` trong repo. Tạo `docs` rồi chép `README-PHUC.md` và `INTEGRATION-BACKEND.md` vào đó.
4. Trong VS Code, mở terminal tại thư mục web:

```powershell
cd apps/web
Copy-Item .env.example .env.local
npm install
npm test
npm run dev
```

5. Mở http://localhost:3000. Mặc định `.env.local` bật `NEXT_PUBLIC_DEMO_MODE=true`, nên bạn thử được **Menu → chi tiết → giỏ → login demo → thanh toán demo → xác nhận → lịch sử** mà không cần backend.
6. Khi hoàn tất thay đổi, chạy `npm run typecheck` và `npm run build` (cần `npm install` thành công).

```powershell
cd ../..
git status
git add apps/web docs
# Kiểm tra lại: KHÔNG đưa .env.local, node_modules, .next vào Git.
git commit -m "feat(web): Assignment 1 Phuc frontend tasks 3 4 5 9"
git push -u origin feature/phuc-frontend-a1
```

Tạo Pull Request vào `main` của **Assignment 1**, nhờ Đại/Hoàng kiểm tra và merge. **Tuyệt đối không push lên `CNPM` (Assignment 2).**

## 3. Dùng API NestJS thật (không lấy demo làm minh chứng)

Sau khi Duy và Tâm hoàn tất backend trong Assignment 1:

```dotenv
NEXT_PUBLIC_DEMO_MODE=false
API_UPSTREAM_URL=http://localhost:3001
```

- Dừng `npm run dev`, chạy lại để Next.js nhận biến môi trường.
- Dự kiến Next.js gọi proxy `/api/backend/*` để tránh CORS trực tiếp.
- **BẮT BUỘC ghép DTO** cho `POST /orders`, `POST /payments`, JWT cookie/bearer và các bảng size/topping trong API. Đọc `INTEGRATION-BACKEND.md`.
- Chỉ chụp màn hình minh chứng "API thật" khi Network chỉ ra yêu cầu backend đã chạy thành công, không dùng công tắc giả lập trên Menu.
- Đừng lưu token JWT, mật khẩu thật, hoặc file `.env.local` vào ảnh, commit hay tài liệu.

## 4. Phạm vi đã cài đặt và chưa cài đặt

| Phần | Tình trạng bộ code | Giới hạn |
|---|---|---|
| Task 3 | Menu có sản phẩm, skeleton loading, empty/error và thử lại | Mặc định demo; phải kiểm lại với NestJS thật |
| Task 4 | S/M/L, topping, số lượng, tính đơn giá/tạm tính | Giá frontend không thay thế tính giá backend |
| Task 5 | Context + localStorage, tăng/giảm/xóa, badge, tổng tiền | Không thay thế kiểm tra kho ở backend |
| Task 9 – UI | Checkout, thanh toán mô phỏng, xác nhận và lịch sử | Docker/README E2E, API và bàn giao do Đại/Hoàng/Tâm/Duy phụ trách |
| Task 7/8/6/10 – backend | **Không bao gồm** | Auth JWT, đơn thật, payment thật và quản lý kho do backend phụ trách |

**Lưu ý:** Nút đăng nhập trong DEMO chỉ tạo phiên UI theo email; không dùng JWT và không kiểm tra mật khẩu. Chế độ demo dùng `localStorage` để giữ giỏ và đơn hàng, không phải hệ thống sản xuất.

## 5. Minh chứng Phúc cần chụp

- **Task 3:** Menu có 6 món demo; empty; error; sau khi kết nối NestJS thật: ảnh Network `GET /products` thành công + Menu render đúng.
- **Task 4:** Ảnh cùng một món với size S, M, L và ít nhất 2 cấu hình topping; kèm phép tính đơn giá (ví dụ món demo 35.000 + M 5.000 + topping 7.000 + 9.000 = 56.000đ).
- **Task 5:** Trước/sau thêm 2 sản phẩm khác cấu hình, sửa số lượng, tổng tiền và badge, xóa sản phẩm.
- **Task 9 – frontend:** Ảnh thanh toán thành công, lỗi vẫn giữ giỏ, màn mã đơn `PAID`, danh sách lịch sử. Phân biệt rõ ảnh chế độ demo và tích hợp thật.

Chuyển Hoàng: URL PR, ảnh, kết quả `npm test`, `npm run build`, và mô tả nào là demo/API thật.
