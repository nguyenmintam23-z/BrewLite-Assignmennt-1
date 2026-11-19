import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ path: string[] }> };
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

async function proxy(request: NextRequest, context: Context) {
  if (STATE_CHANGING_METHODS.has(request.method)) {
    const origin = request.headers.get("origin");
    if (!origin) {
      return NextResponse.json({ message: "Origin không được phép." }, { status: 403 });
    }
    try {
      const expectedOrigin = process.env.FRONTEND_ORIGIN
        ? new URL(process.env.FRONTEND_ORIGIN).origin
        : request.nextUrl.origin;
      if (new URL(origin).origin !== expectedOrigin) {
        return NextResponse.json({ message: "Origin không được phép." }, { status: 403 });
      }
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
      return NextResponse.json({ message: "Origin không được phép." }, { status: 403 });
    }
  }

  const upstreamBase = process.env.API_UPSTREAM_URL;
  if (!upstreamBase) {
    return NextResponse.json(
      { message: "Chưa thiết lập API_UPSTREAM_URL cho NestJS." },
      { status: 503 },
    );
  }
  const { path } = await context.params;
  if (!path?.length || path.some((part) => part === "." || part === ".." || part.includes("/"))) {
    return NextResponse.json({ message: "Đường dẫn không hợp lệ." }, { status: 400 });
  }

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) headers.set("cookie", cookieHeader);
  const origin = request.headers.get("origin");
  if (origin) headers.set("origin", origin);
  const idempotency = request.headers.get("idempotency-key");
  if (idempotency) headers.set("idempotency-key", idempotency);

  let url: URL;
  try {
    const base = new URL(upstreamBase.endsWith("/") ? upstreamBase : `${upstreamBase}/`);
    url = new URL(path.map(encodeURIComponent).join("/"), base);
    url.search = request.nextUrl.search;
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    return NextResponse.json(
      { message: "API_UPSTREAM_URL không hợp lệ." },
      { status: 503 },
    );
  }

  const body =
    METHODS.includes(request.method) && request.method !== "GET"
      ? await request.arrayBuffer()
      : undefined;
  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
    });
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    return NextResponse.json(
      { message: "Không kết nối được NestJS. Kiểm tra API_UPSTREAM_URL và backend." },
      { status: 503 },
    );
  }

  const responseBody = await upstream.text();
  const responseHeaders = new Headers();
  responseHeaders.set("cache-control", "no-store");
  const responseType = upstream.headers.get("content-type");
  if (responseType) responseHeaders.set("content-type", responseType);
  const noBodyStatus = [204, 205, 304].includes(upstream.status);
  const res = new NextResponse(noBodyStatus ? null : responseBody, {
    status: upstream.status,
    headers: responseHeaders,
  });
  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) res.headers.append("set-cookie", setCookie);
  return res;
}
export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
