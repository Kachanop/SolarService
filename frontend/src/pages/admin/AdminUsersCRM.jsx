import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  UserX,
  Eye,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Money } from '../../components/Shared.jsx';

const roleLabels = {
  customer: { label: 'ลูกค้า (Customer)', tone: 'blue' },
  staff: { label: 'พนักงานบริการ (Staff)', tone: 'purple' },
  technician: { label: 'ช่างติดตั้ง (Technician)', tone: 'yellow' },
  admin: { label: 'ผู้ดูแลระบบ (Admin)', tone: 'green' },
};

export default function AdminUsersCRM({
  users,
  onUpdateRole,
  onToggleBan,
  authUser,
  savingId,
  setToast,
}) {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [crmTab, setCrmTab] = useState('orders');

  const filtered = useMemo(() => {
    return (users || []).map((u) => ({
      ...u,
      is_banned: Boolean(u.is_banned),
    })).filter((u) => {
      const matchSearch =
        !search ||
        `${u.full_name || ''} ${u.phone || ''} ${u.id || ''} ${u.email || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchRole = !filterRole || u.role === filterRole;
      const matchStatus =
        !filterStatus ||
        (filterStatus === 'banned' ? u.is_banned : !u.is_banned);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, filterRole, filterStatus]);

  function handleBanToggle(user) {
    const nextState = !user.is_banned;
    const actionName = nextState ? 'ระงับบัญชี' : 'ปลดระงับบัญชี';
    if (confirm(`ต้องการ${actionName}ของผู้ใช้ "${user.full_name || user.id}" หรือไม่?`)) {
      onToggleBan(user.id, nextState);
      if (setToast) setToast(`${actionName}เรียบร้อยแล้ว`);
    }
  }

  return (
    <div className="admin-users-crm-view">
      {/* CRM Stats Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <small>ผู้ใช้งานทั้งหมด</small>
          <strong>{(users || []).length} บัญชี</strong>
          <span style={{ fontSize: '9px', color: '#5b6b58' }}>ในฐานข้อมูล Supabase</span>
        </div>
        <div className="stat-card">
          <small>ลูกค้าทั่วไป (Customers)</small>
          <strong>{(users || []).filter((u) => u.role === 'customer').length} คน</strong>
          <span style={{ fontSize: '9px', color: '#5b6b58' }}>ผู้ใช้บริการหลัก</span>
        </div>
        <div className="stat-card">
          <small>ช่างและพนักงาน (Staff & Tech)</small>
          <strong>
            {(users || []).filter((u) => ['technician', 'staff'].includes(u.role)).length} คน
          </strong>
          <span style={{ fontSize: '9px', color: '#5b6b58' }}>ทีมงาน SolarService</span>
        </div>
        <div className="stat-card">
          <small>บัญชีที่ถูกระงับ (Banned)</small>
          <strong style={{ color: (users || []).filter((u) => u.is_banned).length > 0 ? '#b53b2d' : '#334832' }}>
            {(users || []).filter((u) => u.is_banned).length} บัญชี
          </strong>
          <span style={{ fontSize: '9px', color: '#5b6b58' }}>ความปลอดภัยระบบ</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar" style={{ marginTop: '16px' }}>
        <div className="admin-toolbar-left">
          <div className="admin-search-box">
            <Search size={14} color="#788775" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, เบอร์โทร, User ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="admin-filter-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">ทุกระดับสิทธิ์ (Role)</option>
            <option value="customer">ลูกค้า (Customer)</option>
            <option value="staff">พนักงานบริการ (Staff)</option>
            <option value="technician">ช่างติดตั้ง (Technician)</option>
            <option value="admin">Admin (ผู้ดูแลระบบ)</option>
          </select>

          <select
            className="admin-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">ทุกสถานะบัญชี</option>
            <option value="active">ปกติ (Active)</option>
            <option value="banned">ถูกระงับ (Banned)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-table">
        <div
          className="admin-table-head"
          style={{ gridTemplateColumns: 'minmax(160px, 1.4fr) minmax(110px, 1fr) minmax(120px, 1fr) minmax(130px, 1.1fr) minmax(90px, 0.8fr) minmax(140px, 1.2fr)' }}
        >
          <span>ผู้ใช้งาน / บัญชี</span>
          <span>เบอร์โทร / อีเมล</span>
          <span>สิทธิ์การใช้งาน (Role)</span>
          <span>เปลี่ยนสิทธิ์ด่วน</span>
          <span>สถานะ</span>
          <span>CRM & การจัดการ</span>
        </div>

        {filtered.length ? (
          filtered.map((user) => {
            const roleInfo = roleLabels[user.role] || roleLabels.customer;
            const isSelf = user.id === authUser?.id;
            return (
              <div
                key={user.id}
                className="admin-table-row"
                style={{ gridTemplateColumns: 'minmax(160px, 1.4fr) minmax(110px, 1fr) minmax(120px, 1fr) minmax(130px, 1.1fr) minmax(90px, 0.8fr) minmax(140px, 1.2fr)' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#e9f1e3',
                        color: '#466835',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '11px',
                        fontWeight: '700',
                      }}
                    >
                      {(user.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong>{user.full_name || 'ไม่ระบุชื่อ'}</strong>
                      <small style={{ fontSize: '8px', color: '#889585' }}>
                        {user.id?.slice(0, 8)}...
                      </small>
                    </div>
                  </div>
                </div>

                <div>
                  <span>{user.phone || '—'}</span>
                  <small style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#587b45' }}>
                    <CheckCircle size={10} /> ยืนยันแล้ว
                  </small>
                </div>

                <div>
                  <span className={`status-pill ${roleInfo.tone}`}>
                    {roleInfo.label.split(' ')[0]}
                  </span>
                </div>

                <div>
                  <select
                    className="admin-select"
                    value={user.role}
                    disabled={isSelf || savingId === user.id}
                    onChange={(e) => onUpdateRole(user, e.target.value)}
                    style={{ fontSize: '9px', padding: '5px 7px' }}
                  >
                    <option value="customer">ลูกค้า (Customer)</option>
                    <option value="staff">พนักงาน (Staff)</option>
                    <option value="technician">ช่าง (Technician)</option>
                    <option value="admin">Admin สูงสุด</option>
                  </select>
                </div>

                <div>
                  <span className={`status-pill ${user.is_banned ? 'red' : 'green'}`}>
                    {user.is_banned ? 'ถูกระงับ' : 'ปกติ'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="button button-outline small-button"
                    style={{ padding: '5px 8px', fontSize: '9px' }}
                    onClick={() => {
                      setSelectedCustomer(user);
                      setCrmTab('orders');
                    }}
                  >
                    <Eye size={12} /> ข้อมูล 360°
                  </button>

                  {!isSelf && (
                    <button
                      type="button"
                      className={`button ${user.is_banned ? 'button-outline' : 'button-outline'} small-button`}
                      style={{
                        padding: '5px 8px',
                        fontSize: '9px',
                        color: user.is_banned ? '#477038' : '#a03b30',
                        borderColor: user.is_banned ? '#b8d6a8' : '#f0cfc9',
                      }}
                      onClick={() => handleBanToggle(user)}
                      title={user.is_banned ? 'ปลดการระงับ' : 'ระงับบัญชีผู้ใช้'}
                    >
                      {user.is_banned ? <UserCheck size={12} /> : <UserX size={12} />}
                      {user.is_banned ? 'ปลดแบน' : 'ระงับ'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="admin-empty">ไม่พบข้อมูลผู้ใช้ที่ตรงกับเงื่อนไข</p>
        )}
      </div>

      {/* CRM 360 Customer Profile Modal */}
      {selectedCustomer && (
        <div
          className="admin-form-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedCustomer(null);
          }}
        >
          <div className="admin-modal-card" style={{ maxWidth: '640px' }}>
            <div className="admin-modal-header">
              <div>
                <h2>ข้อมูลลูกค้าแบบ 360 องศา (Customer CRM 360°)</h2>
                <p>ประวัติการสั่งซื้อ บริการช่าง และอุปกรณ์ที่ติดตั้งทั้งหมด</p>
              </div>
              <button
                type="button"
                className="icon-action"
                onClick={() => setSelectedCustomer(null)}
              >
                ×
              </button>
            </div>

            {/* Profile Hero */}
            <div className="crm-profile-hero">
              <div className="crm-avatar">
                {(selectedCustomer.full_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#253723' }}>
                  {selectedCustomer.full_name || 'ไม่ระบุชื่อ'}
                </h3>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '11px', color: '#576753' }}>
                  <span>
                    <Phone size={12} style={{ display: 'inline', marginRight: '3px' }} />
                    {selectedCustomer.phone || 'ยังไม่ได้ระบุ'}
                  </span>
                  <span>
                    <ShieldCheck size={12} style={{ display: 'inline', marginRight: '3px' }} />
                    บทบาท: {roleLabels[selectedCustomer.role]?.label.split(' ')[0] || selectedCustomer.role}
                  </span>
                  <span>
                    <Calendar size={12} style={{ display: 'inline', marginRight: '3px' }} />
                    สมัครเมื่อ {new Date(selectedCustomer.created_at).toLocaleDateString('th-TH')}
                  </span>
                </div>
              </div>
            </div>

            {/* Sub Tabs */}
            <div className="crm-tabs">
              <button
                type="button"
                className={`crm-tab-btn ${crmTab === 'orders' ? 'active' : ''}`}
                onClick={() => setCrmTab('orders')}
              >
                <ShoppingBag size={13} style={{ display: 'inline', marginRight: '4px' }} />
                ประวัติคำสั่งซื้อ
              </button>
              <button
                type="button"
                className={`crm-tab-btn ${crmTab === 'bookings' ? 'active' : ''}`}
                onClick={() => setCrmTab('bookings')}
              >
                <Wrench size={13} style={{ display: 'inline', marginRight: '4px' }} />
                ประวัติการจองและติดตั้ง
              </button>
              <button
                type="button"
                className={`crm-tab-btn ${crmTab === 'warranties' ? 'active' : ''}`}
                onClick={() => setCrmTab('warranties')}
              >
                <ShieldCheck size={13} style={{ display: 'inline', marginRight: '4px' }} />
                อุปกรณ์ในประกัน
              </button>
            </div>

            {/* Tab Contents */}
            <div style={{ minHeight: '160px' }}>
              {crmTab === 'orders' && (
                <div>
                  <div style={{ padding: '12px', background: '#f8faf6', borderRadius: '7px', marginBottom: '10px', fontSize: '11px', color: '#3b4b38' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>คำสั่งซื้อ #SS-202610-098</strong>
                      <span className="status-pill green">จัดส่งแล้ว</span>
                    </div>
                    <div style={{ marginTop: '4px', color: '#687766' }}>
                      แผงโซลาร์เซลล์ LONGi 580W (2 แผง) + สายไฟโซลาร์เซลล์ PV1-F
                    </div>
                    <div style={{ marginTop: '6px', fontWeight: '700', color: '#274b1c' }}>
                      ยอดชำระ: ฿ 9,880 (ชำระแล้วผ่าน PromptPay)
                    </div>
                  </div>
                </div>
              )}

              {crmTab === 'bookings' && (
                <div>
                  <div style={{ padding: '12px', background: '#f8faf6', borderRadius: '7px', marginBottom: '10px', fontSize: '11px', color: '#3b4b38' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>คิวจองสำรวจ #BK-202609-041</strong>
                      <span className="status-pill green">ติดตั้งเสร็จสมบูรณ์</span>
                    </div>
                    <div style={{ marginTop: '4px', color: '#687766' }}>
                      ระบบโซลาร์เซลล์ 5 kW พร้อมมิเตอร์ TOU · ช่างผู้ดูแล: ช่างเอกชัย
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '10px', color: '#889585' }}>
                      วันที่ส่งมอบงาน: 20 กันยายน 2568
                    </div>
                  </div>
                </div>
              )}

              {crmTab === 'warranties' && (
                <div>
                  <div style={{ padding: '12px', background: '#f8faf6', borderRadius: '7px', marginBottom: '10px', fontSize: '11px', color: '#3b4b38' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>Huawei Inverter 5kW (S/N: HW-INV-88392104)</strong>
                      <span className="status-pill green">อยู่ในประกัน</span>
                    </div>
                    <div style={{ marginTop: '4px', color: '#687766' }}>
                      ระยะเวลารับประกัน 10 ปี (สิ้นสุด 15 มิ.ย. 2578)
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                className="button button-outline"
                onClick={() => setSelectedCustomer(null)}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
