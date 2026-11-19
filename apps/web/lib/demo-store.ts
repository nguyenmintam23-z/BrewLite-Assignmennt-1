"use client";
import type { CartItem, Order, PaymentMethod } from "./types";
import { cartTotal } from "./pricing";
import { demoProducts } from "./demo-data";
const STORAGE_KEY = "brewlite_a1_demo_orders_v1";

function read(): Order[] {
  if (typeof window === "undefined") return [];
  try { const v = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); return Array.isArray(v) ? v : []; }
  catch { return []; }
}
function write(orders: Order[]): void { if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); }
export function demoOrders(): Order[] { return read().sort((a,b) => b.createdAt.localeCompare(a.createdAt)); }
export function demoCreateOrder(items: CartItem[]): Order {
  if (!items.length) throw new Error("Giỏ hàng trống.");
  for (const item of items) {
    const product = demoProducts.find(p => p.id === item.productId);
    if (!product || item.quantity > (product.stock ?? Number.MAX_SAFE_INTEGER)) throw new Error("Sản phẩm không còn đủ số lượng.");
  }
  const id = globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}`;
  const order: Order = { id,code:`#${id.slice(0,8).toUpperCase()}`,status:"PENDING",total:cartTotal(items),items:structuredClone(items),createdAt:new Date().toISOString() };
  write([order,...read()]);
  return order;
}
export function demoPay(id: string, method: PaymentMethod, shouldFail: boolean): Order {
  const orders = read();
  const index = orders.findIndex(o => o.id === id);
  if (index < 0) throw new Error("Không tìm thấy đơn hàng demo.");
  const order = orders[index];
  const next: Order = {...order,method,status:shouldFail ? "PAYMENT_FAILED" : "PAID"};
  orders[index] = next;
  write(orders);
  return next;
}
