import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { compare, hash, hashSync } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { PublicUser, toPublicUser, UsersService } from '../users/users.service';
import { JWT_TTL_SECONDS } from './auth.types';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { TokenRevocationService } from './token-revocation.service';

/** Số vòng băm bcrypt (NFR-03). */
export const BCRYPT_ROUNDS = 10;
export const MSG_SAI_DANG_NHAP = 'Email hoặc mật khẩu không đúng';
export const MSG_EMAIL_TRUNG = 'Email đã được đăng ký';

/** Băm giả để so sánh khi không có email, giữ thời gian phản hồi giống nhau. */
const HASH_GIA = hashSync('khong-phai-mat-khau-that', BCRYPT_ROUNDS);

export interface SessionResult {
  user: PublicUser;
  token: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger('Auth');

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly revocation: TokenRevocationService,
  ) {}

  /** FR-20: kiểm tra email trùng, chỉ lưu mật khẩu đã băm. Không tự đăng nhập. */
  async register(dto: RegisterDto): Promise<{ user: PublicUser }> {
    if (await this.users.findByEmail(dto.email)) {
      throw new ConflictException(MSG_EMAIL_TRUNG);
    }
    const passwordHash = await hash(dto.password, BCRYPT_ROUNDS);
    try {
      const u = await this.users.create({ email: dto.email, passwordHash });
      this.logger.log({ event: 'user_registered', userId: u.id });
      return { user: toPublicUser(u) };
    } catch (err) {
      // Hai yêu cầu đăng ký cùng email chạy song song: ràng buộc UNIQUE chặn bản thứ hai.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(MSG_EMAIL_TRUNG);
      }
      throw err;
    }
  }

  /** FR-21: sai email hoặc mật khẩu đều trả cùng một thông báo. */
  async login(dto: LoginDto): Promise<SessionResult> {
    const u = await this.users.findByEmail(dto.email);
    const dung = await compare(dto.password, u?.passwordHash ?? HASH_GIA);
    if (!u || !dung) {
      this.logger.warn({ event: 'login_failed' });
      throw new UnauthorizedException(MSG_SAI_DANG_NHAP);
    }
    const token = await this.jwt.signAsync(
      { sub: u.id, role: 'CUSTOMER' },
      { jwtid: randomUUID(), expiresIn: JWT_TTL_SECONDS },
    );
    this.logger.log({ event: 'login_succeeded', userId: u.id });
    return { user: toPublicUser(u), token };
  }

  /** GET /auth/me: đọc lại từ database để thông tin luôn mới nhất; tài khoản không còn thì 401. */
  async me(userId: string): Promise<{ user: PublicUser }> {
    const u = await this.users.findById(userId);
    if (!u) throw new UnauthorizedException(MSG_CHUA_DANG_NHAP);
    return { user: toPublicUser(u) };
  }

  /** FR-21: token cũ bị từ chối đến khi hết hạn. Token không hợp lệ thì chỉ cần xóa cookie. */
  async logout(token: string | undefined): Promise<void> {
    if (!token) return;
    try {
      const p = await this.jwt.verifyAsync<{ jti?: string; exp?: number; sub?: string }>(token);
      if (p.jti && p.exp) {
        this.revocation.revoke(p.jti, p.exp);
        this.logger.log({ event: 'logout', userId: p.sub });
      }
    } catch (err) {
      if (
        err instanceof Error &&
        ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(err.name)
      ) {
        return;
      }
      throw err;
    }
  }
}

// Re-export cho guard
export const MSG_CHUA_DANG_NHAP = 'Chưa đăng nhập hoặc phiên đã hết hạn';
