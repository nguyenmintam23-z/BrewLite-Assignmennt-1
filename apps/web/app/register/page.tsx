"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {useAuth} from "@/components/AuthProvider";
import {DEMO_MODE} from "@/lib/api";
export default function RegisterPage(){
  const router=useRouter();const {signUp}=useAuth();const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [loading,setLoading]=useState(false);const [error,setError]=useState("");
  async function submit(e:FormEvent){e.preventDefault();setLoading(true);setError("");try{await signUp(email.trim(),password);router.replace("/");}catch(err){setError(err instanceof Error?err.message:"Không thể đăng ký.");}finally{setLoading(false);}}
  return <div className="auth-layout"><div className="auth-art"><span>✦</span><h2>Chọn món dễ dàng,<br/>nhận hàng nhanh chóng.</h2><p>BrewLite mang đến trải nghiệm đặt đồ uống gọn nhẹ.</p></div><section className="auth-card"><span className="overline">THAM GIA BREWLITE</span><h1>Tạo tài khoản</h1><p className="muted">{DEMO_MODE?"Đăng ký demo chỉ tạo phiên giao diện, không lưu tài khoản trên máy chủ.":"Tạo tài khoản để đặt hàng."}</p>
    <form onSubmit={submit} className="form-stack"><label>Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ten@example.com"/></label>
    {!DEMO_MODE&&<label>Mật khẩu<input type="password" minLength={8} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Ít nhất 8 ký tự"/></label>}
    {error&&<p className="form-error" role="alert">{error}</p>}<button className="btn btn-primary btn-wide" disabled={loading}>{loading?"Đang tạo...":"Tạo tài khoản →"}</button></form>
    <p className="auth-bottom">Đã có tài khoản? <Link href="/login">Đăng nhập</Link></p>{DEMO_MODE&&<p className="demo-note">Chế độ demo không triển khai API register/JWT thật.</p>}</section></div>;
}
