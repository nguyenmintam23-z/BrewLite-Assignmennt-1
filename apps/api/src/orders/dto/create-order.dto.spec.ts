/** Task 6 – validate body POST /orders bằng class-validator (minh chứng 400). */
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validate } from 'class-validator';
import { ID } from '../../test-fixtures';
import { CreateOrderDto } from './create-order.dto';

const OPTS = { whitelist: true, forbidNonWhitelisted: true };

async function errorsOf(body: unknown): Promise<string[]> {
  const dto = plainToInstance(CreateOrderDto, body);
  const flat = (errs: ValidationError[], path = ''): string[] =>
    errs.flatMap((e) => {
      const p = path ? `${path}.${e.property}` : e.property;
      return [...Object.keys(e.constraints ?? {}).map((c) => `${p}:${c}`), ...flat(e.children ?? [], p)];
    });
  return flat(await validate(dto, OPTS));
}

const item = (over: Record<string, unknown> = {}) => ({
  productId: ID.cappuccino,
  size: 'M',
  toppingIds: [ID.cream],
  qty: 2,
  ...over,
});

describe('CreateOrderDto', () => {
  it('body hợp lệ theo INTEGRATION-BACKEND.md của Phúc', async () => {
    expect(await errorsOf({ items: [item()] })).toEqual([]);
  });

  it('toppingIds và couponCode không bắt buộc', async () => {
    expect(await errorsOf({ items: [item({ toppingIds: undefined })] })).toEqual([]);
    expect(await errorsOf({ items: [item()], couponCode: 'GIAM10' })).toEqual([]);
  });

  it.each<[string, unknown, string]>([
    ['thiếu items', {}, 'items:'],
    ['items rỗng', { items: [] }, 'items:arrayMinSize'],
    ['quá 20 món', { items: Array.from({ length: 21 }, () => item()) }, 'items:arrayMaxSize'],
    ['productId không phải UUID', { items: [item({ productId: '1' })] }, 'items.0.productId:isUuid'],
    ['size lạ', { items: [item({ size: 'XL' })] }, 'items.0.size:isIn'],
    ['qty = 0', { items: [item({ qty: 0 })] }, 'items.0.qty:min'],
    ['qty > 20', { items: [item({ qty: 21 })] }, 'items.0.qty:max'],
    ['qty lẻ', { items: [item({ qty: 1.5 })] }, 'items.0.qty:isInt'],
    ['qty là chuỗi', { items: [item({ qty: '2' })] }, 'items.0.qty:isInt'],
    ['topping trùng', { items: [item({ toppingIds: [ID.cream, ID.cream] })] }, 'items.0.toppingIds:arrayUnique'],
    ['quá 5 topping', { items: [item({ toppingIds: Array.from({ length: 6 }, (_, i) => `7c2d3e4f-5a6b-4c7d-9e8f-1a2b3c4d5e1${i}`) })] }, 'items.0.toppingIds:arrayMaxSize'],
    ['topping không phải UUID', { items: [item({ toppingIds: ['cream'] })] }, 'items.0.toppingIds:isUuid'],
    ['couponCode quá dài', { items: [item()], couponCode: 'X'.repeat(33) }, 'couponCode:maxLength'],
  ])('400 khi %s', async (_case, body, expected) => {
    const errs = await errorsOf(body);
    expect(errs.some((e) => e.startsWith(expected))).toBe(true);
  });

  it('chặn client gửi giá/tổng tiền (trường lạ)', async () => {
    const errs = await errorsOf({ items: [item({ price: 1 })], total: 1 });
    expect(errs).toEqual(expect.arrayContaining(['total:whitelistValidation', 'items.0.price:whitelistValidation']));
  });
});
