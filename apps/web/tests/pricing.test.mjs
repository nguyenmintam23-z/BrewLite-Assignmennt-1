import test from 'node:test';
import assert from 'node:assert/strict';
import {cartCount,cartKey,cartTotal,lineTotal,makeItem,unitPrice} from '../lib/pricing.ts';
import {addCartItem,updateCartQuantity,removeCartItem} from '../lib/cart-logic.ts';
const prod={id:'1',name:'Cà phê sữa',price:35000,imageUrl:'/img/milk-coffee.svg',description:'',category:'Cafe',stock:30,
  sizes:[{code:'S',extra:0},{code:'M',extra:5000},{code:'L',extra:10000}],
  toppings:[{id:'cream',name:'Kem',price:9000},{id:'pearl',name:'Trân châu',price:7000}]};
test('Task 4: chọn size M + 2 topping tính đúng đơn giá',()=>{
  const item=makeItem(prod,'M',['cream','pearl'],2);
  assert.equal(unitPrice(item),56000);
  assert.equal(lineTotal(item),112000);
});
test('Task 4: size S không topping giữ giá gốc',()=>{
  assert.equal(unitPrice(makeItem(prod,'S',[],1)),35000);
});
test('Task 5: tổng giỏ và badge là tổng số lượng',()=>{
  const items=[makeItem(prod,'M',['cream'],2),makeItem(prod,'S',[],1)];
  assert.equal(cartCount(items),3);
  assert.equal(cartTotal(items),133000);
});
test('Task 5: khóa giỏ không phụ thuộc thứ tự topping',()=>{
  const a=makeItem(prod,'M',['pearl','cream'],1);
  const b=makeItem(prod,'M',['cream','pearl'],1);
  assert.equal(cartKey(a.productId,a.size,a.toppings),cartKey(b.productId,b.size,b.toppings));
});
test('Task 4: từ chối size không thuộc sản phẩm',()=>{
  assert.throws(()=>makeItem({...prod,sizes:[{code:'S',extra:0}]},'L',[],1));
});

test('Task 5: thêm cùng cấu hình gộp số lượng, khác size giữ dòng riêng',()=>{
  const a=makeItem(prod,'M',[],1),b=makeItem(prod,'S',[],1);
  let items=addCartItem([],a);
  items=addCartItem(items,a);
  items=addCartItem(items,b);
  assert.equal(items.length,2);
  assert.equal(items[0].quantity,2);
});
test('Task 5: sửa số lượng và xóa dòng giỏ',()=>{
  const item=makeItem(prod,'M',[],1);
  const changed=updateCartQuantity([item],item.key,5);
  assert.equal(changed[0].quantity,5);
  assert.deepEqual(removeCartItem(changed,item.key),[]);
});
