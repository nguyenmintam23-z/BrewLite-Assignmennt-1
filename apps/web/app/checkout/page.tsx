"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useCart} from "@/components/CartProvider";
import {useAuth} from "@/components/AuthProvider";
import {createOrder,DEMO_MODE,payOrder} from "@/lib/api";
import {formatVnd} from "@/lib/pricing";
import type {Order,PaymentMethod} from "@/lib/types";

export default function CheckoutPage(){
  const router=useRouter();const {items,total,ready,clear}=useCart();const {user,ready:authReady,error:authError}=useAuth();
  const [method,setMethod]=useState<PaymentMethod>("WALLET");
  const [simulateFailure,setSimulateFailure]=useState(false);const [pending,setPending]=useState(false);const [error,setError]=useState("");
  const [note,setNote]=useState("");const [createdOrder,setCreatedOrder]=useState<Order|null>(null);
  useEffect(()=>{if(ready&&authReady&&!user)router.replace("/login?next=/checkout");},[ready,authReady,user,router]);
  async function submit(){
    if(!items.length||pending||!user)return;
    setPending(true);setError("");setNote("");
    try {
      const order=createdOrder??await createOrder(items);
      if(!createdOrder)setCreatedOrder(order);
      const status=await payOrder(order.id,method,DEMO_MODE&&simulateFailure);
      if(status==="PAID"){
        const confirmed={...order,status:"PAID" as const,method};
        sessionStorage.setItem("brewlite_a1_last_order",JSON.stringify(confirmed));
        clear();router.push(`/orders/${encodeURIComponent(order.id)}`);
      } else if(status==="PAYMENT_FAILED"){
        setError("Thanh toán thất bại. Giỏ hàng được giữ nguyên. Bạn có thể thử lại trên cùng đơn hàng.");
      } else {
        setNote("Thanh toán đang xử lý hoặc chờ xác nhận. Giỏ hàng vẫn được giữ nguyên cho đến khi có kết quả cuối cùng.");
      }
    }catch(e){setError(e instanceof Error?e.message:"Không thể thanh toán. Vui lòng thử lại.");}
    finally{setPending(false);}
  }
  if(!ready||!authReady)return <p>Đang chuẩn bị thanh toán...</p>;
  if(authError&&!user)return <div className="notice notice-error" role="alert">{authError}</div>;
  if(!user)return <div className="empty-state"><h2>Vui lòng đăng nhập để thanh toán</h2><Link href="/login?next=/checkout" className="btn btn-primary">Đăng nhập</Link></div>;
  if(!items.length)return <div className="empty-state"><h2>Giỏ hàng trống</h2><Link href="/" className="btn btn-primary">Chọn món</Link></div>;
  return <><div className="page-heading"><span className="overline">CHECKOUT</span><h1>Thanh toán không tiền mặt</h1><p>Chọn Ví điện tử hoặc Thẻ và xác nhận đơn.</p></div><div className="checkout-layout"><div className="stack"><section className="panel"><h2>Phương thức thanh toán</h2><div className="method-grid"><label className={`method-option ${method==="WALLET"?"selected":""}`}><input type="radio" name="payment" checked={method==="WALLET"} onChange={()=>setMethod("WALLET")}/><span className="method-icon">◈</span><strong>Ví điện tử</strong><small>Mock Wallet</small></label><label className={`method-option ${method==="CARD"?"selected":""}`}><input type="radio" name="payment" checked={method==="CARD"} onChange={()=>setMethod("CARD")}/><span className="method-icon">▤</span><strong>Thẻ ngân hàng</strong><small>Mock Card</small></label></div>{DEMO_MODE&&<label className="demo-failure"><input type="checkbox" checked={simulateFailure} onChange={e=>setSimulateFailure(e.target.checked)}/> Giả lập thanh toán thất bại (chỉ để test UI)</label>}</section><section className="panel"><h2>Người đặt</h2><p>{user.email}</p><p className="muted">Nhận đồ uống tại quầy BrewLite</p></section>{error&&<div className="notice notice-error" role="alert">{error}</div>}{note&&<div className="notice">{note}</div>}{createdOrder&&<p className="muted">Đơn đang sử dụng: {createdOrder.code} ({createdOrder.id})</p>}</div><aside className="summary-card"><h2>Đơn hàng</h2><div className="stack-small">{items.map(item=><div className="summary-row" key={item.key}><span>{item.name} ({item.size}) ×{item.quantity}</span><strong>{formatVnd((item.basePrice+item.sizeExtra+item.toppings.reduce((n,t)=>n+t.price,0))*item.quantity)}</strong></div>)}</div><div className="summary-row summary-final"><span>Tổng thanh toán</span><strong>{formatVnd(total)}</strong></div><button className="btn btn-primary btn-wide" disabled={pending} onClick={()=>void submit()}>{pending?"Đang xử lý...":`Xác nhận · ${formatVnd(total)}`}</button><Link href="/cart" className="text-link center">← Quay lại giỏ</Link><small>Trong demo không có giao dịch tiền thật. Backend phải xác nhận giá, kho và trạng thái.</small></aside></div></>;
}
