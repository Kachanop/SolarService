import React from 'react';
import {
  BarChart3,
  Package,
  Layers,
  ShoppingBag,
  CreditCard,
  CalendarDays,
  FileText,
  Wrench,
  ShieldCheck,
  BellRing,
  LifeBuoy,
  Users,
  UsersRound,
  Star,
  FileCode2,
} from 'lucide-react';

export const adminNavItems = [
  { path: '/admin', label: 'Dashboard', icon: <BarChart3 size={15} /> },
  { path: '/reports', label: 'รายงานสถิติ', icon: <FileText size={15} /> },
  { path: '/manage-products', label: 'จัดการสินค้า', icon: <Package size={15} /> },
  { path: '/manage-packages', label: 'แพ็กเกจติดตั้ง', icon: <Layers size={15} /> },
  { path: '/manage-orders', label: 'คำสั่งซื้อ', icon: <ShoppingBag size={15} />, badgeKey: 'pendingOrders' },
  { path: '/manage-payments', label: 'ตรวจสลิป & ชำระเงิน', icon: <CreditCard size={15} />, badgeKey: 'pendingPayments' },
  { path: '/manage-bookings', label: 'คิวจองสำรวจ', icon: <CalendarDays size={15} />, badgeKey: 'pendingBookings' },
  { path: '/manage-technicians', label: 'ช่าง & สำรวจพื้นที่', icon: <UsersRound size={15} />, badgeKey: 'pendingSurveys' },
  { path: '/manage-quotes', label: 'ใบเสนอราคา', icon: <FileText size={15} /> },
  { path: '/installations', label: 'งานติดตั้ง', icon: <Wrench size={15} />, badgeKey: 'activeInstallations' },
  { path: '/warranties', label: 'ทะเบียนรับประกัน', icon: <ShieldCheck size={15} /> },
  { path: '/maintenance', label: 'รอบบำรุงรักษา', icon: <BellRing size={15} />, badgeKey: 'pendingMaintenance' },
  { path: '/tickets', label: 'แจ้งซ่อม & เคส', icon: <LifeBuoy size={15} />, badgeKey: 'openTickets' },
  { path: '/manage-users', label: 'CRM & ผู้ใช้', icon: <Users size={15} /> },
  { path: '/manage-reviews', label: 'จัดการรีวิว', icon: <Star size={15} /> },
  { path: '/manage-cms', label: 'เนื้อหา CMS', icon: <FileCode2 size={15} /> },
];

export default function AdminSubNav({ currentRoute, navigate, badgeCounts = {} }) {
  return (
    <div className="admin-nav-scroll-wrap">
      <nav className="admin-nav-bar" aria-label="Admin Navigation">
        {adminNavItems.map((item) => {
          const isActive = currentRoute === item.path;
          const count = item.badgeKey ? badgeCounts[item.badgeKey] : null;
          return (
            <button
              key={item.path}
              type="button"
              className={`admin-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
              {count ? (
                <span className={`admin-nav-badge ${count > 0 ? 'alert' : ''}`}>
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
