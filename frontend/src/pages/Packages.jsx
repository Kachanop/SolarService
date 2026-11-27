import { Check, ShieldCheck, CalendarDays, Phone } from 'lucide-react';
import { packages as fallbackPackages } from '../data/catalog.js';
import { PageIntro } from '../components/Shared.jsx';

const packagePhoto = (name) => `${import.meta.env.BASE_URL}images/packages/${name}.jpg`;

function resolvePackageImage(pkg) {
  if (pkg.image) return pkg.image;
  const kw = Number(pkg.system_size_kw);
  if ([3, 5, 10].includes(kw)) return packagePhoto(`package-${kw}kw`);
  return packagePhoto('package-5kw');
}

function isTestPackage(pkg) {
  return /test|ทดสอบ/i.test(`${pkg.name || ''} ${pkg.slug || ''} ${pkg.description || ''}`);
}

export default function Packages({ navigate, packages: incomingPackages = [] }) {
  const dbPackages = incomingPackages.map((pkg) => ({
    ...pkg,
    size: `${Number(pkg.system_size_kw || 0)} kW`,
    priceNumber: Number(pkg.price || 0),
    priceLabel: Number(pkg.price || 0).toLocaleString('th-TH'),
    items: Array.isArray(pkg.features) ? pkg.features : [],
    image: resolvePackageImage(pkg),
    isSample: false,
  }));
  const defaultDisplayPackages = [
    {
      id: 'pkg-test-10',
      slug: 'package-test-10-baht',
      name: 'แพ็กเกจทดสอบการชำระเงิน 10 บาท',
      system_size_kw: 1,
      size: '1 kW',
      priceNumber: 10,
      priceLabel: '10',
      description: 'แพ็กเกจทดลองสำหรับตรวจสอบขั้นตอนสั่งซื้อ ชำระเงิน PromptPay และออกใบเสนอราคาหลังชำระเงิน',
      items: ['แพ็กเกจทดลองระบบ 1 kW', 'รองรับชำระเงิน PromptPay 10 บาท', 'ออกใบเสนอราคาหลังชำระเงินสำเร็จ'],
      isSample: true,
    },
    ...fallbackPackages.map((item, idx) => {
      const kw = Number(String(item.size).replace(/[^0-9.]/g, '')) || 5;
      return {
        ...item,
        id: `sample-pkg-${idx}`,
        slug: `package-${kw}kw`,
        system_size_kw: kw,
        priceNumber: Number(String(item.price).replace(/,/g, '')),
        priceLabel: item.price,
        isSample: true,
      };
    }),
  ];
  const displayPackages = [
    ...dbPackages,
    ...defaultDisplayPackages.filter((fallback) => !dbPackages.some((dbPkg) => (
      (fallback.slug && dbPkg.slug === fallback.slug)
      || (fallback.slug === 'package-test-10-baht' && Number(dbPkg.price) === 10 && /ทดสอบ|test|เทส|10/i.test(dbPkg.name || ''))
      || ([3, 5, 10].includes(Number(fallback.system_size_kw)) && Number(dbPkg.system_size_kw) === Number(fallback.system_size_kw))
    ))),
  ];

  return (
    <div className="page-wrap">
      <PageIntro
        eyebrow="SOLAR PACKAGES"
        title="แพ็กเกจที่พอดีกับบ้านคุณ"
        description="แพ็กเกจติดตั้งต้องนัดทีมงานประเมินหน้างานก่อน เพื่อยืนยันความเหมาะสมและเสนอราคาที่ถูกต้อง"
      />
      <div className="package-grid">
        {displayPackages.map((item) => {
          const testPkg = isTestPackage(item);
          return (
            <article key={item.id || item.name} className={`package-card ${item.popular ? 'popular' : ''}`}>
              {item.popular && <div className="popular-label">ยอดนิยม</div>}
              {testPkg
                ? <div className="package-photo" style={{ display: 'grid', placeItems: 'center', background: '#eef3ea', color: '#526e48', fontWeight: 700 }}>แพ็กเกจทดสอบการชำระเงิน 10 บาท</div>
                : <img className="package-photo" src={item.image} alt={item.name} loading="lazy" />}
              <div className="package-top">
                <span className="package-size">{item.size}</span>
              </div>
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <div className="package-price"><small>{testPkg ? 'ราคาทดสอบ' : 'เริ่มต้น'}</small><strong>{item.priceLabel}<span> บาท</span></strong></div>
              <ul>{(item.items || []).map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul>
              <div style={{ display: 'grid', gap: '8px' }}>
                <button className="button button-green" type="button" onClick={() => navigate(`/contact?package=${encodeURIComponent(item.name)}`)}>
                  <Phone size={16} /> ติดต่อเพื่อนัดประเมินหน้างาน
                </button>
                <button className="button button-outline" type="button" onClick={() => navigate('/bookings')}>
                  <CalendarDays size={16} /> นัดสำรวจหน้างาน
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <p className="package-note"><ShieldCheck size={16} /> ยังไม่มีการเรียกเก็บเงินจากหน้าแพ็กเกจ ทีมงานจะติดต่อกลับเพื่อนัดประเมินก่อนเสนอราคา</p>
    </div>
  );
}
