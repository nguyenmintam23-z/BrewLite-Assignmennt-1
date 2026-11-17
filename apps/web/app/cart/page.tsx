"use client";
import Link from "next/link";
import {useCart} from "@/components/CartProvider";
import {formatVnd,lineTotal,unitPrice} from "@/lib/pricing";
export default function CartPage(){
  const {items,ready,total,update,remove}=useCart();
  if(!ready)return <p>Đang tải giỏ hàng...</p>;
  return <><div className="page-heading"><span className="overline">YOUR ORDER</span><h1>Giỏ hàng của bạn</h1><p>Kiểm tra các món trước khi thanh toán.</p></div>
    {!items.length?<div className="empty-state"><div className="empty-icon">🛒</div><h2>Giỏ hàng đang trống</h2><p>Hãy chọn một món ngon từ thực đơn.</p><Link href="/" className="btn btn-primary">Xem Menu</Link></div>
    :<div className="checkout-layout"><section className="stack">{items.map(item=><article key={item.key} className="cart-item"><img src={item.imageUrl} alt={item.name}/><div className="cart-item-info"><h3>{item.name}</h3><p className="muted">Size {item.size}{item.toppings.length?` · ${item.toppings.map(t=>t.name).join(", ")}`:" · Không topping"}</p><p>{formatVnd(unitPrice(item))} / ly</p><div className="cart-actions"><div className="stepper"><button aria-label={`Giảm ${item.name}`} disabled={item.quantity<=1} onClick={()=>update(item.key,item.quantity-1)}>−</button><span>{item.quantity}</span><button aria-label={`Tăng ${item.name}`} disabled={item.quantity>=99} onClick={()=>update(item.key,item.quantity+1)}>+</button></div><button className="link-danger" onClick={()=>remove(item.key)}>Xóa</button></div></div><strong className="cart-line-total">{formatVnd(lineTotal(item))}</strong></article>)}<Link href="/" className="text-link">← Tiếp tục chọn món</Link></section>
      <aside className="summary-card"><h2>Thông tin đơn hàng</h2><div className="summary-row"><span>Tạm tính</span><strong>{formatVnd(total)}</strong></div><div className="summary-row"><span>Phí giao hàng</span><span>Nhận tại quầy</span></div><div className="summary-row summary-final"><span>Tổng cộng</span><strong>{formatVnd(total)}</strong></div><Link href="/checkout" className="btn btn-primary btn-wide">Tiến hành thanh toán →</Link><small>Giá cuối cùng được backend xác nhận khi tạo đơn.</small></aside></div>}
  </>;
}
