"use client";
import {createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode} from "react";
import type {CartItem} from "@/lib/types";
import {cartCount,cartTotal} from "@/lib/pricing";
import {addCartItem,updateCartQuantity,removeCartItem} from "@/lib/cart-logic";
const KEY = "brewlite_a1_cart_v1";

type CartCtx = {
  items:CartItem[];ready:boolean;count:number;total:number;
  add:(item:CartItem)=>void; update:(key:string,quantity:number)=>void;
  remove:(key:string)=>void; clear:()=>void;
};
const Context = createContext<CartCtx|null>(null);
export function CartProvider({children}:{children:ReactNode}) {
  const [items,setItems] = useState<CartItem[]>([]);
  const [ready,setReady] = useState(false);
  useEffect(()=>{
    try {const v=JSON.parse(localStorage.getItem(KEY)??"[]");if(Array.isArray(v))setItems(v);}catch{}
    setReady(true);
  },[]);
  useEffect(()=>{if(ready)localStorage.setItem(KEY,JSON.stringify(items));},[items,ready]);
  const add=useCallback((item:CartItem)=>setItems(old=>addCartItem(old,item)),[]);
  const update=useCallback((key:string,quantity:number)=>setItems(old=>updateCartQuantity(old,key,quantity)),[]);
  const remove=useCallback((key:string)=>setItems(old=>removeCartItem(old,key)),[]);
  const clear=useCallback(()=>setItems([]),[]);
  const count=useMemo(()=>cartCount(items),[items]);
  const total=useMemo(()=>cartTotal(items),[items]);
  return <Context.Provider value={{items,ready,count,total,add,update,remove,clear}}>{children}</Context.Provider>;
}
export function useCart(){const v=useContext(Context);if(!v)throw new Error("CartProvider missing");return v;}
