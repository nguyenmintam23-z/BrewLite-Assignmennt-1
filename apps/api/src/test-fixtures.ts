/** Dữ liệu dùng chung cho unit test; giá bám lib/demo-data.ts của Phúc để đối chiếu giá FE = BE. */
import type { ProductRecord } from './products/product.mapper';

export const ID = {
  cappuccino: '3f1a2b4c-5d6e-4f70-8a9b-0c1d2e3f4a01',
  peachTea: '3f1a2b4c-5d6e-4f70-8a9b-0c1d2e3f4a02',
  hidden: '3f1a2b4c-5d6e-4f70-8a9b-0c1d2e3f4a03',
  pearl: '7c2d3e4f-5a6b-4c7d-9e8f-1a2b3c4d5e01',
  cream: '7c2d3e4f-5a6b-4c7d-9e8f-1a2b3c4d5e02',
  jelly: '7c2d3e4f-5a6b-4c7d-9e8f-1a2b3c4d5e03',
} as const;

const sizes: ProductRecord['sizes'] = [
  { size: { code: 'L', extraPrice: 10000 } },
  { size: { code: 'S', extraPrice: 0 } },
  { size: { code: 'M', extraPrice: 5000 } },
];

export const RECORDS: ProductRecord[] = [
  {
    id: ID.cappuccino,
    name: 'Cappuccino',
    description: 'Espresso, sữa nóng và lớp bọt mịn.',
    price: 45000,
    imageUrl: '/img/cappuccino.svg',
    isActive: true,
    stock: 30,
    sizes,
    toppings: [
      { topping: { id: ID.pearl, name: 'Trân châu', price: 7000, isActive: true } },
      { topping: { id: ID.cream, name: 'Kem sữa', price: 9000, isActive: true } },
      { topping: { id: ID.jelly, name: 'Thạch', price: 6000, isActive: false } },
    ],
  },
  {
    id: ID.peachTea,
    name: 'Trà đào',
    description: 'Trà thơm dịu cùng hương đào tươi mát.',
    price: 39000,
    imageUrl: null,
    isActive: true,
    stock: 35,
    sizes: [{ size: { code: 'M', extraPrice: 5000 } }, { size: { code: 'L', extraPrice: 10000 } }],
    toppings: [{ topping: { id: ID.jelly, name: 'Thạch', price: 6000, isActive: true } }],
  },
  {
    id: ID.hidden,
    name: 'Món ngừng bán',
    description: '',
    price: 30000,
    imageUrl: null,
    isActive: false,
    stock: 0,
    sizes,
    toppings: [],
  },
];
