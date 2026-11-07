import React, { useEffect, useState, useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { adminService } from '../services/adminService.js';
import AdminSubNav from './admin/AdminSubNav.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import AdminReports from './admin/AdminReports.jsx';
import AdminProducts from './admin/AdminProducts.jsx';
import AdminPackages from './admin/AdminPackages.jsx';
import AdminOrders from './admin/AdminOrders.jsx';
import AdminPayments from './admin/AdminPayments.jsx';
import AdminBookings from './admin/AdminBookings.jsx';
import AdminTechnicianManagement from './admin/AdminTechnicianManagement.jsx';
import AdminQuotes from './admin/AdminQuotes.jsx';
import AdminInstallations from './admin/AdminInstallations.jsx';
import AdminWarranties from './admin/AdminWarranties.jsx';
import AdminMaintenance from './admin/AdminMaintenance.jsx';
import AdminTickets from './admin/AdminTickets.jsx';
import AdminReviews from './admin/AdminReviews.jsx';
import AdminCMS from './admin/AdminCMS.jsx';
import AdminUsersCRM from './admin/AdminUsersCRM.jsx';

export default function AdminWorkspace({ route, title, navigate, authUser, setToast }) {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modular Data Stores
  const [analyticsData, setAnalyticsData] = useState(null);
  const [productsData, setProductsData] = useState([]);
  const [packagesData, setPackagesData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [paymentsData, setPaymentsData] = useState([]);
  const [bookingsData, setBookingsData] = useState([]);
  const [quotesData, setQuotesData] = useState([]);
  const [installationsData, setInstallationsData] = useState([]);
  const [warrantiesData, setWarrantiesData] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [ticketsData, setTicketsData] = useState([]);
  const [reviewsData, setReviewsData] = useState([]);
  const [bannersData, setBannersData] = useState([]);
  const [articlesData, setArticlesData] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [usersData, setUsersData] = useState([]);

  // Badges calculation for SubNav
  const badgeCounts = useMemo(() => {
    return {
      pendingPayments: (paymentsData || []).filter((p) => p.status === 'pending').length,
      pendingBookings: (bookingsData || []).filter((b) => ['pending', 'assigned'].includes(b.status)).length,
      pendingSurveys: (bookingsData || []).filter((b) => ['pending', 'assigned'].includes(b.status)).length,
      pendingOrders: (ordersData || []).filter((o) => ['pending', 'confirmed', 'processing'].includes(o.status)).length,
      activeInstallations: (installationsData || []).filter((i) => !['completed', 'cancelled'].includes(i.status)).length,
      pendingMaintenance: (maintenanceData || []).filter((m) => m.status === 'pending').length,
      openTickets: (ticketsData || []).filter((t) => t.status === 'open').length,
    };
  }, [paymentsData, bookingsData, ordersData, installationsData, maintenanceData, ticketsData]);

  // Load all modular data
  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setErrorMessage('');

      try {
        const [
          anData,
          prods,
          pkgs,
          ords,
          pays,
          bks,
          qts,
          insts,
          wars,
          maints,
          tks,
          revs,
          bans,
          arts,
          techs,
        ] = await Promise.all([
          adminService.getAnalytics(),
          adminService.getProducts(),
          adminService.getPackages(),
          adminService.getOrders(),
          adminService.getPayments(),
          adminService.getBookings(),
          adminService.getQuotes(),
          adminService.getInstallations(),
          adminService.getWarranties(),
          adminService.getMaintenanceReminders(),
          adminService.getTickets(),
          adminService.getReviews(),
          adminService.getBanners(),
          adminService.getArticles(),
          adminService.getTechnicians(),
        ]);

        let users = [];
        if (supabase) {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('id,full_name,phone,role,created_at,is_banned')
              .order('created_at', { ascending: false });
            if (!error && data && data.length > 0) users = data;
          } catch (e) {
            console.warn('Profiles fetch error:', e);
          }
        }
        if (!users.length) {
          users = [
            { id: 'usr-1', full_name: 'คุณสมชาย ใจดี', phone: '081-234-5678', role: 'customer', created_at: '2026-08-10', is_banned: false },
            { id: 'usr-2', full_name: 'คุณนภา รุ่งอรุณ', phone: '089-876-5432', role: 'customer', created_at: '2026-08-15', is_banned: false },
            { id: 'usr-3', full_name: 'คุณวิชัย พัฒนกุล', phone: '084-555-4321', role: 'customer', created_at: '2026-09-01', is_banned: false },
            { id: 'usr-4', full_name: 'ช่างเอกชัย ช่างใหญ่', phone: '081-111-2222', role: 'technician', created_at: '2026-07-20', is_banned: false },
            { id: 'usr-5', full_name: 'ช่างสมศักดิ์ สายตรวจ', phone: '082-222-3333', role: 'technician', created_at: '2026-07-25', is_banned: false },
            { id: 'usr-6', full_name: 'เจ้าหน้าที่แอดมิน', phone: '02-123-4567', role: 'admin', created_at: '2026-06-01', is_banned: false },
          ];
        }

        if (active) {
          setAnalyticsData(anData);
          setProductsData(prods);
          setPackagesData(pkgs);
          setOrdersData(ords);
          setPaymentsData(pays);
          setBookingsData(bks);
          setQuotesData(qts);
          setInstallationsData(insts);
          setWarrantiesData(wars);
          setMaintenanceData(maints);
          setTicketsData(tks);
          setReviewsData(revs);
          setBannersData(bans);
          setArticlesData(arts);
          setTechnicians(techs);
          setUsersData(users);
        }
      } catch (err) {
        if (active) {
          setErrorMessage(`โหลดข้อมูล Admin ไม่สำเร็จ: ${err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'}`);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return (
    <div className="workspace-wrap" style={{ maxWidth: '1220px' }}>
      {/* Header */}
      <div className="workspace-heading">
        <div>
          <div className="eyebrow">SOLARSERVICE ENTERPRISE ADMIN</div>
          <h1>{title}</h1>
          <p>ระบบบริหารจัดการธุรกิจโซลาร์เซลล์ครบวงจร การบริการ และการดูแลลูกค้าหลังการขาย</p>
        </div>
        <div className="workspace-heading-actions">
          <span className="today-label">
            <CalendarDays size={15} />
            {new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}
          </span>
        </div>
      </div>

      {/* Sub Navigation Bar for all 16 Admin Tools */}
      <AdminSubNav
        currentRoute={route}
        navigate={navigate}
        badgeCounts={badgeCounts}
      />

      {/* Notice & Error Messages */}
      {errorMessage && <div className="admin-message error" role="alert">{errorMessage}</div>}
      {notice && (
        <div className="admin-message success" role="status">
          {notice}
          <button type="button" onClick={() => setNotice('')} aria-label="ปิดข้อความ">×</button>
        </div>
      )}

      {loading ? (
        <div className="admin-loading">กำลังโหลดข้อมูลระบบ Admin...</div>
      ) : (
        <div className="workspace-content">
          {/* 1. Dashboard View */}
          {route === '/admin' && (
            <AdminDashboard
              analyticsData={analyticsData}
              navigate={navigate}
              onExport={() => navigate('/reports')}
            />
          )}

          {/* 2. Reports View */}
          {route === '/reports' && (
            <AdminReports
              analyticsData={analyticsData}
              onExport={() => {}}
            />
          )}

          {/* 3. Products Management View */}
          {route === '/manage-products' && (
            <AdminProducts
              products={productsData}
              onSaveProduct={async (item) => {
                await adminService.saveProduct(item);
                setRefreshKey((k) => k + 1);
              }}
              onDeleteProduct={async (id) => {
                await adminService.deleteProduct(id);
                setRefreshKey((k) => k + 1);
              }}
              setToast={setToast}
            />
          )}

          {/* 4. Packages View */}
          {route === '/manage-packages' && (
            <AdminPackages
              packages={packagesData}
              onSavePackage={async (item) => {
                await adminService.savePackage(item);
                setRefreshKey((k) => k + 1);
              }}
              onDeletePackage={async (id) => {
                await adminService.deletePackage(id);
                setRefreshKey((k) => k + 1);
              }}
              setToast={setToast}
            />
          )}

          {/* 5. Orders View */}
          {route === '/manage-orders' && (
            <AdminOrders
              orders={ordersData}
              onUpdateStatus={async (id, status, extra) => {
                await adminService.updateOrderStatus(id, status, extra);
                setRefreshKey((k) => k + 1);
              }}
              setToast={setToast}
            />
          )}

          {/* 6. Payments Verification View */}
          {route === '/manage-payments' && (
            <AdminPayments
              payments={paymentsData}
              onVerify={async (id, isApproved, rejectReason) => {
                await adminService.verifyPayment(
                  id,
                  isApproved,
                  rejectReason,
                  authUser?.email || 'Admin'
                );
                setRefreshKey((k) => k + 1);
              }}
              setToast={setToast}
            />
          )}

          {/* 7. Bookings Management View */}
          {route === '/manage-bookings' && (
            <AdminBookings
              bookings={bookingsData}
              technicians={technicians}
              onUpdateStatus={async (id, status) => {
                await adminService.updateBookingStatus(id, status);
                setRefreshKey((k) => k + 1);
              }}
              onAssignTechnician={async (bookingId, techId, techName) => {
                await adminService.assignTechnician(bookingId, techId, techName);
                setRefreshKey((k) => k + 1);
              }}
              onSaveBooking={async (item) => {
                await adminService.saveBooking(item);
                setRefreshKey((k) => k + 1);
              }}
              navigate={navigate}
              setToast={setToast}
            />
          )}

          {route === '/manage-technicians' && (
            <AdminTechnicianManagement
              technicians={technicians}
              bookings={bookingsData}
              onAssignTechnician={async (bookingId, technicianId) => {
                const technician = technicians.find((item) => item.id === technicianId);
                if (!technician) throw new Error('ไม่พบข้อมูลช่างที่เลือก');
                await adminService.assignTechnician(bookingId, technicianId, technician.full_name);
                setRefreshKey((key) => key + 1);
              }}
              setToast={setToast}
              navigate={navigate}
            />
          )}

          {/* 8. Quotes View */}
          {route === '/manage-quotes' && (
            <AdminQuotes
              quotes={quotesData}
              onUpdateStatus={async (id, status) => {
                await adminService.updateQuoteStatus(id, status);
                setRefreshKey((k) => k + 1);
              }}
              onSaveQuote={async (item) => {
                await adminService.saveQuote(item);
                setRefreshKey((k) => k + 1);
              }}
              navigate={navigate}
              setToast={setToast}
            />
          )}

          {/* 9. Installations View */}
          {route === '/installations' && (
            <AdminInstallations
              installations={installationsData}
              technicians={technicians}
              onUpdateStatus={async (id, status, extra) => {
                await adminService.updateInstallationStatus(id, status, extra);
                setRefreshKey((k) => k + 1);
              }}
              onSaveInstallation={async (item) => {
                await adminService.saveInstallation(item);
                setRefreshKey((k) => k + 1);
              }}
              navigate={navigate}
              setToast={setToast}
            />
          )}

          {/* 10. Warranties View */}
          {route === '/warranties' && (
            <AdminWarranties
              warranties={warrantiesData}
              onSave={async (item) => {
                await adminService.saveWarranty(item);
                setRefreshKey((k) => k + 1);
              }}
              onDelete={async (id) => {
                await adminService.deleteWarranty(id);
                setRefreshKey((k) => k + 1);
              }}
              setToast={setToast}
            />
          )}

          {/* 11. Maintenance Reminders View */}
          {route === '/maintenance' && (
            <AdminMaintenance
              reminders={maintenanceData}
              onUpdateStatus={async (id, status, extra) => {
                await adminService.updateMaintenanceStatus(id, status, extra);
                setRefreshKey((k) => k + 1);
              }}
              onAddReminder={async (item) => {
                const current = maintenanceData;
                const newItem = {
                  ...item,
                  id: `maint-${Date.now()}`,
                  status: 'pending',
                  last_notified_at: null,
                };
                localStorage.setItem(
                  'solarservice_admin_maintenance',
                  JSON.stringify([newItem, ...current])
                );
                setRefreshKey((k) => k + 1);
              }}
              setToast={setToast}
            />
          )}

          {/* 12. Support Tickets View */}
          {route === '/tickets' && (
            <AdminTickets
              tickets={ticketsData}
              onSaveTicket={async (item) => {
                await adminService.saveTicket(item);
                setRefreshKey((k) => k + 1);
              }}
              setToast={setToast}
            />
          )}

          {/* 13. Users CRM View */}
          {route === '/manage-users' && (
            <AdminUsersCRM
              users={usersData}
              onUpdateRole={async (user, role) => {
                if (supabase) {
                  await supabase.from('profiles').update({ role }).eq('id', user.id);
                }
                const updated = usersData.map((u) => (u.id === user.id ? { ...u, role } : u));
                setUsersData(updated);
                setNotice('เปลี่ยนระดับสิทธิ์เรียบร้อยแล้ว');
              }}
              onToggleBan={async (userId, isBanned) => {
                await adminService.toggleUserBan(userId, isBanned);
                const updated = usersData.map((u) => (u.id === userId ? { ...u, is_banned: isBanned } : u));
                setUsersData(updated);
              }}
              authUser={authUser}
              savingId=""
              setToast={setToast}
            />
          )}

          {/* 14. Reviews View */}
          {route === '/manage-reviews' && (
            <AdminReviews
              reviews={reviewsData}
              onTogglePublish={async (id, isPublished) => {
                await adminService.toggleReviewPublish(id, isPublished);
                setRefreshKey((k) => k + 1);
              }}
              onDeleteReview={async (id) => {
                await adminService.deleteReview(id);
                setRefreshKey((k) => k + 1);
              }}
              setToast={setToast}
            />
          )}

          {/* 15. CMS View */}
          {route === '/manage-cms' && (
            <AdminCMS
              banners={bannersData}
              articles={articlesData}
              onSaveBanner={async (item) => {
                await adminService.saveBanner(item);
                setRefreshKey((k) => k + 1);
              }}
              onDeleteBanner={async (id) => {
                await adminService.deleteBanner(id);
                setRefreshKey((k) => k + 1);
              }}
              onSaveArticle={async (item) => {
                await adminService.saveArticle(item);
                setRefreshKey((k) => k + 1);
              }}
              onDeleteArticle={async (id) => {
                await adminService.deleteArticle(id);
                setRefreshKey((k) => k + 1);
              }}
              setToast={setToast}
            />
          )}
        </div>
      )}
    </div>
  );
}
