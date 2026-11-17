import type {CartItem} from "./types";
export function addCartItem(items:CartItem[],newItem:CartItem):CartItem[]{
  const existing=items.find(item=>item.key===newItem.key);
  return existing ? items.map(item=>item.key===newItem.key?{...item,quantity:Math.min(99,item.quantity+newItem.quantity)}:item) : [...items,newItem];
}
export function updateCartQuantity(items:CartItem[],key:string,qty:number):CartItem[]{
  const next=Number.isFinite(qty)?Math.max(1,Math.min(99,Math.trunc(qty))):1;
  return items.map(item=>item.key===key?{...item,quantity:next}:item);
}
export function removeCartItem(items:CartItem[],key:string):CartItem[]{return items.filter(item=>item.key!==key);}
