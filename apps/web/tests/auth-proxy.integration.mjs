import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

const baseUrl = process.env.WEB_BASE_URL || "http://localhost:3000";
const origin = new URL(baseUrl).origin;

test("real auth session is forwarded through the Next.js proxy", async () => {
  assert.equal(
    process.env.NEXT_PUBLIC_DEMO_MODE,
    "false",
    "Run the proxy integration test with NEXT_PUBLIC_DEMO_MODE=false",
  );

  const email = `task7-proxy-${randomUUID()}@task7.test`;
  const password = "strong-password-7";
  const register = await fetch(`${baseUrl}/api/backend/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(register.status, 201);
  const registeredUser = await register.json();
  assert.equal(registeredUser.user.email, email);
  assert.doesNotMatch(JSON.stringify(registeredUser), /passwordHash|password_hash|token|jwt/i);

  const login = await fetch(`${baseUrl}/api/backend/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(login.status, 200);
  const setCookie = login.headers.get("set-cookie");
  assert.ok(setCookie, "Next.js proxy must forward backend Set-Cookie");
  assert.match(setCookie, /^brewlite_a1_access_token=/);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Lax/i);
  assert.match(setCookie, /Path=\//i);
  assert.match(setCookie, /Max-Age=1800/i);
  assert.doesNotMatch(await login.text(), /passwordHash|password_hash|token|jwt/i);
  const cookie = setCookie.split(";", 1)[0];

  const currentUser = await fetch(`${baseUrl}/api/backend/auth/me`, {
    headers: { cookie },
  });
  assert.equal(currentUser.status, 200);
  assert.equal((await currentUser.json()).user.email, email);

  const logout = await fetch(`${baseUrl}/api/backend/auth/logout`, {
    method: "POST",
    headers: { origin, cookie },
  });
  assert.equal(logout.status, 204);
  assert.equal(await logout.text(), "");
  const clearedCookie = logout.headers.get("set-cookie");
  assert.ok(clearedCookie, "Next.js proxy must forward logout Set-Cookie");
  assert.match(clearedCookie, /^brewlite_a1_access_token=/);
  assert.match(clearedCookie, /Expires=Thu, 01 Jan 1970 00:00:00 GMT/i);
  assert.match(clearedCookie, /Path=\//i);

  const afterLogout = await fetch(`${baseUrl}/api/backend/auth/me`, {
    headers: { cookie },
  });
  assert.equal(afterLogout.status, 401);

  const rejectedOrigin = await fetch(`${baseUrl}/api/backend/auth/logout`, {
    method: "POST",
    headers: { origin: "https://attacker.example" },
  });
  assert.equal(rejectedOrigin.status, 403);
});
