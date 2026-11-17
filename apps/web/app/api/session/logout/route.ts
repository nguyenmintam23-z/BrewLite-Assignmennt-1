import { NextResponse } from "next/server";
export async function POST() {
  const response = NextResponse.json({ok:true});
  response.cookies.set("brewlite_a1_access_token","",{httpOnly:true,path:"/",maxAge:0});
  // Backend cookie mang tên khác (nếu có) cần cấu hình đăng xuất cùng team Tâm.
  return response;
}
