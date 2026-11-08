import React, { useEffect, useState } from 'react';
import { Search, ShoppingCart, Eye, X, Check, Zap } from 'lucide-react';
import { PageIntro } from '../components/Shared.jsx';

/* ---------- สไตล์ (อยู่ในไฟล์นี้เลย ไม่ต้องมีไฟล์ CSS แยก) ---------- */
const CSS = `
/* สีดึงมาจากธีมของเว็บ: เขียวเข้ม #27392c / เขียวหลัก #526e48 / พื้นหลัง #f7f8f4 */
.sx-tabs, .sx-grid, .sx-overlay {
  --sx-green: #526e48;
  --sx-green-dark: #27392c;
  --sx-green-soft: #eef3ea;
  --sx-lime: #e6edba;
  --sx-ink: #29382c;
  --sx-muted: #6f7a6e;
  --sx-line: #e0e6db;
  --sx-card: #ffffff;
  font-family: inherit;
}

/* แท็บ */
.sx-tabs { display: inline-flex; gap: 4px; margin: 8px 0 20px; padding: 4px; background: var(--sx-green-soft); border: 1px solid var(--sx-line); border-radius: 12px; max-width: 100%; overflow-x: auto; }
.sx-tabs button { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border: 0; border-radius: 9px; background: transparent; font: inherit; font-size: 14px; font-weight: 600; color: var(--sx-muted); cursor: pointer; white-space: nowrap; }
.sx-tabs button span { font-size: 12px; padding: 0 8px; border-radius: 999px; background: rgba(82, 110, 72, .12); color: var(--sx-green); }
.sx-tabs button.on { background: var(--sx-green); color: #fff; }
.sx-tabs button.on span { background: rgba(255, 255, 255, .2); color: #fff; }
.sx-tabs button:focus-visible, .sx-btn:focus-visible, .sx-close:focus-visible, .sx-thumb:focus-visible { outline: 3px solid var(--sx-lime); outline-offset: 2px; box-shadow: 0 0 0 5px var(--sx-green); }

/* กริดการ์ด */
.sx-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 22px; margin-top: 18px; }
.sx-card { display: flex; flex-direction: column; background: var(--sx-card); border: 1px solid var(--sx-line); border-radius: 18px; overflow: hidden; transition: border-color .2s, box-shadow .2s; }
.sx-card:hover { border-color: #b9c9b1; box-shadow: 0 10px 26px rgba(39, 57, 44, .08); }
.sx-card-media { position: relative; aspect-ratio: 4 / 3; background: var(--sx-green-soft); }
.sx-card-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sx-badge { position: absolute; top: 12px; left: 12px; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; background: var(--sx-lime); color: var(--sx-green-dark); }
.sx-badge-soft { background: #fff; border: 1px solid var(--sx-line); color: var(--sx-green); }
.sx-badge.sx-inline { position: static; display: inline-block; margin-bottom: 10px; }
.sx-card-body { display: flex; flex-direction: column; gap: 8px; padding: 18px; flex: 1; }
.sx-card-title { margin: 0; font-size: 17px; line-height: 1.4; font-weight: 700; color: var(--sx-green-dark); }
.sx-card-desc { margin: 0; color: var(--sx-muted); font-size: 14px; line-height: 1.65; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.sx-card-price { margin-top: auto; padding: 6px 0 4px; font-size: 24px; font-weight: 800; color: var(--sx-green); }
.sx-card-price.sx-big { font-size: 32px; margin: 4px 0 12px; }
.sx-card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

/* ปุ่ม */
.sx-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 10px; border-radius: 10px; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; border: 1px solid transparent; transition: background .15s, color .15s; }
.sx-btn-solid { background: var(--sx-green); color: #fff; }
.sx-btn-solid:hover { background: var(--sx-green-dark); }
.sx-btn-ghost { background: #fff; color: var(--sx-green); border-color: #c5d3bd; }
.sx-btn-ghost:hover { background: var(--sx-green-soft); }
.sx-btn:disabled { opacity: .55; cursor: not-allowed; }
.sx-btn-wide { width: 100%; padding: 14px; font-size: 16px; margin-top: 22px; }

/* หน้าต่างรายละเอียด */
.sx-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(39, 57, 44, .6); }
.sx-modal { position: relative; display: grid; grid-template-columns: 1fr 1fr; width: min(940px, 100%); max-height: 90vh; overflow: auto; background: #fff; border-radius: 22px; }
.sx-close { position: absolute; top: 14px; right: 14px; z-index: 2; width: 36px; height: 36px; display: grid; place-items: center; border: 1px solid var(--sx-line); border-radius: 50%; background: #fff; color: var(--sx-green-dark); cursor: pointer; }
.sx-modal-media { background: var(--sx-green-soft); }
.sx-modal-media > img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; }
.sx-thumbs { display: flex; gap: 8px; padding: 10px; overflow-x: auto; }
.sx-thumb { flex: 0 0 64px; height: 64px; padding: 0; border: 2px solid transparent; border-radius: 10px; overflow: hidden; background: none; cursor: pointer; }
.sx-thumb.on { border-color: var(--sx-green); }
.sx-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sx-modal-body { padding: 30px 28px; }
.sx-modal-body h2 { margin: 0; font-size: 24px; line-height: 1.35; color: var(--sx-green-dark); }
.sx-modal-body h4 { margin: 22px 0 10px; font-size: 15px; color: var(--sx-green-dark); }
.sx-modal-desc { margin: 0; color: var(--sx-muted); line-height: 1.75; }
.sx-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.sx-list li { display: flex; align-items: flex-start; gap: 8px; font-size: 14px; color: var(--sx-ink); }
.sx-list svg { flex: none; margin-top: 2px; padding: 2px; width: 18px; height: 18px; border-radius: 50%; background: var(--sx-green-soft); color: var(--sx-green); }
.sx-specs { margin: 0; display: grid; }
.sx-specs div { display: flex; justify-content: space-between; gap: 12px; padding: 9px 12px; font-size: 14px; }
.sx-specs div:nth-child(odd) { background: var(--sx-green-soft); border-radius: 8px; }
.sx-specs dt { color: var(--sx-muted); }
.sx-specs dd { margin: 0; font-weight: 600; color: var(--sx-green-dark); text-align: right; }

@media (max-width: 720px) {
  .sx-modal { grid-template-columns: 1fr; }
  .sx-grid { grid-template-columns: 1fr; }
}
`;

