import React from 'react';
import { ArrowRight, Sun } from 'lucide-react';
import { PageIntro } from '../components/Shared.jsx';

export default function About({ navigate }) {
  return <div className="page-wrap"><PageIntro eyebrow="ABOUT SOLARSERVICE" title={<>เราเชื่อว่าพลังงานสะอาด<br />ควรเป็นเรื่องง่ายสำหรับทุกคน</>} description="SolarService เกิดจากความตั้งใจที่จะทำให้การเริ่มต้นใช้พลังงานแสงอาทิตย์เป็นเรื่องที่เข้าใจง่าย เชื่อถือได้ และเข้าถึงได้สำหรับทุกบ้าน" /><div className="about-panel"><div className="about-visual"><Sun size={76} /><span>ENERGY FOR TOMORROW</span></div><div><div className="eyebrow">พลังงานที่ดี เริ่มจากความใส่ใจ</div><h2>เราไม่ได้แค่ติดตั้งโซลาร์<br />แต่เราดูแลบ้านของคุณ</h2><p>ตั้งแต่การเลือกอุปกรณ์ การสำรวจหน้างาน ไปจนถึงการติดตั้งและบริการหลังการขาย ทุกขั้นตอนถูกออกแบบให้คุณมั่นใจและสบายใจที่สุด</p><div className="about-stats"><div><strong>2,400+</strong><span>บ้านที่ไว้วางใจ</span></div><div><strong>8 ปี</strong><span>ประสบการณ์ทีมงาน</span></div><div><strong>4.9/5</strong><span>คะแนนความพึงพอใจ</span></div></div><button className="button button-green" onClick={() => navigate('/contact')}>พูดคุยกับเรา <ArrowRight size={16} /></button></div></div></div>;
}
