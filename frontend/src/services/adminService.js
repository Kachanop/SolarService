import { supabase } from '../lib/supabase.js';

// Default mock data for rich demonstration and fallback if tables don't exist yet in Supabase
const defaultMockData = {
  packages: [
    {
      id: 'pkg-1',
      name: 'แพ็กเกจเริ่มต้น 3 kW',
      slug: 'package-3kw',
      system_size_kw: 3.0,
      price: 89000,
      description: 'เหมาะสำหรับบ้านขนาดเล็ก ค่าไฟไม่เกิน 3,000 บาท/เดือน',
      inverter_brand: 'Huawei SUN2000-3KTL',
      panel_brand: 'LONGi Hi-MO 6 (6 แผง)',
      features: ['แผงโซลาร์เซลล์ 6 แผง 580W', 'อินเวอร์เตอร์ Huawei 3 kW', 'รับประกันแผง 25 ปี', 'รับประกันอินเวอร์เตอร์ 10 ปี', 'ฟรีล้างแผง 2 ปี'],
      popular: false,
      is_active: true,
      created_at: '2026-08-10T10:00:00Z',
    },
    {
      id: 'pkg-2',
      name: 'แพ็กเกจยอดนิยม 5 kW',
      slug: 'package-5kw',
      system_size_kw: 5.0,
      price: 149000,
      description: 'ลงตัวสำหรับครอบครัวทั่วไป ค่าไฟ 3,000 - 6,000 บาท/เดือน ประหยัดค่าไฟคุ้มค่า',
      inverter_brand: 'Huawei SUN2000-5KTL',
      panel_brand: 'LONGi Hi-MO 6 (10 แผง)',
      features: ['แผงโซลาร์เซลล์ 10 แผง 580W', 'อินเวอร์เตอร์ Huawei 5 kW', 'ระบบ Smart Power Sensor', 'รับประกันแผง 25 ปี', 'รับประกันงานติดตั้ง 5 ปี', 'บริการล้างแผงฟรี 2 ปีแรก'],
      popular: true,
      is_active: true,
      created_at: '2026-08-12T10:00:00Z',
    },
    {
      id: 'pkg-3',
      name: 'แพ็กเกจครอบครัวใหญ่ 10 kW',
      slug: 'package-10kw',
      system_size_kw: 10.0,
      price: 269000,
      description: 'รองรับบ้านขนาดใหญ่ เปิดแอร์หลายตัว หรือมีรถยนต์ไฟฟ้า EV ค่าไฟเกิน 7,000 บาท/เดือน',
      inverter_brand: 'Huawei SUN2000-10KTL',
      panel_brand: 'LONGi Hi-MO 6 (18 แผง)',
      features: ['แผงโซลาร์เซลล์ 18 แผง 580W', 'อินเวอร์เตอร์ Huawei 10 kW 3 Phase', 'รองรับชาร์จรถยนต์ EV', 'รับประกันแผง 25 ปี', 'รับประกันอินเวอร์เตอร์ 10 ปี', 'ล้างแผงและตรวจเช็คฟรี 3 ปี'],
      popular: false,
      is_active: true,
      created_at: '2026-08-15T10:00:00Z',
    },
    {
      id: 'pkg-4',
      name: 'แพ็กเกจ Hybrid Storage 5kW + Battery 5kWh',
      slug: 'package-hybrid-5kw',
      system_size_kw: 5.0,
      price: 229000,
      description: 'ระบบไฮบริดพร้อมแบตเตอรี่ มีไฟใช้ตลอด 24 ชม. แม้ไฟดับกลางคืน',
      inverter_brand: 'Huawei SUN2000-5KTL-L1',
      panel_brand: 'LONGi 580W + LUNA2000 Battery',
      features: ['อินเวอร์เตอร์ไฮบริด 5 kW', 'แบตเตอรี่ Huawei LUNA 5 kWh', 'แผงโซลาร์ 10 แผง', 'ระบบสำรองไฟดับอัตโนมัติ (Backup Box)', 'รับประกันแบตเตอรี่ 10 ปี'],
      popular: false,
      is_active: true,
      created_at: '2026-09-01T10:00:00Z',
    },
  ],

  warranties: [
    {
      id: 'war-1',
      warranty_number: 'WR-2026-0081',
      customer_id: 'cust-1',
      customer_name: 'คุณสมชาย ใจดี',
      customer_phone: '081-234-5678',
      equipment_type: 'inverter',
      equipment_model: 'Huawei SUN2000-5KTL',
      serial_number: 'HW-INV-88392104',
      installation_number: 'IN-7C89F1A234',
      warranty_start: '2025-06-15',
      warranty_end: '2035-06-15',
      status: 'active',
      notes: 'รับประกันศูนย์ Huawei Thailand 10 ปีเต็ม ครอบคลุมเมนบอร์ดและอินเวอร์เตอร์',
    },
    {
      id: 'war-2',
      warranty_number: 'WR-2026-0082',
      customer_id: 'cust-1',
      customer_name: 'คุณสมชาย ใจดี',
      customer_phone: '081-234-5678',
      equipment_type: 'solar_panel',
      equipment_model: 'LONGi Hi-MO 6 580W (10 แผง)',
      serial_number: 'LG-PNL-202506-01~10',
      installation_number: 'IN-7C89F1A234',
      warranty_start: '2025-06-15',
      warranty_end: '2050-06-15',
      status: 'active',
      notes: 'รับประกันประสิทธิภาพการผลิตไฟเกิน 84.8% นาน 25 ปี',
    },
    {
      id: 'war-3',
      warranty_number: 'WR-2026-0083',
      customer_id: 'cust-2',
      customer_name: 'คุณนภา รุ่งอรุณ',
      customer_phone: '089-876-5432',
      equipment_type: 'battery',
      equipment_model: 'Huawei LUNA2000 5kWh',
      serial_number: 'HW-BAT-99482711',
      installation_number: 'IN-6B33D98E12',
      warranty_start: '2025-08-20',
      warranty_end: '2035-08-20',
      status: 'active',
      notes: 'รับประกันโมดูลแบตเตอรี่ 10 ปีหรือ 6,000 รอบชาร์จ',
    },
    {
      id: 'war-4',
      warranty_number: 'WR-2026-0084',
      customer_id: 'cust-3',
      customer_name: 'คุณวิชัย พัฒนกุล',
      customer_phone: '084-555-4321',
      equipment_type: 'installation_work',
      equipment_model: 'งานติดตั้งโครงสร้างหลังคาและระบบสายไฟ',
      serial_number: 'INST-ROOF-2024-09',
      installation_number: 'IN-5A11C20098',
      warranty_start: '2024-09-10',
      warranty_end: '2026-11-10',
      status: 'expiring_soon',
      notes: 'รับประกันการรั่วซึมของหลังคาและระบบไฟฟ้า 2 ปี ใกล้ครบกำหนด',
    },
  ],

  maintenance_reminders: [
    {
      id: 'maint-1',
      customer_id: 'cust-1',
      customer_name: 'คุณสมชาย ใจดี',
      customer_phone: '081-234-5678',
      address: '99/12 หมู่บ้านกรีนวิลล์ บางนา-ตราด กม.10',
      title: 'รอบล้างแผงโซลาร์เซลล์ประจำ 6 เดือน (รอบที่ 2)',
      reminder_type: 'panel_cleaning',
      frequency_months: 6,
      due_date: '2026-11-15',
      status: 'pending',
      last_notified_at: null,
      notes: 'แผงอาจมีฝุ่นละอองสะสมเนื่องจากอยู่ใกล้ถนนใหญ่ ล้างแผงจะช่วยเพิ่มประสิทธิภาพได้ 15-20%',
    },
    {
      id: 'maint-2',
      customer_id: 'cust-2',
      customer_name: 'คุณนภา รุ่งอรุณ',
      customer_phone: '089-876-5432',
      address: '45/8 ซอยสุขุมวิท 65 แขวงพระโขนงเหนือ',
      title: 'ตรวจเช็คระบบไฟฟ้าและอินเวอร์เตอร์ประจำปี (รอบ 1 ปี)',
      reminder_type: 'inverter_check',
      frequency_months: 12,
      due_date: '2026-11-20',
      status: 'notified',
      last_notified_at: '2026-11-01T09:30:00Z',
      notes: 'ส่งข้อความและอีเมลแจ้งเตือนลูกค้าแล้ว ลูกค้ารับทราบเตรียมยืนยันวันนัด',
    },
    {
      id: 'maint-3',
      customer_id: 'cust-3',
      customer_name: 'คุณวิชัย พัฒนกุล',
      customer_phone: '084-555-4321',
      address: '180 ถนนราชพฤกษ์ ต.บางกร่าง อ.เมือง นนทบุรี',
      title: 'รอบล้างแผงโซลาร์เซลล์และตรวจวัดกระแสไฟ',
      reminder_type: 'panel_cleaning',
      frequency_months: 6,
      due_date: '2026-12-05',
      status: 'scheduled',
      last_notified_at: '2026-10-28T14:00:00Z',
      notes: 'นัดหมายช่างเข้าบริการวันที่ 5 ธ.ค. 2569 เวลา 10:00 น.',
    },
    {
      id: 'maint-4',
      customer_id: 'cust-4',
      customer_name: 'คุณกานดา สุวรรณรัตน์',
      customer_phone: '086-123-9999',
      address: '77/3 ต.หนองปรือ อ.บางละมุง จ.ชลบุรี',
      title: 'ตรวจสุขภาพแบตเตอรี่ Huawei LUNA 6 เดือน',
      reminder_type: 'battery_health',
      frequency_months: 6,
      due_date: '2026-10-15',
      status: 'completed',
      last_notified_at: '2026-10-10T08:00:00Z',
      notes: 'ทีมช่างเข้าตรวจสุขภาพแบตเตอรี่เรียบร้อย State of Health (SOH) 99.4%',
    },
  ],

  support_tickets: [
    {
      id: 'tk-1',
      ticket_number: 'TK-1001',
      customer_id: 'cust-1',
      customer_name: 'คุณสมชาย ใจดี',
      customer_phone: '081-234-5678',
      title: 'แอป FusionSolar แสดงสถานะ Inverter Offline ชั่วคราว',
      category: 'inverter_error',
      priority: 'high',
      status: 'in_progress',
      assigned_to_name: 'ช่างธนกร โซลาร์โปร',
      description: 'แอปบนมือถือขึ้นเตือนว่าขาดการเชื่อมต่อ WiFi เมื่อเช้านี้ ตัวเครื่องไฟเขียวยังกระพริบปกติ',
      resolution_notes: 'ช่างแนะนำการรีเซ็ต WiFi Dongle ผ่านทางโทรศัพท์แล้ว กำลังติดตามผล',
      created_at: '2026-11-01T08:15:00Z',
    },
    {
      id: 'tk-2',
      ticket_number: 'TK-1002',
      customer_id: 'cust-3',
      customer_name: 'คุณวิชัย พัฒนกุล',
      customer_phone: '084-555-4321',
      title: 'สอบถามเรื่องเอกสารขออนุญาตขนานไฟกับการไฟฟ้านครหลวง (กฟน.)',
      category: 'inquiry',
      priority: 'medium',
      status: 'open',
      assigned_to_name: 'เจ้าหน้าที่แอดมิน',
      description: 'ต้องการทราบความคืบหน้าเรื่องมิเตอร์ TOU และการติดตั้งมิเตอร์สองทิศทาง',
      resolution_notes: '',
      created_at: '2026-11-01T11:40:00Z',
    },
    {
      id: 'tk-3',
      ticket_number: 'TK-1003',
      customer_id: 'cust-2',
      customer_name: 'คุณนภา รุ่งอรุณ',
      customer_phone: '089-876-5432',
      title: 'มีกิ่งไม้บังแสงแผงโซลาร์เซลล์แถวทิศใต้ อยากปรึกษางานตัดแต่ง',
      category: 'repair',
      priority: 'low',
      status: 'resolved',
      assigned_to_name: 'ช่างเอกชัย',
      description: 'ช่วงบ่ายต้นไม้ข้างบ้านมีกิ่งยื่นมาบังแดดบางส่วน ส่งผลให้ผลิตไฟได้ลดลง',
      resolution_notes: 'ทีมช่างเข้าตัดแต่งกิ่งไม้ให้เรียบร้อยเมื่อ 30 ต.ค. และค่าวัตต์กลับมาปกติ',
      created_at: '2026-10-29T14:20:00Z',
      resolved_at: '2026-10-30T16:00:00Z',
    },
  ],

  cms_banners: [
    {
      id: 'ban-1',
      title: 'พลังงานสะอาด คืนทุนไวใน 3-4 ปี',
      subtitle: 'ติดตั้งโซลาร์รูฟท็อปกับ SolarService ผ่อน 0% สูงสุด 10 เดือน พร้อมรับประกันงานติดตั้งยาวนาน',
      tag: 'โปรโมชั่นพิเศษประจำเดือน',
      link_url: '/packages',
      button_text: 'ดูแพ็กเกจติดตั้ง',
      display_order: 1,
      is_active: true,
      created_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 'ban-2',
      title: 'ลดค่าไฟหน้าร้อน สูงสุด 70%',
      subtitle: 'ด้วยแผงโซลาร์เซลล์เกรด Tier-1 LONGi Hi-MO 6 นวัตกรรมผลิตไฟระดับโลก',
      tag: 'รับประกันแผง 25 ปี',
      link_url: '/products',
      button_text: 'เลือกซื้ออุปกรณ์',
      display_order: 2,
      is_active: true,
      created_at: '2026-10-15T00:00:00Z',
    },
  ],

  cms_articles: [
    {
      id: 'art-1',
      title: 'วิธีคำนวณขนาดโซลาร์เซลล์ให้เหมาะกับค่าไฟบ้านของคุณ (kW)',
      slug: 'how-to-calculate-solar-size',
      category: 'ความรู้โซลาร์',
      summary: 'เจาะลึกวิธีอ่านบิลค่าไฟ และประเมินขนาดระบบโซลาร์ 3kW, 5kW หรือ 10kW ให้คุ้มค่าที่สุด',
      views_count: 1420,
      is_published: true,
      created_at: '2026-10-10T10:00:00Z',
    },
    {
      id: 'art-2',
      title: 'ทำไมต้องล้างแผงโซลาร์เซลล์ทุก 6 เดือน? ฝุ่นสะสมลดกำลังผลิตเท่าไหร่',
      slug: 'importance-of-solar-cleaning',
      category: 'การดูแลรักษา',
      summary: 'ฝุ่น ขี้นก และคราบละอองน้ำมัน สามารถบดบังแสงและลดประสิทธิภาพลงได้ถึง 15-25% รู้วิธีดูแลรักษาที่ถูกต้อง',
      views_count: 980,
      is_published: true,
      created_at: '2026-10-18T10:00:00Z',
    },
    {
      id: 'art-3',
      title: 'ขั้นตอนการขออนุญาตขนานไฟ กฟน. / กฟภ. ปี 2569 อัปเดตล่าสุด',
      slug: 'solar-permit-guidelines-2026',
      category: 'กฎหมายและขั้นตอน',
      summary: 'ครบทุกเอกสารและขั้นตอนสำหรับเจ้าของบ้าน SolarService ดำเนินการยื่นแทนให้ครบทุกขั้นตอน',
      views_count: 2150,
      is_published: true,
      created_at: '2026-10-25T10:00:00Z',
    },
  ],

  payments: [
    {
      id: 'pay-1',
      reference: 'PAY-20261101-0891',
      customer_id: 'cust-1',
      customer_name: 'คุณสมชาย ใจดี',
      amount: 149000,
      method: 'bank_transfer',
      status: 'pending',
      order_or_quote: 'QT-9921008 (แพ็กเกจ 5kW)',
      slip_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      paid_at: '2026-11-01T14:32:00Z',
      notes: 'โอนมัดจำงวดแรก 50% ธนาคารกสิกรไทย',
    },
    {
      id: 'pay-2',
      reference: 'PAY-20261031-0744',
      customer_id: 'cust-2',
      customer_name: 'คุณนภา รุ่งอรุณ',
      amount: 32500,
      method: 'bank_transfer',
      status: 'verified',
      order_or_quote: 'SS-489A12 (อินเวอร์เตอร์ Huawei 5kW)',
      slip_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      paid_at: '2026-10-31T18:10:00Z',
      verified_by: 'Admin SolarService',
      verified_at: '2026-10-31T18:30:00Z',
      notes: 'ตรวจสอบยอดเงินเข้าบัญชี SCB เรียบร้อย จัดส่งสินค้าแล้ว',
    },
    {
      id: 'pay-3',
      reference: 'PAY-20261030-0622',
      customer_id: 'cust-3',
      customer_name: 'คุณวิชัย พัฒนกุล',
      amount: 4290,
      method: 'gateway',
      status: 'verified',
      order_or_quote: 'SS-381F00 (แผง LONGi 580W 1 แผง)',
      slip_url: '',
      paid_at: '2026-10-30T10:05:00Z',
      verified_by: 'Auto Gateway',
      verified_at: '2026-10-30T10:05:00Z',
      notes: 'ชำระผ่าน PromptPay QR Code อัตโนมัติ',
    },
  ],

  reviews: [
    {
      id: 'rev-1',
      customer_id: 'cust-1',
      customer_name: 'คุณสมชาย ใจดี',
      rating: 5,
      comment: 'ทีมช่าง SolarService มืออาชีพมากครับ เข้าสำรวจตรงเวลา เก็บงานสายไฟบนหลังคาเรียบร้อย มีแอปดูการผลิตไฟแบบเรียลไทม์ ค่าไฟลดลงจริงเกินครึ่ง!',
      installation_number: 'IN-7C89F1A234 (ระบบ 5 kW)',
      is_published: true,
      created_at: '2026-10-25T11:20:00Z',
    },
    {
      id: 'rev-2',
      customer_id: 'cust-2',
      customer_name: 'คุณนภา รุ่งอรุณ',
      rating: 5,
      comment: 'ประทับใจบริการหลังการขายและการดูแลเรื่องการขนานไฟมากค่ะ ไม่ต้องวิ่งเต้นเอกสารเองเลย เจ้าหน้าที่คอยอัปเดตสถานะตลอด แนะนำเพื่อนบ้านติดตั้งต่อแล้วค่ะ',
      installation_number: 'IN-6B33D98E12 (ระบบ 5 kW + แบตเตอรี่)',
      is_published: true,
      created_at: '2026-10-28T16:45:00Z',
    },
    {
      id: 'rev-3',
      customer_id: 'cust-4',
      customer_name: 'คุณกานดา สุวรรณรัตน์',
      rating: 4,
      comment: 'ติดตั้งเร็วดีมากครับ ใช้เวลาแค่วันเดียวเสร็จ ตัวแผงคุณภาพดี ฝนตกหนักไม่มีปัญหารั่วซึมเลยครับ มีเจ้าหน้าที่โทรสอบถามหลังติดตั้งด้วย',
      installation_number: 'IN-5A11C20098 (ระบบ 3 kW)',
      is_published: false,
      created_at: '2026-11-01T09:10:00Z',
    },
  ],

  orders: [
    {
      id: 'ord-1',
      order_number: 'SS-202611-0192',
      customer_id: 'cust-1',
      customer_name: 'คุณสมชาย ใจดี',
      shipping_name: 'คุณสมชาย ใจดี',
      phone: '081-234-5678',
      shipping_address: '99/12 หมู่บ้านกรีนวิลล์ บางนา-ตราด กม.10 เขตบางนา กรุงเทพฯ 10260',
      status: 'processing',
      total: 32500,
      payment_method: 'bank_transfer',
      payment_status: 'paid',
      tracking_number: 'TH-FLASH-89210082',
      items: [
        { name: 'อินเวอร์เตอร์ Huawei SUN2000-5KTL', sku: 'HW-INV-5KW', quantity: 1, price: 32500, subtotal: 32500 },
      ],
      created_at: '2026-11-01T10:20:00Z',
      notes: 'จัดส่งด่วนพิเศษ ห่อกันกระแทกอย่างหนา',
    },
    {
      id: 'ord-2',
      order_number: 'SS-202610-0188',
      customer_id: 'cust-2',
      customer_name: 'คุณนภา รุ่งอรุณ',
      shipping_name: 'คุณนภา รุ่งอรุณ',
      phone: '089-876-5432',
      shipping_address: '45/8 ซอยสุขุมวิท 65 พระโขนง กรุงเทพฯ 10110',
      status: 'shipped',
      total: 17160,
      payment_method: 'gateway',
      payment_status: 'paid',
      tracking_number: 'KERRY-BKK-492019',
      items: [
        { name: 'แผงโซลาร์เซลล์ LONGi Hi-MO 6 580W', sku: 'LG-580W', quantity: 4, price: 4290, subtotal: 17160 },
      ],
      created_at: '2026-10-30T15:40:00Z',
      notes: 'จัดส่งถึงหน้าบ้าน มีผู้รับเรียบร้อย',
    },
    {
      id: 'ord-3',
      order_number: 'SS-202610-0175',
      customer_id: 'cust-3',
      customer_name: 'คุณวิชัย พัฒนกุล',
      shipping_name: 'คุณวิชัย พัฒนกุล',
      phone: '084-555-4321',
      shipping_address: '88/4 หมู่ 5 คลองหลวง ปทุมธานี 12120',
      status: 'completed',
      total: 8580,
      payment_method: 'gateway',
      payment_status: 'paid',
      tracking_number: 'THPOST-EMS-00918',
      items: [
        { name: 'แผงโซลาร์เซลล์ LONGi Hi-MO 6 580W', sku: 'LG-580W', quantity: 2, price: 4290, subtotal: 8580 },
      ],
      created_at: '2026-10-25T11:10:00Z',
      notes: 'ลูกค้ารับสินค้าและตรวจสภาพเรียบร้อย',
    },
    {
      id: 'ord-4',
      order_number: 'SS-202611-0195',
      customer_id: 'cust-5',
      customer_name: 'คุณธนากร แสงสุริยา',
      shipping_name: 'คุณธนากร แสงสุริยา',
      phone: '082-999-8877',
      shipping_address: '22/1 ถ.มิตรภาพ อ.เมือง จ.ขอนแก่น 40000',
      status: 'pending',
      total: 68900,
      payment_method: 'bank_transfer',
      payment_status: 'pending',
      tracking_number: '',
      items: [
        { name: 'แบตเตอรี่ Huawei LUNA 5kWh', sku: 'HW-LUNA-5K', quantity: 1, price: 68900, subtotal: 68900 },
      ],
      created_at: '2026-11-01T16:00:00Z',
      notes: 'รอตรวจสลิปโอนเงิน',
    },
  ],

  bookings: [
    {
      id: 'bk-1',
      booking_number: 'BK-202611-0081',
      customer_id: 'cust-1',
      customer_name: 'คุณสมชาย ใจดี',
      phone: '081-234-5678',
      province: 'กรุงเทพมหานคร',
      address: '99/12 หมู่บ้านกรีนวิลล์ บางนา-ตราด กม.10 เขตบางนา',
      preferred_at: '2026-11-05T10:00:00Z',
      service_type: 'survey',
      status: 'confirmed',
      technician_ids: ['tech-1'],
      technician_names: ['ช่างเอกชัย ช่างใหญ่'],
      notes: 'บ้านเดี่ยว 2 ชั้น หลังคาซีแพคโมเนีย ค่าไฟเฉลี่ย 4,500 บ./เดือน สนใจระบบ 5kW',
      created_at: '2026-11-01T09:30:00Z',
    },
    {
      id: 'bk-2',
      booking_number: 'BK-202611-0082',
      customer_id: 'cust-2',
      customer_name: 'คุณนภา รุ่งอรุณ',
      phone: '089-876-5432',
      province: 'นนทบุรี',
      address: '45/8 ถนนราชพฤกษ์ ตำบลบางกร่าง อำเภอเมือง',
      preferred_at: '2026-11-06T13:30:00Z',
      service_type: 'survey',
      status: 'pending',
      technician_ids: [],
      technician_names: [],
      notes: 'ต้องการติดตั้งโซลาร์เซลล์พร้อมแบตเตอรี่สำรองไฟตอนกลางคืน',
      created_at: '2026-11-01T14:15:00Z',
    },
    {
      id: 'bk-3',
      booking_number: 'BK-202610-0079',
      customer_id: 'cust-3',
      customer_name: 'คุณวิชัย พัฒนกุล',
      phone: '084-555-4321',
      province: 'ปทุมธานี',
      address: '88/4 หมู่ 5 คลองหลวง ปทุมธานี',
      preferred_at: '2026-10-28T09:00:00Z',
      service_type: 'survey',
      status: 'quoted',
      technician_ids: ['tech-2'],
      technician_names: ['ช่างสมศักดิ์ สายตรวจ'],
      notes: 'สำรวจเสร็จเรียบร้อย พื้นที่หลังคา 65 ตร.ม. ทิศใต้ แนะนำระบบ 5kW ออกใบเสนอราคาแล้ว',
      created_at: '2026-10-25T11:00:00Z',
    },
    {
      id: 'bk-4',
      booking_number: 'BK-202610-0075',
      customer_id: 'cust-4',
      customer_name: 'คุณกานดา สุวรรณรัตน์',
      phone: '086-111-2233',
      province: 'สมุทรปราการ',
      address: '12/9 หมู่บ้านพฤกษา เทพารักษ์',
      preferred_at: '2026-10-20T10:30:00Z',
      service_type: 'installation',
      status: 'completed',
      technician_ids: ['tech-1', 'tech-2'],
      technician_names: ['ช่างเอกชัย ช่างใหญ่', 'ช่างสมศักดิ์ สายตรวจ'],
      notes: 'ติดตั้งระบบ 3kW เสร็จสมบูรณ์ ขนานไฟเรียบร้อย',
      created_at: '2026-10-18T08:00:00Z',
    },
  ],

  quotes: [
    {
      id: 'qt-1',
      quote_number: 'QT-202611-0088',
      customer_id: 'cust-1',
      customer_name: 'คุณสมชาย ใจดี',
      customer_phone: '081-234-5678',
      booking_number: 'BK-202611-0081',
      system_size_kw: 5.0,
      total: 149000,
      discount: 5000,
      net_total: 144000,
      status: 'sent',
      valid_until: '2026-11-20',
      items: [
        { description: 'แพ็กเกจติดตั้งโซลาร์รูฟท็อป 5 kW (LONGi 580W 10 แผง + Huawei 5kW Inverter)', amount: 149000 },
      ],
      notes: 'ราคารวมบริการขออนุญาตขนานไฟ กฟน. ติดตั้งมิเตอร์ TOU และตรวจเช็คฟรี 2 ปี',
      created_at: '2026-11-01T11:00:00Z',
    },
    {
      id: 'qt-2',
      quote_number: 'QT-202610-0085',
      customer_id: 'cust-2',
      customer_name: 'คุณนภา รุ่งอรุณ',
      customer_phone: '089-876-5432',
      booking_number: 'BK-202610-0071',
      system_size_kw: 10.0,
      total: 269000,
      discount: 10000,
      net_total: 259000,
      status: 'approved',
      valid_until: '2026-11-15',
      items: [
        { description: 'แพ็กเกจโซลาร์เซลล์ 10 kW 3-Phase พร้อมระบบรองรับชาร์จรถยนต์ EV', amount: 269000 },
      ],
      notes: 'ลูกค้าอนุมัติแล้ว อยู่ระหว่างเตรียมนัดหมายวันเข้าติดตั้ง',
      created_at: '2026-10-28T14:30:00Z',
    },
    {
      id: 'qt-3',
      quote_number: 'QT-202610-0079',
      customer_id: 'cust-3',
      customer_name: 'คุณวิชัย พัฒนกุล',
      customer_phone: '084-555-4321',
      booking_number: 'BK-202610-0079',
      system_size_kw: 3.0,
      total: 89000,
      discount: 0,
      net_total: 89000,
      status: 'draft',
      valid_until: '2026-11-10',
      items: [
        { description: 'แพ็กเกจเริ่มต้น 3 kW สำหรับบ้านขนาดเล็ก ค่าไฟไม่เกิน 3,000 บ.', amount: 89000 },
      ],
      notes: 'ร่างใบเสนอราคา รอส่งให้ลูกค้าหลังตรวจสอบขนาดหม้อแปลง',
      created_at: '2026-10-31T09:00:00Z',
    },
  ],

  installations: [
    {
      id: 'inst-1',
      installation_number: 'IN-202611-0045',
      customer_id: 'cust-2',
      customer_name: 'คุณนภา รุ่งอรุณ',
      phone: '089-876-5432',
      address: '45/8 ซอยสุขุมวิท 65 แขวงพระโขนงเหนือ กรุงเทพฯ',
      quote_number: 'QT-202610-0085',
      system_size_kw: 10.0,
      lead_technician: 'ช่างเอกชัย ช่างใหญ่',
      scheduled_at: '2026-11-08T09:00:00Z',
      status: 'scheduled',
      stages: { site_ready: true, equipment_delivered: true, panels_mounted: false, inverter_wired: false, grid_tested: false },
      notes: 'เตรียมแผง 18 แผง และอินเวอร์เตอร์ 10kW เข้าหน้างานวันที่ 7 พ.ย.',
      created_at: '2026-10-29T10:00:00Z',
    },
    {
      id: 'inst-2',
      installation_number: 'IN-202611-0042',
      customer_id: 'cust-1',
      customer_name: 'คุณสมชาย ใจดี',
      phone: '081-234-5678',
      address: '99/12 หมู่บ้านกรีนวิลล์ บางนา-ตราด กม.10 เขตบางนา',
      quote_number: 'QT-202611-0088',
      system_size_kw: 5.0,
      lead_technician: 'ช่างสมศักดิ์ สายตรวจ',
      scheduled_at: '2026-11-03T09:30:00Z',
      status: 'installing',
      stages: { site_ready: true, equipment_delivered: true, panels_mounted: true, inverter_wired: true, grid_tested: false },
      notes: 'กำลังเดินท่อร้อยสายไฟ AC/DC และติดตู้ Combiner Box',
      created_at: '2026-10-26T14:00:00Z',
    },
    {
      id: 'inst-3',
      installation_number: 'IN-202610-0038',
      customer_id: 'cust-4',
      customer_name: 'คุณกานดา สุวรรณรัตน์',
      phone: '086-111-2233',
      address: '12/9 หมู่บ้านพฤกษา เทพารักษ์ สมุทรปราการ',
      quote_number: 'QT-202610-0072',
      system_size_kw: 3.0,
      lead_technician: 'ช่างเอกชัย ช่างใหญ่',
      scheduled_at: '2026-10-22T09:00:00Z',
      completed_at: '2026-10-22T17:00:00Z',
      status: 'completed',
      stages: { site_ready: true, equipment_delivered: true, panels_mounted: true, inverter_wired: true, grid_tested: true },
      notes: 'ทดสอบขนานไฟเรียบร้อย ประสิทธิภาพการผลิตไฟ 3.1 kW ปกติสมบูรณ์',
      created_at: '2026-10-15T09:00:00Z',
    },
  ],

  products: [
    {
      id: 'prod-1',
      name: 'แผงโซลาร์เซลล์ LONGi Hi-MO 6 580W',
      slug: 'longi-himo-6-580w',
      category: 'แผงโซลาร์เซลล์',
      sku: 'SKU-LG-580W',
      price: 4290,
      compare_at_price: 4890,
      stock_quantity: 120,
      image_url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80',
      description: 'แผงโซลาร์เซลล์ Monocrystalline เทคโนโลยี HPBC ชั้นนำระดับโลก ประสิทธิภาพ 22.5% ทนทานรับประกัน 25 ปี',
      is_active: true,
      created_at: '2026-08-01T00:00:00Z',
    },
    {
      id: 'prod-2',
      name: 'อินเวอร์เตอร์ Huawei SUN2000-5KTL-L1',
      slug: 'huawei-sun2000-5ktl',
      category: 'อินเวอร์เตอร์',
      sku: 'SKU-HW-5KTL',
      price: 32500,
      compare_at_price: 36000,
      stock_quantity: 18,
      image_url: 'https://images.unsplash.com/photo-1558441719-8b489c63f7d1?w=600&auto=format&fit=crop&q=80',
      description: 'อินเวอร์เตอร์ระบบ 1 Phase กำลัง 5 kW ประสิทธิภาพ 98.4% รองรับระบบ Optimizer และต่อแบตเตอรี่ได้โดยตรง รับประกันศูนย์ไทย 10 ปี',
      is_active: true,
      created_at: '2026-08-05T00:00:00Z',
    },
    {
      id: 'prod-3',
      name: 'แบตเตอรี่ Huawei LUNA2000 5kWh Smart String ESS',
      slug: 'huawei-luna2000-5kwh',
      category: 'แบตเตอรี่',
      sku: 'SKU-HW-LUNA5K',
      price: 68900,
      compare_at_price: 75000,
      stock_quantity: 8,
      image_url: 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=600&auto=format&fit=crop&q=80',
      description: 'โมดูลแบตเตอรี่ลิเธียมฟอสเฟต (LFP) 100% DOD ปลอดภัยสูง ดีไซน์หรูหราขยายความจุได้ถึง 30kWh',
      is_active: true,
      created_at: '2026-08-10T00:00:00Z',
    },
    {
      id: 'prod-4',
      name: 'ชุดอุปกรณ์ยึดจับหลังคาซีแพคและสายไฟ PV ครบเซ็ต',
      slug: 'mounting-cpack-pv-kit',
      category: 'อุปกรณ์ติดตั้ง',
      sku: 'SKU-MNT-CPACK',
      price: 12900,
      compare_at_price: 14500,
      stock_quantity: 35,
      image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
      description: 'ชุดรางอลูมิเนียมเกรด 6005-T5 กันสนิม สกรูสแตนเลส 304 พร้อมสายไฟ PV1-F เบอร์ 4 และข้อต่อ MC4 มาตรฐานสากล',
      is_active: true,
      created_at: '2026-08-15T00:00:00Z',
    },
  ],

  technicians: [
    { id: 'tech-1', full_name: 'ช่างเอกชัย ช่างใหญ่', phone: '081-111-2222', role: 'technician' },
    { id: 'tech-2', full_name: 'ช่างสมศักดิ์ สายตรวจ', phone: '082-222-3333', role: 'technician' },
    { id: 'tech-3', full_name: 'ช่างวิรัช ไฟฟ้า', phone: '083-333-4444', role: 'technician' },
  ],
};

