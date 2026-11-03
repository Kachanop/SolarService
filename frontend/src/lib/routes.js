export const roleMenus = {
  Guest: [{ label: 'หน้าแรก', path: '/' }, { label: 'สินค้า', path: '/products' }, { label: 'แพ็กเกจติดตั้ง', path: '/packages' }, { label: 'บริการช่าง', path: '/services' }, { label: 'เกี่ยวกับเรา', path: '/about' }],
  Customer: [{ label: 'ภาพรวม', path: '/customer' }, { label: 'สินค้าของเรา', path: '/products' }, { label: 'การจองของฉัน', path: '/bookings' }, { label: 'ใบเสนอราคา', path: '/quotes' }, { label: 'ติดตามงาน', path: '/tracking' }, { label: 'บัญชีของฉัน', path: '/account' }],
  Technician: [{ label: 'ภาพรวม', path: '/technician' }, { label: 'ตารางนัดหมาย', path: '/schedule' }, { label: 'งานของฉัน', path: '/jobs' }, { label: 'ประวัติงาน', path: '/work-history' }, { label: 'บัญชีของฉัน', path: '/account' }],
  Admin: [
    { label: 'Dashboard', path: '/admin' },
    { label: 'สินค้า & แพ็กเกจ', path: '/manage-products' },
    { label: 'คำสั่งซื้อ & สลิป', path: '/manage-orders' },
    { label: 'การจอง & งานติดตั้ง', path: '/manage-bookings' },
    { label: 'รับประกัน & ซ่อม', path: '/warranties' },
    { label: 'CRM ผู้ใช้งาน', path: '/manage-users' },
    { label: 'รายงาน & CMS', path: '/reports' },
    { label: 'บัญชีของฉัน', path: '/account' },
  ],
};

export const adminRoutes = new Set([
  '/admin', '/manage-products', '/manage-packages', '/manage-users',
  '/manage-bookings', '/manage-quotes', '/manage-orders', '/manage-payments',
  '/installations', '/warranties', '/maintenance', '/tickets',
  '/manage-reviews', '/manage-cms', '/reports',
]);
export const technicianRoutes = new Set(['/technician', '/schedule', '/jobs', '/survey', '/work-history', '/job-detail']);

export const pageTitles = {
  '/customer': 'ภาพรวมของฉัน', '/bookings': 'การจองของฉัน', '/quotes': 'ใบเสนอราคา',
  '/tracking': 'ติดตามงานติดตั้ง', '/cart': 'ตะกร้าสินค้า', '/checkout': 'ยืนยันคำสั่งซื้อ',
  '/profile': 'บัญชีของฉัน', '/account': 'บัญชีของฉัน', '/reviews': 'รีวิวบริการ',
  '/technician': 'ภาพรวมช่าง', '/schedule': 'ตารางนัดหมาย', '/jobs': 'งานที่ได้รับมอบหมาย',
  '/survey': 'แบบฟอร์มสำรวจหน้างาน', '/work-history': 'ประวัติงาน', '/job-detail': 'รายละเอียดงาน',
  '/admin': 'Dashboard & สถิติระบบ',
  '/manage-products': 'จัดการสินค้าและสต็อก',
  '/manage-packages': 'จัดการแพ็กเกจติดตั้งโซลาร์',
  '/manage-users': 'จัดการผู้ใช้ & CRM & สิทธิ์',
  '/manage-bookings': 'จัดการการจองสำรวจ',
  '/manage-quotes': 'จัดการใบเสนอราคา',
  '/manage-orders': 'จัดการคำสั่งซื้อ',
  '/manage-payments': 'ตรวจสอบการชำระเงิน & สลิป',
  '/installations': 'จัดการงานติดตั้งระบบ',
  '/warranties': 'ทะเบียนรับประกันสินค้า (Warranty Registry)',
  '/maintenance': 'แจ้งเตือนรอบบำรุงรักษา & ล้างแผง',
  '/tickets': 'ระบบแจ้งซ่อม & ช่วยเหลือ (Ticketing System)',
  '/manage-reviews': 'จัดการรีวิวและความคิดเห็น',
  '/manage-cms': 'จัดการเนื้อหาหน้าเว็บ & CMS',
  '/reports': 'รายงานสถิติและผลประกอบการ (Analytics & Reports)',
};
export function routeFromHash() {
  if (new URLSearchParams(window.location.search).get('flow') === 'reset') return '/reset-password';
  return (window.location.hash.replace(/^#/, '').split('?')[0]) || '/';
}
