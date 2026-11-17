"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {useParams,useRouter} from "next/navigation";
import {useCart} from "@/components/CartProvider";
import {getProduct} from "@/lib/api";
import {formatVnd,makeItem,unitPrice} from "@/lib/pricing";
import type {Product,SizeCode} from "@/lib/types";
export default function ProductDetail(){
  const params=useParams<{id:string}>();const router=useRouter();const {add}=useCart();
  const [product,setProduct]=useState<Product|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
  const [size,setSize]=useState<SizeCode>("M");const [toppingIds,setToppingIds]=useState<string[]>([]);const [qty,setQty]=useState(1);
  useEffect(()=>{let active=true;setLoading(true);getProduct(params.id).then(p=>{if(active){setProduct(p);if(p)setSize(p.sizes.find(s=>s.code==="M")?.code ?? p.sizes[0]?.code ?? "S");}}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Không tải được sản phẩm");}).finally(()=>{if(active)setLoading(false);});return()=>{active=false};},[params.id]);
  const item=useMemo(()=>{if(!product)return null;try{return makeItem(product,size,toppingIds,qty);}catch{return null;}},[product,size,toppingIds,qty]);
  if(loading)return <div className="empty-state"><p>Đang tải chi tiết sản phẩm...</p></div>;
  if(error)return <div className="empty-state" role="alert"><h2>Có lỗi xảy ra</h2><p>{error}</p><Link href="/" className="btn btn-primary">Về Menu</Link></div>;
  if(!product || !item)return <div className="empty-state"><h2>Không tìm thấy sản phẩm</h2><Link href="/" className="btn btn-primary">Về Menu</Link></div>;
  const toggle=(id:string)=>setToppingIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  return <><div className="breadcrumbs"><Link href="/">Menu</Link><span>/</span>{product.name}</div><div className="detail-layout"><div className="detail-visual"><img src={product.imageUrl} alt={product.name}/></div><div className="detail-info"><span className="overline">{product.category}</span><h1>{product.name}</h1><p className="muted">{product.description}</p><p className="price-large">{formatVnd(product.price)} <small>giá cơ bản</small></p>
    <fieldset className="selection"><legend>Chọn size</legend><div className="sizes">{product.sizes.map(option=><label key={option.code} className={`choice ${size===option.code?"selected":""}`}><input type="radio" name="size" value={option.code} checked={size===option.code} onChange={()=>setSize(option.code)}/><strong>{option.code}</strong><small>{option.extra?`+${formatVnd(option.extra)}`:"Tiêu chuẩn"}</small></label>)}</div></fieldset>
    <fieldset className="selection"><legend>Topping (tùy chọn)</legend>{product.toppings.length ? <div className="toppings">{product.toppings.map(t=><label key={t.id} className="topping"><span><input type="checkbox" checked={toppingIds.includes(t.id)} onChange={()=>toggle(t.id)}/>{t.name}</span><span>+{formatVnd(t.price)}</span></label>)}</div> : <p className="muted">Sản phẩm này chưa có topping.</p>}</fieldset>
    <div className="quantity-control"><strong>Số lượng</strong><div className="stepper"><button aria-label="Giảm số lượng" onClick={()=>setQty(q=>Math.max(1,q-1))} disabled={qty<=1}>−</button><span>{qty}</span><button aria-label="Tăng số lượng" onClick={()=>setQty(q=>Math.min(99,q+1))} disabled={qty>=99}>+</button></div></div>
    <div className="detail-summary"><span>Đơn giá: {formatVnd(unitPrice(item))}</span><strong>Tạm tính: {formatVnd(unitPrice(item)*qty)}</strong></div>
    <button className="btn btn-primary btn-wide" disabled={product.stock===0} onClick={()=>{add(item);router.push("/cart");}}>{product.stock===0?"Hết hàng":"Thêm vào giỏ hàng →"}</button>
  </div></div></>;
}
