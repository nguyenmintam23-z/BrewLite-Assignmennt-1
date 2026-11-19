import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/** Đánh dấu endpoint không cần đăng nhập. Mặc định mọi endpoint cần JWT (guard toàn cục). */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC, true);
