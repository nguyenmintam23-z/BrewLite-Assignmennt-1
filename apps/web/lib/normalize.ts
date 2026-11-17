import type { Order, OrderStatus, PaymentMethod, Product, SizeCode, SizeOption, Topping, CartItem } from "./types";
import { asMoney } from "./pricing";

const obj = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
const arr = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const str = (value: unknown, fallback = ""): string => (typeof value === "string" || typeof value === "number") ? String(value) : fallback;

export function unwrapList(value: unknown, names: string[] = ["items", "products", "orders", "data"]): unknown[] {
  if (Array.isArray(value)) return value;
  const record = obj(value);
  for (const name of names) {
    const field = record[name];
    if (Array.isArray(field)) return field;
    const nested = obj(field);
    if (Array.isArray(nested.items)) return nested.items;
  }
  return [];
}

export function normalizeProduct(value: unknown): Product {
  const p = obj(value);
  const rawSizes = arr(p.sizes ?? p.sizeOptions);
  const sizes: SizeOption[] = rawSizes.map(v => {
    const s = obj(v);
    const code = str(s.code ?? s.name ?? s.size).toUpperCase();
    if (code !== "S" && code !== "M" && code !== "L") return null;
    return {code:code as SizeCode, extra:asMoney(s.extra ?? s.extraPrice ?? s.priceDelta ?? s.priceAdjustment ?? 0)};
  }).filter((v): v is SizeOption => v !== null);
  // Nếu API không gửi size, hiển thị S/M/L không phụ thu; cần backend xác nhận giá thực tế.
  const usableSizes = sizes.length ? sizes : (["S", "M", "L"] as const).map(code => ({code, extra:0}));
  const rawToppings = arr(p.toppings ?? p.toppingOptions);
  const toppings: Topping[] = rawToppings.map(v => {
    const t = obj(v);
    return { id:str(t.id), name:str(t.name, "Topping"), price:asMoney(t.price ?? t.extraPrice ?? 0) };
  }).filter(t => t.id !== "");
  const stockNumber = p.stock ?? p.stockQuantity;
  return {
    id:str(p.id), name:str(p.name, "Đồ uống"),
    description:str(p.description, "Chọn kích cỡ và topping theo ý thích."),
    price:asMoney(p.price ?? p.basePrice),
    imageUrl:str(p.imageUrl ?? p.image ?? p.image_url, "/img/placeholder.svg"),
    category:str(p.category, "Đồ uống"),
    stock:stockNumber === undefined || stockNumber === null ? null : Math.max(0, Number(stockNumber) || 0),
    sizes:usableSizes, toppings,
  };
}

export function normalizeStatus(raw: unknown): OrderStatus {
  switch (str(raw).toUpperCase()) {
    case "PAID": case "SUCCEEDED": case "SUCCESS": case "CONFIRMED": return "PAID";
    case "FAILED": case "PAYMENT_FAILED": return "PAYMENT_FAILED";
    case "PROCESSING": return "PROCESSING";
    case "PREPARING": return "PREPARING";
    case "READY": return "READY";
    case "COMPLETED": return "COMPLETED";
    case "CANCELLED": return "CANCELLED";
    default: return "PENDING";
  }
}

export function normalizeOrder(raw: unknown, fallbackItems: CartItem[] = []): Order {
  const order = obj(obj(raw).order ?? raw);
  const value = obj(raw);
  const id = str(order.id ?? order.orderId ?? value.orderId);
  if (!id) throw new Error("API không trả về mã định danh đơn hàng.");
  const status = normalizeStatus(order.status ?? value.status ?? "PENDING");
  return {
    id, code:str(order.code ?? order.orderCode ?? order.orderNumber, `#${id}`), status,
    total:asMoney(order.total ?? order.totalAmount ?? value.total ?? 0),
    items:Array.isArray(order.items) ? (order.items as CartItem[]) : fallbackItems,
    createdAt:str(order.createdAt, new Date().toISOString()),
    method: str(order.method) === "CARD" ? "CARD" : str(order.method) === "WALLET" ? "WALLET" : undefined,
  };
}
export function normalizePaymentStatus(raw: unknown): OrderStatus {
  const body = obj(raw);
  const nestedPayment = obj(body.payment);
  const nestedOrder = obj(body.order);
  return normalizeStatus(nestedOrder.status ?? nestedPayment.status ?? body.status ?? "PENDING");
}
export function toBackendProductId(id: string): string | number {
  return /^\d+$/.test(id) ? Number(id) : id;
}
