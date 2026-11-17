"use client";
import {useState,type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useAuth} from "@/components/AuthProvider";
import {DEMO_MODE} from "@/lib/api";
export default function LoginPage(){
  const router=useRouter();const {signIn}=useAuth();
  const [email,setEmail]=useState("");const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);const [error,setError]=useState("");
  async function submit(event:FormEvent){event.preventDefault();setLoading(true);setError("");try{await signIn(email.trim(),password);const dest=new URLSearchParams(window.location.search).get("next");router.replace(dest?.startsWith("/")&&!dest.startsWith("//")?dest:"/");}catch(e){setError(e instanceof Error?e.message:"Đăng nhập thất bại.");}finally{setLoading(false);}}
  return <div className="auth-layout"><div className="auth-art"><span>☕</span><h2>Cà phê ngon<br/>ở phía trước.</h2><p>Đăng nhập để đặt hàng, thanh toán và theo dõi đơn.</p></div><section className="auth-card"><span className="overline">CHÀO MỪNG QUAY LẠI</span><h1>Đăng nhập</h1><p className="muted">{DEMO_MODE?"Demo chỉ lưu email cho phiên giao diện, không xác thực danh tính.":"Đăng nhập bằng tài khoản BrewLite."}</p>
    <form onSubmit={submit} className="form-stack"><label>Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="ten@example.com"/></label>
    {!DEMO_MODE&&<label>Mật khẩu<input type="password" autoComplete="current-password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mật khẩu của bạn"/></label>}
    {error&&<p className="form-error" role="alert">{error}</p>}<button disabled={loading} className="btn btn-primary btn-wide">{loading?"Đang xử lý...":"Đăng nhập →"}</button></form>
    <p className="auth-bottom">Chưa có tài khoản? <Link href="/register">Đăng ký</Link></p>
    {DEMO_MODE&&<p className="demo-note">Không nhập mật khẩu thật trong chế độ demo. API JWT thật do Tâm phụ trách.</p>}
  </section></div>;
}
