/**
 * Task 10 – tiêu chí chấm (a): chặn được chuyển trạng thái sai (đề A1 mục 9, 9.1).
 */
import {
  InvalidTransitionError,
  ORDER_STATUSES,
  OrderStatus,
  assertTransition,
  canTransition,
  isTerminal,
} from './order-state';

// Bảng chép tay độc lập từ sơ đồ mục 9.1 để test không tự lặp lại code.
const ALLOWED: ReadonlyArray<[OrderStatus, OrderStatus]> = [
  ['PENDING', 'PAID'],
  ['PENDING', 'PAYMENT_FAILED'],
  ['PENDING', 'CANCELLED'],
  ['PAYMENT_FAILED', 'PENDING'],
  ['PAYMENT_FAILED', 'CANCELLED'],
  ['PAID', 'PREPARING'],
  ['PAID', 'CANCELLED'],
  ['PREPARING', 'READY'],
  ['READY', 'COMPLETED'],
];

const key = (from: string, to: string) => `${from}->${to}`;
const allowedKeys = new Set(ALLOWED.map(([f, t]) => key(f, t)));
const ALL_PAIRS = ORDER_STATUSES.flatMap((from) => ORDER_STATUSES.map((to) => [from, to] as const));
const REJECTED = ALL_PAIRS.filter(([f, t]) => !allowedKeys.has(key(f, t)));

describe('Order State Machine – assertTransition', () => {
  it('có đủ 7 trạng thái theo đề', () => {
    expect([...ORDER_STATUSES].sort()).toEqual(
      ['CANCELLED', 'COMPLETED', 'PAID', 'PAYMENT_FAILED', 'PENDING', 'PREPARING', 'READY'],
    );
  });

  it.each(ALLOWED)('cho phép %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
    expect(() => assertTransition(from, to)).not.toThrow();
  });

  it(`chặn toàn bộ ${49 - ALLOWED.length} cặp còn lại`, () => {
    expect(REJECTED).toHaveLength(49 - ALLOWED.length);
    for (const [from, to] of REJECTED) {
      expect(canTransition(from, to)).toBe(false);
      expect(() => assertTransition(from, to)).toThrow(InvalidTransitionError);
    }
  });

  it.each([
    ['PENDING', 'READY', 'nhảy bước khi chưa thanh toán'],
    ['PAID', 'COMPLETED', 'bỏ qua PREPARING và READY'],
    ['READY', 'PREPARING', 'đi lùi'],
    ['PAYMENT_FAILED', 'PAID', 'lỗi thanh toán phải thử lại qua PENDING'],
    ['PREPARING', 'CANCELLED', 'hủy khi đang pha'],
    ['COMPLETED', 'CANCELLED', 'hủy đơn đã hoàn tất'],
    ['CANCELLED', 'PENDING', 'mở lại đơn đã hủy'],
    ['PENDING', 'PENDING', 'giữ nguyên trạng thái'],
  ])('chặn %s → %s (%s)', (from, to) => {
    expect(() => assertTransition(from, to)).toThrow(InvalidTransitionError);
  });

  it('lỗi mang code INVALID_TRANSITION và from/to để trả HTTP 409', () => {
    let err: unknown;
    try {
      assertTransition('COMPLETED', 'PAID');
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(InvalidTransitionError);
    expect(err).toMatchObject({ code: 'INVALID_TRANSITION', from: 'COMPLETED', to: 'PAID' });
  });

  it('chặn trạng thái không tồn tại (dữ liệu lạ từ client/DB)', () => {
    expect(() => assertTransition('PENDING', 'SHIPPED')).toThrow(InvalidTransitionError);
    expect(() => assertTransition('PENDING_PAYMENT', 'PAID')).toThrow(InvalidTransitionError);
    expect(canTransition('', 'PAID')).toBe(false);
  });

  it('luồng thành công đi hết PENDING → COMPLETED', () => {
    const happy: OrderStatus[] = ['PENDING', 'PAID', 'PREPARING', 'READY', 'COMPLETED'];
    for (let i = 1; i < happy.length; i++) {
      expect(() => assertTransition(happy[i - 1], happy[i])).not.toThrow();
    }
  });

  it('thanh toán lỗi rồi thử lại thành công', () => {
    const path: OrderStatus[] = ['PENDING', 'PAYMENT_FAILED', 'PENDING', 'PAID'];
    for (let i = 1; i < path.length; i++) {
      expect(() => assertTransition(path[i - 1], path[i])).not.toThrow();
    }
  });

  it('chỉ COMPLETED và CANCELLED là trạng thái kết thúc', () => {
    expect(ORDER_STATUSES.filter(isTerminal).sort()).toEqual(['CANCELLED', 'COMPLETED']);
  });
});
