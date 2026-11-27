import React from 'react';
import { ArrowRight, Check, Plus, ShoppingCart } from 'lucide-react';
import { packages as fallbackPackages, products as fallbackProducts } from '../data/catalog.js';

export function Money({ value }) {
  return <>{Number(value).toLocaleString('th-TH')} <span className="currency">บาท</span></>;
}
export function PageIntro({ eyebrow, title, description, children }) {
  return <section className="page-intro"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p>{children}</section>;
}
export function ProductCard({ product, addToCart, navigate, compact = false }) {
  const category = product.category || 'อุปกรณ์โซลาร์';
  return <article className={`product-card ${compact ? 'compact' : ''}`}>
    <button className={`product-art ${product.tone || 'blue'}`} onClick={() => navigate?.('/products')} aria-label={`ดูรายละเอียด${product.name}`}>{product.image_url ? <img className={`product-image ${/inverter|battery|อินเวอร์เตอร์|แบตเตอรี่/i.test(`${category} ${product.name}`) ? 'product-image-contain' : ''}`} src={product.image_url} alt="" loading="lazy" /> : <span className="product-symbol">{product.icon || '▰'}</span>}<span className="product-badge">{product.badge || 'คุณภาพพรีเมียม'}</span><span className="product-art-caption">{category.toUpperCase()}</span></button>
    <div className="product-info"><small>{category}</small><a href="#/products" className="product-name">{product.name}</a><p>{product.detail || product.description}</p><div className="product-price">{product.oldPrice && <del><Money value={product.oldPrice} /></del>}<strong><Money value={product.price} /></strong></div><button className="add-cart-button" type="button" onClick={addToCart}><Plus size={16} /> เพิ่มลงตะกร้า</button></div>
  </article>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const packagePhoto = (name) => `${import.meta.env.BASE_URL}images/packages/${name}.jpg`;

function resolvePackageImage(pkg) {
  if (pkg.image) return pkg.image;
  const kw = Number(pkg.system_size_kw);
  if ([3, 5, 10].includes(kw)) return packagePhoto(`package-${kw}kw`);
  return packagePhoto('package-5kw');
}

function isTestEntry(item) {
  return /test|ทดสอบ|^เทส$/i.test(`${item?.name || ''} ${item?.slug || ''}`.trim());
}

export function pickRecommendedProducts(products = [], limit = 3) {
  const source = products.length ? products : fallbackProducts;
  const primary = source.filter((item) => !isTestEntry(item));
  const rest = source.filter((item) => isTestEntry(item));
  return [...primary, ...rest].slice(0, limit);
}

export function pickRecommendedPackages(packages = [], limit = 3) {
  const dbPackages = packages.map((pkg) => ({
    ...pkg,
    size: `${Number(pkg.system_size_kw || 0)} kW`,
    priceNumber: Number(pkg.price || 0),
    priceLabel: Number(pkg.price || 0).toLocaleString('th-TH'),
    items: Array.isArray(pkg.features) ? pkg.features : [],
    image: resolvePackageImage(pkg),
    popular: Boolean(pkg.popular || Number(pkg.system_size_kw) === 5),
    isSample: false,
  }));
  const fallbackList = fallbackPackages.map((item, idx) => {
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
  });
  const merged = [
    ...dbPackages,
    ...fallbackList.filter((fallback) => !dbPackages.some((dbPkg) => (
      dbPkg.slug === fallback.slug
      || ([3, 5, 10].includes(Number(fallback.system_size_kw)) && Number(dbPkg.system_size_kw) === Number(fallback.system_size_kw))
    ))),
  ];
  const primary = merged.filter((item) => !isTestEntry(item));
  const rest = merged.filter((item) => isTestEntry(item));
  return [...primary, ...rest].slice(0, limit);
}

export function RecommendedShowcase({ products = [], packages = [], addToCart, navigate, sectionClassName = 'section' }) {
  const recommendedProducts = pickRecommendedProducts(products, 3);
  const recommendedPackages = pickRecommendedPackages(packages, 3);

  function orderPackage(pkg) {
    if (!pkg || pkg.isSample || !UUID_RE.test(String(pkg.id))) {
      navigate?.('/packages');
      return;
    }
    addToCart?.({
      ...pkg,
      price: pkg.priceNumber,
      itemType: 'package',
      category: 'แพ็กเกจติดตั้ง',
      icon: '⚡',
      tone: 'green',
    });
  }

  return (
    <>
      <section className={sectionClassName}>
        <div className="section-heading">
          <div>
            <div className="eyebrow">RECOMMENDED PRODUCTS</div>
            <h2>สินค้าแนะนำ</h2>
            <p>อุปกรณ์โซลาร์เซลล์คุณภาพที่คัดสรรมาเพื่อบ้านคุณ</p>
          </div>
          <a className="text-link" href="#/products">ดูสินค้าทั้งหมด <ArrowRight size={16} /></a>
        </div>
        <div className="product-grid">
          {recommendedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              addToCart={() => addToCart?.({ ...product, itemType: 'product' })}
              navigate={navigate}
              compact
            />
          ))}
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="section-heading">
          <div>
            <div className="eyebrow">RECOMMENDED PACKAGES</div>
            <h2>แพ็กเกจแนะนำ</h2>
            <p>ชุดโซลาร์รูฟท็อปพร้อมติดตั้ง ออกแบบตามขนาดการใช้ไฟ</p>
          </div>
          <a className="text-link" href="#/packages">ดูแพ็กเกจทั้งหมด <ArrowRight size={16} /></a>
        </div>
        <div className="package-grid" style={{ marginTop: 0 }}>
          {recommendedPackages.map((pkg) => (
            <article key={pkg.id || pkg.name} className={`package-card ${pkg.popular ? 'popular' : ''}`}>
              {pkg.popular && <div className="popular-label">ยอดนิยม</div>}
              <img className="package-photo" src={pkg.image} alt={pkg.name} loading="lazy" />
              <div className="package-top">
                <span className="package-size">{pkg.size}</span>
              </div>
              <h2>{pkg.name}</h2>
              <p>{pkg.description}</p>
              <div className="package-price"><small>เริ่มต้น</small><strong>{pkg.priceLabel}<span> บาท</span></strong></div>
              <ul>{(pkg.items || []).slice(0, 4).map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul>
              {!pkg.isSample && UUID_RE.test(String(pkg.id)) ? (
                <button className={`button ${pkg.popular ? 'button-green' : 'button-outline'}`} type="button" onClick={() => orderPackage(pkg)}>
                  <ShoppingCart size={16} /> เพิ่มลงตะกร้า
                </button>
              ) : (
                <button className={`button ${pkg.popular ? 'button-green' : 'button-outline'}`} type="button" onClick={() => navigate?.('/bookings')}>
                  นัดสำรวจฟรี <ArrowRight size={16} />
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
