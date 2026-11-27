import React, { useEffect, useState } from 'react';
import { AlertCircle, CalendarDays, Phone, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

function formatDueDate(date) {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function installmentLabel(installment, today) {
  if (installment.status === 'paid') return 'ชำระแล้ว';
  if (installment.due_date < today) return 'เกินกำหนด';
  if (installment.due_date === today) return 'ครบกำหนดวันนี้';
  return 'รอชำระ';
}

export default function StaffInstallments({ title }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    if (!supabase) {
      setError('กรุณาตั้งค่า Supabase ก่อนใช้งาน');
      setLoading(false);
      return undefined;
    }

    supabase.from('orders')
      .select('id,order_number,shipping_name,phone,total,status,created_at,payment_plan,order_installments(id,installment_number,amount,due_date,status,paid_at)')
      .eq('payment_plan', 'three_installments')
      .order('created_at', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) throw queryError;
        setOrders(data || []);
      })
      .catch((queryError) => {
        if (active) setError(queryError instanceof Error ? queryError.message : 'โหลดรายการผ่อนชำระไม่สำเร็จ');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [refresh]);

  const installments = orders.flatMap((order) => (order.order_installments || []).map((item) => ({
    ...item,
    order,
  })));
  const overdueCount = installments.filter((item) => item.status === 'pending' && item.due_date < today).length;

  return <div className="workspace-wrap">
    <div className="workspace-heading">
      <div>
        <div className="eyebrow">STAFF · PAYMENTS</div>
        <h1>{title}</h1>
        <p>ติดตามกำหนดชำระและติดต่อช่วยเหลือลูกค้าได้ โดยไม่มีสิทธิ์เปลี่ยนสถานะการชำระ</p>
      </div>
      <button className="button button-outline small-button" type="button" onClick={() => setRefresh((value) => value + 1)} disabled={loading}>
        <RefreshCw size={14} /> รีเฟรช
      </button>
    </div>

    {error && <div className="bk-form-error" role="alert"><AlertCircle size={16} /> โหลดรายการผ่อนไม่สำเร็จ: {error}</div>}
    {loading && <p className="bk-hint" role="status">กำลังโหลดรายการผ่อนชำระ…</p>}
    {!loading && !error && <div className="workspace-content">
      <div className="workspace-section-heading">
        <div><h2>รายการผ่อนชำระ</h2><p>{overdueCount ? `มี ${overdueCount} งวดเกินกำหนด` : 'ไม่มีงวดที่เกินกำหนด'}</p></div>
      </div>
      {!orders.length && <div className="technician-empty"><CalendarDays size={26} /><strong>ยังไม่มีคำสั่งซื้อแบบผ่อนชำระ</strong></div>}
      <div className="bk-history-list">{orders.map((order) => {
        const orderInstallments = [...(order.order_installments || [])]
          .sort((left, right) => left.installment_number - right.installment_number);
        return <article className="bk-history-card" key={order.id}>
          <div className="bk-history-heading">
            <strong>{order.order_number}</strong>
            <span className={`status-pill ${order.status === 'cancelled' ? 'gray' : 'blue'}`}>{order.status}</span>
          </div>
          <div className="bk-history-details">
            <span>{order.shipping_name || 'ไม่ระบุชื่อผู้รับ'}</span>
            {order.phone && <a href={`tel:${order.phone}`}><Phone size={14} /> {order.phone} · โทรติดตาม</a>}
            <span>ยอดรวม {Number(order.total || 0).toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</span>
          </div>
          <div className="bk-history-list">
            {orderInstallments.map((installment) => {
              const label = installmentLabel(installment, today);
              const tone = installment.status === 'paid' ? 'green' : label === 'เกินกำหนด' ? 'yellow' : 'blue';
              return <div className="bk-history-details" key={installment.id}>
                <span>งวด {installment.installment_number} · ครบกำหนด {formatDueDate(installment.due_date)}</span>
                <span>{Number(installment.amount).toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</span>
                <span className={`status-pill ${tone}`}>{label}</span>
              </div>;
            })}
          </div>
        </article>;
      })}</div>
    </div>}
  </div>;
}
