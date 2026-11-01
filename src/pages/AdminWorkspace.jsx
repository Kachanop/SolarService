import React, { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Check, ChevronRight, CreditCard, Download, Package, Plus, ShoppingBag, ShieldCheck, Sun, Wrench } from 'lucide-react';
import { supabase, supabaseConfigError } from '../lib/supabase.js';
import { Money } from '../components/Shared.jsx';

export const adminStatusOptions = {
  '/manage-bookings': ['pending', 'assigned', 'confirmed', 'surveying', 'quoted', 'approved', 'installing', 'completed', 'cancelled'],
  '/manage-quotes': ['draft', 'sent', 'approved', 'rejected', 'expired'],
  '/manage-orders': ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'],
  '/installations': ['scheduled', 'preparing', 'installing', 'testing', 'completed', 'cancelled'],
};

export const adminStatusLabels = {
  pending: 'รอดำเนินการ',
  assigned: 'มอบหมายแล้ว',
  confirmed: 'ยืนยันแล้ว',
  surveying: 'กำลังสำรวจ',
  quoted: 'เสนอราคาแล้ว',
  approved: 'อนุมัติแล้ว',
  installing: 'กำลังติดตั้ง',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
  draft: 'ฉบับร่าง',
  sent: 'ส่งแล้ว',
  rejected: 'ปฏิเสธ',
  expired: 'หมดอายุ',
  processing: 'กำลังดำเนินการ',
  shipped: 'จัดส่งแล้ว',
  scheduled: 'นัดหมายแล้ว',
  preparing: 'เตรียมงาน',
  testing: 'ทดสอบระบบ',
};
export default function AdminWorkspace({ route, title, navigate, authUser }) {
  const [records, setRecords] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [stats, setStats] = useState(null);
  const [productForm, setProductForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setErrorMessage('');
      setStats(null);
      setRecords([]);
      setTechnicians([]);
      if (!supabase) {
        setErrorMessage(supabaseConfigError || 'ไม่สามารถเชื่อมต่อ Supabase ได้');
        setLoading(false);
        return;
      }

      async function attachCustomerNames(rows) {
        const customerIds = [...new Set(rows.map((row) => row.customer_id).filter(Boolean))];
        if (!customerIds.length) return rows;
        const { data, error } = await supabase.from('profiles').select('id,full_name').in('id', customerIds);
        if (error) throw error;
        const names = new Map((data || []).map((profile) => [profile.id, profile.full_name]));
        return rows.map((row) => ({ ...row, customer_name: names.get(row.customer_id) || 'ไม่ระบุชื่อ' }));
      }

      try {
        if (route === '/admin' || route === '/reports') {
          const results = await Promise.all([
            supabase.from('products').select('id', { count: 'exact', head: true }),
            supabase.from('profiles').select('id', { count: 'exact', head: true }),
            supabase.from('orders').select('id,total,status,created_at'),
            supabase.from('service_bookings').select('id,status'),
            supabase.from('installations').select('id,status'),
            supabase.from('service_bookings')
              .select('id,booking_number,customer_id,status,preferred_at,province,created_at')
              .order('created_at', { ascending: false })
              .limit(5),
          ]);
          const failed = results.find((result) => result.error);
          if (failed?.error) throw failed.error;
          const [productCount, profileCount, orders, bookings, installations, recentBookings] = results;
          const currentMonth = new Date();
          const monthlyRevenue = (orders.data || []).reduce((total, order) => {
            const createdAt = new Date(order.created_at);
            return order.status !== 'cancelled'
              && createdAt.getFullYear() === currentMonth.getFullYear()
              && createdAt.getMonth() === currentMonth.getMonth()
              ? total + Number(order.total)
              : total;
          }, 0);
          const nextStats = {
            monthlyRevenue,
            orders: (orders.data || []).filter((order) => order.status !== 'cancelled').length,
            pendingBookings: (bookings.data || []).filter((booking) => booking.status === 'pending').length,
            activeInstallations: (installations.data || []).filter((installation) => !['completed', 'cancelled'].includes(installation.status)).length,
            products: productCount.count || 0,
            users: profileCount.count || 0,
            bookings: (bookings.data || []).length,
            completedInstallations: (installations.data || []).filter((installation) => installation.status === 'completed').length,
          };
          const customerBookings = await attachCustomerNames(recentBookings.data || []);
          if (active) {
            setStats(nextStats);
            setRecords(customerBookings);
          }
          return;
        }

        let query;
        if (route === '/manage-products') {
          query = supabase.from('products').select('*').order('created_at', { ascending: false });
        } else if (route === '/manage-users') {
          query = supabase.from('profiles').select('id,full_name,phone,role,created_at').order('created_at', { ascending: false });
        } else if (route === '/manage-bookings') {
          query = supabase.from('service_bookings')
            .select('id,booking_number,customer_id,status,preferred_at,address,province,created_at')
            .order('created_at', { ascending: false });
        } else if (route === '/manage-quotes') {
          query = supabase.from('quotations')
            .select('id,quote_number,booking_id,customer_id,status,total,valid_until,created_at')
            .order('created_at', { ascending: false });
        } else if (route === '/manage-orders') {
          query = supabase.from('orders')
            .select('id,order_number,status,total,shipping_name,created_at')
            .order('created_at', { ascending: false });
        } else if (route === '/installations') {
          query = supabase.from('installations')
            .select('id,installation_number,customer_id,status,scheduled_at,created_at')
            .order('created_at', { ascending: false });
        } else {
          throw new Error('ไม่พบหน้าจัดการที่ร้องขอ');
        }

        const { data, error } = await query;
        if (error) throw error;
        let nextRecords = data || [];
        if (['/manage-bookings', '/manage-quotes', '/installations'].includes(route)) {
          nextRecords = await attachCustomerNames(nextRecords);
        }
        if (route === '/manage-bookings' && nextRecords.length) {
          const bookingIds = nextRecords.map((row) => row.id);
          const [assignmentResult, technicianResult] = await Promise.all([
            supabase.from('technician_assignments').select('booking_id,technician_id').in('booking_id', bookingIds),
            supabase.from('profiles').select('id,full_name').eq('role', 'technician').order('full_name'),
          ]);
          if (assignmentResult.error) throw assignmentResult.error;
          if (technicianResult.error) throw technicianResult.error;
          const technicianNames = new Map((technicianResult.data || []).map((technician) => [technician.id, technician.full_name]));
          const assignments = new Map();
          (assignmentResult.data || []).forEach((assignment) => {
            const assigned = assignments.get(assignment.booking_id) || [];
            assigned.push(assignment.technician_id);
            assignments.set(assignment.booking_id, assigned);
          });
          nextRecords = nextRecords.map((row) => ({
            ...row,
            technician_ids: assignments.get(row.id) || [],
            technician_names: (assignments.get(row.id) || []).map((id) => technicianNames.get(id) || 'ช่างไม่พบข้อมูล'),
          }));
          if (active) setTechnicians(technicianResult.data || []);
        }
        if (route === '/manage-quotes' && nextRecords.length) {
          const bookingIds = [...new Set(nextRecords.map((row) => row.booking_id).filter(Boolean))];
          const { data: bookings, error: bookingsError } = await supabase
            .from('service_bookings')
            .select('id,booking_number')
            .in('id', bookingIds);
          if (bookingsError) throw bookingsError;
          const bookingNumbers = new Map((bookings || []).map((booking) => [booking.id, booking.booking_number]));
          nextRecords = nextRecords.map((row) => ({ ...row, booking_number: bookingNumbers.get(row.booking_id) || '—' }));
        }
        if (active) setRecords(nextRecords);
      } catch (error) {
        if (active) setErrorMessage(`โหลดข้อมูล Admin ไม่สำเร็จ: ${error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [route, refreshKey]);

  async function updateStatus(record, status) {
    const table = {
      '/manage-bookings': 'service_bookings',
      '/manage-quotes': 'quotations',
      '/manage-orders': 'orders',
      '/installations': 'installations',
    }[route];
    if (!supabase || !table) return;
    setSavingId(record.id);
    setErrorMessage('');
    try {
      const { data, error } = await supabase.from(table).update({ status }).eq('id', record.id).select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('ไม่พบข้อมูลรายการนี้ หรือไม่มีสิทธิ์แก้ไข');
      setNotice('บันทึกสถานะเรียบร้อยแล้ว');
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setErrorMessage(`บันทึกสถานะไม่สำเร็จ: ${error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
    } finally {
      setSavingId('');
    }
  }

  async function updateRole(record, role) {
    if (!supabase) return;
    setSavingId(record.id);
    setErrorMessage('');
    try {
      const { data, error } = await supabase.from('profiles').update({ role }).eq('id', record.id).select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('ไม่พบผู้ใช้นี้ หรือไม่มีสิทธิ์แก้ไข');
      setNotice('บันทึกบทบาทผู้ใช้เรียบร้อยแล้ว');
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setErrorMessage(`เปลี่ยนบทบาทไม่สำเร็จ: ${error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
    } finally {
      setSavingId('');
    }
  }

  async function assignTechnician(record, technicianId) {
    if (!supabase || !technicianId) return;
    setSavingId(record.id);
    setErrorMessage('');
    try {
      const { error } = await supabase.from('technician_assignments')
        .insert({ booking_id: record.id, technician_id: technicianId, assigned_by: authUser.id });
      if (error) throw error;
      setNotice('มอบหมายช่างเรียบร้อยแล้ว');
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setErrorMessage(`มอบหมายช่างไม่สำเร็จ: ${error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
    } finally {
      setSavingId('');
    }
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (!supabase || !productForm) return;
    const price = Number(productForm.price);
    const stockQuantity = Number(productForm.stock_quantity);
    const compareAtPrice = productForm.compare_at_price === '' ? null : Number(productForm.compare_at_price);
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stockQuantity) || stockQuantity < 0
      || (compareAtPrice !== null && (!Number.isFinite(compareAtPrice) || compareAtPrice < price))) {
      setErrorMessage('กรุณาตรวจสอบราคา ราคาเดิม และจำนวนสินค้าให้ถูกต้อง');
      return;
    }
    const payload = {
      name: productForm.name.trim(),
      slug: productForm.slug.trim(),
      category: productForm.category.trim(),
      description: productForm.description.trim(),
      price,
      compare_at_price: compareAtPrice,
      sku: productForm.sku.trim() || null,
      stock_quantity: stockQuantity,
      is_active: productForm.is_active,
    };
    if (!payload.name || !payload.slug || !payload.category) {
      setErrorMessage('กรุณากรอกชื่อสินค้า Slug และหมวดหมู่');
      return;
    }
    setSavingId('product');
    setErrorMessage('');
    try {
      const result = productForm.id
        ? await supabase.from('products').update(payload).eq('id', productForm.id).select('id').maybeSingle()
        : await supabase.from('products').insert(payload).select('id').single();
      if (result.error) throw result.error;
      if (!result.data) throw new Error('ไม่พบสินค้า หรือไม่มีสิทธิ์แก้ไข');
      setProductForm(null);
      setNotice(productForm.id ? 'แก้ไขสินค้าเรียบร้อยแล้ว' : 'เพิ่มสินค้าเรียบร้อยแล้ว');
      setRefreshKey((key) => key + 1);
      window.dispatchEvent(new Event('solarservice:products-updated'));
    } catch (error) {
      setErrorMessage(`บันทึกสินค้าไม่สำเร็จ: ${error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
    } finally {
      setSavingId('');
    }
  }

  function exportRecords() {
    const columns = {
      '/manage-products': [['ชื่อสินค้า', 'name'], ['Slug', 'slug'], ['หมวดหมู่', 'category'], ['ราคา', 'price'], ['จำนวนคงเหลือ', 'stock_quantity'], ['เผยแพร่', 'is_active']],
      '/manage-users': [['ชื่อ', 'full_name'], ['เบอร์โทร', 'phone'], ['บทบาท', 'role'], ['วันที่สมัคร', 'created_at']],
      '/manage-bookings': [['เลขที่จอง', 'booking_number'], ['ลูกค้า', 'customer_name'], ['สถานะ', 'status'], ['วันนัด', 'preferred_at'], ['จังหวัด', 'province']],
      '/manage-quotes': [['เลขที่ใบเสนอราคา', 'quote_number'], ['ลูกค้า', 'customer_name'], ['เลขที่จอง', 'booking_number'], ['ยอดรวม', 'total'], ['สถานะ', 'status']],
      '/manage-orders': [['เลขที่คำสั่งซื้อ', 'order_number'], ['ผู้รับสินค้า', 'shipping_name'], ['ยอดรวม', 'total'], ['สถานะ', 'status'], ['วันที่สั่งซื้อ', 'created_at']],
      '/installations': [['เลขที่ติดตั้ง', 'installation_number'], ['ลูกค้า', 'customer_name'], ['สถานะ', 'status'], ['วันนัดติดตั้ง', 'scheduled_at']],
    }[route];
    if (!columns) return;
    const escapeCell = (value) => {
      const text = String(value ?? '').replace(/^[\u0000-\u0020]*[=+\-@]/, "'$&");
      return `"${text.replaceAll('"', '""')}"`;
    };
    const csv = [columns.map(([label]) => label), ...records.map((record) => columns.map(([, key]) => {
      const value = record[key];
      return key === 'status' && adminStatusLabels[value] ? adminStatusLabels[value] : value;
    }))].map((row) => row.map(escapeCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${route.slice(1)}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function statusControl(record) {
    const statuses = adminStatusOptions[route];
    if (!statuses) return null;
    return <select className="admin-select" aria-label={`สถานะ ${record.booking_number || record.quote_number || record.order_number || record.installation_number}`}
      value={record.status} disabled={savingId === record.id} onChange={(event) => updateStatus(record, event.target.value)}>
      {statuses.map((status) => <option key={status} value={status}>{adminStatusLabels[status] || status}</option>)}
    </select>;
  }

  function tableRow(record) {
    if (route === '/manage-products') return <div className="admin-table-row" key={record.id}>
      <div><strong>{record.name}</strong><small>{record.sku || record.slug}</small></div>
      <span>{record.category}</span>
      <strong><Money value={record.price} /></strong>
      <span className={`status-pill ${record.is_active ? 'green' : 'yellow'}`}>{record.is_active ? 'เผยแพร่' : 'ซ่อน'}</span>
      <button className="button button-outline small-button" onClick={() => setProductForm({ ...record, compare_at_price: record.compare_at_price ?? '', sku: record.sku ?? '' })}>แก้ไข</button>
    </div>;
    if (route === '/manage-users') return <div className="admin-table-row" key={record.id}>
      <div><strong>{record.full_name || 'ไม่ระบุชื่อ'}</strong><small>{record.id}</small></div>
      <span>{record.phone || '—'}</span>
      <span className="status-pill blue">{record.role}</span>
      <select className="admin-select" aria-label={`บทบาท ${record.full_name}`} value={record.role} disabled={savingId === record.id || record.id === authUser?.id}
        onChange={(event) => updateRole(record, event.target.value)}>
        <option value="customer">ลูกค้า</option><option value="technician">ช่าง</option><option value="admin">Admin</option>
      </select>
      <span>{new Date(record.created_at).toLocaleDateString('th-TH')}</span>
    </div>;
    if (route === '/manage-bookings') return <div className="admin-table-row" key={record.id}>
      <div><strong>{record.booking_number}</strong><small>{record.customer_name} · {new Date(record.created_at).toLocaleDateString('th-TH')}</small></div>
      <span>{record.province}</span>
      <span>{new Date(record.preferred_at).toLocaleString('th-TH')}</span>
      {statusControl(record)}
      <div><select className="admin-select" aria-label={`มอบหมายช่าง ${record.booking_number}`} value="" disabled={savingId === record.id || technicians.every((technician) => record.technician_ids?.includes(technician.id))}
        onChange={(event) => assignTechnician(record, event.target.value)}>
        <option value="">{technicians.length ? 'เลือกช่าง…' : 'ไม่มีบัญชีช่าง'}</option>
        {technicians.filter((technician) => !record.technician_ids?.includes(technician.id)).map((technician) => <option key={technician.id} value={technician.id}>{technician.full_name || technician.id}</option>)}
      </select><small className="admin-assignees">{record.technician_names?.length ? record.technician_names.join(', ') : 'ยังไม่ได้มอบหมาย'}</small></div>
    </div>;
    if (route === '/manage-quotes') return <div className="admin-table-row" key={record.id}>
      <div><strong>{record.quote_number}</strong><small>อ้างอิง {record.booking_number}</small></div>
      <span>{record.customer_name}</span>
      <strong><Money value={record.total} /></strong>
      {statusControl(record)}
      <span>{new Date(record.created_at).toLocaleDateString('th-TH')}</span>
    </div>;
    if (route === '/manage-orders') return <div className="admin-table-row" key={record.id}>
      <div><strong>{record.order_number}</strong><small>{record.shipping_name}</small></div>
      <span>{record.shipping_name}</span>
      <span>{new Date(record.created_at).toLocaleDateString('th-TH')}</span>
      <strong><Money value={record.total} /></strong>
      {statusControl(record)}
    </div>;
    return <div className="admin-table-row" key={record.id}>
      <div><strong>{record.installation_number}</strong><small>{record.customer_name}</small></div>
      <span>{record.scheduled_at ? new Date(record.scheduled_at).toLocaleString('th-TH') : 'ยังไม่กำหนด'}</span>
      <span className="status-pill blue">{adminStatusLabels[record.status] || record.status}</span>
      {statusControl(record)}
      <span>{new Date(record.created_at).toLocaleDateString('th-TH')}</span>
    </div>;
  }

  const headings = {
    '/manage-products': ['สินค้า', 'หมวดหมู่', 'ราคา', 'การเผยแพร่', 'จัดการ'],
    '/manage-users': ['ผู้ใช้', 'เบอร์โทร', 'บทบาทปัจจุบัน', 'เปลี่ยนบทบาท', 'สมัครเมื่อ'],
    '/manage-bookings': ['รายการจอง', 'จังหวัด', 'วันนัดหมาย', 'สถานะ', 'มอบหมายช่าง'],
    '/manage-quotes': ['ใบเสนอราคา', 'ลูกค้า', 'ยอดรวม', 'สถานะ', 'สร้างเมื่อ'],
    '/manage-orders': ['คำสั่งซื้อ', 'ผู้รับสินค้า', 'วันที่สั่งซื้อ', 'ยอดรวม', 'สถานะ'],
    '/installations': ['งานติดตั้ง', 'วันนัดหมาย', 'สถานะ', 'เปลี่ยนสถานะ', 'สร้างเมื่อ'],
  }[route];

  return <div className="workspace-wrap">
    <div className="workspace-heading">
      <div><div className="eyebrow">ADMIN CONSOLE</div><h1>{title}</h1><p>จัดการข้อมูลจริงจากฐานข้อมูล SolarService</p></div>
      <div className="workspace-heading-actions">
        <span className="today-label"><CalendarDays size={15} />{new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}</span>
        {route === '/manage-products' && <button className="button button-dark" onClick={() => {
          setErrorMessage('');
          setProductForm({ name: '', slug: '', category: '', description: '', price: '', compare_at_price: '', sku: '', stock_quantity: 0, is_active: true });
        }}><Plus size={16} /> เพิ่มสินค้า</button>}
        {headings && <button className="button button-outline small-button" onClick={exportRecords} disabled={loading}><Download size={15} /> ส่งออก CSV</button>}
      </div>
    </div>
    <div className="welcome-strip"><span><Sun size={19} /></span><p>ยินดีต้อนรับ, ผู้ดูแลระบบ<small>{authUser?.email || 'จัดการข้อมูลและติดตามการดำเนินงานได้ที่นี่'}</small></p><ArrowRight size={18} /></div>
    <div className="workspace-content">
      <div className="workspace-section-heading"><div><h2>{route === '/admin' ? 'ภาพรวมการดำเนินงาน' : route === '/reports' ? 'รายงานจากข้อมูลจริง' : title}</h2><p>{route === '/admin' || route === '/reports' ? 'ตัวเลขคำนวณจากข้อมูลใน Supabase' : 'ตรวจสอบและจัดการข้อมูลใน Supabase'}</p></div></div>
      {errorMessage && <div className="admin-message error" role="alert">{errorMessage}</div>}
      {notice && <div className="admin-message success" role="status">{notice}<button onClick={() => setNotice('')} aria-label="ปิดข้อความ">×</button></div>}
      {loading ? <div className="admin-loading" role="status">กำลังโหลดข้อมูลจาก Supabase…</div> : null}
      {!loading && (route === '/admin' || route === '/reports') && stats && <>
        <div className={route === '/reports' ? 'report-grid' : 'stats-grid'}>
          {route === '/reports' ? <>
            <div><small>มูลค่าคำสั่งซื้อเดือนนี้</small><strong>฿ {stats.monthlyRevenue.toLocaleString('th-TH')}</strong><span>รวมรายการที่ไม่ถูกยกเลิก</span></div>
            <div><small>คำสั่งซื้อ</small><strong>{stats.orders} รายการ</strong><span>รายการที่ใช้งานได้ทั้งหมด</span></div>
            <div><small>การจองสำรวจ</small><strong>{stats.bookings} งาน</strong><span>จากฐานข้อมูลจริง</span></div>
            <div><small>งานติดตั้งเสร็จสิ้น</small><strong>{stats.completedInstallations} งาน</strong><span>จากฐานข้อมูลจริง</span></div>
          </> : <>
            {[['มูลค่าคำสั่งซื้อเดือนนี้', `฿ ${stats.monthlyRevenue.toLocaleString('th-TH')}`, <CreditCard />],
              ['คำสั่งซื้อ', stats.orders, <ShoppingBag />],
              ['รอมอบหมายงาน', stats.pendingBookings, <CalendarDays />],
              ['งานติดตั้งที่ยังดำเนินการ', stats.activeInstallations, <Wrench />],
              ['สินค้าในระบบ', stats.products, <Package />],
              ['บัญชีผู้ใช้', stats.users, <ShieldCheck />]].map(([label, value, icon]) =>
              <div className="stat-card" key={label}><span>{icon}</span><small>{label}</small><strong>{value}</strong></div>)}
          </>}
        </div>
        {route === '/admin' && <div className="quick-actions">
          {[['จัดการสินค้า', <Package />, '/manage-products'], ['จัดการผู้ใช้', <ShieldCheck />, '/manage-users'],
            ['การจอง', <CalendarDays />, '/manage-bookings'], ['คำสั่งซื้อ', <ShoppingBag />, '/manage-orders']].map(([label, icon, path]) =>
            <button key={path} onClick={() => navigate(path)}><span>{icon}</span><strong>{label}</strong><ChevronRight size={17} /></button>)}
        </div>}
        {route === '/admin' && <section className="admin-recent"><h3>การจองล่าสุด</h3>{records.length
          ? <div className="admin-table"><div className="admin-table-head"><span>รายการจอง</span><span>จังหวัด</span><span>วันนัดหมาย</span><span>สถานะ</span><span>สร้างเมื่อ</span></div>
            {records.map((record) => <div className="admin-table-row" key={record.id}><div><strong>{record.booking_number}</strong><small>{record.customer_name}</small></div><span>{record.province}</span><span>{new Date(record.preferred_at).toLocaleString('th-TH')}</span><span className="status-pill yellow">{adminStatusLabels[record.status] || record.status}</span><span>{new Date(record.created_at).toLocaleDateString('th-TH')}</span></div>)}</div>
          : <p className="admin-empty">ยังไม่มีการจอง</p>}</section>}
      </>}
      {!loading && headings && <div className="admin-table">
        <div className="admin-table-head">{headings.map((heading) => <span key={heading}>{heading}</span>)}</div>
        {records.length ? records.map(tableRow) : <p className="admin-empty">ยังไม่มีข้อมูลในส่วนนี้</p>}
      </div>}
      {!loading && route === '/manage-products' && productForm && <div className="admin-form-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setProductForm(null);
      }}>
        <form className="admin-product-form" onSubmit={saveProduct}>
          <div className="workspace-section-heading"><div><h2>{productForm.id ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</h2><p>ข้อมูลจะถูกบันทึกลง Supabase</p></div><button type="button" className="icon-action" aria-label="ปิด" onClick={() => setProductForm(null)}>×</button></div>
          <div className="admin-form-grid">
            {[['name', 'ชื่อสินค้า', true], ['slug', 'Slug (ไม่ซ้ำ)', true], ['category', 'หมวดหมู่', true], ['sku', 'SKU'], ['price', 'ราคา', true, 'number'], ['compare_at_price', 'ราคาเดิม', false, 'number'], ['stock_quantity', 'จำนวนคงเหลือ', true, 'number'], ['description', 'รายละเอียด']].map(([key, label, required, type]) =>
              <label key={key} className={key === 'description' ? 'full-width' : ''}>{label}
                <input type={type || 'text'} required={Boolean(required)} min={type === 'number' ? '0' : undefined}
                  step={key === 'stock_quantity' ? '1' : type === 'number' ? '0.01' : undefined}
                  value={productForm[key] ?? ''} onChange={(event) => setProductForm((current) => ({ ...current, [key]: event.target.value }))} />
              </label>)}
            <label className="admin-checkbox full-width"><input type="checkbox" checked={Boolean(productForm.is_active)} onChange={(event) => setProductForm((current) => ({ ...current, is_active: event.target.checked }))} /> เผยแพร่สินค้าให้ลูกค้าเห็น</label>
          </div>
          <div className="admin-form-actions"><button type="button" className="button button-outline" onClick={() => setProductForm(null)}>ยกเลิก</button>
            <button type="submit" className="button button-green" disabled={savingId === 'product'}>{savingId === 'product' ? 'กำลังบันทึก…' : 'บันทึกสินค้า'}</button></div>
        </form>
      </div>}
    </div>
  </div>;
}
