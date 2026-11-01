import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Menu, ShoppingCart, Sun, X } from 'lucide-react';
import { supabase, supabaseConfigError } from './lib/supabase.js';
import { products } from './data/catalog.js';
import { adminRoutes, pageTitles, roleMenus, routeFromHash, technicianRoutes } from './lib/routes.js';
import Home from './pages/Home.jsx';
import Products from './pages/Products.jsx';
import Packages from './pages/Packages.jsx';
import Services from './pages/Services.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import AuthPage from './pages/AuthPage.jsx';
import { Cart, Checkout } from './pages/CartPages.jsx';
import WorkspacePage from './pages/WorkspacePage.jsx';
import { NotFound, Footer } from './components/SiteLayout.jsx';

function App() {
  const [route, setRoute] = useState(routeFromHash);
  const [role, setRole] = useState('Guest');
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [cart, setCart] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState(() => supabase ? [] : products);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    async function loadCatalog() {
      try {
        const { data, error } = await supabase.from('products')
          .select('id,name,category,description,price,compare_at_price,is_active')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (!active) return;
        const tones = { 'แผงโซลาร์เซลล์': 'blue', 'อินเวอร์เตอร์': 'green', 'แบตเตอรี่': 'sand', 'อุปกรณ์ติดตั้ง': 'lilac' };
        const icons = { 'แผงโซลาร์เซลล์': '▰', 'อินเวอร์เตอร์': '⌁', 'แบตเตอรี่': '▥', 'อุปกรณ์ติดตั้ง': '⌘' };
        setCatalogProducts((data || []).map((product, index) => ({
          ...product,
          price: Number(product.price),
          oldPrice: product.compare_at_price === null ? null : Number(product.compare_at_price),
          detail: product.description,
          icon: icons[product.category] || '▰',
          tone: tones[product.category] || ['blue', 'green', 'sand', 'lilac'][index % 4],
        })));
      } catch (error) {
        if (!active) return;
        setCatalogProducts([]);
        setToast(`โหลดสินค้าไม่สำเร็จ: ${error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
      }
    }

    const refreshCatalog = () => loadCatalog();
    window.addEventListener('solarservice:products-updated', refreshCatalog);
    loadCatalog();
    return () => {
      active = false;
      window.removeEventListener('solarservice:products-updated', refreshCatalog);
    };
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const user = session?.user ?? null;
      setAuthUser(user);
      if (!user) {
        setRole('Guest');
        setAuthLoading(false);
      }
    });

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setAuthLoading(false);
          setToast(`ตรวจสอบสถานะการเข้าสู่ระบบไม่สำเร็จ: ${error.message}`);
          return;
        }
        const user = data.session?.user ?? null;
        setAuthUser(user);
        if (!user) {
          setRole('Guest');
          setAuthLoading(false);
        }
      })
      .catch((error) => {
        if (!active) return;
        setAuthLoading(false);
        setToast(`เชื่อมต่อ Supabase ไม่สำเร็จ: ${error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authUser || !supabase) return undefined;
    let active = true;
    setAuthLoading(true);

    supabase.from('profiles').select('role').eq('id', authUser.id).maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setRole('Customer');
          setToast(`อ่านบทบาทผู้ใช้ไม่สำเร็จ: ${error.message}`);
        } else if (!data) {
          setRole('Customer');
          setToast('ไม่พบโปรไฟล์ผู้ใช้ กรุณาตรวจสอบว่าได้ตั้งค่า migration ของ Supabase แล้ว');
        } else {
          const roles = { customer: 'Customer', technician: 'Technician', admin: 'Admin' };
          const userRole = roles[data.role];
          if (!userRole) {
            setRole('Customer');
            setToast(`ไม่รู้จักบทบาทผู้ใช้: ${data.role}`);
          } else {
            setRole(userRole);
          }
        }
        setAuthLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        setRole('Customer');
        setAuthLoading(false);
        setToast(`อ่านบทบาทผู้ใช้ไม่สำเร็จ: ${error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
      });

    return () => { active = false; };
  }, [authUser?.id]);

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
    if (!authUser || authLoading) return;
    const landingRoute = role === 'Admin' ? '/admin' : role === 'Technician' ? '/technician' : '/customer';
    if ((adminRoutes.has(route) && role !== 'Admin')
      || (technicianRoutes.has(route) && !['Technician', 'Admin'].includes(role))) {
      navigate(landingRoute);
      return;
    }
    if (['/login', '/register', '/customer', '/technician', '/admin'].includes(route) && route !== landingRoute) {
      navigate(landingRoute);
    }
  }, [authUser, authLoading, role, route]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const filteredProducts = useMemo(() => catalogProducts.filter((product) =>
    `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase())), [catalogProducts, search]);
  const protectedRoutes = new Set([
    '/customer', '/bookings', '/quotes', '/tracking', '/cart', '/checkout', '/profile', '/reviews',
    '/technician', '/schedule', '/jobs', '/survey', '/work-history', '/admin', '/manage-products',
    '/manage-users', '/manage-bookings', '/manage-quotes', '/manage-orders', '/installations', '/reports',
  ]);
  const screen = !authUser && protectedRoutes.has(route)
    ? '/login'
    : adminRoutes.has(route) && role !== 'Admin'
      ? '/customer'
      : technicianRoutes.has(route) && !['Technician', 'Admin'].includes(role)
        ? '/customer'
        : route;

  function navigate(path) {
    if (window.location.hash === `#${path}`) {
      setRoute(path);
      return;
    }
    window.location.hash = path;
  }

  function onAuthenticated() {
    navigate('/customer');
  }

  async function signOut() {
    if (!supabase) {
      setToast(supabaseConfigError);
      return;
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setToast(`ออกจากระบบไม่สำเร็จ: ${error.message}`);
        return;
      }
    } catch (error) {
      setToast(`ออกจากระบบไม่สำเร็จ: ${error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
      return;
    }
    setCart([]);
    setRole('Guest');
    navigate('/');
    setToast('ออกจากระบบเรียบร้อยแล้ว');
  }

  function addToCart(product) {
    if (!authUser) {
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

  const isWorkspace = Boolean(authUser);
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
          {!isWorkspace ? <a className="login-link" href="#/login"><LogIn size={16} /> เข้าสู่ระบบ</a> : <><a className="cart-button" href="#/cart" aria-label={`ตะกร้า ${cartCount} รายการ`}><ShoppingCart size={18} /><span>ตะกร้า</span>{cartCount > 0 && <b>{cartCount}</b>}</a><button className="signout-button" onClick={signOut} title={authUser.email || 'ออกจากระบบ'}>ออกจากระบบ</button></>}
          {!isWorkspace && <a className="button button-dark header-cta" href="#/register">สมัครสมาชิก <ArrowRight size={15} /></a>}
        </div>
      </header>

      <main>
        {authLoading && <div className="auth-loading" role="status">กำลังตรวจสอบสถานะสมาชิก…</div>}
        {!authLoading && screen === '/login' && route !== '/login' && <AuthPage route="/login" navigate={navigate} onAuthenticated={onAuthenticated} setToast={setToast} />}
        {!authLoading && screen === '/' && <Home navigate={navigate} addToCart={addToCart} products={catalogProducts} />}
        {!authLoading && screen === '/products' && <Products products={filteredProducts} search={search} setSearch={setSearch} addToCart={addToCart} />}
        {!authLoading && screen === '/packages' && <Packages navigate={navigate} />}
        {!authLoading && screen === '/services' && <Services navigate={navigate} />}
        {!authLoading && screen === '/about' && <About navigate={navigate} />}
        {!authLoading && screen === '/contact' && <Contact setToast={setToast} />}
        {!authLoading && ['/login', '/register', '/forgot-password', '/reset-password'].includes(screen) && !(screen === '/login' && route !== '/login') && <AuthPage route={screen} navigate={navigate} onAuthenticated={onAuthenticated} setToast={setToast} />}
        {!authLoading && screen === '/cart' && <Cart cart={cart} setCart={setCart} navigate={navigate} />}
        {!authLoading && screen === '/checkout' && <Checkout setToast={setToast} navigate={navigate} />}
        {!authLoading && pageTitles[screen] && screen !== '/cart' && screen !== '/checkout' && <WorkspacePage route={screen} title={pageTitles[screen]} navigate={navigate} setToast={setToast} authUser={authUser} />}
        {!authLoading && !['/', '/products', '/packages', '/services', '/about', '/contact', '/login', '/register', '/forgot-password', '/reset-password', '/cart', '/checkout', ...Object.keys(pageTitles)].includes(screen) && <NotFound navigate={navigate} />}
      </main>
      <Footer navigate={navigate} />
      {toast && <div className="toast"><span className="toast-check"><Check size={15} /></span>{toast}</div>}
    </div>
  );
}

export default App;