/* ---------- helpers ---------- */
const baht = (n) => `฿${Number(n || 0).toLocaleString('th-TH')}`;

// รูป fallback (SVG ในตัว) เผื่อไม่มีรูปหรือโหลดไม่ขึ้น
const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#eef2f6"/><g fill="none" stroke="#9aa7b5" stroke-width="6"><rect x="110" y="95" width="180" height="110" rx="6"/><path d="M110 132h180M110 168h180M170 95v110M230 95v110"/></g></svg>`
  );

// รูปจริงวางไว้ที่ public/images/products/<ชื่อไฟล์>.jpg (ใช้ BASE_URL เผื่อเว็บอยู่ใน /SolarService/)
const photo = (name) => `${import.meta.env.BASE_URL}images/products/${name}.jpg`;

const getImage = (item) => getSources(item)[0];

// ถ้ารูปโหลดไม่ขึ้น ให้ลองรูปถัดไปในรายการ สุดท้ายเป็นภาพประกอบในตัว (ไม่มีรูปแตก)
const onImgError = (e, sources = []) => {
  const el = e.currentTarget;
  const step = Number(el.dataset.step || 1);
  if (step < sources.length) {
    el.dataset.step = String(step + 1);
    el.src = sources[step];
  } else if (el.src !== FALLBACK_IMG) {
    el.src = FALLBACK_IMG;
  }
};

