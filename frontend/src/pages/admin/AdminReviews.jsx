import React, { useState, useMemo } from 'react';
import {
  Star,
  Search,
  Filter,
  CheckCircle,
  EyeOff,
  Eye,
  Trash2,
  ThumbsUp,
} from 'lucide-react';

export default function AdminReviews({ reviews, onTogglePublish, onDeleteReview, setToast }) {
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = useMemo(() => {
    return (reviews || []).filter((r) => {
      const matchSearch =
        !search ||
        `${r.customer_name} ${r.comment} ${r.installation_number || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchRating = !filterRating || r.rating === Number(filterRating);
      const matchStatus =
        !filterStatus ||
        (filterStatus === 'published' ? r.is_published : !r.is_published);
      return matchSearch && matchRating && matchStatus;
    });
  }, [reviews, search, filterRating, filterStatus]);

  function handleToggle(item) {
    const nextState = !item.is_published;
    onTogglePublish(item.id, nextState);
    if (setToast) {
      setToast(nextState ? 'เผยแพร่รีวิวขึ้นหน้าเว็บเรียบร้อยแล้ว' : 'ซ่อนรีวิวจากหน้าเว็บเรียบร้อยแล้ว');
    }
  }

  function handleDelete(item) {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรีวิวนี้?')) {
      onDeleteReview(item.id);
      if (setToast) setToast('ลบรีวิวเรียบร้อยแล้ว');
    }
  }

  return (
    <div className="admin-reviews-view">
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <div className="admin-search-box">
            <Search size={14} color="#788775" />
            <input
              type="text"
              placeholder="ค้นหาชื่อลูกค้า, ข้อความรีวิว..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="admin-filter-select"
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
          >
            <option value="">ทุกคะแนนดาว</option>
            <option value="5">★★★★★ (5 ดาว)</option>
            <option value="4">★★★★☆ (4 ดาว)</option>
            <option value="3">★★★☆☆ (3 ดาว)</option>
            <option value="2">★★☆☆☆ (2 ดาว)</option>
            <option value="1">★☆☆☆☆ (1 ดาว)</option>
          </select>

          <select
            className="admin-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">ทุกสถานะ</option>
            <option value="published">เผยแพร่แล้ว (Public)</option>
            <option value="hidden">ซ่อนอยู่ (Hidden / Pending)</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="admin-table">
        <div
          className="admin-table-head"
          style={{ gridTemplateColumns: 'minmax(120px, 1fr) minmax(100px, 0.8fr) minmax(240px, 2fr) minmax(90px, 0.7fr) minmax(130px, 1fr)' }}
        >
          <span>ลูกค้า / งานที่ติดตั้ง</span>
          <span>คะแนนรีวิว</span>
          <span>ข้อคิดเห็นและประสบการณ์</span>
          <span>สถานะ</span>
          <span>การจัดการ</span>
        </div>

        {filtered.length ? (
          filtered.map((item) => (
            <div
              key={item.id}
              className="admin-table-row"
              style={{ gridTemplateColumns: 'minmax(120px, 1fr) minmax(100px, 0.8fr) minmax(240px, 2fr) minmax(90px, 0.7fr) minmax(130px, 1fr)' }}
            >
              <div>
                <strong>{item.customer_name}</strong>
                <small>{item.installation_number || 'งานติดตั้งโซลาร์'}</small>
              </div>

              <div>
                <span style={{ color: '#d2a73e', fontSize: '13px', letterSpacing: '1px' }}>
                  {'★'.repeat(item.rating)}
                  {'☆'.repeat(5 - item.rating)}
                </span>
                <small style={{ color: '#778474' }}>{item.rating} / 5 คะแนน</small>
              </div>

              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#2d3d2c', lineHeight: '1.6' }}>
                  "{item.comment}"
                </p>
                <small style={{ color: '#889485', marginTop: '3px', display: 'block' }}>
                  {new Date(item.created_at).toLocaleDateString('th-TH')}
                </small>
              </div>

              <div>
                <span className={`status-pill ${item.is_published ? 'green' : 'yellow'}`}>
                  {item.is_published ? 'เผยแพร่แล้ว' : 'ซ่อนอยู่'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  type="button"
                  className={`button ${item.is_published ? 'button-outline' : 'button-green'} small-button`}
                  style={{ padding: '6px 10px', fontSize: '10px' }}
                  onClick={() => handleToggle(item)}
                >
                  {item.is_published ? (
                    <>
                      <EyeOff size={13} /> ซ่อนรีวิว
                    </>
                  ) : (
                    <>
                      <Eye size={13} /> อนุมัติเผยแพร่
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="icon-action"
                  title="ลบรีวิว"
                  onClick={() => handleDelete(item)}
                >
                  <Trash2 size={14} color="#9a3e35" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="admin-empty">ไม่พบรีวิวที่ตรงกับเงื่อนไข</p>
        )}
      </div>
    </div>
  );
}
