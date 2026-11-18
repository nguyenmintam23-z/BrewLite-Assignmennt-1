/** Task 2 – JSON của GET /products có đủ khóa theo đề A1 và contract. */
import { ID, RECORDS } from '../test-fixtures';
import { toMenu, toProductView } from './product.mapper';

describe('product.mapper', () => {
  const menu = toMenu(RECORDS);
  const cap = menu.find((p) => p.id === ID.cappuccino)!;

  it('có đủ khóa đề yêu cầu: id, name, price, imageUrl, stock', () => {
    for (const p of menu) {
      expect(p).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          price: expect.any(Number),
          stock: expect.any(Number),
        }),
      );
      expect(p).toHaveProperty('imageUrl');
    }
  });

  it('price là số nguyên VND, không phải chuỗi Decimal', () => {
    expect(cap.price).toBe(45000);
    expect(Number.isInteger(cap.price)).toBe(true);
  });

  it('chỉ trả món đang bán', () => {
    expect(menu.map((p) => p.id)).toEqual([ID.cappuccino, ID.peachTea]);
  });

  it('mảng rỗng khi chưa có sản phẩm', () => {
    expect(toMenu([])).toEqual([]);
  });

  it('sizes sắp S, M, L với phụ thu', () => {
    expect(cap.sizes).toEqual([
      { code: 'S', extra: 0 },
      { code: 'M', extra: 5000 },
      { code: 'L', extra: 10000 },
    ]);
  });

  it('bỏ topping ngừng bán, giữ id/name/price', () => {
    expect(cap.toppings).toEqual([
      { id: ID.cream, name: 'Kem sữa', price: 9000 },
      { id: ID.pearl, name: 'Trân châu', price: 7000 },
    ]);
  });

  it('không lộ trường nội bộ (isActive, version…)', () => {
    expect(Object.keys(cap).sort()).toEqual(
      ['description', 'id', 'imageUrl', 'name', 'price', 'sizes', 'stock', 'toppings'],
    );
  });

  it('imageUrl null giữ nguyên null, stock âm (lỗi dữ liệu) trả 0', () => {
    const v = toProductView({ ...RECORDS[1], stock: -3 });
    expect(v.imageUrl).toBeNull();
    expect(v.stock).toBe(0);
  });
});
