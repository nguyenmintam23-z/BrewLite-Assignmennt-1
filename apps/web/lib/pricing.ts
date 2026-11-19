import type { CartItem, Product, SizeCode, Topping } from "./types";

// Giá trên frontend chỉ để hiển thị. Backend PHẢI tự tính lại giá khi đặt đơn.
export function asMoney(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}
export function formatVnd(value: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}
export function unitPrice(item: CartItem): number {
  return asMoney(item.basePrice) + asMoney(item.sizeExtra) + item.toppings.reduce((sum, x) => sum + asMoney(x.price), 0);
}
export function lineTotal(item: CartItem): number {
  return unitPrice(item) * Math.max(0, Math.trunc(item.quantity));
}
export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}
export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + Math.max(0, Math.trunc(item.quantity)), 0);
}
export function cartKey(productId: string, size: SizeCode, toppings: Topping[]): string {
  return [productId, size, [...toppings].map(t => t.id).sort().join(",")].join("::");
}
export function makeItem(product: Product, size: SizeCode, toppingIds: string[], quantity = 1): CartItem {
  const choice = product.sizes.find(x => x.code === size);
  if (!choice) throw new Error("Kích cỡ không hợp lệ cho sản phẩm này.");
  const chosen = product.toppings.filter(t => toppingIds.includes(t.id));
  return {
    key: cartKey(product.id, size, chosen), productId: product.id,
    name: product.name, imageUrl: product.imageUrl, basePrice: product.price,
    size, sizeExtra: choice.extra, toppings: chosen,
    quantity: Math.max(1, Math.trunc(quantity)),
  };
}