/* ---------- ภาพประกอบสินค้า (SVG ในตัว) ใช้ชั่วคราวจนกว่าจะใส่รูปจริง ---------- */
const svgUri = (inner, bg = '#eaf0e8') =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="${bg}"/>${inner}</svg>`);

const panelSvg = (x, y, w, h, cols, rows) => {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#1d3b57" stroke="#d5dde3" stroke-width="5"/>`;
  for (let i = 1; i < cols; i++) s += `<line x1="${x + (w / cols) * i}" y1="${y}" x2="${x + (w / cols) * i}" y2="${y + h}" stroke="#4d7596" stroke-width="1.5"/>`;
  for (let j = 1; j < rows; j++) s += `<line x1="${x}" y1="${y + (h / rows) * j}" x2="${x + w}" y2="${y + (h / rows) * j}" stroke="#4d7596" stroke-width="1.5"/>`;
  return s;
};

const illus = (kind) => {
  switch (kind) {
    case 'panel':
      return svgUri(`<circle cx="330" cy="62" r="26" fill="#d8c85a"/>${panelSvg(95, 70, 210, 170, 6, 8)}<rect x="190" y="240" width="20" height="26" fill="#9aa7b0"/><rect x="150" y="264" width="100" height="8" rx="3" fill="#9aa7b0"/>`);
    case 'panel-small':
      return svgUri(`<circle cx="70" cy="60" r="24" fill="#d8c85a"/>${panelSvg(110, 85, 180, 140, 5, 6)}<rect x="190" y="225" width="20" height="24" fill="#9aa7b0"/><rect x="155" y="247" width="90" height="8" rx="3" fill="#9aa7b0"/>`);
    case 'inverter':
      return svgUri(`<rect x="110" y="55" width="180" height="190" rx="16" fill="#f7f9f7" stroke="#b9c4bd" stroke-width="4"/><rect x="135" y="80" width="130" height="70" rx="8" fill="#26402f"/><path d="M150 130l22-28 20 18 22-34 30 30" fill="none" stroke="#7bd88f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="150" cy="185" r="7" fill="#4a7c59"/><circle cx="175" cy="185" r="7" fill="#d8c85a"/><circle cx="200" cy="185" r="7" fill="#c9d2cc"/><rect x="135" y="212" width="130" height="10" rx="5" fill="#d5ddd7"/>`);
    case 'hybrid':
      return svgUri(`<rect x="85" y="60" width="130" height="180" rx="14" fill="#f7f9f7" stroke="#b9c4bd" stroke-width="4"/><rect x="105" y="82" width="90" height="52" rx="6" fill="#26402f"/><circle cx="115" cy="165" r="6" fill="#4a7c59"/><circle cx="137" cy="165" r="6" fill="#d8c85a"/><rect x="105" y="195" width="90" height="9" rx="4" fill="#d5ddd7"/><rect x="235" y="90" width="85" height="150" rx="12" fill="#2f5d46"/><rect x="250" y="106" width="55" height="12" rx="4" fill="#7bd88f"/><rect x="250" y="130" width="55" height="12" rx="4" fill="#7bd88f"/><rect x="250" y="154" width="55" height="12" rx="4" fill="#bfe8c8"/><rect x="250" y="178" width="55" height="12" rx="4" fill="#bfe8c8"/>`);
    case 'battery':
      return svgUri(`<rect x="130" y="48" width="140" height="205" rx="16" fill="#2f5d46"/><rect x="175" y="36" width="50" height="14" rx="4" fill="#9aa7b0"/><rect x="152" y="76" width="96" height="22" rx="5" fill="#7bd88f"/><rect x="152" y="108" width="96" height="22" rx="5" fill="#7bd88f"/><rect x="152" y="140" width="96" height="22" rx="5" fill="#7bd88f"/><rect x="152" y="172" width="96" height="22" rx="5" fill="#bfe8c8"/><rect x="152" y="204" width="96" height="22" rx="5" fill="#bfe8c8"/>`);
    case 'mount':
      return svgUri(`<g stroke="#8a97a0" stroke-width="12" stroke-linecap="round"><line x1="70" y1="110" x2="330" y2="110"/><line x1="70" y1="190" x2="330" y2="190"/></g><g fill="#b9c4bd"><rect x="110" y="92" width="22" height="116" rx="4"/><rect x="268" y="92" width="22" height="116" rx="4"/></g><g fill="#d8c85a"><circle cx="121" cy="110" r="7"/><circle cx="121" cy="190" r="7"/><circle cx="279" cy="110" r="7"/><circle cx="279" cy="190" r="7"/></g>`);
    case 'house':
      return svgUri(`<circle cx="335" cy="58" r="26" fill="#d8c85a"/><rect x="90" y="150" width="220" height="110" fill="#f7f9f7" stroke="#b9c4bd" stroke-width="4"/><rect x="185" y="195" width="30" height="65" fill="#9fb3a4"/><rect x="115" y="180" width="40" height="36" fill="#cfe3d3"/><rect x="245" y="180" width="40" height="36" fill="#cfe3d3"/><polygon points="70,152 200,60 330,152" fill="#3d5a47"/><polygon points="130,138 175,100 215,100 175,138" fill="#1d3b57" stroke="#d5dde3" stroke-width="3"/><polygon points="180,138 222,100 262,100 222,138" fill="#1d3b57" stroke="#d5dde3" stroke-width="3"/>`);
    default:
      return FALLBACK_IMG;
  }
};

