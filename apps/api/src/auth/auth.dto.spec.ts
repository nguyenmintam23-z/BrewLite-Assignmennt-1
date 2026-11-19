import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { cookieOptions } from './auth.controller';
import { RegisterDto } from './dto/auth.dto';
import { normalizeEmail } from '../users/users.service';
import { validateEnvironment } from '../env';

describe('Task 7 auth configuration and validation', () => {
  it.each([
    ['invalid email', { email: 'not-an-email', password: 'strong-pass-1' }],
    ['short password', { email: 'user@example.test', password: 'short' }],
    ['password above bcrypt byte limit', { email: 'user@example.test', password: '😀'.repeat(19) }],
  ])('rejects %s', async (_label, payload) => {
    const errors = await validate(plainToInstance(RegisterDto, payload));
    expect(errors.length).toBeGreaterThan(0);
  });

  it('trims and lowercases email consistently for storage and lookup', () => {
    expect(normalizeEmail('  User.Name@Example.Test  ')).toBe('user.name@example.test');
  });

  it('sets Secure on production cookies but permits local HTTP', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalCookieSecure = process.env.COOKIE_SECURE;
    try {
      process.env.NODE_ENV = 'test';
      process.env.COOKIE_SECURE = 'false';
      expect(cookieOptions()).toMatchObject({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });

      process.env.NODE_ENV = 'production';
      expect(cookieOptions().secure).toBe(true);
    } finally {
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalNodeEnv;
      if (originalCookieSecure === undefined) delete process.env.COOKIE_SECURE;
      else process.env.COOKIE_SECURE = originalCookieSecure;
    }
  });

  it('fails fast when required database or JWT configuration is missing', () => {
    expect(() => validateEnvironment({})).toThrow('DATABASE_URL is required');
    expect(() =>
      validateEnvironment({
        DATABASE_URL: 'postgresql://localhost/brewlite',
        JWT_SECRET: 'too-short',
      }),
    ).toThrow('JWT_SECRET is required');
  });
});
