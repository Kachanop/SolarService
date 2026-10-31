import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, BatteryCharging,
  CalendarDays, Check, ChevronDown, ChevronRight, ClipboardList, Clock3,
  CreditCard, Download, FileText, Headphones, House, Leaf, LogIn, Menu,
  Package, Plus, Search, ShieldCheck, ShoppingBag, ShoppingCart, Sun, Users,
  Wrench, X, Zap,
} from 'lucide-react';

const products = [
  { id: 1, name: 'แผงโซลาร์เซลล์ LONGi 580W', category: 'แผงโซลาร์เซลล์', price: 4_290, oldPrice: 4_890, badge: 'ขายดี', icon: '▰', tone: 'blue', detail: 'ประสิทธิภาพสูง ทนทานต่อทุกสภาพอากาศ' },
  { id: 2, name: 'อินเวอร์เตอร์ Huawei 5kW', category: 'อินเวอร์เตอร์', price: 32_500, badge: 'รับประกัน 10 ปี', icon: '⌁', tone: 'green', detail: 'แปลงพลังงานได้เต็มประสิทธิภาพ พร้อมระบบติดตาม' },
  { id: 3, name: 'แบตเตอรี่ Huawei LUNA 5kWh', category: 'แบตเตอรี่', price: 68_900, icon: '▥', tone: 'sand', detail: 'สำรองพลังงานไว้ใช้ได้แม้ในเวลากลางคืน' },
  { id: 4, name: 'ชุดติดตั้งและอุปกรณ์ครบเซ็ต', category: 'อุปกรณ์ติดตั้ง', price: 12_900, badge: 'ครบชุด', icon: '⌘', tone: 'lilac', detail: 'อุปกรณ์มาตรฐานสำหรับระบบโซลาร์บนหลังคา' },
];

const packages = [
  { name: 'แพ็กเกจเริ่มต้น', size: '3 kW', price: '89,000', description: 'เหมาะสำหรับบ้านขนาดเล็ก ค่าไฟไม่เกิน 3,000 บาท/เดือน', items: ['แผงโซลาร์เซลล์ 6 แผง', 'อินเวอร์เตอร์ 3 kW', 'ติดตั้งพร้อมอุปกรณ์', 'รับประกันงานติดตั้ง 5 ปี'] },
  { name: 'แพ็กเกจยอดนิยม', size: '5 kW', price: '149,000', description: 'ลงตัวสำหรับครอบครัวทั่วไป ช่วยประหยัดค่าไฟได้มากขึ้น', items: ['แผงโซลาร์เซลล์ 10 แผง', 'อินเวอร์เตอร์ 5 kW', 'ติดตั้งพร้อมอุปกรณ์', 'รับประกันงานติดตั้ง 5 ปี'], popular: true },
  { name: 'แพ็กเกจครอบครัวใหญ่', size: '10 kW', price: '269,000', description: 'รองรับบ้านขนาดใหญ่และการใช้พลังงานสูง', items: ['แผงโซลาร์เซลล์ 18 แผง', 'อินเวอร์เตอร์ 10 kW', 'ติดตั้งพร้อมอุปกรณ์', 'รับประกันงานติดตั้ง 5 ปี'] },
];

const roleMenus = {
  Guest: [{ label: 'หน้าแรก', path: '/' }, { label: 'สินค้า', path: '/products' }, { label: 'แพ็กเกจติดตั้ง', path: '/packages' }, { label: 'บริการช่าง', path: '/services' }, { label: 'เกี่ยวกับเรา', path: '/about' }],
  Customer: [{ label: 'ภาพรวม', path: '/customer' }, { label: 'สินค้าของเรา', path: '/products' }, { label: 'การจองของฉัน', path: '/bookings' }, { label: 'ใบเสนอราคา', path: '/quotes' }, { label: 'ติดตามงาน', path: '/tracking' }],
  Technician: [{ label: 'ภาพรวม', path: '/technician' }, { label: 'ตารางนัดหมาย', path: '/schedule' }, { label: 'งานของฉัน', path: '/jobs' }, { label: 'ประวัติงาน', path: '/work-history' }],
  Admin: [{ label: 'Dashboard', path: '/admin' }, { label: 'จัดการสินค้า', path: '/manage-products' }, { label: 'การจอง', path: '/manage-bookings' }, { label: 'ใบเสนอราคา', path: '/manage-quotes' }, { label: 'รายงาน', path: '/reports' }],
};

const pageTitles = {
  '/customer': 'ภาพรวมของฉัน', '/bookings': 'การจองของฉัน', '/quotes': 'ใบเสนอราคา',
  '/tracking': 'ติดตามงานติดตั้ง', '/cart': 'ตะกร้าสินค้า', '/checkout': 'ยืนยันคำสั่งซื้อ',
  '/profile': 'โปรไฟล์ของฉัน', '/reviews': 'รีวิวบริการ',
  '/technician': 'ภาพรวมช่าง', '/schedule': 'ตารางนัดหมาย', '/jobs': 'งานที่ได้รับมอบหมาย',
  '/survey': 'แบบฟอร์มสำรวจหน้างาน', '/work-history': 'ประวัติงาน',
  '/admin': 'ภาพรวมระบบ', '/manage-products': 'จัดการสินค้า', '/manage-users': 'จัดการผู้ใช้งาน',
  '/manage-bookings': 'จัดการการจอง', '/manage-quotes': 'จัดการใบเสนอราคา', '/manage-orders': 'จัดการคำสั่งซื้อ',
  '/installations': 'จัดการงานติดตั้ง', '/reports': 'รายงานผลประกอบการ',
};

