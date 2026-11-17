export type SizeCode = "S" | "M" | "L";
export type PaymentMethod = "WALLET" | "CARD";
export type OrderStatus = "PENDING" | "PAID" | "PAYMENT_FAILED" | "PROCESSING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

export interface SizeOption { code: SizeCode; extra: number }
export interface Topping { id: string; name: string; price: number }
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number | null;
  sizes: SizeOption[];
  toppings: Topping[];
}
export interface CartItem {
  key: string;
  productId: string;
  name: string;
  imageUrl: string;
  size: SizeCode;
  sizeExtra: number;
  basePrice: number;
  toppings: Topping[];
  quantity: number;
}
export interface User { email: string }
export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  total: number;
  items: CartItem[];
  createdAt: string;
  method?: PaymentMethod;
}
