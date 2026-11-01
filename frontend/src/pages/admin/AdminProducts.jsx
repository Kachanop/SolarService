import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Plus,
  Trash2,
  Edit3,
  Download,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Tag,
  DollarSign,
  Boxes,
} from 'lucide-react';
import { Money } from '../../components/Shared.jsx';

export default function AdminProducts({ products, onSaveProduct, onDeleteProduct, setToast }) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [formModal, setFormModal] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const categories = ['แผงโซลาร์เซลล์', 'อินเวอร์เตอร์', 'แบตเตอรี่', 'อุปกรณ์ติดตั้ง'];

  const filtered = useMemo(() => {
    return (products || []).filter((p) => {
      const matchSearch =
        !search ||
        `${p.name} ${p.sku || ''} ${p.slug || ''} ${p.category || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchCat = !filterCategory || p.category === filterCategory;
      let matchStock = true;
      if (filterStock === 'out') matchStock = Number(p.stock_quantity) <= 0;
      else if (filterStock === 'low') matchStock = Number(p.stock_quantity) > 0 && Number(p.stock_quantity) < 10;
      else if (filterStock === 'in') matchStock = Number(p.stock_quantity) >= 10;
      return matchSearch && matchCat && matchStock;
    });
  }, [products, search, filterCategory, filterStock]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleSave(e) {
    e.preventDefault();
    if (!formModal.name || !formModal.price) {
      alert('กรุณากรอกชื่อสินค้าและราคาขาย');
      return;
    }
    onSaveProduct(formModal);
    setFormModal(null);
    if (setToast) {
      setToast(formModal.id ? 'แก้ไขข้อมูลสินค้าเรียบร้อยแล้ว' : 'เพิ่มสินค้าใหม่ลงระบบเรียบร้อยแล้ว');
    }
  }

  function handleDelete(id, name) {
    if (confirm(`คุณต้องการลบสินค้า "${name}" ออกจากระบบหรือไม่?`)) {
      onDeleteProduct(id);
      if (setToast) setToast('ลบสินค้าเรียบร้อยแล้ว');
    }
  }

  function exportCSV() {
    const headers = ['รหัสสินค้า (SKU)', 'ชื่อสินค้า', 'หมวดหมู่', 'ราคาขาย (บาท)', 'ราคาเดิม (บาท)', 'จำนวนสต็อก', 'สถานะการเผยแพร่'];
    const rows = filtered.map((p) => [
      `"${p.sku || p.slug || ''}"`,
      `"${p.name}"`,
      `"${p.category}"`,
      p.price,
      p.compare_at_price || '',
      p.stock_quantity ?? 0,
      p.is_active ? 'เผยแพร่' : 'ซ่อน',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SolarService_Products_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="admin-products-view">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span style={{ background: '#eaf4e6', color: '#447233' }}><Package size={16} /></span>
          <small>สินค้าทั้งหมด</small>
          <strong>{(products || []).length} รายการ</strong>
          <span style={{ fontSize: '9px', color: '#687766' }}>ในระบบสต็อก</span>
        </div>
        <div className="stat-card">
          <span style={{ background: '#eaf1f8', color: '#33628e' }}><CheckCircle size={16} /></span>
          <small>สินค้าพร้อมจำหน่าย</small>
          <strong>{(products || []).filter((p) => (p.stock_quantity ?? 0) >= 10 && p.is_active).length} รายการ</strong>
          <span style={{ fontSize: '9px', color: '#587b45' }}>สต็อกปกติ</span>
        </div>
        <div className="stat-card">
          <span style={{ background: '#fff5e6', color: '#b5791a' }}><AlertTriangle size={16} /></span>
          <small>สต็อกใกล้หมด (&lt;10 ชิ้น)</small>
          <strong style={{ color: (products || []).filter((p) => (p.stock_quantity ?? 0) < 10).length > 0 ? '#b5791a' : '#334832' }}>
            {(products || []).filter((p) => (p.stock_quantity ?? 0) < 10).length} รายการ
          </strong>
          <span style={{ fontSize: '9px', color: '#b5791a' }}>ควรสั่งซื้อเพิ่ม</span>
        </div>
        <div className="stat-card">
          <span style={{ background: '#f5ebfa', color: '#6a3692' }}><Boxes size={16} /></span>
          <small>หมวดหมู่อุปกรณ์</small>
          <strong>{categories.length} หมวด</strong>
          <span style={{ fontSize: '9px', color: '#687766' }}>แผง / อินเวอร์เตอร์ / แบต</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar" style={{ marginTop: '16px' }}>
        <div className="admin-toolbar-left">
          <div className="admin-search-box">
            <Search size={14} color="#788775" />
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้า, SKU, หมวดหมู่..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="admin-filter-select"
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">ทุกหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="admin-filter-select"
            value={filterStock}
            onChange={(e) => {
              setFilterStock(e.target.value);
              setPage(1);
            }}
          >
            <option value="">ทุกสถานะสต็อก</option>
            <option value="in">สต็อกพร้อม (&gt;= 10)</option>
            <option value="low">สต็อกใกล้หมด (&lt; 10)</option>
            <option value="out">สินค้าหมดสต็อก (0)</option>
          </select>
        </div>

        <div className="admin-toolbar-right">
          <button
            type="button"
            className="button button-outline small-button"
            onClick={exportCSV}
          >
            <Download size={14} /> ส่งออก CSV
          </button>
          <button
            type="button"
            className="button button-dark small-button"
            onClick={() =>
              setFormModal({
                name: '',
                slug: '',
                category: 'แผงโซลาร์เซลล์',
                sku: '',
                price: '',
                compare_at_price: '',
                stock_quantity: 10,
                image_url: '',
                description: '',
                is_active: true,
              })
            }
          >
            <Plus size={14} /> เพิ่มสินค้าใหม่
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-table">
        <div
          className="admin-table-head"
          style={{ gridTemplateColumns: 'minmax(220px, 2fr) minmax(110px, 1fr) minmax(110px, 1fr) minmax(120px, 1fr) minmax(90px, 0.8fr) minmax(110px, 1fr)' }}
        >
          <span>สินค้า & SKU</span>
          <span>หมวดหมู่</span>
          <span>ราคาขาย</span>
          <span>สต็อกคงเหลือ</span>
          <span>การเผยแพร่</span>
          <span>การจัดการ</span>
        </div>

        {paginated.length ? (
          paginated.map((p) => {
            const stock = p.stock_quantity ?? 0;
            const stockTone = stock <= 0 ? 'red' : stock < 10 ? 'yellow' : 'green';
            return (
              <div
                key={p.id}
                className="admin-table-row"
                style={{ gridTemplateColumns: 'minmax(220px, 2fr) minmax(110px, 1fr) minmax(110px, 1fr) minmax(120px, 1fr) minmax(90px, 0.8fr) minmax(110px, 1fr)' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #dce4d7' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '6px',
                          background: '#f2f6ee',
                          color: '#557945',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: '11px',
                          fontWeight: '700',
                        }}
                      >
                        <Package size={18} />
                      </div>
                    )}
                    <div>
                      <strong>{p.name}</strong>
                      <small style={{ color: '#7c8b7a', fontSize: '10px' }}>
                        SKU: {p.sku || p.slug || '—'}
                      </small>
                    </div>
                  </div>
                </div>

                <span>{p.category}</span>

                <div>
                  <strong style={{ color: '#274b1c' }}><Money value={p.price} /></strong>
                  {p.compare_at_price && (
                    <small style={{ textDecoration: 'line-through', color: '#9da89a', display: 'block' }}>
                      <Money value={p.compare_at_price} />
                    </small>
                  )}
                </div>

                <div>
                  <span className={`status-pill ${stockTone}`}>
                    {stock <= 0 ? 'หมดสต็อก' : `คงเหลือ: ${stock} ชิ้น`}
                  </span>
                </div>

                <div>
                  <span className={`status-pill ${p.is_active ? 'green' : 'gray'}`}>
                    {p.is_active ? 'เผยแพร่' : 'ซ่อน'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="button button-outline small-button"
                    onClick={() => setFormModal({ ...p })}
                    title="แก้ไขสินค้า"
                  >
                    <Edit3 size={12} /> แก้ไข
                  </button>
                  <button
                    type="button"
                    className="icon-action"
                    onClick={() => handleDelete(p.id, p.name)}
                    title="ลบสินค้า"
                  >
                    <Trash2 size={13} color="#9a3e35" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="admin-empty">ไม่พบข้อมูลสินค้าที่ตรงกับเงื่อนไขการค้นหา</p>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="admin-pagination">
          <span>
            แสดง {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} จากทั้งหมด {filtered.length} รายการ
          </span>
          <div className="admin-pagination-controls">
            <button
              type="button"
              className="admin-page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={`admin-page-btn ${page === p ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className="admin-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {formModal && (
        <div
          className="admin-form-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setFormModal(null);
          }}
        >
          <form className="admin-product-form" onSubmit={handleSave}>
            <div className="workspace-section-heading">
              <div>
                <h2>{formModal.id ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าและอุปกรณ์ใหม่'}</h2>
                <p>บันทึกข้อมูลลงฐานข้อมูลและเชื่อมต่อกับหน้าร้าน SolarService</p>
              </div>
              <button
                type="button"
                className="icon-action"
                onClick={() => setFormModal(null)}
              >
                ×
              </button>
            </div>

            <div className="admin-form-grid">
              <label>
                ชื่อสินค้า *
                <input
                  type="text"
                  required
                  value={formModal.name || ''}
                  onChange={(e) => setFormModal({ ...formModal, name: e.target.value })}
                  placeholder="เช่น แผงโซลาร์เซลล์ LONGi Hi-MO 6 580W"
                />
              </label>

              <label>
                Slug (URL ที่ไม่ซ้ำ) *
                <input
                  type="text"
                  required
                  value={formModal.slug || ''}
                  onChange={(e) => setFormModal({ ...formModal, slug: e.target.value })}
                  placeholder="longi-himo-6-580w"
                />
              </label>

              <label>
                หมวดหมู่สินค้า *
                <select
                  className="admin-filter-select"
                  value={formModal.category || 'แผงโซลาร์เซลล์'}
                  onChange={(e) => setFormModal({ ...formModal, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label>
                รหัสสินค้า (SKU)
                <input
                  type="text"
                  value={formModal.sku || ''}
                  onChange={(e) => setFormModal({ ...formModal, sku: e.target.value })}
                  placeholder="SKU-LG-580W"
                />
              </label>

              <label>
                ราคาขาย (บาท) *
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formModal.price ?? ''}
                  onChange={(e) => setFormModal({ ...formModal, price: e.target.value })}
                  placeholder="4290"
                />
              </label>

              <label>
                ราคาเดิม / ราคาเปรียบเทียบ (บาท)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formModal.compare_at_price ?? ''}
                  onChange={(e) => setFormModal({ ...formModal, compare_at_price: e.target.value })}
                  placeholder="4890"
                />
              </label>

              <label>
                จำนวนสต็อกคงเหลือ (ชิ้น) *
                <input
                  type="number"
                  min="0"
                  required
                  value={formModal.stock_quantity ?? 0}
                  onChange={(e) => setFormModal({ ...formModal, stock_quantity: e.target.value })}
                />
              </label>

              <label>
                URL รูปภาพสินค้า
                <input
                  type="url"
                  value={formModal.image_url || ''}
                  onChange={(e) => setFormModal({ ...formModal, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </label>

              <label className="full-width">
                รายละเอียดและสเปกสินค้า
                <textarea
                  rows="3"
                  value={formModal.description || ''}
                  onChange={(e) => setFormModal({ ...formModal, description: e.target.value })}
                  placeholder="ข้อมูลจำเพาะ กำลังวัตต์ การรับประกัน..."
                />
              </label>

              <label className="admin-checkbox full-width">
                <input
                  type="checkbox"
                  checked={Boolean(formModal.is_active)}
                  onChange={(e) => setFormModal({ ...formModal, is_active: e.target.checked })}
                />
                เผยแพร่สินค้านี้บนหน้าเว็บและอนุญาตให้ลูกค้าสั่งซื้อ
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
                บันทึกสินค้า
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

