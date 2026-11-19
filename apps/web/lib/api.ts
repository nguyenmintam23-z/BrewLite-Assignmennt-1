"use client";
import type { CartItem, Order, PaymentMethod, Product, User } from "./types";
import { demoProducts } from "./demo-data";
import { demoCreateOrder, demoOrders, demoPay } from "./demo-store";
import { normalizeOrder, normalizePaymentStatus, normalizeProduct, toBackendProductId, unwrapList } from "./normalize";

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = "ApiError"; }
}
async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(`/api/backend${path}`, {
    ...init, credentials:"include", cache:"no-store",
    headers: { ...(init.body ? {"Content-Type":"application/json"} : {}), ...init.headers },
  });
  const bodyText = await response.text();
  let data: unknown = null;
  try { data = bodyText ? JSON.parse(bodyText) : null; } catch { data = bodyText; }
  if (!response.ok) {
    if (
      response.status === 401 &&
      !["/auth/login", "/auth/register", "/auth/logout"].includes(path) &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new Event("brewlite:unauthorized"));
    }
    const errorData = data && typeof data === "object" ? data as Record<string, unknown> : {};
    const raw = errorData.message;
    const message = Array.isArray(raw) ? raw.join("; ") : typeof raw === "string" ? raw : `Lỗi HTTP ${response.status}`;
    throw new ApiError(response.status, message);
  }
  return data;
}
const json = (body: unknown) => ({method:"POST",body:JSON.stringify(body)});
const fallbackAllowed = (e: unknown) => e instanceof ApiError && (e.status === 404 || e.status === 405);

function authUser(raw: unknown): User {
  const value = raw && typeof raw === "object" && "user" in raw
    ? (raw as Record<string, unknown>).user
    : raw;
  if (!value || typeof value !== "object") throw new Error("Phản hồi xác thực không hợp lệ.");
  const record=value as Record<string, unknown>;
  if(typeof record.email!=="string"||!record.email)throw new Error("Phản hồi xác thực thiếu email.");
  return {
    ...(typeof record.id==="string"?{id:record.id}:{}),
    email:record.email,
    ...(typeof record.loyaltyPoints==="number"?{loyaltyPoints:record.loyaltyPoints}:{}),
    ...(typeof record.createdAt==="string"?{createdAt:record.createdAt}:{}),
  };
}

export async function getProducts(): Promise<Product[]> {
  if (DEMO_MODE) return demoProducts;
  return unwrapList(await request("/products")).map(normalizeProduct).filter(p => p.id);
}
export async function getProduct(id: string): Promise<Product | null> {
  if (DEMO_MODE) return demoProducts.find(p => p.id === id) ?? null;
  try {
    const raw = await request(`/products/${encodeURIComponent(id)}`);
    const body = raw && typeof raw === "object" && "data" in raw ? (raw as Record<string, unknown>).data : raw;
    return normalizeProduct(body);
  } catch (e) {
    if (!fallbackAllowed(e)) throw e;
    return (await getProducts()).find(p => p.id === id) ?? null;
  }
}
export async function register(email: string, password: string): Promise<User> {
  if (DEMO_MODE) return {email};
  return authUser(await request("/auth/register",json({email,password})));
}
export async function login(email: string, password: string): Promise<User> {
  if (DEMO_MODE) return {email};
  return authUser(await request("/auth/login",json({email,password})));
}
export async function getCurrentUser(): Promise<User> {
  if (DEMO_MODE) return {email:""};
  return authUser(await request("/auth/me"));
}
export async function logout(): Promise<void> {
  if (DEMO_MODE) return;
  await request("/auth/logout",{method:"POST"});
}
export async function createOrder(items: CartItem[]): Promise<Order> {
  if (DEMO_MODE) return demoCreateOrder(items);
  const payload = {items:items.map(item=>({
    productId:toBackendProductId(item.productId),size:item.size,
    toppingIds:item.toppings.map(t=>toBackendProductId(t.id)),qty:item.quantity,
  }))};
  let data: unknown;
  try { data = await request("/orders",json(payload)); }
  catch (e) {
    if (!fallbackAllowed(e)) throw e;
    // Chỉ thử đường dẫn cũ khi endpoint mới trả 404/405. DTO backend có thể khác.
    data = await request("/orders/checkout",json(payload));
  }
  const order = normalizeOrder(data,items);
  return {...order,total:order.total || items.reduce((sum,item)=>sum+(item.basePrice+item.sizeExtra+item.toppings.reduce((s,t)=>s+t.price,0))*item.quantity,0)};
}
export async function payOrder(orderId: string, method: PaymentMethod, shouldFail = false): Promise<Order["status"]> {
  if (DEMO_MODE) return demoPay(orderId,method,shouldFail).status;
  // Giữ nguyên key nếu request mạng bị ngắt khi chưa biết kết quả để tránh replay trùng.
  // Sau PAID / PAYMENT_FAILED, retry kế tiếp là một attempt mới và dùng key mới.
  const storageKey = `brewlite_a1_payment_key_${orderId}`;
  let key = sessionStorage.getItem(storageKey);
  if (!key) {
    key = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
    sessionStorage.setItem(storageKey,key);
  }
  const raw = await request("/payments",{...json({orderId,method}),headers:{"Idempotency-Key":key}});
  const status = normalizePaymentStatus(raw);
  if (status === "PAID" || status === "PAYMENT_FAILED") sessionStorage.removeItem(storageKey);
  return status;
}
export async function getOrders(): Promise<Order[]> {
  if (DEMO_MODE) return demoOrders();
  let raw: unknown;
  try { raw = await request("/orders/me"); }
  catch(e) {
    if (!fallbackAllowed(e)) throw e;
    raw = await request("/orders");
  }
  return unwrapList(raw,["orders","items","data"]).map(v=>normalizeOrder(v));
}
