"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useParams} from "next/navigation";
import {getOrders} from "@/lib/api";
import {StatusPill} from "@/components/StatusPill";
import {formatVnd} from "@/lib/pricing";
import type {Order} from "@/lib/types";
export default function OrderConfirmation(){
  const params=useParams<{id:string}>();const [order,setOrder]=useState<Order|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
  useEffect(()=>{let active=true;getOrders().then(orders=>{if(!active)return;const found=orders.find(o=>o.id===params.id);if(found){setOrder(found);return;}try{const last=JSON.parse(sessionStorage.getItem("brewlite_a1_last_order")??"null") as Order|null;if(last?.id===params.id)setOrder(last);}catch{}}).catch(e=>{if(active){setError(e instanceof Error?e.message:"Không tải được đơn.");try{const last=JSON.parse(sessionStorage.getItem("brewlite_a1_last_order")??"null") as Order|null;if(last?.id===params.id)setOrder(last);}catch{}}}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[params.id]);
  if(loading)return <p>Đang tải thông tin đơn...</p>;
  if(!order)return <div className="empty-state"><h2>Không tìm thấy thông tin đơn</h2><p>{error||"Đơn hàng chưa có trong lịch sử. Hãy thử mở lại sau."}</p><Link href="/orders" className="btn btn-primary">Xem lịch sử đơn</Link></div>;
  return <div className="confirmation"><div className="success-mark">✓</div><span className="overline">BREWLITE ORDER</span><h1>{order.status==="PAID"?"Đặt hàng thành công!":"Thông tin đơn hàng"}</h1><p className="muted">{order.status==="PAID"?"Cảm ơn bạn! Hãy giữ mã đơn để nhận đồ uống.":"Trạng thái đơn được hiển thị bên dưới."}</p><div className="receipt"><div className="summary-row"><span>Mã đơn</span><strong>{order.code}</strong></div><div className="summary-row"><span>Trạng thái</span><StatusPill status={order.status}/></div><div className="summary-row"><span>Ngày đặt</span><span>{new Date(order.createdAt).toLocaleString("vi-VN")}</span></div>{order.method&&<div className="summary-row"><span>Thanh toán</span><span>{order.method==="CARD"?"Thẻ":"Ví điện tử"}</span></div>}<div className="summary-row summary-final"><span>Tổng tiền</span><strong>{formatVnd(order.total)}</strong></div></div><div className="confirmation-actions"><Link href="/" className="btn btn-primary">Về Menu</Link><Link href="/orders" className="btn btn-secondary">Lịch sử đơn</Link></div></div>;
}
