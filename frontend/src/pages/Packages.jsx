import React from 'react';
import { ArrowRight, Check, ShieldCheck, Sun } from 'lucide-react';
import { packages } from '../data/catalog.js';
import { PageIntro } from '../components/Shared.jsx';

export default function Packages({ navigate }) {
  return <div className="page-wrap"><PageIntro eyebrow="SOLAR PACKAGES" title="แพ็กเกจที่พอดีกับบ้านคุณ" description="ทุกแพ็กเกจออกแบบโดยผู้เชี่ยวชาญ พร้อมติดตั้งและดูแลครบวงจร" />
    <div className="package-grid">{packages.map((item) => <article key={item.name} className={`package-card ${item.popular ? 'popular' : ''}`}>{item.popular && <div className="popular-label">ยอดนิยม</div>}<div className="package-top"><span className="package-icon"><Sun size={21} /></span><span className="package-size">{item.size}</span></div><h2>{item.name}</h2><p>{item.description}</p><div className="package-price"><small>เริ่มต้น</small><strong>{item.price}<span> บาท</span></strong></div><ul>{item.items.map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul><button className={`button ${item.popular ? 'button-green' : 'button-outline'}`} onClick={() => navigate('/bookings')}>นัดสำรวจฟรี <ArrowRight size={16} /></button></article>)}</div>
    <p className="package-note"><ShieldCheck size={16} /> ราคาจริงขึ้นอยู่กับการสำรวจพื้นที่และอุปกรณ์ที่เลือก ไม่มีค่าใช้จ่ายในการเข้าสำรวจ</p>
  </div>;
}
