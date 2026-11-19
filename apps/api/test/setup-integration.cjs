const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('Set DATABASE_URL to a dedicated PostgreSQL database before integration tests.');
}

let databaseName;
try {
  databaseName = decodeURIComponent(new URL(databaseUrl).pathname.slice(1));
} catch {
  throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
}
if (!/(^|[_-])test($|[_-])/i.test(databaseName)) {
  throw new Error('Integration tests require a dedicated database name containing "test".');
}

process.env.JWT_SECRET = process.env.JWT_SECRET || 'task7-integration-test-secret-not-for-production';
process.env.COOKIE_SECURE = 'false';
process.env.FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
process.env.NODE_ENV = 'test';
