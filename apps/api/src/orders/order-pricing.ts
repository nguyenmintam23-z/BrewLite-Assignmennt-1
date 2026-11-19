/**
 * Tính giá đơn ở server – Task 6 (đề A1: POST /orders), dùng lại cho minh chứng Task 4.
 *
 *   unitPrice = price + size.extra + Σ topping.price
 *   lineTotal = unitPrice × qty
 *   subtotal  = Σ lineTotal
 *
 * Không nhận giá từ client. Giảm giá (coupon) do Task 10.4 (Tâm) áp lên `subtotal` sau bước này.
 * Logic thuần: service tra sản phẩm từ DB, gọi `priceOrder`, bắt `PricingError` → HTTP 400/404.
 * Tiền là số nguyên VND (docs/api-contract.md mục 1).
 */
import type { ProductView, SizeCode } from '../products/product.mapper';

export interface OrderLineInput {
  productId: string;
  size: SizeCode;
  toppingIds?: string[];
  qty: number;
}

export interface PricedTopping {
  id: string;
  name: string;
  price: number;
}

export interface PricedLine {
  productId: string;
  name: string;
  size: SizeCode;
  sizeExtra: number;
  toppings: PricedTopping[];
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PricedOrder {
  items: PricedLine[];
  subtotal: number;
}

export type PricingErrorCode =
  | 'EMPTY_ORDER'
  | 'PRODUCT_NOT_FOUND'
  | 'INVALID_SIZE'
  | 'INVALID_TOPPING'
  | 'DUPLICATE_TOPPING'
  | 'INVALID_QTY'
  | 'AMOUNT_OVERFLOW';

/** PRODUCT_NOT_FOUND → 404, còn lại → 400 (contract mục 2.3). */
export class PricingError extends Error {
  constructor(
    readonly code: PricingErrorCode,
    message: string,
    readonly lineIndex?: number,
  ) {
    super(message);
    this.name = 'PricingError';
  }
}

function safeAmount(value: number, lineIndex?: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new PricingError('AMOUNT_OVERFLOW', 'Số tiền không hợp lệ', lineIndex);
  }
  return value;
}

/**
 * @param lines    giỏ hàng client gửi (đã qua CreateOrderDto)
 * @param products sản phẩm đang bán tra từ DB (chỉ isActive, đã map qua `toProductView`)
 */
export function priceOrder(lines: readonly OrderLineInput[], products: readonly ProductView[]): PricedOrder {
  if (!lines.length) throw new PricingError('EMPTY_ORDER', 'Đơn hàng phải có ít nhất 1 món');

  const byId = new Map(products.map((p) => [p.id, p]));
  let subtotal = 0;

  const items = lines.map((line, i): PricedLine => {
    if (!Number.isInteger(line.qty) || line.qty < 1) {
      throw new PricingError('INVALID_QTY', `Số lượng món thứ ${i + 1} không hợp lệ`, i);
    }

    const product = byId.get(line.productId);
    if (!product) throw new PricingError('PRODUCT_NOT_FOUND', `Không tìm thấy món thứ ${i + 1}`, i);

    const size = product.sizes.find((s) => s.code === line.size);
    if (!size) throw new PricingError('INVALID_SIZE', `${product.name} không có size ${line.size}`, i);

    const toppingIds = line.toppingIds ?? [];
    if (new Set(toppingIds).size !== toppingIds.length) {
      throw new PricingError('DUPLICATE_TOPPING', `Topping của ${product.name} bị trùng`, i);
    }
    const toppings = toppingIds.map((id) => {
      const t = product.toppings.find((x) => x.id === id);
      if (!t) throw new PricingError('INVALID_TOPPING', `Topping không áp dụng cho ${product.name}`, i);
      return { id: t.id, name: t.name, price: t.price };
    });

    const unitPrice = safeAmount(product.price + size.extra + toppings.reduce((s, t) => s + t.price, 0), i);
    const lineTotal = safeAmount(unitPrice * line.qty, i);
    subtotal = safeAmount(subtotal + lineTotal, i);

    return {
      productId: product.id,
      name: product.name,
      size: size.code,
      sizeExtra: size.extra,
      toppings,
      qty: line.qty,
      unitPrice,
      lineTotal,
    };
  });

  return { items, subtotal };
}

/** Gộp số lượng theo sản phẩm để kiểm/trừ tồn kho (Task 10.3). */
export function quantityByProduct(lines: readonly OrderLineInput[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const l of lines) out.set(l.productId, (out.get(l.productId) ?? 0) + l.qty);
  return out;
}
