import React from 'react';
import { ArrowRight, Leaf, Sun } from 'lucide-react';

export function NotFound({ navigate }) {
  return <div className="not-found"><span>404</span><h1>ไม่พบหน้าที่คุณกำลังมองหา</h1><p>ลิงก์นี้อาจถูกย้ายหรือไม่มีอยู่แล้ว</p><button className="button button-green" onClick={() => navigate('/')}>กลับหน้าหลัก <ArrowRight size={16} /></button></div>;
}
export function Footer({ navigate }) {
  return <footer className="site-footer"><div className="footer-main"><div className="footer-brand"><a className="brand" href="#/"><span className="brand-mark"><Sun size={21} /></span><span>solar<span className="brand-light">service</span><small>POWER YOUR EVERYDAY</small></span></a><p>พลังงานสะอาดที่ออกแบบเพื่อบ้านคุณ<br />ดูแลครบตั้งแต่สำรวจถึงติดตั้ง</p></div><div><strong>เลือกชม</strong><a href="#/products">สินค้าทั้งหมด</a><a href="#/packages">แพ็กเกจติดตั้ง</a><a href="#/services">บริการของเรา</a></div><div><strong>SolarService</strong><a href="#/about">เกี่ยวกับเรา</a><a href="#/contact">ติดต่อเรา</a><a href="#/login">เข้าสู่ระบบ</a></div><div className="footer-contact"><strong>มีคำถาม? คุยกับเรา</strong><p>โทร 02-123-4567<br />จันทร์ – เสาร์ 09:00 – 18:00 น.</p><button onClick={() => navigate('/contact')}>ติดต่อทีมงาน <ArrowRight size={14} /></button></div></div><div className="footer-bottom"><span>© 2025 SolarService. สงวนลิขสิทธิ์</span><span>ออกแบบด้วยความใส่ใจ เพื่อพลังงานที่ยั่งยืน <Leaf size={13} /></span></div></footer>;
}
