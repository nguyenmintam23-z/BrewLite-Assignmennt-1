import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { INestApplication } from '@nestjs/common';
import { compare } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { AUTH_COOKIE, JWT_TTL_SECONDS } from '../src/auth/auth.types';
import { PrismaService } from '../src/prisma/prisma.service';

const PASSWORD = 'strong-password-7';
let app: INestApplication;
let prisma: PrismaService;
let jwt: JwtService;
let primaryEmail: string;
let sessionToken: string;
let sessionEmail: string;

function email(): string {
  return `task7-${randomUUID()}@task7.test`;
}

function cookieValue(headers: string | string[] | undefined): string {
  const values = Array.isArray(headers) ? headers : headers ? [headers] : [];
  const cookie = values.find((value) => value.startsWith(`${AUTH_COOKIE}=`));
  if (!cookie) throw new Error('Login response did not set the auth cookie');
  return cookie.slice(`${AUTH_COOKIE}=`.length).split(';', 1)[0];
}

describe('Task 7 auth integration (PostgreSQL)', () => {
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    await prisma.user.deleteMany({ where: { email: { endsWith: '@task7.test' } } });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({ where: { email: { endsWith: '@task7.test' } } });
    }
    if (app) await app.close();
  });

  it.each([
    ['invalid email', { email: 'invalid', password: PASSWORD }],
    ['invalid password', { email: 'person@example.test', password: 'short' }],
  ])('rejects registration with %s (400)', async (_label, body) => {
    await request(app.getHttpServer()).post('/auth/register').send(body).expect(400);
  });

  it('registers a normalized user with a bcrypt hash and no session', async () => {
    primaryEmail = email();
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `  ${primaryEmail.toUpperCase()}  `, password: PASSWORD })
      .expect(201);

    expect(response.body.user).toMatchObject({
      email: primaryEmail,
      loyaltyPoints: 0,
    });
    expect(response.body.user.id).toBeTruthy();
    expect(response.body.user.createdAt).toBeTruthy();
    expect(JSON.stringify(response.body)).not.toMatch(/passwordHash|password_hash|token|jwt/i);
    expect(response.headers['set-cookie']).toBeUndefined();

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: primaryEmail } });
    expect(stored.passwordHash).not.toBe(PASSWORD);
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(await compare(PASSWORD, stored.passwordHash)).toBe(true);
    expect(stored.loyaltyPoints).toBe(0);
  });

  it('rejects an email duplicate after trim and lowercase normalization (409)', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: ` ${primaryEmail.toUpperCase()} `, password: PASSWORD })
      .expect(409);
  });

  it('allows only one of two concurrent registrations for the same normalized email', async () => {
    const duplicateEmail = email();
    const responses = await Promise.all([
      request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: duplicateEmail, password: PASSWORD }),
      request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: ` ${duplicateEmail.toUpperCase()} `, password: PASSWORD }),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(await prisma.user.count({ where: { email: duplicateEmail } })).toBe(1);
  });

  it.each([
    ['wrong password', () => primaryEmail, 'wrong-password'],
    ['unknown email', email, PASSWORD],
  ])('rejects login with %s (401)', async (_label, getEmail, password) => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: getEmail(), password })
      .expect(401);
  });

  it('logs in with a 30-minute HttpOnly cookie and no JWT in the body', async () => {
    sessionEmail = email();
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: sessionEmail, password: PASSWORD })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: sessionEmail, password: PASSWORD })
      .expect(200);
    const cookieHeader = response.headers['set-cookie'] as string | string[] | undefined;
    const cookies = Array.isArray(cookieHeader) ? cookieHeader : cookieHeader ? [cookieHeader] : [];
    sessionToken = cookieValue(cookies);

    expect(cookies[0]).toMatch(/HttpOnly/i);
    expect(cookies[0]).toMatch(/SameSite=Lax/i);
    expect(cookies[0]).toMatch(/Path=\//i);
    expect(cookies[0]).toMatch(new RegExp(`Max-Age=${JWT_TTL_SECONDS}`));
    expect(cookies[0]).not.toMatch(/;\s*Secure/i);
    expect(JSON.stringify(response.body)).not.toMatch(/passwordHash|password_hash|token|jwt/i);

    const claims = await jwt.verifyAsync<{ iat: number; exp: number }>(sessionToken);
    expect(claims.exp - claims.iat).toBe(JWT_TTL_SECONDS);
  });

  it('returns the authenticated database user from GET /auth/me', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', `${AUTH_COOKIE}=${sessionToken}`)
      .expect(200);
    expect(response.body.user.email).toBe(sessionEmail);
    expect(response.body.user.loyaltyPoints).toBe(0);
    expect(JSON.stringify(response.body)).not.toMatch(/passwordHash|password_hash|token|jwt/i);
  });

  it('rejects a missing cookie (401)', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('rejects a modified JWT (401)', async () => {
    const parts = sessionToken.split('.');
    const changedSignature = `${parts[2][0] === 'a' ? 'b' : 'a'}${parts[2].slice(1)}`;
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', `${AUTH_COOKIE}=${parts[0]}.${parts[1]}.${changedSignature}`)
      .expect(401);
  });

  it('rejects an expired JWT (401)', async () => {
    const expiredToken = await jwt.signAsync(
      { sub: '00000000-0000-4000-8000-000000000001' },
      { jwtid: randomUUID(), expiresIn: -1 },
    );
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', `${AUTH_COOKIE}=${expiredToken}`)
      .expect(401);
  });

  it('clears and revokes the cookie on logout (204)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', `${AUTH_COOKIE}=${sessionToken}`)
      .expect(204);
    const clearCookieHeader = response.headers['set-cookie'] as string | string[] | undefined;
    const clearCookie = Array.isArray(clearCookieHeader)
      ? clearCookieHeader[0]
      : clearCookieHeader;
    if (!clearCookie) throw new Error('Logout response did not clear the auth cookie');
    expect(clearCookie).toMatch(new RegExp(`^${AUTH_COOKIE}=`));
    expect(clearCookie).toMatch(/Expires=Thu, 01 Jan 1970 00:00:00 GMT/i);
    expect(clearCookie).toMatch(/Path=\//i);
    expect(clearCookie).toMatch(/HttpOnly/i);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', `${AUTH_COOKIE}=${sessionToken}`)
      .expect(401);
  });

  it('rejects a cross-origin state-changing request', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .set('Origin', 'https://attacker.example')
      .send({ email: email(), password: PASSWORD })
      .expect(403);
  });

  it('confirms that product and order controllers are not implemented in this branch', async () => {
    await request(app.getHttpServer()).get('/products').expect(404);
    await request(app.getHttpServer()).post('/orders').send({}).expect(404);
  });
});
