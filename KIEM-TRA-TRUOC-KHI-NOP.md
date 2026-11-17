# Kiểm tra bộ code trước khi nộp

## Kiểm tra đã chạy trong môi trường tạo file

- `npm test` — 7/7 bài unit test đạt (giá, size/topping, tính tổng, badge, giỏ hàng).
- Parser TypeScript/TSX — 24/24 file không có lỗi cú pháp.
- `node --check next.config.mjs` — đã qua kiểm tra cú pháp.

## Kiểm tra nhóm phải thực hiện trên máy có kết nối npm

- `npm install` — chưa được thực hiện trong môi trường tạo file (không truy cập npm registry).
- `npm run typecheck` — cần cài dependencies trước.
- `npm run build` — cần cài dependencies trước.
- Chạy `npm run dev` và mở trình duyệt; kiểm tra Task 3, 4, 5, UI Task 9.
- Chuyển `NEXT_PUBLIC_DEMO_MODE=false`; kết nối NestJS thật rồi kiểm tra DTO, JWT, trạng thái, thanh toán và lịch sử.

**Không được coi unit test giá frontend hoặc dữ liệu demo là chứng minh hoàn thành toàn bộ Assignment 1 hoặc API backend.**
