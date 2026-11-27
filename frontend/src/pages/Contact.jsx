import React, { useState } from 'react';
import { ArrowRight, FileText, Headphones, House } from 'lucide-react';
import { PageIntro } from '../components/Shared.jsx';

export default function Contact({ setToast }) {
  const requestedPackage = new URLSearchParams(window.location.hash.split('?')[1] || '').get('package') || '';
  const [form, setForm] = useState({ name: '', contact: '', message: '' });

  function submit(event) {
    event.preventDefault();
    const subject = requestedPackage ? `ขอนัดประเมินแพ็กเกจ ${requestedPackage}` : 'สอบถาม SolarService';
    const body = [
      `ชื่อ: ${form.name.trim()}`,
      `ช่องทางติดต่อกลับ: ${form.contact.trim()}`,
      requestedPackage ? `แพ็กเกจที่สนใจ: ${requestedPackage}` : '',
      '',
      form.message.trim(),
    ].filter(Boolean).join('\n');
    window.location.href = `mailto:hello@solarservice.co.th?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setToast('กำลังเปิดโปรแกรมอีเมลเพื่อส่งคำขอ หากไม่เปิด กรุณาโทร 02-123-4567');
  }

  return <div className="page-wrap">
    <PageIntro
      eyebrow="CONTACT US"
      title={requestedPackage ? 'นัดประเมินแพ็กเกจหน้างาน' : 'คุยกับเราได้เลย'}
      description={requestedPackage
        ? `แจ้งความสนใจแพ็กเกจ ${requestedPackage} ทีมงานจะติดต่อกลับเพื่อประเมินพื้นที่ก่อนจัดทำข้อเสนอ`
        : 'ทีมงานยินดีตอบทุกคำถามเรื่องโซลาร์เซลล์และบริการของเรา'}
    />
    <div className="contact-grid">
      <div className="contact-details">
        <h2>เราพร้อมช่วยคุณ</h2>
        <p>ปรึกษาเบื้องต้นได้ฟรี ไม่มีข้อผูกมัด</p>
        <div><span><Headphones /></span><section><small>โทรศัพท์</small><a href="tel:021234567"><strong>02-123-4567</strong></a><small>จันทร์ – เสาร์, 09:00 – 18:00 น.</small></section></div>
        <div><span><FileText /></span><section><small>อีเมล</small><a href="mailto:hello@solarservice.co.th"><strong>hello@solarservice.co.th</strong></a></section></div>
        <div><span><House /></span><section><small>สำนักงาน</small><strong>กรุงเทพมหานคร ประเทศไทย</strong></section></div>
      </div>
      <form className="form-card" onSubmit={submit}>
        <h3>{requestedPackage ? 'ขอให้ทีมงานติดต่อเพื่อนัดประเมิน' : 'ส่งข้อความถึงเรา'}</h3>
        <label>ชื่อของคุณ<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="เช่น คุณสมชาย ใจดี" /></label>
        <label>อีเมลหรือเบอร์โทร<input required value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} placeholder="สำหรับติดต่อกลับ" /></label>
        <label>รายละเอียด<textarea required rows="4" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="บอกเราได้เลยว่าต้องการคำปรึกษาเรื่องอะไร" /></label>
        <button className="button button-green" type="submit">
          เปิดอีเมลเพื่อส่งคำขอติดต่อ <ArrowRight size={16} />
        </button>
      </form>
    </div>
  </div>;
}
