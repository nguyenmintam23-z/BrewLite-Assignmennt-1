import type { Metadata } from "next";
import type { ReactNode } from "react";
import {CartProvider} from "@/components/CartProvider";
import {AuthProvider} from "@/components/AuthProvider";
import {AppHeader} from "@/components/AppHeader";
import "./globals.css";
export const metadata: Metadata = {title:"BrewLite | Đặt cà phê",description:"BrewLite - đặt đồ uống và thanh toán không tiền mặt"};
export default function RootLayout({children}:{children:ReactNode}){
  return <html lang="vi"><body><AuthProvider><CartProvider><AppHeader/><main className="container main-content">{children}</main><footer className="footer"><div className="container">BrewLite · Assignment 1 · Phần frontend của Phúc (Task 3, 4, 5 và UI Task 9)</div></footer></CartProvider></AuthProvider></body></html>;
}
