insert into public.products (
  name, slug, category, description, price, compare_at_price, sku,
  stock_quantity, image_url, warranty_months, is_active
)
values
  (
    'แผงโซลาร์เซลล์ LONGi Hi-MO 6 580W',
    'longi-himo-6-580w',
    'แผงโซลาร์เซลล์',
    'แผงโซลาร์เซลล์ Monocrystalline เทคโนโลยี HPBC ประสิทธิภาพ 22.5% รับประกัน 25 ปี',
    4290, 4890, 'SKU-LG-580W', 120, '/images/products/panel.jpg', 300, true
  ),
  (
    'อินเวอร์เตอร์ Huawei SUN2000-5KTL-L1',
    'huawei-sun2000-5ktl',
    'อินเวอร์เตอร์',
    'อินเวอร์เตอร์ระบบ 1 Phase กำลัง 5 kW ประสิทธิภาพ 98.4% รองรับระบบ Optimizer รับประกันศูนย์ไทย 10 ปี',
    32500, 36000, 'SKU-HW-5KTL', 18, '/images/products/inverter-huawei.jpg', 120, true
  ),
  (
    'แบตเตอรี่ Huawei LUNA2000 5kWh Smart String ESS',
    'huawei-luna2000-5kwh',
    'แบตเตอรี่',
    'โมดูลแบตเตอรี่ลิเธียมฟอสเฟต (LFP) 100% DOD ขยายความจุได้ถึง 30kWh',
    68900, 75000, 'SKU-HW-LUNA5K', 8, '/images/products/battery.jpg', 120, true
  ),
  (
    'ชุดอุปกรณ์ยึดจับหลังคาซีแพคและสายไฟ PV ครบเซ็ต',
    'mounting-cpack-pv-kit',
    'อุปกรณ์ติดตั้ง',
    'ชุดรางอลูมิเนียมเกรด 6005-T5 สกรูสแตนเลส 304 สายไฟ PV1-F เบอร์ 4 และข้อต่อ MC4',
    12900, 14500, 'SKU-MNT-CPACK', 35, '/images/products/mounting-kit.jpg', 12, true
  )
on conflict do nothing;
