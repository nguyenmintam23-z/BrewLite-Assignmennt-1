/** Task 6 (giá tính ở server) + minh chứng giá Task 4: giá gốc + size + topping. */
import { toMenu } from '../products/product.mapper';
import { ID, RECORDS } from '../test-fixtures';
import { PricingError, priceOrder, quantityByProduct } from './order-pricing';

const menu = toMenu(RECORDS);

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (e) {
    if (e instanceof PricingError) return e.code;
    throw e;
  }
  return undefined;
}

describe('priceOrder', () => {
  it.each([
    ['S', 45000],
    ['M', 50000],
    ['L', 55000],
  ] as const)('Cappuccino size %s không topping = %i', (size, expected) => {
    const r = priceOrder([{ productId: ID.cappuccino, size, qty: 1 }], menu);
    expect(r.items[0].unitPrice).toBe(expected);
  });

  it('cộng nhiều topping: Cappuccino M + Kem sữa + Trân châu = 45k + 5k + 9k + 7k', () => {
    const r = priceOrder(
      [{ productId: ID.cappuccino, size: 'M', toppingIds: [ID.cream, ID.pearl], qty: 1 }],
      menu,
    );
    expect(r.items[0].unitPrice).toBe(66000);
    expect(r.items[0].toppings.map((t) => t.name)).toEqual(['Kem sữa', 'Trân châu']);
  });

  it('lineTotal = unitPrice × qty, subtotal = Σ lineTotal', () => {
    const r = priceOrder(
      [
        { productId: ID.cappuccino, size: 'M', toppingIds: [ID.cream], qty: 1 }, // 59 000
        { productId: ID.peachTea, size: 'L', toppingIds: [ID.jelly], qty: 2 }, // 55 000 × 2
      ],
      menu,
    );
    expect(r.items.map((i) => [i.unitPrice, i.lineTotal])).toEqual([
      [59000, 59000],
      [55000, 110000],
    ]);
    expect(r.subtotal).toBe(169000);
  });

  it('cùng món khác cấu hình là 2 dòng riêng', () => {
    const r = priceOrder(
      [
        { productId: ID.cappuccino, size: 'S', qty: 1 },
        { productId: ID.cappuccino, size: 'L', toppingIds: [ID.pearl], qty: 1 },
      ],
      menu,
    );
    expect(r.items).toHaveLength(2);
    expect(r.subtotal).toBe(45000 + 62000);
  });

  it('không nhận giá từ client: trường price lạ bị bỏ qua', () => {
    const line = { productId: ID.cappuccino, size: 'S' as const, qty: 1, price: 1 };
    expect(priceOrder([line], menu).subtotal).toBe(45000);
  });

  it.each([
    ['EMPTY_ORDER', []],
    ['PRODUCT_NOT_FOUND', [{ productId: '00000000-0000-4000-8000-000000000000', size: 'S', qty: 1 }]],
    ['PRODUCT_NOT_FOUND', [{ productId: ID.hidden, size: 'S', qty: 1 }]],
    ['INVALID_SIZE', [{ productId: ID.peachTea, size: 'S', qty: 1 }]],
    ['INVALID_TOPPING', [{ productId: ID.peachTea, size: 'M', toppingIds: [ID.pearl], qty: 1 }]],
    ['INVALID_TOPPING', [{ productId: ID.cappuccino, size: 'M', toppingIds: [ID.jelly], qty: 1 }]],
    ['DUPLICATE_TOPPING', [{ productId: ID.cappuccino, size: 'M', toppingIds: [ID.cream, ID.cream], qty: 1 }]],
    ['INVALID_QTY', [{ productId: ID.cappuccino, size: 'M', qty: 0 }]],
    ['INVALID_QTY', [{ productId: ID.cappuccino, size: 'M', qty: 1.5 }]],
  ] as const)('báo %s', (code, lines) => {
    expect(codeOf(() => priceOrder(lines as never, menu))).toBe(code);
  });

  it('lỗi kèm vị trí dòng để FE báo đúng món', () => {
    expect.assertions(1);
    try {
      priceOrder(
        [
          { productId: ID.cappuccino, size: 'S', qty: 1 },
          { productId: ID.peachTea, size: 'S', qty: 1 },
        ],
        menu,
      );
    } catch (e) {
      expect(e).toMatchObject({ code: 'INVALID_SIZE', lineIndex: 1 });
    }
  });

  it('chặn số tiền vượt giới hạn an toàn', () => {
    const huge = [{ ...menu[0], price: Number.MAX_SAFE_INTEGER }];
    expect(codeOf(() => priceOrder([{ productId: ID.cappuccino, size: 'M', qty: 2 }], huge))).toBe(
      'AMOUNT_OVERFLOW',
    );
  });
});

describe('quantityByProduct', () => {
  it('gộp số lượng theo sản phẩm để kiểm tồn kho', () => {
    const m = quantityByProduct([
      { productId: ID.cappuccino, size: 'S', qty: 1 },
      { productId: ID.peachTea, size: 'M', qty: 2 },
      { productId: ID.cappuccino, size: 'L', qty: 3 },
    ]);
    expect(Object.fromEntries(m)).toEqual({ [ID.cappuccino]: 4, [ID.peachTea]: 2 });
  });
});
