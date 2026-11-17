"use client";
import {createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode} from "react";
import type {User} from "@/lib/types";
import * as api from "@/lib/api";
const KEY = "brewlite_a1_ui_identity_v1";

type AuthCtx = {
  user:User|null;ready:boolean;
  signIn:(email:string,password:string)=>Promise<void>;
  signUp:(email:string,password:string)=>Promise<void>;
  signOut:()=>Promise<void>;
};
const Context = createContext<AuthCtx|null>(null);
export function AuthProvider({children}:{children:ReactNode}) {
  const [user,setUser] = useState<User|null>(null);
  const [ready,setReady] = useState(false);
  useEffect(()=>{
    try {const v = sessionStorage.getItem(KEY);if(v) {const parsed = JSON.parse(v) as User;if(parsed.email)setUser(parsed);} } catch {}
    setReady(true);
  },[]);
  const signIn = useCallback(async(email:string,password:string)=>{
    await api.login(email,password);
    const next = {email};
    sessionStorage.setItem(KEY,JSON.stringify(next));
    setUser(next);
  },[]);
  const signUp = useCallback(async(email:string,password:string)=>{
    await api.register(email,password);
    if (api.DEMO_MODE) { /* demo không tạo tài khoản thật; chỉ cấp phiên UI */ }
    else await api.login(email,password);
    const next = {email};
    sessionStorage.setItem(KEY,JSON.stringify(next));
    setUser(next);
  },[]);
  const signOut = useCallback(async()=>{
    await api.logout(); sessionStorage.removeItem(KEY); setUser(null);
  },[]);
  const value = useMemo(()=>({user,ready,signIn,signUp,signOut}),[user,ready,signIn,signUp,signOut]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() {const v=useContext(Context);if(!v)throw new Error("AuthProvider missing");return v;}
