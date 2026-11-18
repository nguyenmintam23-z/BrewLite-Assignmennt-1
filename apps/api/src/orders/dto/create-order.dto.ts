/**
 * DTO cho POST /orders (Task 6, đề A1: "validate (class-validator)").
 * Body theo INTEGRATION-BACKEND.md của Phúc: { items: [{ productId, size, toppingIds, qty }] }.
 * Giới hạn theo docs/api-contract.md mục 2.3. Bật ValidationPipe với
 * { whitelist: true, forbidNonWhitelisted: true, transform: true } để chặn trường lạ (vd "price").
 */
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type { SizeCode } from '../../products/product.mapper';

export const SIZE_CODES: readonly SizeCode[] = ['S', 'M', 'L'];
export const MAX_ITEMS = 20;
export const MAX_QTY = 20;
export const MAX_TOPPINGS = 5;

export class OrderItemDto {
  @IsUUID('4')
  productId!: string;

  @IsIn(SIZE_CODES)
  size!: SizeCode;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_TOPPINGS)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  toppingIds?: string[];

  @IsInt()
  @Min(1)
  @Max(MAX_QTY)
  qty!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  /** Task 10.4 (Tâm) – mã giảm giá, không bắt buộc. */
  @IsOptional()
  @IsString()
  @MaxLength(32)
  couponCode?: string;
}
