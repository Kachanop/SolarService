import React from 'react';
import { ArrowRight, ArrowUpRight, Headphones, Leaf, Package, ShieldCheck, Sun, Wrench, Zap } from 'lucide-react';
import { ProductCard } from '../components/Shared.jsx';

export default function Home({ navigate, addToCart, products: catalog }) {
  return <>
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot" /> พลังงานสะอาด สำหรับทุกบ้าน</div>
        <h1>ให้แสงอาทิตย์<br />ดูแลบ้านคุณ<span className="sun-accent">.</span></h1>
        <p className="hero-description">เริ่มต้นประหยัดค่าไฟอย่างยั่งยืน ด้วยระบบโซลาร์เซลล์ที่ออกแบบเพื่อบ้านคุณ พร้อมทีมช่างผู้เชี่ยวชาญดูแลทุกขั้นตอน</p>
        <div className="hero-actions"><a className="button button-green" href="#/packages">เลือกแพ็กเกจ <ArrowRight size={17} /></a><a className="text-link" href="#/services"><span className="play-icon">▶</span> รู้จักบริการของเรา</a></div>
        <div className="hero-trust"><div className="avatar-stack"><span>น</span><span>ภ</span><span>ก</span><span>+</span></div><div><strong>2,400+ บ้าน</strong><small>ที่ไว้วางใจ SolarService</small></div><span className="trust-divider" /><div className="rating"><span>★★★★★</span><small>4.9/5 คะแนนรีวิว</small></div></div>
      </div>
      <div className="hero-art">
        <div className="art-sun"><Sun size={44} strokeWidth={1.2} /></div>
        <div className="art-cloud cloud-one" /><div className="art-cloud cloud-two" />
        <div className="art-hill hill-back" /><div className="art-hill hill-front" />
        <div className="house-illustration">
          <div className="roof"><span className="roof-panel panel-one" /><span className="roof-panel panel-two" /><span className="roof-panel panel-three" /></div>
          <div className="house-body"><div className="window window-left" /><div className="door" /><div className="window window-right" /><div className="plant plant-one">♧</div><div className="plant plant-two">♧</div></div>
        </div>
        <div className="art-spark spark-one">✳</div><div className="art-spark spark-two">✦</div>
        <div className="savings-card"><span className="savings-icon"><Zap size={17} /></span><div><small>ประหยัดค่าไฟได้สูงสุด</small><strong>70% <i>ต่อเดือน</i></strong></div><ArrowUpRight size={18} className="savings-arrow" /></div>
        <div className="clean-badge"><span><Leaf size={17} /></span><div><strong>พลังงานสะอาด</strong><small>เพื่อโลกที่ดีกว่า</small></div></div>
        <span className="art-caption">SUNSHINE, MADE SIMPLE.</span>
      </div>
    </section>

    <section className="proof-bar">
      <div><strong>ออกแบบเพื่อบ้านคุณ</strong><span>ไม่ใช่แค่ระบบสำเร็จรูป</span></div>
      <div><ShieldCheck size={21} /><strong>รับประกันยาวนาน</strong></div>
      <div><Wrench size={21} /><strong>ช่างมืออาชีพ</strong></div>
      <div><Headphones size={21} /><strong>ดูแลทุกขั้นตอน</strong></div>
      <a href="#/services">ทำไมต้อง SolarService <ArrowRight size={15} /></a>
    </section>

    <section className="section home-products">
      <div className="section-heading"><div><div className="eyebrow">คัดสรรมาเพื่อคุณ</div><h2>พลังงานดี ๆ เริ่มที่นี่</h2><p>อุปกรณ์คุณภาพที่เราคัดมาเพื่อบ้านของคุณโดยเฉพาะ</p></div><a className="text-link" href="#/products">ดูสินค้าทั้งหมด <ArrowRight size={16} /></a></div>
      {catalog.length ? <div className="product-grid">{catalog.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} addToCart={() => addToCart(product)} navigate={navigate} compact />)}</div>
        : <div className="empty-state"><Package size={28} /><h3>ยังไม่มีสินค้าให้เลือก</h3><p>โปรดกลับมาเยี่ยมชมอีกครั้งในภายหลัง</p></div>}
    </section>
    <section className="bottom-cta"><div><div className="eyebrow">เริ่มต้นง่ายกว่าที่คิด</div><h2>ยังไม่แน่ใจว่าบ้านคุณ<br />เหมาะกับระบบแบบไหน?</h2><p>ให้ช่างผู้เชี่ยวชาญเข้าสำรวจและออกแบบให้ฟรี ไม่มีค่าใช้จ่าย</p></div><a className="button button-dark" href="#/bookings">นัดช่างสำรวจฟรี <ArrowRight size={17} /></a></section>
  </>;
}
