import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { PageIntro, ProductCard } from '../components/Shared.jsx';

export default function Products({ products: list, search, setSearch, addToCart }) {
  const [filter, setFilter] = useState('ทั้งหมด');
  const categories = ['ทั้งหมด', ...new Set(list.map((product) => product.category).filter(Boolean))];
  const visible = filter === 'ทั้งหมด' ? list : list.filter((product) => product.category === filter);
  return <div className="page-wrap">
    <PageIntro eyebrow="SOLAR SHOP" title="เลือกอุปกรณ์ที่ใช่" description="อุปกรณ์โซลาร์เซลล์คุณภาพ พร้อมคำแนะนำจากผู้เชี่ยวชาญ">
      <div className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาสินค้าที่คุณสนใจ..." /></div>
    </PageIntro>
    <div className="filter-row">{categories.map((category) => <button key={category} className={`filter-chip ${filter === category ? 'selected' : ''}`} onClick={() => setFilter(category)}>{category}</button>)}<span className="result-count">{visible.length} รายการ</span></div>
    {visible.length ? <div className="product-grid catalog-grid">{visible.map((product) => <ProductCard key={product.id} product={product} addToCart={() => addToCart(product)} />)}</div> : <div className="empty-state"><Search size={28} /><h3>{list.length ? 'ไม่พบสินค้าที่ค้นหา' : 'ยังไม่มีสินค้าในระบบ'}</h3><p>{list.length ? 'ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น' : 'โปรดกลับมาเยี่ยมชมอีกครั้งในภายหลัง'}</p></div>}
  </div>;
}
