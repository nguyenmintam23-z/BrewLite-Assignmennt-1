"use client";
import Link from "next/link";
import {useCart} from "./CartProvider";
import {useAuth} from "./AuthProvider";
import {DEMO_MODE} from "@/lib/api";
import {useRouter} from "next/navigation";
export function AppHeader() {
  const {count} = useCart();const {user,signOut} = useAuth();const router=useRouter();
  return <>
    <header className="header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label="BrewLite - Về Menu"><span className="brand-mark">B</span><span>BrewLite<small>COFFEE & TEA</small></span></Link>
        <nav className="nav" aria-label="Điều hướng chính">
          <Link href="/">Menu</Link>
          <Link href="/orders">Đơn hàng</Link>
          <Link href="/cart" className="cart-nav">Giỏ hàng <span className="cart-badge" aria-label={`${count} sản phẩm trong giỏ`}>{count}</span></Link>
        </nav>
        <div className="account">
          {user ? <><span className="account-email" title={user.email}>{user.email}</span><button className="btn btn-ghost btn-small" onClick={async()=>{await signOut();router.push("/");}}>Đăng xuất</button></> : <Link className="btn btn-primary btn-small" href="/login">Đăng nhập</Link>}
        </div>
      </div>
    </header>
    {DEMO_MODE && <div className="demo-ribbon">CHẾ ĐỘ DEMO FRONTEND — DỮ LIỆU GIẢ LẬP, KHÔNG PHẢI THANH TOÁN THẬT</div>}
  </>;
}
