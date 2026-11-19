import Link from "next/link";
import type {Product} from "@/lib/types";
import {formatVnd} from "@/lib/pricing";
export function ProductCard({product}:{product:Product}){
  return <article className="product-card">
    <Link href={`/products/${encodeURIComponent(product.id)}`} className="product-image-wrap" aria-label={`Xem ${product.name}`}>
      {/* Ảnh SVG nội bộ ở chế độ demo; API thật có thể trả ảnh ngoài miền. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.imageUrl} alt={product.name} className="product-image" loading="lazy"/>
    </Link>
    <div className="product-body"><span className="eyebrow">{product.category}</span><h3>{product.name}</h3><p>{product.description}</p>
    <div className="product-footer"><strong>{formatVnd(product.price)}</strong><Link className="btn btn-primary btn-small" href={`/products/${encodeURIComponent(product.id)}`}>Chọn món</Link></div>
    </div>
  </article>;
}
