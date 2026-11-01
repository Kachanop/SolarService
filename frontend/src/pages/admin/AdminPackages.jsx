import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Plus,
  Trash2,
  Edit3,
  Check,
  Sun,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Money } from '../../components/Shared.jsx';

export default function AdminPackages({ packages, onSavePackage, onDeletePackage, setToast }) {
  const [search, setSearch] = useState('');
  const [formModal, setFormModal] = useState(null);

  const filtered = useMemo(() => {
    return (packages || []).filter((p) => {
      return (
        !search ||
        `${p.name} ${p.system_size_kw} ${p.description} ${p.inverter_brand || ''}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    });
  }, [packages, search]);

  function handleSave(e) {
    e.preventDefault();
    if (!formModal.name || !formModal.price) {
      alert('กรุณากรอกชื่อแพ็กเกจและราคา');
      return;
    }
    const featuresArray = Array.isArray(formModal.features)
      ? formModal.features
      : String(formModal.features || '')
          .split('\n')
          .map((f) => f.trim())
          .filter(Boolean);

    onSavePackage({
      ...formModal,
      price: Number(formModal.price),
      system_size_kw: Number(formModal.system_size_kw) || 5,
      features: featuresArray,
    });
    setFormModal(null);
    if (setToast) setToast('บันทึกข้อมูลแพ็กเกจติดตั้งเรียบร้อยแล้ว');
  }

  return (
    <div className="admin-packages-view">
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <div className="admin-search-box">
            <Search size={14} color="#788775" />
            <input
              type="text"
              placeholder="ค้นหาชื่อแพ็กเกจ, ขนาด kW, แบรนด์อุปกรณ์..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-toolbar-right">
          <button
            type="button"
            className="button button-dark small-button"
            onClick={() =>
              setFormModal({
                name: '',
                slug: '',
                system_size_kw: 5,
                price: 149000,
                description: '',
                inverter_brand: 'Huawei SUN2000-5KTL',
                panel_brand: 'LONGi Hi-MO 6 580W (10 แผง)',
                features: ['แผงโซลาร์เซลล์ 10 แผง 580W', 'อินเวอร์เตอร์ Huawei 5 kW', 'รับประกันแผง 25 ปี', 'รับประกันงานติดตั้ง 5 ปี'],
                popular: false,
                is_active: true,
              })
            }
          >
            <Plus size={14} /> เพิ่มแพ็กเกจติดตั้งใหม่
          </button>
        </div>
      </div>

      {/* Package List Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px',
        }}
      >
        {filtered.map((item) => (
          <div
            key={item.id}
            className="package-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              boxShadow: item.popular ? '0 8px 24px rgba(88,123,69,0.14)' : 'none',
              borderColor: item.popular ? '#587b45' : '#e5ebd8',
            }}
          >
            {item.popular && (
              <div className="popular-label" style={{ top: '-10px', right: '14px' }}>
                ยอดนิยม
              </div>
            )}

            <div className="package-top">
              <span className="package-icon">
                <Sun size={20} />
              </span>
              <span className="package-size" style={{ fontSize: '14px', fontWeight: '700' }}>
                {item.system_size_kw} kW
              </span>
            </div>

            <h2 style={{ fontSize: '16px', margin: '14px 0 6px' }}>{item.name}</h2>
            <p style={{ minHeight: '36px', fontSize: '11px', color: '#768474' }}>
              {item.description}
            </p>

            <div className="package-price" style={{ padding: '12px 0' }}>
              <small>ราคาติดตั้งเริ่มต้น</small>
              <strong style={{ fontSize: '24px' }}>
                <Money value={item.price} />
              </strong>
            </div>

            {/* Equipment details */}
            <div
              style={{
                background: '#f8faf5',
                padding: '8px 10px',
                borderRadius: '6px',
                fontSize: '10px',
                color: '#495a46',
                margin: '10px 0',
              }}
            >
              <div>
                <strong>อินเวอร์เตอร์:</strong> {item.inverter_brand || 'Huawei'}
              </div>
              <div style={{ marginTop: '3px' }}>
                <strong>แผงโซลาร์:</strong> {item.panel_brand || 'LONGi Tier-1'}
              </div>
            </div>

            {/* Feature tags */}
            <ul style={{ flex: 1, padding: '5px 0' }}>
              {(item.features || []).slice(0, 4).map((f) => (
                <li key={f} style={{ fontSize: '10px' }}>
                  <Check size={14} color="#587b45" /> {f}
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button
                type="button"
                className="button button-outline"
                style={{ flex: 1, padding: '7px 10px', fontSize: '10px' }}
                onClick={() =>
                  setFormModal({
                    ...item,
                    features: Array.isArray(item.features)
                      ? item.features.join('\n')
                      : item.features,
                  })
                }
              >
                <Edit3 size={13} /> แก้ไขแพ็กเกจ
              </button>
              <button
                type="button"
                className="icon-action"
                title="ลบแพ็กเกจ"
                onClick={() => {
                  if (confirm(`ต้องการลบแพ็กเกจ "${item.name}" หรือไม่?`)) {
                    onDeletePackage(item.id);
                    if (setToast) setToast('ลบแพ็กเกจเรียบร้อยแล้ว');
                  }
                }}
              >
                <Trash2 size={14} color="#9c3b31" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Package Form Modal */}
      {formModal && (
        <div
          className="admin-form-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setFormModal(null);
          }}
        >
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <div>
                <h2>{formModal.id ? 'แก้ไขแพ็กเกจติดตั้ง' : 'เพิ่มแพ็กเกจติดตั้งใหม่'}</h2>
                <p>กำหนดรายละเอียดระบบโซลาร์เซลล์ อุปกรณ์ และราคาสำหรับลูกค้า</p>
              </div>
              <button
                type="button"
                className="icon-action"
                onClick={() => setFormModal(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="admin-form-grid">
                <label>
                  ชื่อแพ็กเกจ *
                  <input
                    type="text"
                    required
                    value={formModal.name}
                    onChange={(e) => setFormModal({ ...formModal, name: e.target.value })}
                    placeholder="เช่น แพ็กเกจยอดนิยม 5 kW"
                  />
                </label>

                <label>
                  ขนาดระบบ (kW) *
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={formModal.system_size_kw}
                    onChange={(e) =>
                      setFormModal({ ...formModal, system_size_kw: e.target.value })
                    }
                    placeholder="เช่น 5.0"
                  />
                </label>

                <label>
                  ราคาแพ็กเกจ (บาท) *
                  <input
                    type="number"
                    min="0"
                    required
                    value={formModal.price}
                    onChange={(e) => setFormModal({ ...formModal, price: e.target.value })}
                    placeholder="เช่น 149000"
                  />
                </label>

                <label>
                  แบรนด์ / รุ่น อินเวอร์เตอร์
                  <input
                    type="text"
                    value={formModal.inverter_brand || ''}
                    onChange={(e) =>
                      setFormModal({ ...formModal, inverter_brand: e.target.value })
                    }
                    placeholder="เช่น Huawei SUN2000-5KTL"
                  />
                </label>

                <label className="full-width">
                  แบรนด์ / สเปก แผงโซลาร์เซลล์ที่ใช้
                  <input
                    type="text"
                    value={formModal.panel_brand || ''}
                    onChange={(e) =>
                      setFormModal({ ...formModal, panel_brand: e.target.value })
                    }
                    placeholder="เช่น LONGi Hi-MO 6 580W (10 แผง)"
                  />
                </label>

                <label className="full-width">
                  คำอธิบายแพ็กเกจ
                  <textarea
                    rows="2"
                    value={formModal.description || ''}
                    onChange={(e) =>
                      setFormModal({ ...formModal, description: e.target.value })
                    }
                    placeholder="เหมาะสำหรับบ้านขนาดใด ช่วยประหยัดค่าไฟเท่าไหร่..."
                  />
                </label>

                <label className="full-width">
                  รายการคุณสมบัติ / อุปกรณ์ในชุด (1 บรรทัดต่อ 1 ข้อ)
                  <textarea
                    rows="4"
                    value={formModal.features || ''}
                    onChange={(e) =>
                      setFormModal({ ...formModal, features: e.target.value })
                    }
                    placeholder="แผงโซลาร์เซลล์ 10 แผง 580W&#10;อินเวอร์เตอร์ Huawei 5 kW&#10;รับประกันงานติดตั้ง 5 ปี"
                  />
                </label>

                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={Boolean(formModal.popular)}
                    onChange={(e) =>
                      setFormModal({ ...formModal, popular: e.target.checked })
                    }
                  />
                  ติดป้าย "ยอดนิยม" (Popular)
                </label>

                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={Boolean(formModal.is_active)}
                    onChange={(e) =>
                      setFormModal({ ...formModal, is_active: e.target.checked })
                    }
                  />
                  เปิดใช้งานและแสดงบนเว็บไซต์
                </label>
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setFormModal(null)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="button button-green">
                  บันทึกแพ็กเกจ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
