import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{path: string[]}> };
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

async function proxy(request: NextRequest, context: Context) {
  const upstreamBase = process.env.API_UPSTREAM_URL;
  if (!upstreamBase) return NextResponse.json({message:"Chưa thiết lập API_UPSTREAM_URL cho NestJS."},{status:503});
  const {path} = await context.params;
  if (!path?.length || path.some(x=>x === "." || x === ".." || x.includes("/"))) {
    return NextResponse.json({message:"Đường dẫn không hợp lệ."},{status:400});
  }
  const base = new URL(upstreamBase.endsWith("/") ? upstreamBase : `${upstreamBase}/`);
  const url = new URL(path.map(encodeURIComponent).join("/"),base);
  url.search = request.nextUrl.search;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type",contentType);
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept",accept);
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) headers.set("cookie",cookieHeader);
  const idempotency = request.headers.get("idempotency-key");
  if (idempotency) headers.set("idempotency-key",idempotency);
  const storedToken = request.cookies.get("brewlite_a1_access_token")?.value;
  if (storedToken) headers.set("authorization",`Bearer ${storedToken}`);
  else if (request.headers.get("authorization")) headers.set("authorization",request.headers.get("authorization")!);

  try {
    const upstream = await fetch(url,{
      method:request.method,
      headers,
      body: METHODS.includes(request.method) && request.method !== "GET" ? await request.arrayBuffer() : undefined,
      cache:"no-store",redirect:"manual",
    });
    const body = await upstream.text();
    const responseHeaders = new Headers();
    responseHeaders.set("cache-control","no-store");
    const responseType = upstream.headers.get("content-type");
    if (responseType) responseHeaders.set("content-type",responseType);
    // Nếu NestJS phát JWT trong JSON, đổi thành cookie HttpOnly thay vì lưu token ở localStorage.
    let responseBody = body;
    let token: string | null = null;
    if (path.join("/") === "auth/login" && upstream.ok && responseType?.includes("application/json")) {
      try {
        const data = JSON.parse(body) as Record<string, unknown>;
        const value = data.access_token ?? data.accessToken ?? data.token;
        if (typeof value === "string" && value) {
          token = value;
          delete data.access_token; delete data.accessToken; delete data.token;
          responseBody = JSON.stringify(data);
        }
      } catch { /* giữ phản hồi gốc nếu không parse được */ }
    }
    const res = new NextResponse(responseBody,{status:upstream.status,headers:responseHeaders});
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) res.headers.append("set-cookie",setCookie);
    if (token) res.cookies.set("brewlite_a1_access_token",token,{
      httpOnly:true,secure:process.env.NODE_ENV === "production",sameSite:"lax",path:"/",maxAge:60*60*8,
    });
    return res;
  } catch {
    return NextResponse.json({message:"Không kết nối được NestJS. Kiểm tra API_UPSTREAM_URL và backend."},{status:503});
  }
}
export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
