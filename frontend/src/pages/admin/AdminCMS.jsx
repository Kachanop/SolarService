import React, { useState } from 'react';
import {
  FileCode2,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Sun,
  BookOpen,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function AdminCMS({
  banners,
  articles,
  onSaveBanner,
  onDeleteBanner,
  onSaveArticle,
  onDeleteArticle,
  setToast,
}) {
  const [activeTab, setActiveTab] = useState('banners');
  const [bannerModal, setBannerModal] = useState(null);
  const [articleModal, setArticleModal] = useState(null);

  function handleSaveBanner(e) {
    e.preventDefault();
    onSaveBanner(bannerModal);
    setBannerModal(null);
    if (setToast) setToast('บันทึกข้อมูลแบนเนอร์เรียบร้อยแล้ว');
  }

  function handleSaveArticle(e) {
    e.preventDefault();
    onSaveArticle(articleModal);
    setArticleModal(null);
    if (setToast) setToast('บันทึกบทความเรียบร้อยแล้ว');
  }

  return (
    <div className="admin-cms-view">
      {/* Sub Tabs */}
      <div className="technician-tabs" style={{ marginBottom: '20px' }}>
        <button
          type="button"
          className={activeTab === 'banners' ? 'active' : ''}
          onClick={() => setActiveTab('banners')}
        >
          <Sun size={14} style={{ display: 'inline', marginRight: '5px' }} />
          แบนเนอร์และโปรโมชั่นหน้าแรก ({banners?.length || 0})
        </button>
        <button
          type="button"
          className={activeTab === 'articles' ? 'active' : ''}
          onClick={() => setActiveTab('articles')}
        >
          <BookOpen size={14} style={{ display: 'inline', marginRight: '5px' }} />
          บทความและสาระน่ารู้ ({articles?.length || 0})
        </button>
      </div>

      {/* Tab 1: Banners */}
      {activeTab === 'banners' && (
        <div>
          <div className="admin-toolbar">
            <div className="admin-toolbar-left">
              <span style={{ fontSize: '12px', color: '#576654' }}>
                จัดการแบนเนอร์โปรโมชั่นที่แสดงในหน้าแรกของ SolarService
              </span>
            </div>
            <div className="admin-toolbar-right">
              <button
                type="button"
                className="button button-dark small-button"
                onClick={() =>
                  setBannerModal({
                    title: '',
                    subtitle: '',
                    tag: 'โปรโมชั่นพิเศษ',
                    link_url: '/packages',
                    button_text: 'ดูแพ็กเกจติดตั้ง',
                    display_order: (banners?.length || 0) + 1,
                    is_active: true,
                  })
                }
              >
                <Plus size={14} /> เพิ่มแบนเนอร์ใหม่
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {(banners || []).map((b) => (
              <div
                key={b.id}
                style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #f7f9f5 0%, #edf3e8 100%)',
                  border: '1px solid #dbe4d5',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="eyebrow" style={{ color: '#587b45' }}>
                    {b.tag || 'แบนเนอร์โปรโมชั่น'}
                  </span>
                  <span className={`status-pill ${b.is_active ? 'green' : 'yellow'}`}>
                    {b.is_active ? 'แสดงผล' : 'ปิดการแสดง'}
                  </span>
                </div>

                <h3 style={{ margin: '4px 0', fontSize: '16px', color: '#253723' }}>
                  {b.title}
                </h3>
                <p style={{ margin: 0, fontSize: '11px', color: '#687766', lineHeight: '1.6' }}>
                  {b.subtitle}
                </p>

                <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#889585' }}>
                    ลิงก์: {b.link_url}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="icon-action"
                      onClick={() => setBannerModal({ ...b })}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      className="icon-action"
                      onClick={() => {
                        if (confirm(`ต้องการลบแบนเนอร์ "${b.title}" หรือไม่?`)) {
                          onDeleteBanner(b.id);
                          if (setToast) setToast('ลบแบนเนอร์เรียบร้อย');
                        }
                      }}
                    >
                      <Trash2 size={13} color="#9a3e35" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Articles */}
      {activeTab === 'articles' && (
        <div>
          <div className="admin-toolbar">
            <div className="admin-toolbar-left">
              <span style={{ fontSize: '12px', color: '#576654' }}>
                บทความสาระความรู้เกี่ยวกับโซลาร์เซลล์ การประหยัดไฟ และขั้นตอนการขออนุญาต
              </span>
            </div>
            <div className="admin-toolbar-right">
              <button
                type="button"
                className="button button-dark small-button"
                onClick={() =>
                  setArticleModal({
                    title: '',
                    slug: '',
                    category: 'ความรู้โซลาร์',
                    summary: '',
                    content: '',
                    is_published: true,
                  })
                }
              >
                <Plus size={14} /> เขียนบทความใหม่
              </button>
            </div>
          </div>

          <div className="admin-table">
            <div
              className="admin-table-head"
              style={{ gridTemplateColumns: 'minmax(220px, 2fr) minmax(110px, 1fr) minmax(90px, 0.8fr) minmax(90px, 0.8fr) 100px' }}
            >
              <span>ชื่อบทความ</span>
              <span>หมวดหมู่</span>
              <span>ยอดเข้าชม</span>
              <span>สถานะ</span>
              <span>จัดการ</span>
            </div>

            {(articles || []).map((art) => (
              <div
                key={art.id}
                className="admin-table-row"
                style={{ gridTemplateColumns: 'minmax(220px, 2fr) minmax(110px, 1fr) minmax(90px, 0.8fr) minmax(90px, 0.8fr) 100px' }}
              >
                <div>
                  <strong>{art.title}</strong>
                  <small>{art.summary?.slice(0, 70)}...</small>
                </div>

                <div>
                  <span className="status-pill blue">{art.category}</span>
                </div>

                <div>
                  <span>{(art.views_count || 0).toLocaleString()} ครั้ง</span>
                </div>

                <div>
                  <span className={`status-pill ${art.is_published ? 'green' : 'yellow'}`}>
                    {art.is_published ? 'เผยแพร่' : 'ฉบับร่าง'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="icon-action"
                    onClick={() => setArticleModal({ ...art })}
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    type="button"
                    className="icon-action"
                    onClick={() => {
                      if (confirm(`ต้องการลบบทความ "${art.title}" หรือไม่?`)) {
                        onDeleteArticle(art.id);
                        if (setToast) setToast('ลบบทความเรียบร้อย');
                      }
                    }}
                  >
                    <Trash2 size={13} color="#9a3e35" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Banner Modal */}
      {bannerModal && (
        <div
          className="admin-form-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setBannerModal(null);
          }}
        >
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <div>
                <h2>{bannerModal.id ? 'แก้ไขแบนเนอร์' : 'เพิ่มแบนเนอร์ใหม่'}</h2>
                <p>กำหนดข้อความและลิงก์สำหรับแบนเนอร์หน้าแรก</p>
              </div>
              <button
                type="button"
                className="icon-action"
                onClick={() => setBannerModal(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveBanner}>
              <div className="admin-form-grid">
                <label className="full-width">
                  หัวข้อหลัก (Title) *
                  <input
                    type="text"
                    required
                    value={bannerModal.title}
                    onChange={(e) => setBannerModal({ ...bannerModal, title: e.target.value })}
                    placeholder="เช่น ลดค่าไฟหน้าร้อน สูงสุด 70%"
                  />
                </label>

                <label className="full-width">
                  ข้อความรอง (Subtitle)
                  <textarea
                    rows="2"
                    value={bannerModal.subtitle}
                    onChange={(e) => setBannerModal({ ...bannerModal, subtitle: e.target.value })}
                    placeholder="รายละเอียดเพิ่มเติมของโปรโมชั่น..."
                  />
                </label>

                <label>
                  ป้ายกำกับ (Tag / Eyebrow)
                  <input
                    type="text"
                    value={bannerModal.tag}
                    onChange={(e) => setBannerModal({ ...bannerModal, tag: e.target.value })}
                    placeholder="เช่น โปรโมชั่นพิเศษ"
                  />
                </label>

                <label>
                  ลิงก์ปลายทาง (Link URL)
                  <input
                    type="text"
                    value={bannerModal.link_url}
                    onChange={(e) => setBannerModal({ ...bannerModal, link_url: e.target.value })}
                    placeholder="/packages"
                  />
                </label>

                <label className="admin-checkbox full-width">
                  <input
                    type="checkbox"
                    checked={Boolean(bannerModal.is_active)}
                    onChange={(e) => setBannerModal({ ...bannerModal, is_active: e.target.checked })}
                  />
                  เปิดใช้งานแบนเนอร์นี้
                </label>
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setBannerModal(null)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="button button-green">
                  บันทึกแบนเนอร์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Article Modal */}
      {articleModal && (
        <div
          className="admin-form-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setArticleModal(null);
          }}
        >
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <div>
                <h2>{articleModal.id ? 'แก้ไขบทความ' : 'เขียนบทความใหม่'}</h2>
                <p>สร้างและเผยแพร่สาระความรู้เกี่ยวกับระบบโซลาร์เซลล์</p>
              </div>
              <button
                type="button"
                className="icon-action"
                onClick={() => setArticleModal(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveArticle}>
              <div className="admin-form-grid">
                <label className="full-width">
                  ชื่อบทความ *
                  <input
                    type="text"
                    required
                    value={articleModal.title}
                    onChange={(e) => setArticleModal({ ...articleModal, title: e.target.value })}
                    placeholder="เช่น วิธีคำนวณขนาดโซลาร์เซลล์ให้เหมาะกับค่าไฟบ้าน"
                  />
                </label>

                <label>
                  หมวดหมู่ *
                  <select
                    className="admin-filter-select"
                    value={articleModal.category}
                    onChange={(e) => setArticleModal({ ...articleModal, category: e.target.value })}
                  >
                    <option value="ความรู้โซลาร์">ความรู้โซลาร์</option>
                    <option value="การดูแลรักษา">การดูแลรักษา</option>
                    <option value="กฎหมายและขั้นตอน">กฎหมายและขั้นตอน</option>
                    <option value="รีวิวและผลลัพธ์">รีวิวและผลลัพธ์</option>
                  </select>
                </label>

                <label>
                  URL Slug
                  <input
                    type="text"
                    value={articleModal.slug || ''}
                    onChange={(e) => setArticleModal({ ...articleModal, slug: e.target.value })}
                    placeholder="how-to-calculate-solar"
                  />
                </label>

                <label className="full-width">
                  บทสรุปย่อ (Summary)
                  <textarea
                    rows="2"
                    value={articleModal.summary || ''}
                    onChange={(e) => setArticleModal({ ...articleModal, summary: e.target.value })}
                    placeholder="สรุปเนื้อหา 2-3 บรรทัด..."
                  />
                </label>

                <label className="full-width">
                  เนื้อหาบทความฉบับเต็ม
                  <textarea
                    rows="6"
                    value={articleModal.content || ''}
                    onChange={(e) => setArticleModal({ ...articleModal, content: e.target.value })}
                    placeholder="พิมพ์เนื้อหาบทความ..."
                  />
                </label>

                <label className="admin-checkbox full-width">
                  <input
                    type="checkbox"
                    checked={Boolean(articleModal.is_published)}
                    onChange={(e) => setArticleModal({ ...articleModal, is_published: e.target.checked })}
                  />
                  เผยแพร่บทความให้บุคคลทั่วไปอ่านได้
                </label>
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setArticleModal(null)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="button button-green">
                  บันทึกบทความ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
