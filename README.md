<div align="center">

# ☀️ SolarService

### พลังงานสะอาดที่ออกแบบเพื่อบ้านคุณ

เลือกซื้อโซลาร์เซลล์ · นัดช่างสำรวจ · ติดตามงานติดตั้ง<br />
ครบทุกขั้นตอนในเว็บไซต์เดียว

<br />

![React](https://img.shields.io/badge/React-18-20232A?logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-3FCF8E?logo=supabase&logoColor=white)
![Status](https://img.shields.io/badge/status-MVP%20in%20progress-c6a45c)

</div>

---

> **สถานะโครงการ** · Frontend MVP พร้อมหน้าเว็บตัวอย่างและ Supabase Auth แล้ว<br />
> Migration ฐานข้อมูลมีอยู่ใน repository แต่ต้องนำไปรันใน Supabase ด้วยตนเอง<br />
> หน้าสินค้า การจอง ใบเสนอราคา และติดตามงานยังไม่เชื่อมกับฐานข้อมูลจริง

## 🧭 สารบัญ

| เริ่มต้น | ภาพรวมระบบ | ข้อมูลและการพัฒนา |
|---|---|---|
| [ติดตั้งและรัน](#getting-started) | [ความสามารถ](#features) | [ตั้งค่า Supabase](#supabase-setup) |
| [เทคโนโลยี](#technology) | [บทบาทผู้ใช้](#user-roles) | [โครงสร้างฐานข้อมูล](#database-schema) |
| [โครงสร้างโปรเจกต์](#project-structure) | [หน้าเว็บไซต์](#site-pages) | [ขอบเขต MVP](#mvp-scope) |
|  | [Workflow หลัก](#workflow) | [แนวทางแบ่งงาน](#team-work) |

<a id="features"></a>
## ✨ ความสามารถและสถานะงาน

| ความสามารถ | สถานะ |
|---|---|
| ความสามารถ | สถานะ |
|---|---|
| หน้าแรกและเมนูนำทาง Responsive | ✅ พร้อมใช้งาน |
| หน้าสินค้า ค้นหา และกรองหมวดหมู่ | 🧩 UI ตัวอย่าง |
| ตะกร้าและ checkout | 🧩 UI ตัวอย่าง; ข้อมูลอยู่ใน state ของหน้าเว็บ |
| หน้าแพ็กเกจและบริการช่าง | ✅ มีหน้า UI และข้อมูลตัวอย่าง |
| สมัครสมาชิก/เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน | ✅ เชื่อม Supabase Auth |
| ออกจากระบบและคืนค่าสถานะ session | ✅ เชื่อม Supabase Auth |
| กู้คืนและตั้งรหัสผ่านใหม่ | ✅ เชื่อม Auth; ต้องตั้ง redirect URL |
| เมนูและพื้นที่ Admin/ช่างตาม role ใน `profiles` | ✅ อ่าน role และจำกัดเส้นทางใน Frontend |
| Schema และ Row Level Security | 🗄️ มี migration; ต้องนำไปรันใน Supabase |
| สินค้า การจอง ผลสำรวจ ใบเสนอราคา และติดตามงาน | 🧩 มีหน้าตัวอย่าง; ยังไม่อ่าน/เขียนฐานข้อมูลจริง |
| อัปโหลดรูปสำรวจไปยัง Supabase Storage | ⏳ ยังไม่ได้เชื่อม |
| Payment Gateway | ⏳ ยังไม่ได้เชื่อม |

<a id="user-roles"></a>
## 👥 บทบาทผู้ใช้

1. **Guest — ผู้เยี่ยมชม**
   - ดูสินค้า แพ็กเกจ บริการ ข้อมูลบริษัท และช่องทางติดต่อ
   - สมัครสมาชิกหรือเข้าสู่ระบบ
   - ต้องเข้าสู่ระบบก่อนทำรายการที่ต้องเป็นสมาชิก

2. **Customer — ลูกค้า**
   - จัดการโปรไฟล์และประวัติการใช้บริการ
   - เลือกซื้อสินค้าและแพ็กเกจ จองช่าง และเลือกวันนัดหมาย
   - ดูผลสำรวจและใบเสนอราคา ยืนยันหรือปฏิเสธราคา
   - ติดตามงานติดตั้งและรีวิวหลังส่งมอบงาน

3. **Technician — ช่าง**
   - ดูตารางนัดหมายและงานที่ได้รับมอบหมาย
   - บันทึกข้อมูลพื้นที่ หลังคา และอุปกรณ์ที่แนะนำ
   - ส่งรายงานผลสำรวจและรูปภาพหน้างาน
   - อัปเดตงานสำรวจและติดตั้ง

4. **Admin — ผู้ดูแลระบบ**
   - จัดการสินค้า แพ็กเกจ บัญชีผู้ใช้ การจอง และการมอบหมายงาน
   - ตรวจผลสำรวจและจัดทำใบเสนอราคา
   - จัดการคำสั่งซื้อ การชำระเงิน และงานติดตั้ง
   - ดู Dashboard และรายงาน

> Frontend อ่านบทบาทจาก `profiles` เพื่อแสดงพื้นที่ลูกค้า ช่าง หรือ Admin และจำกัดเส้นทางตามบทบาท หน้าจัดการยังใช้ข้อมูลตัวอย่างและยังไม่อ่าน/เขียนข้อมูลธุรกิจจากฐานข้อมูล การกำหนดสิทธิ์ที่สำคัญต้องตรวจด้วย RLS ใน Supabase ด้วยเสมอ

<a id="site-pages"></a>
## 🖥️ หน้าเว็บไซต์

### หน้าสาธารณะ

- หน้าแรก
- รายการสินค้าและรายละเอียดสินค้า
- แพ็กเกจติดตั้ง
- บริการช่างสำรวจและติดตั้ง
- เกี่ยวกับเรา
- ติดต่อเรา

### ระบบสมาชิก

- สมัครสมาชิก
- เข้าสู่ระบบ
- ลืมรหัสผ่าน/ตั้งรหัสผ่านใหม่
- โปรไฟล์ — มีโครงหน้า UI

### พื้นที่ลูกค้า

- Dashboard ลูกค้า
- ตะกร้าสินค้าและยืนยันคำสั่งซื้อ
- จองช่างและประวัติการจอง
- ใบเสนอราคา
- ติดตามสถานะงานติดตั้ง
- รีวิวบริการ

### พื้นที่ช่าง

- Dashboard ช่างและตารางนัดหมาย
- รายละเอียดงานและประวัติงาน
- แบบฟอร์มบันทึกผลสำรวจและเลือกไฟล์ภาพ

### พื้นที่ผู้ดูแลระบบ

- Dashboard
- จัดการสินค้าและบัญชีผู้ใช้
- จัดการการจอง ใบเสนอราคา และคำสั่งซื้อ
- จัดการงานติดตั้งและรายงานผลประกอบการ

<a id="workflow"></a>
## 🔄 Workflow หลัก

1. Guest ดูสินค้า/แพ็กเกจ แล้วสมัครสมาชิกหรือเข้าสู่ระบบ
2. Customer เลือกสินค้าเพื่อสั่งซื้อ หรือส่งคำขอนัดช่างเข้าสำรวจ
3. Admin ตรวจคำขอและมอบหมายช่าง
4. Technician เข้าสำรวจ บันทึกข้อมูลและส่งผลสำรวจ
5. Admin จัดทำใบเสนอราคาตามผลสำรวจ
6. Customer ตรวจสอบและยืนยันหรือปฏิเสธใบเสนอราคา
7. ดำเนินการชำระเงิน นัดติดตั้ง และอัปเดตสถานะงาน
8. เมื่อติดตั้งเสร็จ Customer ติดตามประวัติและรีวิวบริการ

<a id="technology"></a>
## 🧰 เทคโนโลยี

- **Frontend:** React 18, Vite 6, JavaScript
- **UI icons:** Lucide React
- **Authentication / Database:** Supabase Auth และ PostgreSQL
- **Access control:** PostgreSQL Row Level Security (RLS)
- **Package manager:** npm

<a id="getting-started"></a>
## 🚀 เริ่มต้นใช้งาน

ต้องติดตั้ง Node.js และ npm ก่อน

```bash
npm install
```

คัดลอก `.env.example` เป็น `.env.local` แล้วกรอกค่า Supabase ตามหัวข้อ [ตั้งค่า Supabase](#ตั้งค่า-supabase) จากนั้นรัน:

```bash
npm run dev
```

คำสั่งอื่น:

```bash
npm run build    # สร้าง production build ไว้ใน dist/
npm run preview  # เปิดดู production build ในเครื่อง
```

<a id="supabase-setup"></a>
## 🔐 ตั้งค่า Supabase

### 1. กำหนด environment variables

คัดลอกไฟล์ตัวอย่าง:

```powershell
Copy-Item .env.example .env.local
```

ใส่ URL และ **Publishable key** ของโปรเจกต์ใน `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

หลังแก้ environment variables ให้ restart Vite (`Ctrl+C` แล้ว `npm run dev`)

> ห้ามใส่ `sb_secret_` หรือ `service_role` key ในตัวแปร `VITE_` หรือโค้ดฝั่ง Browser เด็ดขาด ไฟล์ `.env.local` ถูก ignore โดย Git ส่วน `.env.example` ใช้แชร์เฉพาะชื่อตัวแปรและค่าตัวอย่างเท่านั้น

### 2. ตั้งค่า Authentication redirect URLs

ใน Supabase Dashboard เปิด **Authentication → URL Configuration** แล้วกำหนด:

- Site URL สำหรับเว็บไซต์ที่ deploy แล้ว
- Redirect URLs ที่อนุญาต เช่น `http://localhost:5173/**` สำหรับพัฒนาในเครื่อง และ URL ของเว็บไซต์จริง

การยืนยันอีเมลและการส่งอีเมลรีเซ็ตรหัสผ่านขึ้นอยู่กับการตั้งค่า Auth/SMTP ของ Supabase

### 3. สร้างตารางและ RLS

Schema อยู่ใน [supabase/migrations/20261031200000_initial_schema.sql](./supabase/migrations/20261031200000_initial_schema.sql)

วิธีใช้งานปัจจุบัน:

1. เปิด Supabase Dashboard → **SQL Editor**
2. เปิดไฟล์ migration ด้านบนและคัดลอกเนื้อหาทั้งหมด
3. วางใน SQL Editor แล้วกด Run
4. ตรวจสอบตารางใน **Table Editor** และตรวจ policies ใน **Authentication → Policies**

Migration สร้าง trigger สำหรับสร้าง profile เมื่อมีบัญชีใหม่ และกำหนด RLS บนทุกตาราง โดยทั่วไปลูกค้าอ่าน/แก้ไขได้เฉพาะข้อมูลของตน ช่างเข้าถึงงานที่ได้รับมอบหมาย และ Admin จัดการข้อมูลระบบได้

### 4. กำหนด Admin เริ่มต้น

สมัครบัญชีของผู้ดูแลระบบก่อน แล้วรันคำสั่งต่อไปนี้ **ครั้งเดียว** ใน SQL Editor โดยเปลี่ยนอีเมลให้ตรงกับบัญชีจริง:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where email = 'admin@example.com'
);
```

จากนั้นออกจากระบบและเข้าสู่ระบบใหม่ บัญชีจะเห็น Dashboard และเมนู Admin ที่ `#/admin` การเปลี่ยน role เป็นการดำเนินการที่มีสิทธิ์สูง ควรทำโดยผู้ดูแลที่เชื่อถือได้เท่านั้น และต้องคง RLS policies ในฐานข้อมูลไว้เสมอ เพราะการซ่อนหน้าใน Frontend ไม่ใช่การป้องกันข้อมูลฝั่งฐานข้อมูล

<a id="database-schema"></a>
## 🗄️ โครงสร้างฐานข้อมูล

| ตาราง | หน้าที่ |
|---|---|
| `profiles` | โปรไฟล์ ชื่อ เบอร์โทร และ role; เชื่อมกับ `auth.users` |
| `products` | สินค้า ราคา SKU จำนวนคงเหลือ และสถานะเผยแพร่ |
| `packages` | แพ็กเกจ ขนาดระบบ ราคา และคุณสมบัติ |
| `orders` | คำสั่งซื้อ ยอดรวม สถานะ และที่อยู่จัดส่ง |
| `order_items` | รายการสินค้าในคำสั่งซื้อและราคาขณะสั่ง |
| `service_bookings` | การจองสำรวจ วันนัด ที่อยู่ และสถานะ |
| `technician_assignments` | การมอบหมายงานจองให้ช่าง |
| `site_surveys` | ขนาด/ประเภท/ทิศทางหลังคา ระบบที่แนะนำ และรายงาน |
| `survey_images` | path และคำอธิบายรูปภาพสำรวจ |
| `quotations` | ใบเสนอราคา ยอดรวม สถานะ และคำตอบลูกค้า |
| `quotation_items` | รายการสินค้า/บริการในใบเสนอราคา |
| `installations` | ตารางและสถานะงานติดตั้ง |
| `payments` | รายการชำระเงินและสถานะตรวจสอบ |
| `reviews` | คะแนนและความคิดเห็นหลังติดตั้ง |

Migration ยังเพิ่ม:

- Foreign keys, ข้อจำกัดข้อมูล, unique keys และ indexes สำหรับการค้นหาที่ใช้บ่อย
- Trigger ปรับ `updated_at` และสร้าง `profiles` หลังสมัครสมาชิก
- RLS policies สำหรับข้อมูลสาธารณะ ลูกค้า ช่าง และ Admin
- RPC `create_order` เพื่อสร้างคำสั่งซื้อโดยคำนวณราคาจากข้อมูลสินค้าในฐานข้อมูล
- RPC `respond_to_quotation` เพื่อยืนยันหรือปฏิเสธใบเสนอราคาที่ส่งให้ลูกค้า

ตารางนี้เป็นโครงสร้างเริ่มต้นของ MVP ควรทบทวนข้อกำหนดทางธุรกิจและนโยบายการชำระเงินก่อนใช้งานจริง ระบบยังไม่มี Payment Gateway และยังไม่ได้สร้าง Supabase Storage bucket สำหรับรูปสำรวจ

<a id="project-structure"></a>
## 📁 โครงสร้างโปรเจกต์

```text
SolarService/
├── .env.example                 # ตัวอย่างตัวแปร Supabase (ไม่มี secret จริง)
├── index.html                   # HTML entry point
├── package.json                 # scripts และ dependencies
├── README.md
├── src/
│   ├── App.jsx                  # routing แบบ hash, หน้า UI และ auth flow
│   ├── main.jsx                 # React entry point
│   ├── styles.css               # styles และ responsive layout
│   └── lib/
│       └── supabase.js          # Supabase client
└── supabase/
    └── migrations/
        └── 20261031200000_initial_schema.sql
```

<a id="mvp-scope"></a>
## 🎯 ขอบเขต MVP และงานที่ยังไม่รวม

### ✅ อยู่ในขอบเขต MVP

- ระบบสมาชิกและ role
- แสดง/จัดการสินค้าและแพ็กเกจ
- ตะกร้าและคำสั่งซื้อ
- จองช่าง ตารางนัดหมาย และมอบหมายงาน
- รายงานสำรวจและรูปภาพจากหน้างาน
- ใบเสนอราคาและการตอบรับจากลูกค้า
- ติดตามงานติดตั้ง
- หลังบ้าน Admin ประวัติ และรายงาน

### 🚧 ยังไม่รวมในรุ่นแรก

- ติดตามตำแหน่งช่างด้วย GPS แบบ real-time
- ควบคุมแผงโซลาร์เซลล์ด้วย IoT
- วิเคราะห์โครงสร้างหลังคาด้วย AI
- คำนวณผลผลิตพลังงานขั้นสูงโดยอัตโนมัติ
- เชื่อมต่อ Payment Gateway กับธนาคาร

### 📌 งานพัฒนาต่อที่จำเป็น

- เชื่อมหน้าสินค้า/ตะกร้า/booking/ใบเสนอราคา/installation เข้ากับ Supabase tables และ RPC
- เพิ่ม Supabase Storage bucket และ policies สำหรับภาพสำรวจ
- อ่าน role จาก `profiles` เพื่อแสดงหน้าและเมนูตามสิทธิ์
- ทดสอบ RLS แยกตาม Guest, Customer, Technician และ Admin
- ตั้งค่า email templates, SMTP, redirect URLs และ production hosting
- เพิ่ม automated tests และแนวทาง deploy/migrate สำหรับ environment จริง



ทุกคนร่วมกันทบทวน schema, RLS policies, API/data contract และทดสอบการทำงานข้ามโมดูล
