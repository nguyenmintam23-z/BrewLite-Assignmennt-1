import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { CookieOptions, Request, Response } from 'express';
import { PublicUser } from '../users/users.service';
import { AuthService } from './auth.service';
import { AUTH_COOKIE, AuthRequest, JWT_TTL_SECONDS } from './auth.types';
import { CurrentUser } from './current-user.decorator';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { Public } from './public.decorator';

/**
 * Cookie JWT: HttpOnly; SameSite=Lax; Path=/; thời hạn khớp JWT.
 * COOKIE_SECURE=false chỉ dùng khi chạy local qua HTTP mà trình duyệt không coi là an toàn.
 */
export function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
  };
}

type SessionBody = { user: PublicUser };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * FR-20. 201 khi tạo được tài khoản; 400 dữ liệu sai; 409 email đã tồn tại.
   * Không tự động đăng nhập. Frontend gọi login sau register.
   */
  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<SessionBody> {
    return this.auth.register(dto);
  }

  /**
   * FR-21. 200 + Set-Cookie; body chỉ có user, không có JWT.
   * 401 khi sai thông tin.
   */
  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionBody> {
    const { token, user } = await this.auth.login(dto);
    res.cookie(AUTH_COOKIE, token, {
      ...cookieOptions(),
      maxAge: JWT_TTL_SECONDS * 1000,
    });
    return { user };
  }

  /** FR-21. Luôn xóa cookie và trả 204; nếu token còn hạn thì thu hồi jti. */
  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const token: unknown = req.cookies?.[AUTH_COOKIE];
    await this.auth.logout(typeof token === 'string' ? token : undefined);
    res.clearCookie(AUTH_COOKIE, cookieOptions());
  }

  /** Người dùng và thông tin hiện tại (frontend khôi phục phiên). Chưa đăng nhập → 401. */
  @Get('me')
  me(@CurrentUser() user: NonNullable<AuthRequest['user']>): Promise<SessionBody> {
    return this.auth.me(user.id);
  }
}