// URL รูปที่เป็นรูปจำลอง (placeholder) จะถูกข้าม เพื่อให้ไปใช้รูปจริงหรือภาพประกอบแทน
const PLACEHOLDER_RE = /placehold|placeholder|dummyimage|fakeimg/i;

// เดาชนิดสินค้าจากชื่อ/หมวดหมู่ (รองรับทั้งไทยและอังกฤษ) เพื่อหาไฟล์รูปในโฟลเดอร์ public/images/products/
const guessKind = (item) => {
  const t = `${item.name || ''} ${item.category || ''}`.toLowerCase();
  if (/inverter|อินเวอร์เตอร์/.test(t)) return 'inverter';
  if (/battery|แบตเตอรี่/.test(t)) return 'battery';
  if (/rail|mount|accessor|ราง|โครง|อุปกรณ์เสริม/.test(t)) return 'mounting-kit';
  if (/panel|แผง|solar/.test(t)) return 'panel';
  return null;
};
const KIND_ILLUS = { inverter: 'inverter', battery: 'battery', 'mounting-kit': 'mount', panel: 'panel' };

// ลำดับรูปที่จะลอง: ไฟล์ของเราเอง -> รูปจากฐานข้อมูล (ที่ไม่ใช่ placeholder) -> รูปสำรอง -> ภาพประกอบ
const getSources = (item) => {
  const kind = item.isSample ? null : guessKind(item);
  const own = [item.image, item.image_url, item.imageUrl, ...(item.images || [])].filter((u) => u && !PLACEHOLDER_RE.test(u));
  const list = [
    ...(kind ? [photo(kind)] : []),
    ...own,
    ...(item.fallbacks || []),
    illus(KIND_ILLUS[kind || guessKind(item)] || 'panel'),
  ];
  return [...new Set(list)];
};

// รูปถ่ายจริงสำหรับแพ็กเกจ: ช่างติดตั้งแผงโซลาร์บนหลังคา (Wikipedia, CC0 ใช้เชิงพาณิชย์ได้โดยไม่ต้องขออนุญาต)
const INSTALLER_PHOTO = 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6c/PV_solar_installers_on_sloped_roof.jpg/800px-PV_solar_installers_on_sloped_roof.jpg';

/* ---------- ตัวอย่างแพ็กเกจ (ถ้าไม่ส่ง prop packages เข้ามา) ----------
   เปลี่ยน image เป็นรูปจริงของคุณได้เลย เช่น '/images/pkg-5kw.jpg' หรือ URL เต็ม */
