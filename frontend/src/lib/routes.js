export const roleMenus = {
  Guest: [{ label: 'หน้าแรก', path: '/' }, { label: 'สินค้า', path: '/products' }, { label: 'แพ็กเกจติดตั้ง', path: '/packages' }, { label: 'บริการช่าง', path: '/services' }, { label: 'เกี่ยวกับเรา', path: '/about' }],
  Customer: [{ label: 'ภาพรวม', path: '/customer' }, { label: 'สินค้าของเรา', path: '/products' }, { label: 'การจองของฉัน', path: '/bookings' }, { label: 'ใบเสนอราคา', path: '/quotes' }, { label: 'ติดตามงาน', path: '/tracking' }],
  Technician: [{ label: 'ภาพรวม', path: '/technician' }, { label: 'ตารางนัดหมาย', path: '/schedule' }, { label: 'งานของฉัน', path: '/jobs' }, { label: 'ประวัติงาน', path: '/work-history' }],
  Admin: [{ label: 'Dashboard', path: '/admin' }, { label: 'จัดการสินค้า', path: '/manage-products' }, { label: 'ผู้ใช้งาน', path: '/manage-users' }, { label: 'การจอง', path: '/manage-bookings' }, { label: 'คำสั่งซื้อ', path: '/manage-orders' }, { label: 'รายงาน', path: '/reports' }],
};

export const adminRoutes = new Set(['/admin', '/manage-products', '/manage-users', '/manage-bookings', '/manage-quotes', '/manage-orders', '/installations', '/reports']);
export const technicianRoutes = new Set(['/technician', '/schedule', '/jobs', '/survey', '/work-history']);

export const pageTitles = {
  '/customer': 'ภาพรวมของฉัน', '/bookings': 'การจองของฉัน', '/quotes': 'ใบเสนอราคา',
  '/tracking': 'ติดตามงานติดตั้ง', '/cart': 'ตะกร้าสินค้า', '/checkout': 'ยืนยันคำสั่งซื้อ',
  '/profile': 'โปรไฟล์ของฉัน', '/reviews': 'รีวิวบริการ',
  '/technician': 'ภาพรวมช่าง', '/schedule': 'ตารางนัดหมาย', '/jobs': 'งานที่ได้รับมอบหมาย',
  '/survey': 'แบบฟอร์มสำรวจหน้างาน', '/work-history': 'ประวัติงาน',
  '/admin': 'ภาพรวมระบบ', '/manage-products': 'จัดการสินค้า', '/manage-users': 'จัดการผู้ใช้งาน',
  '/manage-bookings': 'จัดการการจอง', '/manage-quotes': 'จัดการใบเสนอราคา', '/manage-orders': 'จัดการคำสั่งซื้อ',
  '/installations': 'จัดการงานติดตั้ง', '/reports': 'รายงานผลประกอบการ',
};
export function routeFromHash() {
  if (new URLSearchParams(window.location.search).get('flow') === 'reset') return '/reset-password';
  return window.location.hash.replace(/^#/, '') || '/';
}
