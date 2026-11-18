/**
 * Order State Machine – Task 10.1, đề A1 mục 9.1.
 *
 * Logic thuần (không phụ thuộc NestJS/Prisma) để dùng chung cho mọi luồng đổi trạng thái:
 * tạo đơn, thanh toán, hủy, barista cập nhật. Service bắt `InvalidTransitionError`
 * và trả HTTP 409 với `code: "INVALID_TRANSITION"` (xem docs/api-contract.md mục 3).
 */

export const ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'PAYMENT_FAILED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Các chuyển tiếp được phép, đúng các mũi tên trong sơ đồ mục 9.1.
 * Cặp nào không có ở đây đều bị chặn. COMPLETED và CANCELLED là trạng thái kết thúc.
 */
export const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = Object.freeze({
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'], // thanh toán OK / thanh toán lỗi / hủy
  PAYMENT_FAILED: ['PENDING', 'CANCELLED'], // thử lại / hủy
  PAID: ['PREPARING', 'CANCELLED'], // barista nhận / hủy
  PREPARING: ['READY'], // pha xong
  READY: ['COMPLETED'], // giao khách
  COMPLETED: [],
  CANCELLED: [],
});

export class InvalidTransitionError extends Error {
  readonly code = 'INVALID_TRANSITION';

  constructor(
    readonly from: string,
    readonly to: string,
  ) {
    super(`Không thể chuyển đơn từ ${from} sang ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: string, to: string): boolean {
  return isOrderStatus(from) && isOrderStatus(to) && ORDER_TRANSITIONS[from].includes(to);
}

/** Ném `InvalidTransitionError` nếu `from → to` không có mũi tên trong sơ đồ. */
export function assertTransition(from: string, to: string): asserts to is OrderStatus {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to);
}

export function isTerminal(status: OrderStatus): boolean {
  return ORDER_TRANSITIONS[status].length === 0;
}