const DEFAULT_PACKAGES = [
  {
    isSample: true,
    id: 'pkg-3kw',
    name: 'แพ็กเกจ 3 kW สำหรับบ้านขนาดเล็ก',
    price: 89000,
    image: photo('package-3kw'), fallbacks: [INSTALLER_PHOTO, illus('house')],
    description: 'ชุดโซลาร์รูฟท็อปครบชุด เหมาะกับบ้านที่ใช้ไฟเดือนละ 1,500–2,500 บาท',
    includes: ['แผงโซลาร์ 6 แผ่น', 'อินเวอร์เตอร์ 3 kW', 'โครงสร้างยึดหลังคา', 'ค่าติดตั้งและเดินสาย', 'รับประกันงานติดตั้ง 5 ปี'],
  },
  {
    isSample: true,
    id: 'pkg-5kw',
    name: 'แพ็กเกจ 5 kW สำหรับบ้านทั่วไป',
    price: 139000,
    image: photo('package-5kw'), fallbacks: [INSTALLER_PHOTO, illus('house')],
    description: 'คุ้มค่าที่สุดสำหรับครอบครัวที่ใช้แอร์หลายเครื่อง ลดค่าไฟได้ต่อเนื่อง',
    includes: ['แผงโซลาร์ 10 แผ่น', 'อินเวอร์เตอร์ 5 kW', 'ระบบมอนิเตอร์ผ่านแอป', 'ค่าติดตั้งและเดินสาย', 'รับประกันงานติดตั้ง 5 ปี'],
    popular: true,
  },
  {
    isSample: true,
    id: 'pkg-10kw',
    name: 'แพ็กเกจ 10 kW สำหรับร้านค้า/โรงงานเล็ก',
    price: 259000,
    image: photo('package-10kw'), fallbacks: [INSTALLER_PHOTO, illus('house')],
    description: 'รองรับการใช้ไฟช่วงกลางวันสูง ช่วยลดต้นทุนพลังงานของธุรกิจ',
    includes: ['แผงโซลาร์ 20 แผ่น', 'อินเวอร์เตอร์ 10 kW', 'ระบบมอนิเตอร์ผ่านแอป', 'ค่าติดตั้งและเดินสาย', 'รับประกันงานติดตั้ง 5 ปี'],
  },
];


/* ---------- ตัวอย่างสินค้า (แสดงเมื่อระบบยังไม่ส่งสินค้าเข้ามา) ----------
   ราคาและรายละเอียดเป็นข้อมูลสมมติ ให้แก้เป็นของจริง และเปลี่ยน image เป็น path รูปจริงได้ */
const SAMPLE_PRODUCTS = [
  { isSample: true, id: 'sample-1', name: 'แผงโซลาร์ Mono 550W', price: 4290, category: 'แผงโซลาร์', image: photo('panel-550w'), fallbacks: [illus('panel')],
    description: 'แผงโมโนคริสตัลไลน์ประสิทธิภาพสูง ทนแดด ทนฝน เหมาะกับหลังคาบ้านและโรงงาน',
    specs: { 'กำลังไฟ': '550 W', 'ประเภท': 'Mono PERC', 'ประกันผลิตภัณฑ์': '12 ปี', 'ประกันกำลังผลิต': '25 ปี' }, popular: true },
  { isSample: true, id: 'sample-2', name: 'แผงโซลาร์ Mono 450W', price: 3490, category: 'แผงโซลาร์', image: photo('panel-450w'), fallbacks: [illus('panel-small')],
    description: 'ขนาดกะทัดรัด ติดตั้งง่าย เหมาะกับพื้นที่หลังคาจำกัด',
    specs: { 'กำลังไฟ': '450 W', 'ประเภท': 'Mono PERC', 'ประกันผลิตภัณฑ์': '12 ปี' } },
  { isSample: true, id: 'sample-3', name: 'อินเวอร์เตอร์ On-Grid 5 kW', price: 32900, category: 'อินเวอร์เตอร์', image: photo('inverter-5kw'), fallbacks: [illus('inverter')],
    description: 'ต่อเข้าระบบไฟบ้านโดยตรง ดูผลผลิตไฟผ่านแอปบนมือถือได้ทุกเวลา',
    specs: { 'กำลังไฟ': '5 kW', 'ประสิทธิภาพ': '98%', 'การเชื่อมต่อ': 'Wi-Fi', 'ประกัน': '5 ปี' } },
  { isSample: true, id: 'sample-4', name: 'อินเวอร์เตอร์ Hybrid 8 kW', price: 54900, category: 'อินเวอร์เตอร์', image: photo('inverter-hybrid-8kw'), fallbacks: [illus('hybrid')],
    description: 'รองรับการต่อแบตเตอรี่ ใช้ไฟต่อเนื่องแม้ไฟดับ เหมาะกับบ้านที่ต้องการความมั่นคงทางไฟฟ้า',
    specs: { 'กำลังไฟ': '8 kW', 'รองรับแบตเตอรี่': 'ได้', 'ประกัน': '5 ปี' } },
  { isSample: true, id: 'sample-5', name: 'แบตเตอรี่ลิเธียม 5 kWh', price: 59900, category: 'แบตเตอรี่', image: photo('battery-5kwh'), fallbacks: [illus('battery')],
    description: 'เก็บไฟส่วนเกินตอนกลางวันไว้ใช้ตอนกลางคืน อายุการใช้งานยาวนาน',
    specs: { 'ความจุ': '5 kWh', 'เคมี': 'LiFePO4', 'รอบการชาร์จ': '6,000 รอบ', 'ประกัน': '10 ปี' } },
  { isSample: true, id: 'sample-6', name: 'ชุดโครงยึดแผงบนหลังคา', price: 1890, category: 'อุปกรณ์เสริม', image: photo('mounting-kit'), fallbacks: [illus('mount')],
    description: 'โครงอะลูมิเนียมกันสนิม รองรับหลังคาเมทัลชีทและกระเบื้อง (ราคาต่อ 1 แผง)',
    specs: { 'วัสดุ': 'อะลูมิเนียม', 'รองรับลม': 'สูงสุด 180 กม./ชม.' } },
];

