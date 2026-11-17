"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useAuth} from "@/components/AuthProvider";
import {getOrders} from "@/lib/api";
import {formatVnd} from "@/lib/pricing";
import {StatusPill} from "@/components/StatusPill";
import type {Order} from "@/lib/types";
export default function OrdersPage(){
  const router=useRouter();const {user,ready}=useAuth();const [orders,setOrders]=useState<Order[]>([]);const [pending,setPending]=useState(true);const [error,setError]=useState("");
  useEffect(()=>{if(ready&&!user)router.replace("/login?next=/orders");},[ready,user,router]);
  useEffect(()=>{if(!ready||!user)return;let active=true;getOrders().then(v=>{if(active)setOrders(v);}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Không tải được lịch sử đơn.");}).finally(()=>{if(active)setPending(false);});return()=>{active=false;};},[ready,user]);
  if(!ready||!user)return <p>Đang xác thực phiên đăng nhập...</p>;
  return <><div className="page-heading"><span className="overline">ORDER HISTORY</span><h1>Đơn hàng của bạn</h1><p>Theo dõi các đơn đã đặt tại BrewLite.</p></div>{pending?<p>Đang tải lịch sử...</p>:error?<div className="empty-state" role="alert"><h2>Không tải được lịch sử</h2><p>{error}</p><button className="btn btn-primary" onClick={()=>{setPending(true);setError("");getOrders().then(setOrders).catch(e=>setError(e instanceof Error?e.message:String(e))).finally(()=>setPending(false));}}>Thử lại</button></div>:!orders.length?<div className="empty-state"><div className="empty-icon">☕</div><h2>Chưa có đơn hàng</h2><p>Bắt đầu bằng một món đồ uống yêu thích.</p><Link href="/" className="btn btn-primary">Đặt món</Link></div>:<div className="stack">{orders.map(o=><Link className="order-card" href={`/orders/${encodeURIComponent(o.id)}`} key={o.id}><div><span className="overline">MÃ ĐƠN {o.code}</span><p className="muted">{new Date(o.createdAt).toLocaleString("vi-VN")}</p></div><div className="order-card-right"><StatusPill status={o.status}/><strong>{formatVnd(o.total)}</strong><span>Xem chi tiết →</span></div></Link>)}</div>}</>;
}