// Storage helper for persistence during testing
function getLocalStore(key, defaultValue) {
  try {
    const raw = localStorage.getItem(`solarservice_admin_${key}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }
  return defaultValue;
}

function setLocalStore(key, value) {
  try {
    localStorage.setItem(`solarservice_admin_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage write error:', e);
  }
}

async function fetchAllAnalyticsRows(table, columns) {
  const pageSize = 1000;
  const rows = [];
  let start = 0;

  while (true) {
    const { data, error } = await supabase.from(table)
      .select(columns)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(start, start + pageSize - 1);
    if (error) throw error;

    const page = data || [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
    start += pageSize;
  }
}

export const adminService = {
  async updateUserProfile(userId, role, technicianType) {
    if (!supabase) throw new Error('กรุณาตั้งค่า Supabase เพื่อแก้ไขผู้ใช้');
    const update = { role };
    if (role === 'technician') {
      const validTypes = ['survey', 'installation', 'both'];
      if (!validTypes.includes(technicianType)) {
        throw new Error('ประเภทช่างไม่ถูกต้อง');
      }
      update.technician_type = technicianType;
    }
    const { error } = await supabase.from('profiles').update(update).eq('id', userId);
    if (error) throw error;
    return true;
  },
  // 1. Build analytics from verified payments and current operational records
  async getAnalytics(period = '6m') {
    if (!supabase) throw new Error('กรุณาตั้งค่า Supabase เพื่อโหลดข้อมูลสถิติจริง');

    const periodMonths = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 };
    const monthCount = periodMonths[period] || periodMonths['6m'];
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstMonth = new Date(now.getFullYear(), now.getMonth() - monthCount + 1, 1);
    const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const toValidDate = (value) => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };
    const monthStarts = Array.from({ length: monthCount }, (_, index) => (
      new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1)
    ));
    const monthlySales = monthStarts.map((date) => ({
      monthKey: getMonthKey(date),
      month: date.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }),
      productSales: 0,
      packageSales: 0,
      installations: 0,
      total: 0,
    }));
    const monthlyByKey = new Map(monthlySales.map((item) => [item.monthKey, item]));

    const [
      payments,
      orderItems,
      quotations,
      bookings,
      packages,
      installations,
      warranties,
      maintenanceReminders,
      supportTickets,
    ] = await Promise.all([
      fetchAllAnalyticsRows('payments', 'id,order_id,quotation_id,amount,status,paid_at,created_at'),
      fetchAllAnalyticsRows('order_items', 'id,order_id,product_name,quantity,line_total,created_at'),
      fetchAllAnalyticsRows('quotations', 'id,booking_id,created_at'),
      fetchAllAnalyticsRows('service_bookings', 'id,package_id,created_at'),
      fetchAllAnalyticsRows('packages', 'id,name,created_at'),
      fetchAllAnalyticsRows('installations', 'id,status,scheduled_at,completed_at,updated_at,created_at'),
      fetchAllAnalyticsRows('warranties', 'id,status,warranty_end,created_at'),
      fetchAllAnalyticsRows('maintenance_reminders', 'id,status,created_at'),
      fetchAllAnalyticsRows('support_tickets', 'id,status,created_at'),
    ]);

    const verifiedPayments = payments.filter((payment) => payment.status === 'verified');
    const periodPayments = verifiedPayments.filter((payment) => {
      const paymentDate = toValidDate(payment.paid_at || payment.created_at);
      return paymentDate && monthlyByKey.has(getMonthKey(paymentDate));
    });
    const productPaymentsByOrder = new Map();
    const packagePaymentsByQuote = new Map();
    periodPayments.forEach((payment) => {
      const paymentDate = toValidDate(payment.paid_at || payment.created_at);
      const month = monthlyByKey.get(getMonthKey(paymentDate));
      const amount = Number(payment.amount) || 0;
      if (payment.order_id) {
        month.productSales += amount;
        productPaymentsByOrder.set(payment.order_id, (productPaymentsByOrder.get(payment.order_id) || 0) + amount);
      } else if (payment.quotation_id) {
        month.packageSales += amount;
        packagePaymentsByQuote.set(payment.quotation_id, (packagePaymentsByQuote.get(payment.quotation_id) || 0) + amount);
      }
      month.total += amount;
    });

    installations.forEach((installation) => {
      if (installation.status !== 'completed') return;
      const completedDate = toValidDate(installation.completed_at || installation.updated_at);
      const month = completedDate && monthlyByKey.get(getMonthKey(completedDate));
      if (month) month.installations += 1;
    });

    const totalProductSales = monthlySales.reduce((total, item) => total + item.productSales, 0);
    const totalPackageSales = monthlySales.reduce((total, item) => total + item.packageSales, 0);
    const grandTotal = totalProductSales + totalPackageSales;
    const currentMonthKey = getMonthKey(currentMonth);
    const currentMonthSales = monthlyByKey.get(currentMonthKey);
    const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const previousMonthKey = getMonthKey(previousMonth);
    const previousMonthRevenue = verifiedPayments.reduce((total, payment) => {
      const paymentDate = toValidDate(payment.paid_at || payment.created_at);
      return paymentDate && getMonthKey(paymentDate) === previousMonthKey
        ? total + (Number(payment.amount) || 0)
        : total;
    }, 0);
    const currentMonthRevenue = currentMonthSales?.total || 0;
    const monthlyRevenueChangePct = previousMonthRevenue > 0
      ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
      : null;

    const completedThisMonth = installations.filter((installation) => {
      if (installation.status !== 'completed') return false;
      const completedDate = toValidDate(installation.completed_at || installation.updated_at);
      return completedDate && getMonthKey(completedDate) === currentMonthKey;
    });
    const scheduledCompleted = completedThisMonth.filter((installation) => (
      installation.scheduled_at && installation.completed_at
    ));
    const onTimeCompletionPct = scheduledCompleted.length
      ? Math.round((scheduledCompleted.filter((installation) => (
        new Date(installation.completed_at) <= new Date(installation.scheduled_at)
      )).length / scheduledCompleted.length) * 100)
      : null;

    const quotationsById = new Map(quotations.map((quote) => [quote.id, quote]));
    const bookingsById = new Map(bookings.map((booking) => [booking.id, booking]));
    const packagesById = new Map(packages.map((item) => [item.id, item]));
    const productItemsByOrder = new Map();
    orderItems.forEach((item) => {
      if (!productPaymentsByOrder.has(item.order_id)) return;
      const items = productItemsByOrder.get(item.order_id) || [];
      items.push(item);
      productItemsByOrder.set(item.order_id, items);
    });

    const topItemsByKey = new Map();
    productItemsByOrder.forEach((items, orderId) => {
      const lineTotal = items.reduce((total, item) => total + (Number(item.line_total) || 0), 0);
      if (lineTotal <= 0) return;
      const paidAmount = productPaymentsByOrder.get(orderId) || 0;
      items.forEach((item) => {
        const name = item.product_name || 'สินค้าไม่ระบุชื่อ';
        const key = `product:${name}`;
        const topItem = topItemsByKey.get(key) || { name, type: 'สินค้า', units: 0, revenue: 0 };
        topItem.units += Number(item.quantity) || 0;
        topItem.revenue += paidAmount * ((Number(item.line_total) || 0) / lineTotal);
        topItemsByKey.set(key, topItem);
      });
    });
    packagePaymentsByQuote.forEach((paidAmount, quoteId) => {
      const quote = quotationsById.get(quoteId);
      const booking = quote && bookingsById.get(quote.booking_id);
      const packageItem = booking?.package_id && packagesById.get(booking.package_id);
      const name = packageItem?.name || 'งานติดตั้งแบบกำหนดเอง';
      const key = `package:${name}`;
      const topItem = topItemsByKey.get(key) || { name, type: 'แพ็กเกจ', units: 0, revenue: 0 };
      topItem.units += 1;
      topItem.revenue += paidAmount;
      topItemsByKey.set(key, topItem);
    });
    const topSellingItems = [...topItemsByKey.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        pct: grandTotal > 0 ? Math.round((item.revenue / grandTotal) * 100) : 0,
      }));

    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const activeWarranties = warranties.filter((warranty) => (
      ['active', 'expiring_soon'].includes(warranty.status)
      && warranty.warranty_end >= todayKey
    )).length;
    const pendingMaintenance = maintenanceReminders.filter((reminder) => (
      ['pending', 'notified'].includes(reminder.status)
    )).length;
    const openTickets = supportTickets.filter((ticket) => (
      !['resolved', 'closed'].includes(ticket.status)
    )).length;
    const pendingPayments = payments.filter((payment) => (
      ['pending', 'submitted'].includes(payment.status)
    )).length;
    const periodLabel = {
      '1m': 'เดือนนี้',
      '3m': '3 เดือนล่าสุด',
      '6m': '6 เดือนล่าสุด',
      '1y': '12 เดือนล่าสุด',
    }[period] || '6 เดือนล่าสุด';

    return {
      period,
      periodLabel,
      monthlySales,
      breakdown: {
        productSales: totalProductSales,
        packageSales: totalPackageSales,
        productPct: grandTotal ? Math.round((totalProductSales / grandTotal) * 100) : 0,
        packagePct: grandTotal ? Math.round((totalPackageSales / grandTotal) * 100) : 0,
        grandTotal,
      },
      topSellingItems,
      kpis: {
        monthlyRevenue: currentMonthRevenue,
        monthlyRevenueChangePct,
        activeWarranties,
        pendingMaintenance,
        openTickets,
        pendingPayments,
        completedJobsMonth: currentMonthSales?.installations || 0,
        onTimeCompletionPct,
      },
    };
  },

  // 2. Packages CRUD
  async getPackages() {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('packages').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Supabase packages error:', e);
      }
    }
    return getLocalStore('packages', defaultMockData.packages);
  },

  async savePackage(item) {
    if (supabase) {
      try {
        const payload = {
          name: item.name,
          slug: item.slug || `package-${Date.now()}`,
          system_size_kw: Number(item.system_size_kw) || 5,
          price: Number(item.price) || 0,
          description: item.description || '',
          features: Array.isArray(item.features) ? item.features : (item.features || '').split('\n').filter(Boolean),
          is_active: item.is_active ?? true,
        };
        const res = item.id && !item.id.startsWith('pkg-')
          ? await supabase.from('packages').update(payload).eq('id', item.id).select()
          : await supabase.from('packages').insert(payload).select();
        if (!res.error && res.data) {
          return res.data[0];
        }
      } catch (e) {
        console.warn('Supabase savePackage error, saving locally:', e);
      }
    }
    const current = getLocalStore('packages', defaultMockData.packages);
    let updated;
    if (item.id) {
      updated = current.map((p) => (p.id === item.id ? { ...p, ...item } : p));
    } else {
      const newItem = { ...item, id: `pkg-${Date.now()}`, created_at: new Date().toISOString() };
      updated = [newItem, ...current];
    }
    setLocalStore('packages', updated);
    return item;
  },

  async deletePackage(id) {
    if (supabase && !id.startsWith('pkg-')) {
      try {
        await supabase.from('packages').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase deletePackage error:', e);
      }
    }
    const current = getLocalStore('packages', defaultMockData.packages);
    const updated = current.filter((p) => p.id !== id);
    setLocalStore('packages', updated);
    return true;
  },

  // 3. Warranties Registry
  async getWarranties() {
    if (!supabase) throw new Error('ไม่สามารถเชื่อมต่อ Supabase เพื่ออ่านทะเบียนรับประกันได้');
    const { data, error } = await supabase.from('warranties').select(`
      *, customer:profiles!warranties_customer_id_fkey(full_name,phone),
      installation:installations!warranties_installation_id_fkey(installation_number)
    `).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((item) => ({
      ...item,
      customer_name: item.customer?.full_name || '',
      customer_phone: item.customer?.phone || '',
      installation_number: item.installation?.installation_number || '',
    }));
  },

  async saveWarranty(item) {
    if (!supabase) throw new Error('ไม่สามารถเชื่อมต่อ Supabase เพื่อบันทึกทะเบียนรับประกันได้');
    if (!item.customer_id) throw new Error('ไม่พบ Customer ID ของลูกค้า');
    if (!item.serial_number?.trim()) throw new Error('กรุณากรอก Serial Number จริงจากอุปกรณ์');
    if (item.installation_id && !item.id) {
      const { data: existing, error: duplicateError } = await supabase.from('warranties')
        .select('id').eq('installation_id', item.installation_id).eq('equipment_type', item.equipment_type).limit(1);
      if (duplicateError) throw duplicateError;
      if (existing?.length) throw new Error('งานติดตั้งนี้มีทะเบียนรับประกันอุปกรณ์ประเภทนี้แล้ว');
    }
    const payload = { ...item };
    delete payload.customer_name;
    delete payload.customer_phone;
    delete payload.installation_number;
    delete payload.customer;
    delete payload.installation;
    const query = item.id
      ? supabase.from('warranties').update(payload).eq('id', item.id)
      : supabase.from('warranties').insert(payload);
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },

  async deleteWarranty(id) {
    if (!supabase) throw new Error('ไม่สามารถเชื่อมต่อ Supabase เพื่อลบทะเบียนรับประกันได้');
    const { error } = await supabase.from('warranties').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // 4. Maintenance Reminders
  async getMaintenanceReminders() {
    if (!supabase) throw new Error('กรุณาตั้งค่า Supabase เพื่อโหลดข้อมูลบำรุงรักษาจริง');

    const { data, error } = await supabase.from('maintenance_reminders')
      .select('id,customer_id,warranty_id,title,reminder_type,frequency_months,due_date,status,last_notified_at,notes,created_at,updated_at')
      .order('due_date', { ascending: true });
    if (error) throw error;

    const reminders = data || [];
    if (!reminders.length) return [];

    const customerIds = [...new Set(reminders.map((item) => item.customer_id).filter(Boolean))];
    const warrantyIds = [...new Set(reminders.map((item) => item.warranty_id).filter(Boolean))];
    const [profilesResult, warrantiesResult, installationsResult] = await Promise.all([
      supabase.from('profiles').select('id,full_name,phone').in('id', customerIds),
      warrantyIds.length
        ? supabase.from('warranties').select('id,customer_id,installation_id').in('id', warrantyIds)
        : Promise.resolve({ data: [], error: null }),
      supabase.from('installations')
        .select('id,customer_id,booking_id,created_at')
        .in('customer_id', customerIds)
        .order('created_at', { ascending: false }),
    ]);
    if (profilesResult.error) throw profilesResult.error;
    if (warrantiesResult.error) throw warrantiesResult.error;
    if (installationsResult.error) throw installationsResult.error;

    const warrantiesById = new Map((warrantiesResult.data || []).map((item) => [item.id, item]));
    const installations = installationsResult.data || [];
    const installationsById = new Map(installations.map((item) => [item.id, item]));
    const latestInstallationByCustomer = new Map();
    installations.forEach((item) => {
      if (!latestInstallationByCustomer.has(item.customer_id)) {
        latestInstallationByCustomer.set(item.customer_id, item);
      }
    });
    const bookingIds = [...new Set(installations.map((item) => item.booking_id).filter(Boolean))];
    const bookingsResult = bookingIds.length
      ? await supabase.from('service_bookings').select('id,address,province,phone').in('id', bookingIds)
      : { data: [], error: null };
    if (bookingsResult.error) throw bookingsResult.error;

    const profilesById = new Map((profilesResult.data || []).map((item) => [item.id, item]));
    const bookingsById = new Map((bookingsResult.data || []).map((item) => [item.id, item]));
    return reminders.map((reminder) => {
      const warranty = warrantiesById.get(reminder.warranty_id);
      const installation = (warranty?.installation_id && installationsById.get(warranty.installation_id))
        || latestInstallationByCustomer.get(reminder.customer_id);
      const booking = installation && bookingsById.get(installation.booking_id);
      const profile = profilesById.get(reminder.customer_id);
      return {
        ...reminder,
        customer_name: profile?.full_name || 'ลูกค้าไม่ระบุชื่อ',
        customer_phone: profile?.phone || booking?.phone || '',
        address: booking ? [booking.address, booking.province].filter(Boolean).join(' · ') : '',
      };
    });
  },

  async addMaintenanceReminder(item) {
    if (!supabase) throw new Error('กรุณาตั้งค่า Supabase เพื่อเพิ่มข้อมูลบำรุงรักษา');
    if (!item.customer_id) throw new Error('กรุณาเลือกลูกค้าที่มีอยู่ในระบบ');
    if (!item.due_date) throw new Error('กรุณากำหนดวันที่เข้าบริการ');

    const { data, error } = await supabase.from('maintenance_reminders').insert({
      customer_id: item.customer_id,
      warranty_id: item.warranty_id || null,
      title: item.title?.trim() || 'รอบบำรุงรักษาระบบโซลาร์เซลล์',
      reminder_type: item.reminder_type,
      frequency_months: Number(item.frequency_months) || 6,
      due_date: item.due_date,
      status: 'pending',
      notes: item.notes?.trim() || '',
    }).select('id').single();
    if (error) throw error;
    return data;
  },

  async updateMaintenanceStatus(id, status, extra = {}) {
    if (!supabase) throw new Error('กรุณาตั้งค่า Supabase เพื่ออัปเดตข้อมูลบำรุงรักษา');
    const { data, error } = await supabase.from('maintenance_reminders')
      .update({ status, ...extra, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id,status')
      .single();
    if (error) throw error;
    if (!data) throw new Error('ไม่พบรายการแจ้งเตือนที่ต้องการอัปเดต');
    return true;
  },

  // 5. Support Tickets
  async getTickets() {
    if (!supabase) throw new Error('กรุณาตั้งค่า Supabase เพื่อโหลดข้อมูลแจ้งซ่อมจริง');

    const { data, error } = await supabase.from('support_tickets')
      .select('id,ticket_number,customer_id,title,description,category,priority,status,assigned_to,resolution_notes,resolved_at,created_at,updated_at')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const tickets = data || [];
    if (!tickets.length) return [];

    const profileIds = [...new Set(tickets.flatMap((item) => [item.customer_id, item.assigned_to]).filter(Boolean))];
    const profilesResult = profileIds.length
      ? await supabase.from('profiles').select('id,full_name,phone').in('id', profileIds)
      : { data: [], error: null };
    if (profilesResult.error) throw profilesResult.error;

    const profilesById = new Map((profilesResult.data || []).map((item) => [item.id, item]));
    return tickets.map((ticket) => {
      const customer = profilesById.get(ticket.customer_id);
      const assignee = profilesById.get(ticket.assigned_to);
      return {
        ...ticket,
        customer_name: customer?.full_name || 'ลูกค้าไม่ระบุชื่อ',
        customer_phone: customer?.phone || '',
        assigned_to_name: assignee?.full_name || '',
      };
    });
  },

  async saveTicket(item) {
    if (!supabase) throw new Error('กรุณาตั้งค่า Supabase เพื่อบันทึกข้อมูลแจ้งซ่อม');
    if (!item.customer_id) throw new Error('กรุณาเลือกลูกค้าที่มีอยู่ในระบบ');
    if (!item.title?.trim()) throw new Error('กรุณากรอกหัวข้อเคส');

    const payload = {
      customer_id: item.customer_id,
      title: item.title.trim(),
      description: item.description?.trim() || '',
      category: item.category,
      priority: item.priority,
      status: item.status,
      assigned_to: item.assigned_to || null,
      resolution_notes: item.resolution_notes?.trim() || '',
      resolved_at: ['resolved', 'closed'].includes(item.status)
        ? item.resolved_at || new Date().toISOString()
        : null,
    };
    const query = item.id
      ? supabase.from('support_tickets').update(payload).eq('id', item.id)
      : supabase.from('support_tickets').insert(payload);
    const { data, error } = await query.select('id,ticket_number').single();
    if (error) throw error;
    return data;
  },

  // 6. Payments
  async getPayments() {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*,profiles:customer_id(full_name)')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return Promise.all(data.map(async (payment) => {
            let slipUrl = payment.slip_url || '';
            if (slipUrl && !/^https?:\/\//i.test(slipUrl)) {
              const { data: signed, error: signedError } = await supabase.storage
                .from('payment-slips')
                .createSignedUrl(slipUrl, 3600);
              if (!signedError && signed?.signedUrl) slipUrl = signed.signedUrl;
            }
            return {
              ...payment,
              customer_name: payment.profiles?.full_name || '',
              slip_url: slipUrl,
            };
          }));
        }
      } catch (e) {
        console.warn('Supabase payments error:', e);
      }
    }
    return getLocalStore('payments', defaultMockData.payments);
  },

  async verifyPayment(id, isApproved, rejectReason = '', verifiedBy = 'Admin') {
    if (supabase && !id.startsWith('pay-')) {
      try {
        const { error } = await supabase.from('payments').update({
          status: isApproved ? 'verified' : 'rejected',
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id || null,
          reference: rejectReason ? `REJECT:${rejectReason}` : 'ADMIN_VERIFIED',
        }).eq('id', id);
        if (error) throw error;
      } catch (e) {
        console.warn('Supabase verifyPayment error:', e);
      }
    }
    const current = getLocalStore('payments', defaultMockData.payments);
    const updated = current.map((p) => (p.id === id ? {
      ...p,
      status: isApproved ? 'verified' : 'rejected',
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
      notes: rejectReason || p.notes || 'ยืนยันการชำระเงินเรียบร้อย',
    } : p));
    setLocalStore('payments', updated);
    return true;
  },

  // 7. Reviews
  async getReviews() {
    if (!supabase) throw new Error('กรุณาตั้งค่า Supabase เพื่อโหลดรีวิวจริง');

    const { data, error } = await supabase.from('reviews')
      .select('id,customer_id,installation_id,order_item_id,quotation_item_id,rating,comment,is_published,created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const reviews = data || [];
    if (!reviews.length) return [];

    const customerIds = [...new Set(reviews.map((item) => item.customer_id).filter(Boolean))];
    const installationIds = [...new Set(reviews.map((item) => item.installation_id).filter(Boolean))];
    const orderItemIds = [...new Set(reviews.map((item) => item.order_item_id).filter(Boolean))];
    const quotationItemIds = [...new Set(reviews.map((item) => item.quotation_item_id).filter(Boolean))];
    const [profilesResult, installationsResult, orderItemsResult, quotationItemsResult] = await Promise.all([
      customerIds.length
        ? supabase.from('profiles').select('id,full_name').in('id', customerIds)
        : Promise.resolve({ data: [], error: null }),
      installationIds.length
        ? supabase.from('installations').select('id,installation_number').in('id', installationIds)
        : Promise.resolve({ data: [], error: null }),
      orderItemIds.length
        ? supabase.from('order_items').select('id,product_name').in('id', orderItemIds)
        : Promise.resolve({ data: [], error: null }),
      quotationItemIds.length
        ? supabase.from('quotation_items').select('id,product_id,description').in('id', quotationItemIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (profilesResult.error) throw profilesResult.error;
    if (installationsResult.error) throw installationsResult.error;
    if (orderItemsResult.error) throw orderItemsResult.error;
    if (quotationItemsResult.error) throw quotationItemsResult.error;

    const profilesById = new Map((profilesResult.data || []).map((profile) => [profile.id, profile]));
    const installationsById = new Map((installationsResult.data || []).map((installation) => [installation.id, installation]));
    const orderItemsById = new Map((orderItemsResult.data || []).map((item) => [item.id, item]));
    const quotationItems = quotationItemsResult.data || [];
    const productIds = [...new Set(quotationItems.map((item) => item.product_id).filter(Boolean))];
    const productsResult = productIds.length
      ? await supabase.from('products').select('id,name').in('id', productIds)
      : { data: [], error: null };
    if (productsResult.error) throw productsResult.error;
    const quotationItemsById = new Map(quotationItems.map((item) => [item.id, item]));
    const productsById = new Map((productsResult.data || []).map((item) => [item.id, item]));

    return reviews.map((item) => ({
      ...item,
      customer_name: profilesById.get(item.customer_id)?.full_name || 'ลูกค้า',
      installation_number: installationsById.get(item.installation_id)?.installation_number || '',
      reviewed_item_name: orderItemsById.get(item.order_item_id)?.product_name
        || productsById.get(quotationItemsById.get(item.quotation_item_id)?.product_id)?.name
        || quotationItemsById.get(item.quotation_item_id)?.description
        || '',
    }));
  },

  async toggleReviewPublish(id, isPublished) {
    if (!supabase) throw new Error('กรุณาตั้งค่า Supabase เพื่อแก้ไขรีวิว');
    const { data, error } = await supabase.from('reviews')
      .update({ is_published: isPublished })
      .eq('id', id)
      .select('id')
      .single();
    if (error) throw error;
    if (!data) throw new Error('ไม่พบรีวิวที่ต้องการแก้ไข');
    return true;
  },

  async deleteReview(id) {
    if (!supabase) throw new Error('กรุณาตั้งค่า Supabase เพื่อลบรีวิว');
    const { data, error } = await supabase.from('reviews')
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    if (error) throw error;
    if (!data) throw new Error('ไม่พบรีวิวที่ต้องการลบ');
    return true;
  },

  // 8. CMS Banners & Articles
  async getBanners() {
    return getLocalStore('banners', defaultMockData.cms_banners);
  },

  async saveBanner(item) {
    const current = getLocalStore('banners', defaultMockData.cms_banners);
    let updated;
    if (item.id) {
      updated = current.map((b) => (b.id === item.id ? { ...b, ...item } : b));
    } else {
      const newItem = { ...item, id: `ban-${Date.now()}`, created_at: new Date().toISOString() };
      updated = [newItem, ...current];
    }
    setLocalStore('banners', updated);
    return item;
  },

  async deleteBanner(id) {
    const current = getLocalStore('banners', defaultMockData.cms_banners);
    const updated = current.filter((b) => b.id !== id);
    setLocalStore('banners', updated);
    return true;
  },

  async getArticles() {
    return getLocalStore('articles', defaultMockData.cms_articles);
  },

  async saveArticle(item) {
    const current = getLocalStore('articles', defaultMockData.cms_articles);
    let updated;
    if (item.id) {
      updated = current.map((a) => (a.id === item.id ? { ...a, ...item } : a));
    } else {
      const newItem = { ...item, id: `art-${Date.now()}`, views_count: 0, created_at: new Date().toISOString() };
      updated = [newItem, ...current];
    }
    setLocalStore('articles', updated);
    return item;
  },

  async deleteArticle(id) {
    const current = getLocalStore('articles', defaultMockData.cms_articles);
    const updated = current.filter((a) => a.id !== id);
    setLocalStore('articles', updated);
    return true;
  },

  // 9. User Ban / Suspend
  async toggleUserBan(userId, isBanned) {
    if (supabase) {
      try {
        await supabase.from('profiles').update({ is_banned: isBanned }).eq('id', userId);
      } catch (e) {
        console.warn('Supabase toggleUserBan error:', e);
      }
    }
    const bannedUsers = getLocalStore('banned_users', {});
    bannedUsers[userId] = isBanned;
    setLocalStore('banned_users', bannedUsers);
    return true;
  },

  getUserBanStatus(userId) {
    const bannedUsers = getLocalStore('banned_users', {});
    return Boolean(bannedUsers[userId]);
  },

  // 10. Products CRUD
  async getProducts() {
    if (!supabase) {
      return getLocalStore('products', defaultMockData.products);
    }
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async setProductPublished(id, isActive) {
    if (supabase) {
      const { data, error } = await supabase.from('products')
        .update({ is_active: isActive })
        .eq('id', id)
        .select('id,is_active')
        .single();
      if (error) throw error;
      if (!data) throw new Error('ไม่พบสินค้าที่ต้องการเปลี่ยนสถานะ');
      window.dispatchEvent(new Event('solarservice:products-updated'));
      return data;
    }

    const current = getLocalStore('products', defaultMockData.products);
    if (!current.some((product) => product.id === id)) {
      throw new Error('ไม่พบสินค้าที่ต้องการเปลี่ยนสถานะ');
    }
    const updated = current.map((product) => (
      product.id === id ? { ...product, is_active: isActive } : product
    ));
    setLocalStore('products', updated);
    window.dispatchEvent(new Event('solarservice:products-updated'));
    return updated.find((product) => product.id === id);
  },

  async saveProduct(item) {
    const payload = {
      name: item.name?.trim(),
      slug: item.slug?.trim() || `product-${Date.now()}`,
      category: item.category?.trim() || 'แผงโซลาร์เซลล์',
      sku: item.sku?.trim() || null,
      price: Number(item.price) || 0,
      compare_at_price: item.compare_at_price === '' || item.compare_at_price == null ? null : Number(item.compare_at_price),
      stock_quantity: Number(item.stock_quantity) || 0,
      image_url: item.image_url?.trim() || null,
      description: item.description?.trim() || '',
      is_active: item.is_active ?? true,
    };

    if (supabase) {
      const { data, error } = item.id && !String(item.id).startsWith('prod-')
        ? await supabase.from('products').update(payload).eq('id', item.id).select()
        : await supabase.from('products').insert(payload).select();
      if (error) throw error;
      if (!data?.[0]) throw new Error('ไม่พบข้อมูลสินค้าที่บันทึกใน Supabase');
      window.dispatchEvent(new Event('solarservice:products-updated'));
      return data[0];
    }

    const current = getLocalStore('products', defaultMockData.products);
    let updated;
    if (item.id) {
      updated = current.map((p) => (p.id === item.id ? { ...p, ...payload, id: item.id } : p));
    } else {
      const newItem = { ...payload, id: `prod-${Date.now()}`, created_at: new Date().toISOString() };
      updated = [newItem, ...current];
    }
    setLocalStore('products', updated);
    window.dispatchEvent(new Event('solarservice:products-updated'));
    return item;
  },

  async deleteProduct(id) {
    if (supabase && !String(id).startsWith('prod-')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      window.dispatchEvent(new Event('solarservice:products-updated'));
      return true;
    }
    const current = getLocalStore('products', defaultMockData.products);
    const updated = current.filter((p) => p.id !== id);
    setLocalStore('products', updated);
    window.dispatchEvent(new Event('solarservice:products-updated'));
    return true;
  },

  // 11. Orders CRUD
  async getOrders() {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Supabase orders error:', e);
      }
    }
    return getLocalStore('orders', defaultMockData.orders);
  },

  async updateOrderStatus(id, status, extra = {}) {
    if (supabase && !String(id).startsWith('ord-')) {
      try {
        await supabase.from('orders').update({ status, ...extra }).eq('id', id);
      } catch (e) {
        console.warn('Supabase updateOrderStatus error:', e);
      }
    }
    const current = getLocalStore('orders', defaultMockData.orders);
    const updated = current.map((o) => (o.id === id ? { ...o, status, ...extra, updated_at: new Date().toISOString() } : o));
    setLocalStore('orders', updated);
    return true;
  },

  async saveOrder(item) {
    const current = getLocalStore('orders', defaultMockData.orders);
    let updated;
    if (item.id) {
      updated = current.map((o) => (o.id === item.id ? { ...o, ...item } : o));
    } else {
      const newItem = {
        ...item,
        id: `ord-${Date.now()}`,
        order_number: `SS-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
        created_at: new Date().toISOString(),
      };
      updated = [newItem, ...current];
    }
    setLocalStore('orders', updated);
    return item;
  },

  // 12. Bookings CRUD
  async getBookings() {
    if (!supabase) throw new Error('กรุณาตั้งค่า Supabase เพื่อดูการจอง');
    const { data, error } = await supabase.from('service_bookings')
      .select('id,booking_number,customer_id,status,preferred_at,address,province,phone,notes,created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (!data?.length) return [];
    const bookingIds = data.map((booking) => booking.id);
    const [assignmentResult, techResult, profileResult] = await Promise.all([
      supabase.from('technician_assignments').select('booking_id,technician_id,assignment_type,status').in('booking_id', bookingIds),
      // Booking rows only need technician names; technician_type is required by
      // the technician-specific screens, not by this join.
      supabase.from('profiles').select('id,full_name').eq('role', 'technician'),
      supabase.from('profiles').select('id,full_name').in('id', [...new Set(data.map((booking) => booking.customer_id).filter(Boolean))]),
    ]);
    for (const result of [assignmentResult, techResult, profileResult]) if (result.error) throw result.error;
    const techNames = new Map((techResult.data || []).map((technician) => [technician.id, technician.full_name]));
    const customerNames = new Map((profileResult.data || []).map((profile) => [profile.id, profile.full_name]));
    const assignMap = new Map();
    (assignmentResult.data || []).filter((assignment) => assignment.status !== 'cancelled').forEach((assignment) => {
      const assigned = assignMap.get(assignment.booking_id) || [];
      assigned.push(assignment.technician_id);
      assignMap.set(assignment.booking_id, assigned);
    });
    return data.map((booking) => {
      const technicianIds = assignMap.get(booking.id) || [];
      return { ...booking, customer_name: customerNames.get(booking.customer_id) || '', technician_ids: technicianIds, technician_names: technicianIds.map((id) => techNames.get(id) || '') };
    });
  },

  async updateBookingStatus(id, status) {
    if (!supabase) throw new Error('กรุณาตั้งค่า Supabase เพื่อเปลี่ยนสถานะการจอง');
    const { error } = await supabase.from('service_bookings').update({ status }).eq('id', id);
    if (error) throw error;
    return true;
  },

  async assignTechnician(bookingId, technicianId, technicianName = '', assignmentType = 'survey') {
    if (supabase && !String(bookingId).startsWith('bk-')) {
      const { error: assignmentError } = await supabase.rpc('assign_booking_technician', {
        p_booking_id: bookingId,
        p_technician_id: technicianId,
        p_assignment_type: assignmentType,
      });
      if (assignmentError) throw assignmentError;
      return true;
    }
    throw new Error('ไม่สามารถมอบหมายงานโดยไม่มี Supabase จริงได้');
  },

  async saveBooking(item) {
    if (!supabase) throw new Error('ต้องเชื่อมต่อ Supabase เพื่อเปิดคิวจอง');

    const customerName = item.customer_name?.trim();
    const phone = item.phone?.trim();
    if (!customerName || !phone || !item.address?.trim() || !item.preferred_at) {
      throw new Error('กรุณากรอกชื่อลูกค้า เบอร์โทร ที่อยู่ และวันเวลานัดหมายให้ครบ');
    }
    if (!item.request_id) throw new Error('ไม่พบรหัสคำขอสำหรับป้องกันการสร้างคิวซ้ำ กรุณาปิดแล้วเปิดฟอร์มใหม่');
    if (item.service_type && item.service_type !== 'survey') {
      throw new Error('ฟอร์มนี้ใช้เปิดคิวสำรวจหน้างานเท่านั้น');
    }

    // service_bookings.customer_id references an existing auth-backed profile;
    // never create a detached profile or pretend a local-only record is saved.
    const { data: customers, error: customerError } = await supabase
      .from('profiles')
      .select('id,full_name,phone')
      .eq('role', 'customer')
      .eq('full_name', customerName)
      .eq('phone', phone)
      .limit(2);
    if (customerError) throw customerError;
    if (!customers?.length) {
      throw new Error('ไม่พบลูกค้าในระบบที่ชื่อตรงกับเบอร์โทรนี้ กรุณาสมัคร/สร้างบัญชีลูกค้าก่อนเปิดคิว');
    }
    if (customers.length > 1) {
      throw new Error('พบลูกค้าหลายบัญชีที่ใช้ชื่อและเบอร์โทรนี้ กรุณาแก้ข้อมูลบัญชีให้ระบุลูกค้าได้ชัดเจนก่อน');
    }

    const preferredAt = new Date(item.preferred_at);
    if (Number.isNaN(preferredAt.getTime())) throw new Error('วันเวลานัดหมายไม่ถูกต้อง');
    const rawNotes = item.notes?.trim() || '';
    const notes = `[service_type:survey]${rawNotes ? ` ${rawNotes}` : ''}`;
    const payload = {
      id: item.request_id,
      customer_id: customers[0].id,
      preferred_at: preferredAt.toISOString(),
      address: item.address.trim(),
      province: item.province,
      phone,
      notes,
      status: 'pending',
    };
    const columns = 'id,booking_number,customer_id,preferred_at,address,province,phone,notes,status,created_at';
    const { data: insertData, error: insertError } = await supabase
      .from('service_bookings')
      .insert(payload)
      .select(columns)
      .single();
    let inserted = insertData;
    if (insertError) {
      if (insertError.code !== '23505') throw insertError;
      // If an earlier request committed but its response/readback was lost,
      // reuse that same request id instead of creating a second booking.
      const { data: existing, error: existingError } = await supabase
        .from('service_bookings')
        .select(columns)
        .eq('id', item.request_id)
        .maybeSingle();
      if (existingError) throw existingError;
      const sameRequest = existing
        && existing.customer_id === payload.customer_id
        && new Date(existing.preferred_at).getTime() === preferredAt.getTime()
        && existing.address === payload.address
        && existing.province === payload.province
        && existing.phone === payload.phone
        && existing.notes === payload.notes
        && existing.status === payload.status;
      if (!sameRequest) throw insertError;
      inserted = existing;
    }
    if (!inserted?.id) throw new Error('Supabase ไม่ยืนยันผลการสร้างคิว กรุณาตรวจสอบรายการก่อนลองอีกครั้ง');

    // Verify the persisted row is readable before reporting success to the UI.
    const { data: saved, error: readbackError } = await supabase
      .from('service_bookings')
      .select(columns)
      .eq('id', inserted.id)
      .single();
    if (readbackError) throw readbackError;
    if (!saved?.id) throw new Error('สร้างคิวแล้วแต่ตรวจสอบข้อมูลกลับจาก Supabase ไม่สำเร็จ กรุณารีเฟรชรายการก่อนลองซ้ำ');
    return { ...saved, customer_name: customers[0].full_name, technician_ids: [], technician_names: [] };
  },

  // 13. Quotations CRUD
  async getQuotes() {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('quotations').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Supabase quotations error:', e);
      }
    }
    return getLocalStore('quotes', defaultMockData.quotes);
  },

  async updateQuoteStatus(id, status) {
    if (supabase && !String(id).startsWith('qt-')) {
      try {
        await supabase.from('quotations').update({ status }).eq('id', id);
      } catch (e) {
        console.warn('Supabase updateQuoteStatus error:', e);
      }
    }
    const current = getLocalStore('quotes', defaultMockData.quotes);
    const updated = current.map((q) => (q.id === id ? { ...q, status, updated_at: new Date().toISOString() } : q));
    setLocalStore('quotes', updated);
    return true;
  },

  async saveQuote(item) {
    const current = getLocalStore('quotes', defaultMockData.quotes);
    let updated;
    if (item.id) {
      updated = current.map((q) => (q.id === item.id ? { ...q, ...item } : q));
    } else {
      const newItem = {
        ...item,
        id: `qt-${Date.now()}`,
        quote_number: `QT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: item.status || 'sent',
        created_at: new Date().toISOString(),
      };
      updated = [newItem, ...current];
    }
    setLocalStore('quotes', updated);
    return item;
  },

  // 14. Installations CRUD
  async getInstallations() {
    if (!supabase) throw new Error('กรุณาตั้งค่า Supabase เพื่อดูงานติดตั้ง');
    const { data, error } = await supabase.from('installations').select(`
      *,service_bookings!inner(id,booking_number,address,province,phone,preferred_at,customer_id,customer:profiles!service_bookings_customer_id_fkey(full_name),site_surveys(recommended_system_kw))
    `).order('created_at', { ascending: false });
    if (error) throw error;
    const rows = data || [];
    if (!rows.length) return [];
    const bookingIds = rows.map((row) => row.booking_id);
    const { data: assignments, error: assignmentError } = await supabase.from('technician_assignments')
      .select('booking_id,technician_id,profiles:profiles!technician_assignments_technician_id_fkey(full_name)')
      .in('booking_id', bookingIds).eq('assignment_type', 'installation').neq('status', 'cancelled');
    if (assignmentError) throw assignmentError;
    const technicianByBooking = new Map((assignments || []).map((assignment) => [assignment.booking_id, assignment.profiles?.full_name || '']));
    return rows.map((row) => {
      const booking = Array.isArray(row.service_bookings) ? row.service_bookings[0] : row.service_bookings;
      const survey = Array.isArray(booking?.site_surveys) ? booking.site_surveys[0] : booking?.site_surveys;
      return {
        ...row,
        booking_number: booking?.booking_number || '',
        customer_name: booking?.customer?.full_name || '',
        phone: booking?.phone || '',
        address: booking?.address || '',
        scheduled_at: row.scheduled_at || booking?.preferred_at || null,
        system_size_kw: survey?.recommended_system_kw || 0,
        lead_technician: technicianByBooking.get(row.booking_id) || '',
      };
    });
  },

  async getInstallationUpdates(bookingId) {
    if (!supabase) throw new Error('กรุณาตั้งค่า Supabase เพื่อดูรูปงานติดตั้ง');
    const { data, error } = await supabase
      .from('installation_images')
      .select('id,storage_path,created_at')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Promise.all((data || []).map(async (image) => {
      const { data: signed, error: signedError } = await supabase.storage
        .from('installation-images')
        .createSignedUrl(image.storage_path, 3600);
      if (signedError) throw signedError;
      return { ...image, url: signed.signedUrl };
    }));
  },

  async updateInstallationStatus(id, status, extra = {}) {
    if (supabase && !String(id).startsWith('inst-')) {
      const { error } = await supabase.from('installations').update({ status, ...extra }).eq('id', id);
      if (error) throw error;
      return true;
    }
    const current = getLocalStore('installations', defaultMockData.installations);
    const updated = current.map((i) => (i.id === id ? { ...i, status, ...extra, updated_at: new Date().toISOString() } : i));
    setLocalStore('installations', updated);
    return true;
  },

  async saveInstallation(item) {
    const current = getLocalStore('installations', defaultMockData.installations);
    let updated;
    if (item.id) {
      updated = current.map((i) => (i.id === item.id ? { ...i, ...item } : i));
    } else {
      const newItem = {
        ...item,
        id: `inst-${Date.now()}`,
        installation_number: `IN-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: item.status || 'scheduled',
        stages: item.stages || { site_ready: true, equipment_delivered: false, panels_mounted: false, inverter_wired: false, grid_tested: false },
        created_at: new Date().toISOString(),
      };
      updated = [newItem, ...current];
    }
    setLocalStore('installations', updated);
    return item;
  },

  // 15. Technicians List
  async getTechnicians() {
    if (!supabase) throw new Error('กรุณาตั้งค่า Supabase เพื่อดูรายชื่อช่าง');
    const { data, error } = await supabase.from('profiles').select('id,full_name,phone,role,technician_type').eq('role', 'technician');
    if (error) throw error;
    return data || [];
  },
};
