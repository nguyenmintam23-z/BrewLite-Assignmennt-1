export function validateEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  let databaseUrl: URL;
  try {
    databaseUrl = new URL(env.DATABASE_URL);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL');
  }
  if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
    throw new Error('DATABASE_URL must use PostgreSQL');
  }

  if (!env.JWT_SECRET || Buffer.byteLength(env.JWT_SECRET, 'utf8') < 32) {
    throw new Error('JWT_SECRET is required and must be at least 32 bytes');
  }

  if (env.COOKIE_SECURE && !['true', 'false'].includes(env.COOKIE_SECURE)) {
    throw new Error('COOKIE_SECURE must be true or false');
  }

  if (env.FRONTEND_ORIGIN) {
    try {
      const origin = new URL(env.FRONTEND_ORIGIN);
      if (origin.origin !== env.FRONTEND_ORIGIN.replace(/\/$/, '')) {
        throw new Error();
      }
    } catch {
      throw new Error('FRONTEND_ORIGIN must be an origin URL without a path');
    }
  }

  if (env.PORT && (!/^\d+$/.test(env.PORT) || Number(env.PORT) < 1 || Number(env.PORT) > 65535)) {
    throw new Error('PORT must be a valid TCP port');
  }
}