function routeFromHash() {
  return window.location.hash.replace(/^#/, '') || '/';
}

function Money({ value }) {
  return <>{Number(value).toLocaleString('th-TH')} <span className="currency">บาท</span></>;
}

function App() {
  const [route, setRoute] = useState(routeFromHash);
  const [role, setRole] = useState('Guest');
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const onHashChange = () => {
      setRoute(routeFromHash());
      setMobileMenu(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const filteredProducts = useMemo(() => products.filter((product) =>
    `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase())), [search]);
  const protectedRoutes = new Set([
    '/customer', '/bookings', '/quotes', '/tracking', '/cart', '/checkout', '/profile', '/reviews',
    '/technician', '/schedule', '/jobs', '/survey', '/work-history', '/admin', '/manage-products',
    '/manage-users', '/manage-bookings', '/manage-quotes', '/manage-orders', '/installations', '/reports',
  ]);
  const screen = role === 'Guest' && protectedRoutes.has(route) ? '/login' : route;

  function navigate(path) {
    window.location.hash = path;
  }

  function switchRole(nextRole) {
    setRole(nextRole);
    navigate(nextRole === 'Guest' ? '/' : `/${nextRole.toLowerCase()}`);
  }

  function addToCart(product) {
    if (role === 'Guest') {
      setToast('เข้าสู่ระบบก่อนเลือกซื้อสินค้า');
      navigate('/login');
      return;
    }
    setCart((items) => {
      const current = items.find((item) => item.id === product.id);
      return current
        ? items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...items, { ...product, quantity: 1 }];
    });
    setToast(`เพิ่ม “${product.name}” ลงตะกร้าแล้ว`);
  }

  const isWorkspace = role !== 'Guest';
  const activeMenu = roleMenus[role] || roleMenus.Guest;

  return (
    <div className="app-shell">
      <div className="announcement"><Sun size={14} /> เปลี่ยนพลังงานแสงอาทิตย์ให้เป็นค่าไฟที่เบาลง <a href="#/packages">ดูแพ็กเกจที่ใช่ <ArrowRight size={13} /></a></div>
      <header className="site-header">
        <a className="brand" href="#/" aria-label="SolarService หน้าแรก">
          <span className="brand-mark"><Sun size={21} strokeWidth={2.2} /></span>
          <span>solar<span className="brand-light">service</span><small>POWER YOUR EVERYDAY</small></span>
        </a>
        <button className="mobile-menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="เปิดเมนู">{mobileMenu ? <X /> : <Menu />}</button>
        <nav className={`main-nav ${mobileMenu ? 'open' : ''}`} aria-label="เมนูหลัก">
          {activeMenu.map((item) => <a key={item.path} className={route === item.path ? 'active' : ''} href={`#${item.path}`}>{item.label}</a>)}
          {!isWorkspace && <a href="#/contact">ติดต่อเรา</a>}
        </nav>
        <div className="header-actions">
          <label className="role-switcher" title="เลือกมุมมองผู้ใช้งาน">
            <Users size={15} />
            <select value={role} onChange={(event) => switchRole(event.target.value)} aria-label="เลือกบทบาท">
              <option value="Guest">ผู้เยี่ยมชม</option>
              <option value="Customer">ลูกค้า</option>
              <option value="Technician">ช่าง</option>
              <option value="Admin">ผู้ดูแลระบบ</option>
            </select>
            <ChevronDown size={13} />
          </label>
          {!isWorkspace ? <a className="login-link" href="#/login"><LogIn size={16} /> เข้าสู่ระบบ</a> : <a className="cart-button" href="#/cart" aria-label={`ตะกร้า ${cartCount} รายการ`}><ShoppingCart size={18} /><span>ตะกร้า</span>{cartCount > 0 && <b>{cartCount}</b>}</a>}
          {!isWorkspace && <a className="button button-dark header-cta" href="#/register">สมัครสมาชิก <ArrowRight size={15} /></a>}
        </div>
      </header>

      <main>
        {screen === '/login' && route !== '/login' && <AuthPage route="/login" navigate={navigate} switchRole={switchRole} setToast={setToast} />}
        {screen === '/' && <Home navigate={navigate} addToCart={addToCart} />}
        {screen === '/products' && <Products products={filteredProducts} search={search} setSearch={setSearch} addToCart={addToCart} />}
        {screen === '/packages' && <Packages navigate={navigate} />}
        {screen === '/services' && <Services navigate={navigate} />}
        {screen === '/about' && <About navigate={navigate} />}
        {screen === '/contact' && <Contact setToast={setToast} />}
        {(screen === '/login' || screen === '/register' || screen === '/forgot-password') && !(screen === '/login' && route !== '/login') && <AuthPage route={screen} navigate={navigate} switchRole={switchRole} setToast={setToast} />}
        {screen === '/cart' && <Cart cart={cart} setCart={setCart} navigate={navigate} />}
        {screen === '/checkout' && <Checkout setToast={setToast} navigate={navigate} />}
        {pageTitles[screen] && screen !== '/cart' && screen !== '/checkout' && <WorkspacePage route={screen} title={pageTitles[screen]} navigate={navigate} setToast={setToast} />}
        {!['/', '/products', '/packages', '/services', '/about', '/contact', '/login', '/register', '/forgot-password', '/cart', '/checkout', ...Object.keys(pageTitles)].includes(screen) && <NotFound navigate={navigate} />}
      </main>
      <Footer navigate={navigate} />
      {toast && <div className="toast"><span className="toast-check"><Check size={15} /></span>{toast}</div>}
    </div>
  );
}

function Home({ navigate, addToCart }) {
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
      <div className="product-grid">{products.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} addToCart={() => addToCart(product)} navigate={navigate} compact />)}</div>
    </section>
    <section className="bottom-cta"><div><div className="eyebrow">เริ่มต้นง่ายกว่าที่คิด</div><h2>ยังไม่แน่ใจว่าบ้านคุณ<br />เหมาะกับระบบแบบไหน?</h2><p>ให้ช่างผู้เชี่ยวชาญเข้าสำรวจและออกแบบให้ฟรี ไม่มีค่าใช้จ่าย</p></div><a className="button button-dark" href="#/bookings">นัดช่างสำรวจฟรี <ArrowRight size={17} /></a></section>
  </>;
}

function PageIntro({ eyebrow, title, description, children }) {
  return <section className="page-intro"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p>{children}</section>;
}

function Products({ products: list, search, setSearch, addToCart }) {
  const [filter, setFilter] = useState('ทั้งหมด');
  const categories = ['ทั้งหมด', 'แผงโซลาร์เซลล์', 'อินเวอร์เตอร์', 'แบตเตอรี่', 'อุปกรณ์ติดตั้ง'];
  const visible = filter === 'ทั้งหมด' ? list : list.filter((product) => product.category === filter);
  return <div className="page-wrap">
    <PageIntro eyebrow="SOLAR SHOP" title="เลือกอุปกรณ์ที่ใช่" description="อุปกรณ์โซลาร์เซลล์คุณภาพ พร้อมคำแนะนำจากผู้เชี่ยวชาญ">
      <div className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาสินค้าที่คุณสนใจ..." /></div>
    </PageIntro>
    <div className="filter-row">{categories.map((category) => <button key={category} className={`filter-chip ${filter === category ? 'selected' : ''}`} onClick={() => setFilter(category)}>{category}</button>)}<span className="result-count">{visible.length} รายการ</span></div>
    {visible.length ? <div className="product-grid catalog-grid">{visible.map((product) => <ProductCard key={product.id} product={product} addToCart={() => addToCart(product)} />)}</div> : <div className="empty-state"><Search size={28} /><h3>ไม่พบสินค้าที่ค้นหา</h3><p>ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p></div>}
  </div>;
}

function ProductCard({ product, addToCart, navigate, compact = false }) {
  return <article className={`product-card ${compact ? 'compact' : ''}`}>
    <button className={`product-art ${product.tone}`} onClick={() => navigate?.('/products')} aria-label={`ดูรายละเอียด${product.name}`}><span className="product-badge">{product.badge || 'คุณภาพพรีเมียม'}</span><span className="product-symbol">{product.icon}</span><span className="product-art-caption">{product.category.toUpperCase()}</span></button>
    <div className="product-info"><small>{product.category}</small><a href="#/products" className="product-name">{product.name}</a><p>{product.detail}</p><div className="product-price">{product.oldPrice && <del><Money value={product.oldPrice} /></del>}<strong><Money value={product.price} /></strong></div><button className="add-cart-button" onClick={addToCart}><Plus size={16} /> เพิ่มลงตะกร้า</button></div>
  </article>;
}

function Packages({ navigate }) {
  return <div className="page-wrap"><PageIntro eyebrow="SOLAR PACKAGES" title="แพ็กเกจที่พอดีกับบ้านคุณ" description="ทุกแพ็กเกจออกแบบโดยผู้เชี่ยวชาญ พร้อมติดตั้งและดูแลครบวงจร" />
    <div className="package-grid">{packages.map((item) => <article key={item.name} className={`package-card ${item.popular ? 'popular' : ''}`}>{item.popular && <div className="popular-label">ยอดนิยม</div>}<div className="package-top"><span className="package-icon"><Sun size={21} /></span><span className="package-size">{item.size}</span></div><h2>{item.name}</h2><p>{item.description}</p><div className="package-price"><small>เริ่มต้น</small><strong>{item.price}<span> บาท</span></strong></div><ul>{item.items.map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul><button className={`button ${item.popular ? 'button-green' : 'button-outline'}`} onClick={() => navigate('/bookings')}>นัดสำรวจฟรี <ArrowRight size={16} /></button></article>)}</div>
    <p className="package-note"><ShieldCheck size={16} /> ราคาจริงขึ้นอยู่กับการสำรวจพื้นที่และอุปกรณ์ที่เลือก ไม่มีค่าใช้จ่ายในการเข้าสำรวจ</p>
  </div>;
}

function Services({ navigate }) {
  const steps = [{ icon: <CalendarDays />, title: 'นัดหมายสะดวก', text: 'เลือกวันและเวลาที่สะดวก ทีมงานยืนยันนัดหมายให้ภายใน 24 ชั่วโมง' }, { icon: <House />, title: 'สำรวจถึงบ้าน', text: 'ช่างผู้เชี่ยวชาญประเมินหลังคา ทิศทางแสง และการใช้ไฟจริง' }, { icon: <FileText />, title: 'รับข้อเสนอเฉพาะคุณ', text: 'รับผลสำรวจและใบเสนอราคาที่ออกแบบมาเพื่อบ้านของคุณ' }, { icon: <Wrench />, title: 'ติดตั้งอย่างมืออาชีพ', text: 'ทีมช่างมาตรฐานดูแลตั้งแต่เริ่มติดตั้งจนส่งมอบงาน' }];
  return <div className="page-wrap"><PageIntro eyebrow="OUR SERVICES" title={<>บริการครบ จบเรื่องโซลาร์<br />ตั้งแต่สำรวจถึงติดตั้ง</>} description="ทีมงานของเราพร้อมให้คำปรึกษา วางแผน และดูแลระบบพลังงานให้บ้านคุณ" /><div className="service-banner"><div><span className="service-banner-icon"><Wrench size={24} /></span><div className="eyebrow">บริการสำรวจหน้างาน</div><h2>ให้ช่างช่วยดูแล<br />ตั้งแต่ก้าวแรก</h2><p>สำรวจหลังคา ประเมินการใช้ไฟ และแนะนำระบบที่เหมาะกับบ้านคุณ โดยไม่มีค่าใช้จ่าย</p><button className="button button-green" onClick={() => navigate('/bookings')}>จองช่างสำรวจฟรี <ArrowRight size={17} /></button></div><div className="service-stat"><div><strong>24 ชม.</strong><span>ยืนยันการนัดหมาย</span></div><div><strong>ทั่วประเทศ</strong><span>พื้นที่ให้บริการ</span></div><div><strong>ฟรี</strong><span>ไม่มีค่าใช้จ่ายสำรวจ</span></div></div></div><div className="section-heading service-heading"><div><div className="eyebrow">HOW IT WORKS</div><h2>ง่าย ๆ แค่ 4 ขั้นตอน</h2></div></div><div className="steps-grid">{steps.map((step, index) => <article className="step-card" key={step.title}><span className="step-number">0{index + 1}</span><span className="step-icon">{step.icon}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></div>;
}

function About({ navigate }) {
  return <div className="page-wrap"><PageIntro eyebrow="ABOUT SOLARSERVICE" title={<>เราเชื่อว่าพลังงานสะอาด<br />ควรเป็นเรื่องง่ายสำหรับทุกคน</>} description="SolarService เกิดจากความตั้งใจที่จะทำให้การเริ่มต้นใช้พลังงานแสงอาทิตย์เป็นเรื่องที่เข้าใจง่าย เชื่อถือได้ และเข้าถึงได้สำหรับทุกบ้าน" /><div className="about-panel"><div className="about-visual"><Sun size={76} /><span>ENERGY FOR TOMORROW</span></div><div><div className="eyebrow">พลังงานที่ดี เริ่มจากความใส่ใจ</div><h2>เราไม่ได้แค่ติดตั้งโซลาร์<br />แต่เราดูแลบ้านของคุณ</h2><p>ตั้งแต่การเลือกอุปกรณ์ การสำรวจหน้างาน ไปจนถึงการติดตั้งและบริการหลังการขาย ทุกขั้นตอนถูกออกแบบให้คุณมั่นใจและสบายใจที่สุด</p><div className="about-stats"><div><strong>2,400+</strong><span>บ้านที่ไว้วางใจ</span></div><div><strong>8 ปี</strong><span>ประสบการณ์ทีมงาน</span></div><div><strong>4.9/5</strong><span>คะแนนความพึงพอใจ</span></div></div><button className="button button-green" onClick={() => navigate('/contact')}>พูดคุยกับเรา <ArrowRight size={16} /></button></div></div></div>;
}

function Contact({ setToast }) {
  return <div className="page-wrap"><PageIntro eyebrow="CONTACT US" title="คุยกับเราได้เลย" description="ทีมงานยินดีตอบทุกคำถามเรื่องโซลาร์เซลล์และบริการของเรา" /><div className="contact-grid"><div className="contact-details"><h2>เราพร้อมช่วยคุณ</h2><p>ปรึกษาเบื้องต้นได้ฟรี ไม่มีข้อผูกมัด</p><div><span><Headphones /></span><section><small>โทรศัพท์</small><strong>02-123-4567</strong><small>จันทร์ – เสาร์, 09:00 – 18:00 น.</small></section></div><div><span><FileText /></span><section><small>อีเมล</small><strong>hello@solarservice.co.th</strong></section></div><div><span><House /></span><section><small>สำนักงาน</small><strong>กรุงเทพมหานคร ประเทศไทย</strong></section></div></div><form className="form-card" onSubmit={(event) => { event.preventDefault(); setToast('ส่งข้อความเรียบร้อยแล้ว ทีมงานจะติดต่อกลับ'); }}><h3>ส่งข้อความถึงเรา</h3><label>ชื่อของคุณ<input required placeholder="เช่น คุณสมชาย ใจดี" /></label><label>อีเมลหรือเบอร์โทร<input required placeholder="สำหรับติดต่อกลับ" /></label><label>ข้อความ<textarea required rows="4" placeholder="บอกเราได้เลยว่าต้องการคำปรึกษาเรื่องอะไร" /></label><button className="button button-green" type="submit">ส่งข้อความ <ArrowRight size={16} /></button></form></div></div>;
}

function AuthPage({ route, navigate, switchRole, setToast }) {
  const isRegister = route === '/register';
  const isForgot = route === '/forgot-password';
  return <div className="auth-page"><div className="auth-aside"><div className="auth-aside-content"><div className="eyebrow">POWER YOUR EVERYDAY</div><h2>ทุกวันที่สดใส<br />เริ่มต้นที่บ้านคุณ</h2><p>จัดการระบบโซลาร์เซลล์ สั่งซื้อสินค้า และติดตามบริการได้ในที่เดียว</p><div className="auth-benefit"><BadgeCheck size={18} /> สมัครง่าย ใช้งานสะดวก ดูแลครบทุกขั้นตอน</div><div className="auth-sun"><Sun size={120} /></div></div></div><div className="auth-form-wrap"><form className="auth-form" onSubmit={(event) => { event.preventDefault(); if (isForgot) { setToast('ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่แล้ว'); return; } switchRole('Customer'); setToast(isRegister ? 'สร้างบัญชีตัวอย่างเรียบร้อยแล้ว' : 'เข้าสู่ระบบตัวอย่างเรียบร้อยแล้ว'); }}><a href="#/" className="back-link"><ArrowLeft size={16} /> กลับหน้าหลัก</a><div className="eyebrow">{isRegister ? 'CREATE ACCOUNT' : isForgot ? 'RESET PASSWORD' : 'WELCOME BACK'}</div><h1>{isRegister ? 'สร้างบัญชีของคุณ' : isForgot ? 'ลืมรหัสผ่าน?' : 'ยินดีต้อนรับกลับ'}</h1><p>{isRegister ? 'เริ่มต้นจัดการพลังงานในบ้านของคุณ' : isForgot ? 'กรอกอีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่' : 'เข้าสู่ระบบเพื่อใช้งาน SolarService'}</p>{isRegister && <label>ชื่อ-นามสกุล<input required placeholder="ชื่อของคุณ" /></label>}<label>อีเมล<input type="email" required placeholder="name@example.com" /></label>{!isForgot && <label>รหัสผ่าน<input type="password" required minLength="6" placeholder="อย่างน้อย 6 ตัวอักษร" /></label>}{!isRegister && !isForgot && <a className="forgot-link" href="#/forgot-password">ลืมรหัสผ่าน?</a>}<button type="submit" className="button button-green auth-submit">{isRegister ? 'สมัครสมาชิก' : isForgot ? 'ส่งลิงก์ตั้งรหัสผ่าน' : 'เข้าสู่ระบบ'} <ArrowRight size={16} /></button><div className="auth-switch">{isRegister ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชี?'} <a href={isRegister ? '#/login' : '#/register'}>{isRegister ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</a></div><div className="demo-hint"><strong>ทดลองหน้าจอตามบทบาท</strong><span>เลือกบทบาทที่เมนูด้านบน เพื่อดูหน้าจอลูกค้า ช่าง หรือผู้ดูแลระบบ</span></div></form></div></div>;
}

function Cart({ cart, setCart, navigate }) {
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  return <div className="page-wrap"><PageIntro eyebrow="YOUR CART" title="ตะกร้าสินค้า" description="ตรวจสอบรายการสินค้าก่อนดำเนินการสั่งซื้อ" /><div className="cart-layout"><div className="cart-items">{cart.length ? cart.map((item) => <article className="cart-item" key={item.id}><span className={`cart-product-icon ${item.tone}`}>{item.icon}</span><div className="cart-item-info"><small>{item.category}</small><h3>{item.name}</h3><strong><Money value={item.price} /></strong></div><div className="quantity-control"><button aria-label="ลดจำนวน" onClick={() => setCart((items) => items.map((current) => current.id === item.id ? { ...current, quantity: Math.max(1, current.quantity - 1) } : current))}>−</button><span>{item.quantity}</span><button aria-label="เพิ่มจำนวน" onClick={() => setCart((items) => items.map((current) => current.id === item.id ? { ...current, quantity: current.quantity + 1 } : current))}>+</button></div><button className="remove-item" aria-label="ลบสินค้า" onClick={() => setCart((items) => items.filter((current) => current.id !== item.id))}><X size={17} /></button></article>) : <div className="empty-state"><ShoppingBag size={30} /><h3>ยังไม่มีสินค้าในตะกร้า</h3><p>เลือกชมอุปกรณ์โซลาร์เซลล์ที่เหมาะกับบ้านคุณ</p><a className="button button-green" href="#/products">เลือกซื้อสินค้า <ArrowRight size={16} /></a></div>}</div>{cart.length > 0 && <aside className="summary-card"><h3>สรุปคำสั่งซื้อ</h3><div><span>ยอดรวมสินค้า</span><strong><Money value={subtotal} /></strong></div><div><span>ค่าจัดส่ง</span><strong>คำนวณภายหลัง</strong></div><hr /><div className="summary-total"><span>ยอดรวม</span><strong><Money value={subtotal} /></strong></div><button className="button button-green" onClick={() => navigate('/checkout')}>ดำเนินการสั่งซื้อ <ArrowRight size={16} /></button><p><ShieldCheck size={14} /> ชำระเงินอย่างปลอดภัย</p></aside>}</div></div>;
}

function Checkout({ setToast, navigate }) {
  const [submitted, setSubmitted] = useState(false);
  return <div className="page-wrap"><PageIntro eyebrow="CHECKOUT" title={submitted ? 'รับคำสั่งซื้อแล้ว' : 'ยืนยันคำสั่งซื้อ'} description={submitted ? 'ทีมงานจะติดต่อกลับเพื่อยืนยันรายละเอียดการจัดส่ง' : 'กรอกข้อมูลสำหรับจัดส่งสินค้า ทีมงานจะติดต่อเพื่อยืนยันคำสั่งซื้อ'} />{submitted ? <div className="success-panel"><span><Check size={28} /></span><h2>ขอบคุณสำหรับคำสั่งซื้อ</h2><p>หมายเลขคำสั่งซื้อ SS-2025-001 ได้รับการบันทึกแล้ว</p><button className="button button-green" onClick={() => navigate('/tracking')}>ติดตามคำสั่งซื้อ <ArrowRight size={16} /></button></div> : <form className="checkout-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); setToast('บันทึกคำสั่งซื้อเรียบร้อยแล้ว'); }}><label>ชื่อ-นามสกุล<input required placeholder="ชื่อผู้รับสินค้า" /></label><label>เบอร์โทรศัพท์<input type="tel" required placeholder="08X-XXX-XXXX" /></label><label className="full-width">ที่อยู่จัดส่ง<textarea rows="3" required placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์" /></label><label className="full-width">หมายเหตุเพิ่มเติม<textarea rows="2" placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" /></label><button className="button button-green full-width" type="submit">ยืนยันคำสั่งซื้อ <ArrowRight size={16} /></button></form>}</div>;
}

function WorkspacePage({ route, title, navigate, setToast }) {
  const isTechnician = ['/technician', '/schedule', '/jobs', '/survey', '/work-history'].includes(route);
  const isAdmin = ['/admin', '/manage-products', '/manage-users', '/manage-bookings', '/manage-quotes', '/manage-orders', '/installations', '/reports'].includes(route);
  const isDashboard = ['/customer', '/technician', '/admin'].includes(route);
  const isBooking = route === '/bookings';
  const isSurvey = route === '/survey';
  const isReview = route === '/reviews';
  const isProfile = route === '/profile';
  const isProductManage = route === '/manage-products';
  const bookingRows = [{ name: 'สำรวจพื้นที่ติดตั้ง', date: '12 พ.ย. 2568 · 09:00 น.', status: 'รอยืนยันช่าง', tone: 'yellow' }, { name: 'สำรวจระบบโซลาร์ 5 kW', date: '18 พ.ย. 2568 · 13:30 น.', status: 'ยืนยันแล้ว', tone: 'green' }];
  const genericRows = isTechnician
    ? [{ name: 'สำรวจบ้านคุณสมชาย', date: 'วันนี้ · 09:00 น.', customer: 'สมชาย ใจดี', status: 'รอดำเนินการ', tone: 'yellow' }, { name: 'ติดตั้งระบบ 5 kW', date: 'พรุ่งนี้ · 10:30 น.', customer: 'คุณนภา แสงทอง', status: 'กำลังดำเนินการ', tone: 'blue' }]
    : isAdmin
      ? [{ name: 'คำขอสำรวจ #SS-1024', date: 'วันนี้ · 09:00 น.', customer: 'สมชาย ใจดี', status: 'รอมอบหมาย', tone: 'yellow' }, { name: 'ใบเสนอราคา #QT-085', date: 'วันนี้ · 10:15 น.', customer: 'นภา แสงทอง', status: 'รออนุมัติ', tone: 'blue' }, { name: 'งานติดตั้ง #IN-031', date: 'เมื่อวาน · 14:20 น.', customer: 'กิตติ พูนผล', status: 'กำลังติดตั้ง', tone: 'green' }]
      : [{ name: 'สำรวจพื้นที่บ้านของฉัน', date: '18 พ.ย. 2568 · 13:30 น.', customer: 'ทีมช่าง SolarService', status: 'ยืนยันแล้ว', tone: 'green' }, { name: 'ติดตั้งระบบโซลาร์ 5 kW', date: 'รออนุมัติใบเสนอราคา', customer: 'SolarService', status: 'รอดำเนินการ', tone: 'yellow' }];
  const actions = isAdmin
    ? [{ label: 'จัดการสินค้า', icon: <Package />, path: '/manage-products' }, { label: 'ตรวจสอบการจอง', icon: <CalendarDays />, path: '/manage-bookings' }, { label: 'จัดทำใบเสนอราคา', icon: <FileText />, path: '/manage-quotes' }, { label: 'ดูรายงาน', icon: <ClipboardList />, path: '/reports' }]
    : isTechnician
      ? [{ label: 'ดูตารางนัดหมาย', icon: <CalendarDays />, path: '/schedule' }, { label: 'งานที่ได้รับมอบหมาย', icon: <ClipboardList />, path: '/jobs' }, { label: 'บันทึกผลสำรวจ', icon: <FileText />, path: '/survey' }, { label: 'ประวัติงาน', icon: <Clock3 />, path: '/work-history' }]
      : [{ label: 'จองช่างสำรวจ', icon: <CalendarDays />, path: '/bookings' }, { label: 'เลือกแพ็กเกจ', icon: <Sun />, path: '/packages' }, { label: 'ดูใบเสนอราคา', icon: <FileText />, path: '/quotes' }, { label: 'ติดตามงาน', icon: <Wrench />, path: '/tracking' }];
  function pageAction() {
    if (isBooking) return <BookingForm setToast={setToast} />;
    if (isSurvey) return <SurveyForm setToast={setToast} />;
    if (isReview) return <ReviewForm setToast={setToast} />;
    if (isProfile) return <ProfileForm setToast={setToast} />;
    if (isProductManage) return <div className="workspace-table">{products.map((product) => <div className="table-row" key={product.id}><span className={`mini-product ${product.tone}`}>{product.icon}</span><div className="row-main"><strong>{product.name}</strong><small>{product.category}</small></div><strong><Money value={product.price} /></strong><span className="status-pill green">พร้อมขาย</span><button className="icon-action" onClick={() => setToast(`เลือกแก้ไข ${product.name}`)} aria-label={`แก้ไข ${product.name}`}><ArrowUpRight size={16} /></button></div>)}</div>;
    if (route === '/quotes' || route === '/manage-quotes') return <div className="workspace-table"><div className="table-head"><span>รายการ</span><span>วันที่</span><span>สถานะ</span><span>ดำเนินการ</span></div><div className="table-row"><span className="row-icon"><FileText /></span><div className="row-main"><strong>ใบเสนอราคา #QT-085</strong><small>ระบบโซลาร์เซลล์ 5 kW</small></div><span>10 พ.ย. 2568</span><span className="status-pill yellow">รอยืนยัน</span><button className="icon-action" onClick={() => setToast('เปิดใบเสนอราคา #QT-085')} aria-label="ดูใบเสนอราคา"><ArrowUpRight size={16} /></button></div></div>;
    if (route === '/tracking' || route === '/installations') return <div className="tracking-panel"><div className="tracking-top"><span className="status-pill blue">กำลังดำเนินการ</span><span>อัปเดตล่าสุด วันนี้ 10:30 น.</span></div><h3>ติดตั้งระบบโซลาร์เซลล์ 5 kW</h3><p>บ้านคุณสมชาย ใจดี · คำสั่งซื้อ #SS-1024</p><div className="timeline"><div className="done"><span><Check size={14} /></span><strong>ยืนยันคำสั่งซื้อ</strong><small>10 พ.ย. 2568</small></div><div className="done"><span><Check size={14} /></span><strong>สำรวจหน้างาน</strong><small>12 พ.ย. 2568</small></div><div className="current"><span>3</span><strong>กำลังติดตั้ง</strong><small>คาดว่าเสร็จ 18 พ.ย. 2568</small></div><div><span>4</span><strong>ติดตั้งเสร็จ</strong><small>รอดำเนินการ</small></div></div></div>;
    if (route === '/reports') return <div className="report-grid"><div><small>ยอดขายเดือนนี้</small><strong>฿ 428,500</strong><span className="report-up">↑ 12.8% จากเดือนก่อน</span></div><div><small>คำสั่งซื้อ</small><strong>38 รายการ</strong><span>เดือนตุลาคม 2568</span></div><div><small>นัดสำรวจ</small><strong>24 งาน</strong><span>7 งานรอมอบหมาย</span></div><div><small>งานติดตั้งสำเร็จ</small><strong>18 งาน</strong><span>เดือนตุลาคม 2568</span></div></div>;
    if (route === '/reviews') return <div className="review-callout"><span>★★★★★</span><h3>แชร์ประสบการณ์กับเรา</h3><p>งานติดตั้งของคุณเสร็จเรียบร้อยแล้วหรือยัง? รีวิวของคุณช่วยให้เราพัฒนาบริการให้ดียิ่งขึ้น</p><button className="button button-green" onClick={() => setToast('บันทึกรีวิวเรียบร้อยแล้ว ขอบคุณสำหรับความคิดเห็น')}>เขียนรีวิว <ArrowRight size={16} /></button></div>;
    if (route === '/manage-users') return <div className="workspace-table">{['สมชาย ใจดี', 'นภา แสงทอง', 'ช่างกิตติ พูนผล'].map((name, index) => <div className="table-row" key={name}><span className="user-avatar">{name.charAt(0)}</span><div className="row-main"><strong>{name}</strong><small>{index === 2 ? 'technician@solarservice.co.th' : 'customer@email.com'}</small></div><span className="status-pill green">{index === 2 ? 'ช่าง' : 'ลูกค้า'}</span><button className="icon-action" onClick={() => setToast(`เปิดโปรไฟล์ ${name}`)} aria-label={`ดูโปรไฟล์ ${name}`}><ArrowUpRight size={16} /></button></div>)}</div>;
    if (route === '/bookings' || route === '/manage-bookings' || route === '/schedule' || route === '/jobs' || route === '/work-history' || route === '/manage-orders') return <div className="workspace-table">{(isBooking ? bookingRows : genericRows).map((row, index) => <div className="table-row" key={row.name}><span className="row-icon">{isTechnician ? <Wrench /> : <CalendarDays />}</span><div className="row-main"><strong>{row.name}</strong><small>{row.date}{row.customer ? ` · ${row.customer}` : ''}</small></div><span className={`status-pill ${row.tone}`}>{row.status}</span><button className="icon-action" onClick={() => navigate(isTechnician ? '/survey' : isAdmin ? '/manage-quotes' : '/tracking')} aria-label={`ดูรายละเอียด ${row.name}`}><ArrowUpRight size={16} /></button></div>)}</div>;
    if (isDashboard) return <><div className="stats-grid">{(isAdmin ? [['ยอดขายเดือนนี้', '฿ 428,500', <CreditCard />], ['คำสั่งซื้อ', '38', <ShoppingBag />], ['รอมอบหมายช่าง', '7', <CalendarDays />], ['งานติดตั้ง', '12', <Wrench />]] : isTechnician ? [['นัดหมายวันนี้', '3', <CalendarDays />], ['งานที่กำลังทำ', '2', <Wrench />], ['สำรวจเสร็จแล้ว', '18', <Check />]] : [['คำสั่งซื้อ', '2', <ShoppingBag />], ['การจองช่าง', '1', <CalendarDays />], ['ใบเสนอราคา', '1', <FileText />]]).map(([label, value, icon]) => <div className="stat-card" key={label}><span>{icon}</span><small>{label}</small><strong>{value}</strong></div>)}</div><div className="quick-actions">{actions.map((action) => <button key={action.label} onClick={() => navigate(action.path)}><span>{action.icon}</span><strong>{action.label}</strong><ChevronRight size={17} /></button>)}</div></>;
    return <div className="workspace-table"><div className="table-row"><span className="row-icon"><FileText /></span><div className="row-main"><strong>กิจกรรมล่าสุด</strong><small>ข้อมูลจะปรากฏเมื่อมีรายการใหม่</small></div><span className="status-pill green">อัปเดตแล้ว</span></div></div>;
  }
  return <div className="workspace-wrap"><div className="workspace-heading"><div><div className="eyebrow">{isAdmin ? 'ADMIN CONSOLE' : isTechnician ? 'TECHNICIAN PORTAL' : 'MY SOLARSERVICE'}</div><h1>{title}</h1><p>{isAdmin ? 'จัดการข้อมูลและติดตามการดำเนินงานของ SolarService' : isTechnician ? 'จัดการงานสำรวจและติดตั้งของคุณได้ที่นี่' : 'จัดการการสั่งซื้อ การจอง และบริการของคุณได้ในที่เดียว'}</p></div><div className="workspace-heading-actions"><span className="today-label"><CalendarDays size={15} /> 31 ตุลาคม 2568</span>{isAdmin && <button className="button button-dark" onClick={() => navigate('/manage-products')}><Plus size={16} /> เพิ่มรายการ</button>}</div></div>{isDashboard && <div className="welcome-strip"><span><Sun size={19} /></span><p>{isAdmin ? 'ยินดีต้อนรับ, ผู้ดูแลระบบ' : isTechnician ? 'สวัสดีครับ ช่างกิตติ' : 'สวัสดี, คุณสมชาย'} <small>{isAdmin ? 'นี่คือภาพรวมการดำเนินงานล่าสุดของคุณ' : isTechnician ? 'มี 2 งานที่ต้องดำเนินการในวันนี้' : 'พร้อมเปลี่ยนบ้านให้เป็นพลังงานสะอาดหรือยัง?'}</small></p><ArrowRight size={18} /></div>}<div className="workspace-content"><div className="workspace-section-heading"><div><h2>{isDashboard ? isAdmin ? 'ภาพรวมการดำเนินงาน' : 'รายการล่าสุด' : isBooking ? 'จองช่างเข้าสำรวจพื้นที่' : isSurvey ? 'บันทึกรายงานผลสำรวจ' : title}</h2><p>{isDashboard ? 'ติดตามความเคลื่อนไหวและเข้าถึงเมนูที่ใช้บ่อย' : 'ตรวจสอบรายละเอียดและจัดการข้อมูลของคุณ'}</p></div>{!isDashboard && <button className="button button-outline small-button" onClick={() => setToast('ดาวน์โหลดรายงานเรียบร้อยแล้ว')}><Download size={15} /> ส่งออก</button>}</div>{pageAction()}</div></div>;
}

function BookingForm({ setToast }) {
  return <form className="booking-form" onSubmit={(event) => { event.preventDefault(); setToast('ส่งคำขอนัดหมายแล้ว ทีมงานจะยืนยันภายใน 24 ชั่วโมง'); }}><div className="form-helper"><span><CalendarDays size={19} /></span><p><strong>นัดสำรวจฟรี ไม่มีค่าใช้จ่าย</strong><small>กรอกข้อมูลที่สะดวกให้ทีมช่างเข้าตรวจสอบพื้นที่ติดตั้ง</small></p></div><div className="form-fields"><label>วันที่สะดวก<input type="date" required /></label><label>ช่วงเวลาที่สะดวก<select required defaultValue=""><option value="" disabled>เลือกช่วงเวลา</option><option>09:00 – 12:00 น.</option><option>13:00 – 16:00 น.</option></select></label><label>เบอร์โทรศัพท์<input type="tel" required placeholder="08X-XXX-XXXX" /></label><label>จังหวัดที่ติดตั้ง<select required defaultValue=""><option value="" disabled>เลือกจังหวัด</option><option>กรุงเทพมหานคร</option><option>นนทบุรี</option><option>สมุทรปราการ</option><option>เชียงใหม่</option><option>อื่น ๆ</option></select></label><label className="full-width">ที่อยู่สำหรับเข้าสำรวจ<textarea rows="3" required placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด" /></label><button className="button button-green full-width">ยืนยันการจอง <ArrowRight size={16} /></button></div></form>;
}

function SurveyForm({ setToast }) {
  return <form className="booking-form" onSubmit={(event) => { event.preventDefault(); setToast('บันทึกผลสำรวจและส่งรายงานเรียบร้อยแล้ว'); }}><div className="form-fields"><label>ขนาดพื้นที่หลังคา (ตร.ม.)<input type="number" min="0" required placeholder="เช่น 80" /></label><label>ประเภทหลังคา<select required defaultValue=""><option value="" disabled>เลือกประเภท</option><option>กระเบื้อง</option><option>เมทัลชีท</option><option>คอนกรีต</option><option>อื่น ๆ</option></select></label><label>ทิศทางหลังคา<select required defaultValue=""><option value="" disabled>เลือกทิศทาง</option><option>ทิศเหนือ</option><option>ทิศใต้</option><option>ทิศตะวันออก</option><option>ทิศตะวันตก</option></select></label><label>ระบบที่แนะนำ<select required defaultValue=""><option value="" disabled>เลือกระบบ</option><option>3 kW</option><option>5 kW</option><option>10 kW</option></select></label><label className="full-width">หมายเหตุ / สภาพพื้นที่<textarea rows="3" placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับหน้างาน" /></label><label className="full-width upload-field"><span><Plus size={16} /> เพิ่มรูปภาพจากหน้างาน</span><input type="file" accept="image/*" multiple /></label><button className="button button-green full-width">บันทึกและส่งรายงาน <ArrowRight size={16} /></button></div></form>;
}

function ReviewForm({ setToast }) {
  const [rating, setRating] = useState(5);
  return <form className="form-card review-form" onSubmit={(event) => { event.preventDefault(); setToast(`ส่งรีวิว ${rating} ดาวเรียบร้อยแล้ว ขอบคุณมาก`); }}><h3>งานติดตั้งระบบโซลาร์เซลล์</h3><p>ทีมช่าง SolarService · 20 ตุลาคม 2568</p><div className="star-picker" aria-label="คะแนนรีวิว">{[1, 2, 3, 4, 5].map((value) => <button type="button" className={value <= rating ? 'selected' : ''} key={value} onClick={() => setRating(value)} aria-label={`${value} ดาว`}>★</button>)}</div><label>เล่าประสบการณ์ของคุณ<textarea rows="4" required placeholder="บริการของเราเป็นอย่างไรบ้าง?" /></label><button className="button button-green">ส่งรีวิว <ArrowRight size={16} /></button></form>;
}

function ProfileForm({ setToast }) {
  return <form className="booking-form" onSubmit={(event) => { event.preventDefault(); setToast('บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว'); }}><div className="form-fields"><label>ชื่อ-นามสกุล<input required defaultValue="สมชาย ใจดี" /></label><label>อีเมล<input required type="email" defaultValue="somchai@email.com" /></label><label>เบอร์โทรศัพท์<input type="tel" defaultValue="081-234-5678" /></label><label>จังหวัด<input defaultValue="กรุงเทพมหานคร" /></label><button className="button button-green full-width">บันทึกการเปลี่ยนแปลง <Check size={16} /></button></div></form>;
}

function NotFound({ navigate }) {
  return <div className="not-found"><span>404</span><h1>ไม่พบหน้าที่คุณกำลังมองหา</h1><p>ลิงก์นี้อาจถูกย้ายหรือไม่มีอยู่แล้ว</p><button className="button button-green" onClick={() => navigate('/')}>กลับหน้าหลัก <ArrowRight size={16} /></button></div>;
}

function Footer({ navigate }) {
  return <footer className="site-footer"><div className="footer-main"><div className="footer-brand"><a className="brand" href="#/"><span className="brand-mark"><Sun size={21} /></span><span>solar<span className="brand-light">service</span><small>POWER YOUR EVERYDAY</small></span></a><p>พลังงานสะอาดที่ออกแบบเพื่อบ้านคุณ<br />ดูแลครบตั้งแต่สำรวจถึงติดตั้ง</p></div><div><strong>เลือกชม</strong><a href="#/products">สินค้าทั้งหมด</a><a href="#/packages">แพ็กเกจติดตั้ง</a><a href="#/services">บริการของเรา</a></div><div><strong>SolarService</strong><a href="#/about">เกี่ยวกับเรา</a><a href="#/contact">ติดต่อเรา</a><a href="#/login">เข้าสู่ระบบ</a></div><div className="footer-contact"><strong>มีคำถาม? คุยกับเรา</strong><p>โทร 02-123-4567<br />จันทร์ – เสาร์ 09:00 – 18:00 น.</p><button onClick={() => navigate('/contact')}>ติดต่อทีมงาน <ArrowRight size={14} /></button></div></div><div className="footer-bottom"><span>© 2025 SolarService. สงวนลิขสิทธิ์</span><span>ออกแบบด้วยความใส่ใจ เพื่อพลังงานที่ยั่งยืน <Leaf size={13} /></span></div></footer>;
}

export default App;
