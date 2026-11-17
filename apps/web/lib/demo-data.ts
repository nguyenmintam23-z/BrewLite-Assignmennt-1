import type { Product, SizeOption, Topping } from "./types";

const sizes: SizeOption[] = [
  { code: "S", extra: 0 }, { code: "M", extra: 5000 }, { code: "L", extra: 10000 },
];
const toppings: Topping[] = [
  { id: "pearl", name: "Trân châu", price: 7000 },
  { id: "cream", name: "Kem sữa", price: 9000 },
  { id: "jelly", name: "Thạch", price: 6000 },
];
export const demoProducts: Product[] = [
  { id:"1",name:"Cà phê sữa",description:"Cà phê đậm đà kết hợp cùng sữa đặc.",price:35000,imageUrl:"/img/milk-coffee.svg",category:"Cà phê",stock:50,sizes,toppings },
  { id:"2",name:"Americano",description:"Espresso pha với nước nóng, thanh nhẹ.",price:40000,imageUrl:"/img/americano.svg",category:"Cà phê",stock:40,sizes,toppings },
  { id:"3",name:"Cappuccino",description:"Espresso, sữa nóng và lớp bọt mịn.",price:45000,imageUrl:"/img/cappuccino.svg",category:"Cà phê",stock:30,sizes,toppings },
  { id:"4",name:"Trà đào",description:"Trà thơm dịu cùng hương đào tươi mát.",price:39000,imageUrl:"/img/peach-tea.svg",category:"Trà",stock:35,sizes,toppings },
  { id:"5",name:"Latte",description:"Cà phê sữa mềm mại, dễ uống.",price:44000,imageUrl:"/img/latte.svg",category:"Cà phê",stock:28,sizes,toppings },
  { id:"6",name:"Trà matcha",description:"Matcha thơm, vị thanh, kết hợp sữa.",price:49000,imageUrl:"/img/matcha.svg",category:"Trà",stock:21,sizes,toppings },
];
