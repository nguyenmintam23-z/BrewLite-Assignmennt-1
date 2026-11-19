import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

@ValidatorConstraint({ name: 'bcryptByteLimit', async: false })
class BcryptByteLimit implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= 72;
  }

  defaultMessage(): string {
    return 'Mật khẩu tối đa 72 byte';
  }
}

/** POST /auth/register. Không có trường role: đăng ký luôn là CUSTOMER. */
export class RegisterDto {
  @Transform(trim)
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(254)
  email!: string;

  /** bcrypt chỉ dùng 72 byte đầu nên giới hạn 72 ký tự. */
  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  @MaxLength(72, { message: 'Mật khẩu tối đa 72 ký tự' })
  @Validate(BcryptByteLimit)
  password!: string;
}

/** POST /auth/login. */
export class LoginDto {
  @Transform(trim)
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MaxLength(72)
  @Validate(BcryptByteLimit)
  password!: string;
}
