# BrewLite API

## Local setup

Requirements: Node.js 20+, npm, and PostgreSQL.

From `apps/api`, copy `.env.example` to `.env`, then set a working PostgreSQL
`DATABASE_URL` and a private `JWT_SECRET` of at least 32 bytes. Use a separate
database for tests; its name must contain `test`.

```powershell
Set-Location apps\api
Copy-Item .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
npm run dev
```

`prisma migrate deploy` applies the checked-in additive migration and does not
reset the database. `COOKIE_SECURE=false` supports local HTTP; production
always sets the cookie's `Secure` flag. The API listens on port 3001 by default.

## Frontend

Copy `apps/web/.env.example` to `apps/web/.env.local`, set
`NEXT_PUBLIC_DEMO_MODE=false`, and configure `API_UPSTREAM_URL` (default
`http://localhost:3001`) and `FRONTEND_ORIGIN` to the browser-visible web
origin (default `http://localhost:3000`). In a second terminal:

```powershell
Set-Location apps\web
npm install
npm run dev
```

The browser calls the same-origin Next.js proxy. The proxy forwards cookies,
forwards backend `Set-Cookie` headers, and rejects state-changing requests
whose `Origin` does not match the frontend origin.

## Tests and checks

Unit tests, type-safe build, and lint:

```powershell
Set-Location apps\api
npm run test:unit
npm run build
npm run lint
```

For database integration tests, first set `DATABASE_URL` to a dedicated
PostgreSQL database whose name contains `test`, apply the checked-in migration,
then run:

```powershell
$env:DATABASE_URL = "postgresql://brewlite:local-test-password@localhost:5432/brewlite_test"
npm run prisma:migrate:deploy
npm run test:integration
```

The integration suite refuses to run unless the database name contains
`test`. It only removes its own `@task7.test` fixtures and never resets the
database.
