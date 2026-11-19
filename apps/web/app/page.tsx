"use client";
import {useEffect,useState} from "react";
import type {Product} from "@/lib/types";
import {DEMO_MODE,getProducts} from "@/lib/api";
import {ProductCard} from "@/components/ProductCard";

type TestView = "normal"|"empty"|"error";
export default function MenuPage(){
  const [products,setProducts]=useState<Product[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [testView,setTestView]=useState<TestView>("normal");
  async function load(){setLoading(true);setError("");try{setProducts(await getProducts());}catch(e){setError(e instanceof Error?e.message:"Không thể tải thực đơn.");}finally{setLoading(false);}}
  useEffect(()=>{void load();},[]);
  const shown = DEMO_MODE && testView==="empty" ? [] : products;
  const shownError = DEMO_MODE && testView==="error" ? "Đây là trạng thái lỗi GIẢ LẬP cho Task 3 (không phải lỗi API thật)." : error;
  return <>
    <section className="hero"><div><span className="overline">BREWLITE · FRESH EVERY DAY</span><h1>Một ly cà phê ngon,<br/><em>một ngày thật vui.</em></h1><p>Chọn món yêu thích, thêm size và topping, thanh toán trong vài bước.</p><a className="btn btn-primary" href="#products">Khám phá Menu →</a></div><div className="hero-art" aria-hidden="true"><span>☕</span><div>freshly brewed<br/>for you</div></div></section>
    <section id="products" className="section-heading"><div><span className="overline">DÀNH CHO BẠN</span><h2>Thực đơn BrewLite</h2><p>Chọn món và tùy chỉnh theo sở thích của bạn.</p></div></section>
    {DEMO_MODE && <div className="test-bar"><span>Chứng minh UI Task 3 (demo):</span><label htmlFor="test-view">Trạng thái</label><select id="test-view" value={testView} onChange={e=>setTestView(e.target.value as TestView)}><option value="normal">Menu có dữ liệu</option><option value="empty">Không có sản phẩm</option><option value="error">Lỗi giả lập</option></select><button className="btn btn-ghost btn-small" onClick={()=>void load()}>Tải lại</button></div>}
    {loading ? <div className="product-grid" aria-label="Đang tải sản phẩm">{Array.from({length:6},(_,i)=><div key={i} className="skeleton product-card" aria-hidden="true"/>)}</div>
    : shownError ? <div className="empty-state" role="alert"><div className="empty-icon">⚠</div><h3>Không tải được thực đơn</h3><p>{shownError}</p><button className="btn btn-primary" onClick={()=>{setTestView("normal");void load();}}>Thử lại</button></div>
    : !shown.length ? <div className="empty-state"><div className="empty-icon">☕</div><h3>Chưa có sản phẩm</h3><p>Thực đơn đang được cập nhật. Hãy quay lại sau nhé.</p></div>
    : <div className="product-grid">{shown.map(p=><ProductCard key={p.id} product={p}/>)}</div>}
  </>;
}
