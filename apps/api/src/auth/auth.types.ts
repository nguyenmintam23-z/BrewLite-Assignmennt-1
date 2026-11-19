import { Request } from 'express';

/** Tên cookie chứa JWT (đồng bộ với proxy frontend: brewlite_a1_access_token) */
export const AUTH_COOKIE = 'brewlite_a1_access_token';

/** JWT sống 30 phút */
export const JWT_TTL_SECONDS = 30 * 60;

export interface JwtPayload {
  sub: string;
  role: 'CUSTOMER';
  jti: string;
  exp: number;
  iat: number;
}

export interface AuthUser {
  id: string;
  jti: string;
  exp: number;
}

export type AuthRequest = Request & { user?: AuthUser };
