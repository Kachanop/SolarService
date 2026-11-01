import React from 'react';
import { Plus } from 'lucide-react';

export function Money({ value }) {
  return <>{Number(value).toLocaleString('th-TH')} <span className="currency">บาท</span></>;
}
export function PageIntro({ eyebrow, title, description, children }) {
  return <section className="page-intro"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p>{children}</section>;
}
export function ProductCard({ product, addToCart, navigate, compact = false }) {
  return <article className={`product-card ${compact ? 'compact' : ''}`}>
    <button className={`product-art ${product.tone}`} onClick={() => navigate?.('/products')} aria-label={`ดูรายละเอียด${product.name}`}><span className="product-badge">{product.badge || 'คุณภาพพรีเมียม'}</span><span className="product-symbol">{product.icon}</span><span className="product-art-caption">{product.category.toUpperCase()}</span></button>
    <div className="product-info"><small>{product.category}</small><a href="#/products" className="product-name">{product.name}</a><p>{product.detail}</p><div className="product-price">{product.oldPrice && <del><Money value={product.oldPrice} /></del>}<strong><Money value={product.price} /></strong></div><button className="add-cart-button" onClick={addToCart}><Plus size={16} /> เพิ่มลงตะกร้า</button></div>
  </article>;
}
