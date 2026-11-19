"use client";
import {createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode} from "react";
import type {User} from "@/lib/types";
import * as api from "@/lib/api";
import {ApiError} from "@/lib/api";
const KEY = "brewlite_a1_ui_identity_v1";

type AuthCtx = {
  user:User|null;ready:boolean;error:string|null;
  signIn:(email:string,password:string)=>Promise<void>;
  signUp:(email:string,password:string)=>Promise<void>;
  signOut:()=>Promise<void>;
};
const Context = createContext<AuthCtx|null>(null);
export function AuthProvider({children}:{children:ReactNode}) {
  const [user,setUser] = useState<User|null>(null);
  const [ready,setReady] = useState(false);
  const [error,setError] = useState<string|null>(null);
  useEffect(()=>{
    let active=true;
    const onUnauthorized=()=>{
      setUser(null);
      setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    };
    window.addEventListener("brewlite:unauthorized",onUnauthorized);

    if(api.DEMO_MODE){
      const saved=sessionStorage.getItem(KEY);
      if(saved){
        try {
          const parsed=JSON.parse(saved) as User;
          if(parsed.email)setUser(parsed);
        } catch {
          sessionStorage.removeItem(KEY);
        }
      }
      setReady(true);
    } else {
      void api.getCurrentUser().then((current)=>{
        if(active)setUser(current);
      }).catch((cause:unknown)=>{
        if(!active)return;
        if(cause instanceof ApiError&&cause.status===401){
          setUser(null);
          return;
        }
        setError(cause instanceof Error?cause.message:"Không thể khôi phục phiên đăng nhập.");
      }).finally(()=>{
        if(active)setReady(true);
      });
    }
    return ()=>{
      active=false;
      window.removeEventListener("brewlite:unauthorized",onUnauthorized);
    };
  },[]);
  const signIn = useCallback(async(email:string,password:string)=>{
    const next=await api.login(email,password);
    if(api.DEMO_MODE)sessionStorage.setItem(KEY,JSON.stringify(next));
    setError(null);
    setUser(next);
  },[]);
  const signUp = useCallback(async(email:string,password:string)=>{
    await api.register(email,password);
    const next=api.DEMO_MODE?{email}:await api.login(email,password);
    if(api.DEMO_MODE)sessionStorage.setItem(KEY,JSON.stringify(next));
    setError(null);
    setUser(next);
  },[]);
  const signOut = useCallback(async()=>{
    await api.logout();
    if(api.DEMO_MODE)sessionStorage.removeItem(KEY);
    setError(null);
    setUser(null);
  },[]);
  const value = useMemo(()=>({user,ready,error,signIn,signUp,signOut}),[user,ready,error,signIn,signUp,signOut]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() {const v=useContext(Context);if(!v)throw new Error("AuthProvider missing");return v;}
