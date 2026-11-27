import React, { useEffect, useState } from 'react';
import { Search, ShoppingCart, Eye, X, Check, Zap } from 'lucide-react';
import { PageIntro } from '../components/Shared.jsx';
import { getPublishedProductReviews } from '../services/reviewService.js';

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
.sx-card-media { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background: var(--sx-green-soft); }
.sx-card-media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.sx-card-media.sx-product-media img { padding: 14px; box-sizing: border-box; object-fit: contain; }
.sx-card-placeholder { position: absolute; inset: 0; display: grid; place-items: center; padding: 24px; color: var(--sx-muted); font-size: 14px; font-weight: 600; text-align: center; }
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
.sx-modal { position: relative; display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr); width: min(1120px, calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; background: #fff; border-radius: 22px; }
.sx-close { position: absolute; top: 14px; right: 14px; z-index: 2; width: 36px; height: 36px; display: grid; place-items: center; border: 1px solid var(--sx-line); border-radius: 50%; background: #fff; color: var(--sx-green-dark); cursor: pointer; }
.sx-modal-media { display: flex; min-width: 0; flex-direction: column; justify-content: center; background: var(--sx-green-soft); }
.sx-modal-placeholder { display: grid; width: 100%; min-height: 340px; place-items: center; color: var(--sx-muted); font-weight: 600; text-align: center; }
.sx-modal-media > img { width: 100%; height: min(72vh, 720px); min-height: 340px; object-fit: contain; display: block; }
.sx-thumbs { display: flex; gap: 8px; padding: 10px; overflow-x: auto; }
.sx-thumb { flex: 0 0 64px; height: 64px; padding: 0; border: 2px solid transparent; border-radius: 10px; overflow: hidden; background: none; cursor: pointer; }
.sx-thumb.on { border-color: var(--sx-green); }
.sx-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sx-modal-body { min-width: 0; padding: 30px 28px; }
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
.sx-reviews { margin-top: 22px; padding-top: 14px; border-top: 1px solid var(--sx-line); }
.sx-reviews h4 { margin: 0 0 10px; font-size: 15px; color: var(--sx-green-dark); }
.sx-review-summary { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; color: var(--sx-muted); }
.sx-review-summary strong { color: var(--sx-green-dark); font-size: 21px; }
.sx-review-summary span { color: #d2a848; letter-spacing: 1px; }
.sx-review-summary small { font-size: 12px; }
.sx-review-list { display: grid; gap: 10px; max-height: 270px; overflow: auto; margin-top: 12px; }
.sx-review-card { padding: 12px; background: #f8faf6; border: 1px solid var(--sx-line); border-radius: 10px; }
.sx-review-meta { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.sx-review-meta strong { color: var(--sx-green-dark); font-size: 13px; }
.sx-review-meta time { color: var(--sx-muted); font-size: 11px; }
.sx-review-stars { margin-top: 5px; color: #d2a848; letter-spacing: 1px; }
.sx-review-card p { margin: 7px 0 0; color: var(--sx-ink); font-size: 13px; line-height: 1.65; white-space: pre-wrap; overflow-wrap: anywhere; }
.sx-reviews-message { margin: 0; color: var(--sx-muted); font-size: 13px; line-height: 1.6; }

@media (max-width: 720px) {
  .sx-overlay { padding: 10px; }
  .sx-modal { width: 100%; max-height: calc(100vh - 20px); grid-template-columns: minmax(0, 1fr); border-radius: 16px; }
  .sx-modal-media > img { height: min(48vh, 420px); min-height: 220px; }
  .sx-modal-placeholder { min-height: 220px; }
  .sx-modal-body { padding: 24px 20px; }
  .sx-grid { grid-template-columns: 1fr; }
}
`;

/* ---------- helpers ---------- */
const baht = (n) => `฿${Number(n || 0).toLocaleString('th-TH')}`;

const photo = (name) => `${import.meta.env.BASE_URL}images/products/${name}.jpg`;
const packagePhoto = (name) => `${import.meta.env.BASE_URL}images/packages/${name}.jpg`;
const FALLBACK_IMG = photo('panel');

// หากรูปหลักโหลดไม่ขึ้น จะลองรูปสำรองก่อนใช้รูปแผงโซลาร์สำรอง
const onImgError = (e, sources = []) => {
  const el = e.currentTarget;
  const step = Number(el.dataset.step || 1);
  if (step < sources.length) {
    el.dataset.step = String(step + 1);
    el.src = sources[step];
  } else if (el.dataset.fallbackApplied !== 'true') {
    el.dataset.fallbackApplied = 'true';
    el.src = FALLBACK_IMG;
  }
};

const PLACEHOLDER_RE = /placehold|placeholder|dummyimage|fakeimg/i;
const SVG_IMAGE_RE = /^(?:data:image\/svg\+xml)|\.svg(?:[?#]|$)/i;

const guessKind = (item) => {
  const t = `${item.name || ''} ${item.category || ''}`.toLowerCase();
  if (/inverter|อินเวอร์เตอร์/.test(t)) return 'inverter';
  if (/battery|แบตเตอรี่/.test(t)) return 'battery';
  if (/rail|mount|accessor|ราง|โครง|ติดตั้ง|อุปกรณ์เสริม/.test(t)) return 'mounting-kit';
  if (/panel|แผง|solar/.test(t)) return 'panel';
  return null;
};

const isPaymentTestProduct = (item) => /test|ทดสอบ/i.test(`${item.name || ''} ${item.description || ''}`);

const productPhotoName = (item) => {
  const text = `${item.name || ''} ${item.category || ''}`.toLowerCase();
  if (/battery|แบตเตอรี่/.test(text)) return 'battery';
  if (/inverter|อินเวอร์เตอร์/.test(text) && /huawei|sun2000/.test(text)) return 'inverter-huawei';
  return guessKind(item) || 'panel';
};

const productPhotoSource = (item) => {
  const text = `${item.name || ''} ${item.description || ''}`.toLowerCase();
  if (/450\s*w/i.test(text)) return packagePhoto('package-10kw');
  if (/hybrid/i.test(text)) return photo('inverter-huawei');
  return photo(productPhotoName(item));
};

const packagePhotoName = (item) => {
  const systemSize = Number(item.system_size_kw);
  if ([3, 5, 10].includes(systemSize)) return `package-${systemSize}kw`;
  const text = `${item.name || ''} ${item.size || ''}`.toLowerCase();
  const match = text.match(/\b(3|5|10)\s*k\s*w\b/i);
  if (match) return `package-${match[1]}kw`;
  if (/small|เริ่มต้น/.test(text)) return 'package-3kw';
  if (/large|ครอบครัวใหญ่|โรงงาน/.test(text)) return 'package-10kw';
  return 'package-5kw';
};

const getSources = (item, kind = 'product') => {
  if (kind === 'product' && isPaymentTestProduct(item)) return [];
  const localPhoto = kind === 'package'
    ? packagePhoto(packagePhotoName(item))
    : productPhotoSource(item);
  const own = [item.image, item.image_url, item.imageUrl, ...(item.images || [])]
    .filter((url) => url && !PLACEHOLDER_RE.test(url) && !SVG_IMAGE_RE.test(url));
  const fallbacks = (item.fallbacks || [])
    .filter((url) => url && !PLACEHOLDER_RE.test(url) && !SVG_IMAGE_RE.test(url));
  const finalPhoto = kind === 'package' ? packagePhoto('package-5kw') : FALLBACK_IMG;
  return [...new Set([localPhoto, ...own, ...fallbacks, finalPhoto])];
};

const getImage = (item, kind) => getSources(item, kind)[0];

/* ---------- ตัวอย่างแพ็กเกจ (ถ้าไม่ส่ง prop packages เข้ามา) ----------
   เปลี่ยน image เป็นรูปจริงของคุณได้เลย เช่น '/images/pkg-5kw.jpg' หรือ URL เต็ม */
const DEFAULT_PACKAGES = [
  {
    isSample: true,
    id: 'pkg-3kw',
    name: 'แพ็กเกจ 3 kW สำหรับบ้านขนาดเล็ก',
    price: 89000,
    image: packagePhoto('package-3kw'),
    description: 'ชุดโซลาร์รูฟท็อปครบชุด เหมาะกับบ้านที่ใช้ไฟเดือนละ 1,500–2,500 บาท',
    includes: ['แผงโซลาร์ 6 แผ่น', 'อินเวอร์เตอร์ 3 kW', 'โครงสร้างยึดหลังคา', 'ค่าติดตั้งและเดินสาย', 'รับประกันงานติดตั้ง 5 ปี'],
  },
  {
    isSample: true,
    id: 'pkg-5kw',
    name: 'แพ็กเกจ 5 kW สำหรับบ้านทั่วไป',
    price: 139000,
    image: packagePhoto('package-5kw'),
    description: 'คุ้มค่าที่สุดสำหรับครอบครัวที่ใช้แอร์หลายเครื่อง ลดค่าไฟได้ต่อเนื่อง',
    includes: ['แผงโซลาร์ 10 แผ่น', 'อินเวอร์เตอร์ 5 kW', 'ระบบมอนิเตอร์ผ่านแอป', 'ค่าติดตั้งและเดินสาย', 'รับประกันงานติดตั้ง 5 ปี'],
    popular: true,
  },
  {
    isSample: true,
    id: 'pkg-10kw',
    name: 'แพ็กเกจ 10 kW สำหรับร้านค้า/โรงงานเล็ก',
    price: 259000,
    image: packagePhoto('package-10kw'),
    description: 'รองรับการใช้ไฟช่วงกลางวันสูง ช่วยลดต้นทุนพลังงานของธุรกิจ',
    includes: ['แผงโซลาร์ 20 แผ่น', 'อินเวอร์เตอร์ 10 kW', 'ระบบมอนิเตอร์ผ่านแอป', 'ค่าติดตั้งและเดินสาย', 'รับประกันงานติดตั้ง 5 ปี'],
  },
];


/* ---------- ตัวอย่างสินค้า (แสดงเมื่อระบบยังไม่ส่งสินค้าเข้ามา) ----------
   ราคาและรายละเอียดเป็นข้อมูลสมมติ ให้แก้เป็นของจริง และเปลี่ยน image เป็น path รูปจริงได้ */
const SAMPLE_PRODUCTS = [
  { isSample: true, id: 'sample-1', name: 'แผงโซลาร์ Mono 550W', price: 4290, category: 'แผงโซลาร์', image: photo('panel'),
    description: 'แผงโมโนคริสตัลไลน์ประสิทธิภาพสูง ทนแดด ทนฝน เหมาะกับหลังคาบ้านและโรงงาน',
    specs: { 'กำลังไฟ': '550 W', 'ประเภท': 'Mono PERC', 'ประกันผลิตภัณฑ์': '12 ปี', 'ประกันกำลังผลิต': '25 ปี' }, popular: true },
  { isSample: true, id: 'sample-2', name: 'แผงโซลาร์ Mono 450W', price: 3490, category: 'แผงโซลาร์', image: photo('panel'),
    description: 'ขนาดกะทัดรัด ติดตั้งง่าย เหมาะกับพื้นที่หลังคาจำกัด',
    specs: { 'กำลังไฟ': '450 W', 'ประเภท': 'Mono PERC', 'ประกันผลิตภัณฑ์': '12 ปี' } },
  { isSample: true, id: 'sample-3', name: 'อินเวอร์เตอร์ On-Grid 5 kW', price: 32900, category: 'อินเวอร์เตอร์', image: photo('inverter'),
    description: 'ต่อเข้าระบบไฟบ้านโดยตรง ดูผลผลิตไฟผ่านแอปบนมือถือได้ทุกเวลา',
    specs: { 'กำลังไฟ': '5 kW', 'ประสิทธิภาพ': '98%', 'การเชื่อมต่อ': 'Wi-Fi', 'ประกัน': '5 ปี' } },
  { isSample: true, id: 'sample-4', name: 'อินเวอร์เตอร์ Hybrid 8 kW', price: 54900, category: 'อินเวอร์เตอร์', image: photo('inverter'),
    description: 'รองรับการต่อแบตเตอรี่ ใช้ไฟต่อเนื่องแม้ไฟดับ เหมาะกับบ้านที่ต้องการความมั่นคงทางไฟฟ้า',
    specs: { 'กำลังไฟ': '8 kW', 'รองรับแบตเตอรี่': 'ได้', 'ประกัน': '5 ปี' } },
  { isSample: true, id: 'sample-5', name: 'แบตเตอรี่ลิเธียม 5 kWh', price: 59900, category: 'แบตเตอรี่', image: photo('battery'),
    description: 'แบตเตอรี่ LiFePO4 ทั่วไป รุ่นที่จำหน่ายอาจมีสเปกแตกต่างกัน',
    specs: { 'ความจุ': '5 kWh', 'เคมี': 'LiFePO4', 'รอบการชาร์จ': '6,000 รอบ', 'ประกัน': '10 ปี' } },
  { isSample: true, id: 'sample-6', name: 'ชุดโครงยึดแผงบนหลังคา', price: 1890, category: 'อุปกรณ์เสริม', image: photo('mounting-kit'),
    description: 'โครงอะลูมิเนียมกันสนิม รองรับหลังคาเมทัลชีทและกระเบื้อง (ราคาต่อ 1 แผง)',
    specs: { 'วัสดุ': 'อะลูมิเนียม', 'รองรับลม': 'สูงสุด 180 กม./ชม.' } },
];

/* ---------- การ์ดสินค้า / แพ็กเกจ ---------- */
function ItemCard({ item, kind, onView, onAdd }) {
  const isTestProduct = kind === 'product' && isPaymentTestProduct(item);
  return (
    <article className="sx-card">
      <div className={`sx-card-media ${kind === 'product' ? 'sx-product-media' : ''}`}>
        {isTestProduct
          ? <span className="sx-card-placeholder">รายการทดสอบการชำระเงิน</span>
          : <img src={getImage(item, kind)} alt={item.name} loading="lazy" onError={(e) => onImgError(e, getSources(item, kind))} />}
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

  const isTestProduct = kind === 'product' && isPaymentTestProduct(item);
  const gallery = !isTestProduct && item.images && item.images.length > 1 ? item.images : null;
  const [active, setActive] = useState(getImage(item, kind));
  const specs = item.specs && typeof item.specs === 'object' ? Object.entries(item.specs) : [];
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const isDatabaseProduct = kind === 'product' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(item.id));

  useEffect(() => {
    if (!isDatabaseProduct) return undefined;
    let activeRequest = true;
    setReviewsLoading(true);
    setReviewsError('');
    getPublishedProductReviews(item.id)
      .then((data) => { if (activeRequest) setReviews(data); })
      .catch((error) => {
        if (!activeRequest) return;
        const message = [error?.message, error?.details, error?.hint].filter(Boolean).join(' — ');
        setReviewsError(/get_public_product_reviews|PGRST202|schema cache/i.test(message)
          ? 'กรุณารัน migration 20261127000000_product_reviews.sql ก่อน แล้วจึงรัน 20261127010000_public_product_reviews.sql'
          : message || 'โหลดรีวิวสินค้าไม่สำเร็จ');
      })
      .finally(() => { if (activeRequest) setReviewsLoading(false); });
    return () => { activeRequest = false; };
  }, [isDatabaseProduct, item.id]);

  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length
    : 0;

  return (
    <div className="sx-overlay" onClick={onClose} role="presentation">
      <div className="sx-modal" role="dialog" aria-modal="true" aria-label={item.name} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sx-close" onClick={onClose} aria-label="ปิด">
          <X size={20} />
        </button>
        <div className="sx-modal-media">
          {isTestProduct
            ? <div className="sx-modal-placeholder">รายการทดสอบการชำระเงิน</div>
            : <>
              <img src={active} alt={item.name} onError={(e) => onImgError(e, getSources(item, kind))} />
            </>}
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
                  <img src={src} alt="" onError={(e) => onImgError(e, getSources(item, kind))} />
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

          {kind === 'product' && !isDatabaseProduct && <section className="sx-reviews" aria-label="รีวิวสินค้า">
            <h4>รีวิวจากผู้ซื้อ</h4>
            <p className="sx-reviews-message">ไม่สามารถโหลดรีวิวสำหรับสินค้าตัวอย่างนี้ได้</p>
          </section>}

          {isDatabaseProduct && <section className="sx-reviews" aria-label="รีวิวสินค้า">
            <h4>รีวิวจากผู้ซื้อ</h4>
            {reviewsLoading && <p className="sx-reviews-message" role="status">กำลังโหลดรีวิว…</p>}
            {!reviewsLoading && reviewsError && <p className="sx-reviews-message" role="alert">{reviewsError}</p>}
            {!reviewsLoading && !reviewsError && reviews.length > 0 && <>
              <div className="sx-review-summary">
                <strong>{averageRating.toFixed(1)}</strong>
                <span aria-label={`${averageRating.toFixed(1)} จาก 5 ดาว`}>{'★'.repeat(Math.round(averageRating))}{'☆'.repeat(5 - Math.round(averageRating))}</span>
                <small>{reviews.length} รีวิวจากผู้ซื้อ</small>
              </div>
              <div className="sx-review-list">
                {reviews.map((review) => (
                  <article className="sx-review-card" key={review.id}>
                    <div className="sx-review-meta">
                      <strong>{review.customer_name || 'ผู้ซื้อสินค้า'}</strong>
                      <time dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString('th-TH')}</time>
                    </div>
                    <div className="sx-review-stars" aria-label={`${review.rating} จาก 5 ดาว`}>
                      {'★'.repeat(Number(review.rating))}{'☆'.repeat(5 - Number(review.rating))}
                    </div>
                    <p>{review.comment}</p>
                  </article>
                ))}
              </div>
            </>}
            {!reviewsLoading && !reviewsError && reviews.length === 0 && <p className="sx-reviews-message">ยังไม่มีรีวิวจากผู้ซื้อสินค้านี้</p>}
          </section>}

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