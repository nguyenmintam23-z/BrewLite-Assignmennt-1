/**
 * Chuyển bản ghi Prisma → JSON trả về cho GET /products, GET /products/:id (Task 2).
 * Khóa bắt buộc theo đề A1: id, name, price, imageUrl (+ stock theo thực thể Product mục 12.2).
 * sizes/toppings: frontend cần để tính giá Task 4 (INTEGRATION-BACKEND.md của Phúc).
 * Kiểu đầu vào bám docs/schema-draft.prisma (include sizes.size, toppings.topping).
 */

export type SizeCode = 'S' | 'M' | 'L';

export interface ProductRecord {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  stock: number;
  sizes: { size: { code: SizeCode; extraPrice: number } }[];
  toppings: { topping: { id: string; name: string; price: number; isActive: boolean } }[];
}

export interface SizeView {
  code: SizeCode;
  extra: number;
}

export interface ToppingView {
  id: string;
  name: string;
  price: number;
}

export interface ProductView {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  sizes: SizeView[];
  toppings: ToppingView[];
}

const SIZE_ORDER: Record<SizeCode, number> = { S: 0, M: 1, L: 2 };

export function toProductView(p: ProductRecord): ProductView {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    imageUrl: p.imageUrl,
    stock: Math.max(0, p.stock),
    sizes: p.sizes
      .map(({ size }) => ({ code: size.code, extra: size.extraPrice }))
      .sort((a, b) => SIZE_ORDER[a.code] - SIZE_ORDER[b.code]),
    toppings: p.toppings
      .filter(({ topping }) => topping.isActive)
      .map(({ topping }) => ({ id: topping.id, name: topping.name, price: topping.price }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi')),
  };
}

/** Menu chỉ hiện món đang bán (contract mục 2.1). */
export function toMenu(records: readonly ProductRecord[]): ProductView[] {
  return records.filter((p) => p.isActive).map(toProductView);
}
