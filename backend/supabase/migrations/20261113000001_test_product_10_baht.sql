insert into public.products (
  name,
  slug,
  category,
  description,
  price,
  sku,
  stock_quantity,
  is_active
)
values (
  'สินค้าเพื่อทดสอบการชำระเงิน 10 บาท',
  'payment-test-10-baht',
  'สินค้าเพื่อทดสอบ',
  'สินค้าทดลองสำหรับตรวจสอบขั้นตอนสั่งซื้อและชำระเงิน PromptPay ยอดขั้นต่ำตาม Stripe',
  10.00,
  'TEST-PAYMENT-10-BAHT',
  1000,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  price = excluded.price,
  sku = excluded.sku,
  stock_quantity = excluded.stock_quantity,
  is_active = excluded.is_active,
  updated_at = now();