/* ---------- การ์ดสินค้า / แพ็กเกจ ---------- */
function ItemCard({ item, kind, onView, onAdd }) {
  return (
    <article className="sx-card">
      <div className="sx-card-media">
        <img src={getImage(item)} alt={item.name} loading="lazy" onError={(e) => onImgError(e, getSources(item))} />
        {item.popular && <span className="sx-badge">ขายดี</span>}
        {kind === 'package' && !item.popular && <span className="sx-badge sx-badge-soft">รวมติดตั้ง</span>}
      </div>
      <div className="sx-card-body">
        <h3 className="sx-card-title">{item.name}</h3>
        <p className="sx-card-desc">{item.description || 'ยังไม่มีรายละเอียดสินค้า'}</p>
        <div className="sx-card-price">{baht(item.price)}</div>
        <div className="sx-card-actions">
          <button type="button" className="sx-btn sx-btn-ghost" onClick={() => onView(item)}>
            <Eye size={16} /> ดูรายละเอียด
          </button>
          <button
            type="button"
            className="sx-btn sx-btn-solid"
            onClick={() => onAdd(item)}
            disabled={item.isSample}
            title={item.isSample ? 'สินค้าตัวอย่าง ยังสั่งซื้อไม่ได้ (ยังไม่มีในฐานข้อมูล)' : undefined}
          >
            <ShoppingCart size={16} /> {item.isSample ? 'ตัวอย่าง' : 'เพิ่มลงตะกร้า'}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ---------- หน้าต่างรายละเอียด ---------- */
function DetailModal({ item, kind, onClose, onAdd }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const gallery = item.images && item.images.length > 1 ? item.images : null;
  const [active, setActive] = useState(getImage(item));
  const specs = item.specs && typeof item.specs === 'object' ? Object.entries(item.specs) : [];

  return (
    <div className="sx-overlay" onClick={onClose} role="presentation">
      <div className="sx-modal" role="dialog" aria-modal="true" aria-label={item.name} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sx-close" onClick={onClose} aria-label="ปิด">
          <X size={20} />
        </button>
        <div className="sx-modal-media">
          <img src={active} alt={item.name} onError={(e) => onImgError(e, getSources(item))} />
          {gallery && (
            <div className="sx-thumbs">
              {gallery.map((src) => (
                <button
                  type="button"
                  key={src}
                  className={`sx-thumb ${active === src ? 'on' : ''}`}
                  onClick={() => setActive(src)}
                  aria-label="ดูรูปนี้"
                >
                  <img src={src} alt="" onError={(e) => onImgError(e, getSources(item))} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="sx-modal-body">
          {kind === 'package' && <span className="sx-badge sx-badge-soft sx-inline">แพ็กเกจติดตั้ง</span>}
          <h2>{item.name}</h2>
          <div className="sx-card-price sx-big">{baht(item.price)}</div>
          <p className="sx-modal-desc">{item.description}</p>

          {item.includes && item.includes.length > 0 && (
            <>
              <h4>สิ่งที่รวมอยู่ในแพ็กเกจ</h4>
              <ul className="sx-list">
                {item.includes.map((line) => (
                  <li key={line}><Check size={16} /> {line}</li>
                ))}
              </ul>
            </>
          )}

          {specs.length > 0 && (
            <>
              <h4>สเปก</h4>
              <dl className="sx-specs">
                {specs.map(([k, v]) => (
                  <div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>
                ))}
              </dl>
            </>
          )}

          <button
            type="button"
            className="sx-btn sx-btn-solid sx-btn-wide"
            onClick={() => { onAdd(item); onClose(); }}
            disabled={item.isSample}
          >
            <ShoppingCart size={18} /> {item.isSample ? 'สินค้าตัวอย่าง ยังสั่งซื้อไม่ได้' : 'เพิ่มลงตะกร้า'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- หน้าหลัก ---------- */
export default function Products({ products: incoming = [], packages = DEFAULT_PACKAGES, search, setSearch, addToCart }) {
  // ถ้าระบบยังไม่ส่งสินค้ามา ให้แสดงตัวอย่างแทน (ลบ SAMPLE_PRODUCTS ได้เมื่อมีข้อมูลจริงแล้ว)
  const list = incoming.length ? incoming : SAMPLE_PRODUCTS;
  const [tab, setTab] = useState('products'); // 'products' | 'packages'
  const [filter, setFilter] = useState('ทั้งหมด');
  const [selected, setSelected] = useState(null); // { item, kind }

  const categories = ['ทั้งหมด', ...new Set(list.map((p) => p.category).filter(Boolean))];
  const visibleProducts = filter === 'ทั้งหมด' ? list : list.filter((p) => p.category === filter);

  const q = (search || '').trim().toLowerCase();
  const visiblePackages = q
    ? packages.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(q))
    : packages;

  const handleAdd = (item) => addToCart(item);
  const open = (kind) => (item) => setSelected({ item, kind });

  const items = tab === 'products' ? visibleProducts : visiblePackages;
  const kind = tab === 'products' ? 'product' : 'package';

  return (
    <div className="page-wrap">
      <style>{CSS}</style>
      <PageIntro
        eyebrow="SOLAR SHOP"
        title="เลือกอุปกรณ์ที่ใช่"
        description="อุปกรณ์โซลาร์เซลล์คุณภาพ พร้อมคำแนะนำจากผู้เชี่ยวชาญ"
      >
        <div className="search-field">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาสินค้าที่คุณสนใจ..."
          />
        </div>
      </PageIntro>

      <div className="sx-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'products'} className={tab === 'products' ? 'on' : ''} onClick={() => setTab('products')}>
          สินค้าทั้งหมด <span>{list.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === 'packages'} className={tab === 'packages' ? 'on' : ''} onClick={() => setTab('packages')}>
          <Zap size={16} /> แพ็กเกจติดตั้ง <span>{packages.length}</span>
        </button>
      </div>

      {tab === 'products' && (
        <div className="filter-row">
          {categories.map((c) => (
            <button key={c} className={`filter-chip ${filter === c ? 'selected' : ''}`} onClick={() => setFilter(c)}>
              {c}
            </button>
          ))}
          <span className="result-count">{visibleProducts.length} รายการ</span>
        </div>
      )}

      {items.length ? (
        <div className="sx-grid">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} kind={kind} onView={open(kind)} onAdd={handleAdd} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={28} />
          <h3>{(tab === 'products' ? list.length : packages.length) ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีรายการในระบบ'}</h3>
          <p>{(tab === 'products' ? list.length : packages.length) ? 'ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น' : 'โปรดกลับมาเยี่ยมชมอีกครั้งในภายหลัง'}</p>
        </div>
      )}

      {selected && (
        <DetailModal
          key={selected.item.id}
          item={selected.item}
          kind={selected.kind}
          onClose={() => setSelected(null)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}