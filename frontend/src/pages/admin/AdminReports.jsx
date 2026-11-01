import React, { useState } from 'react';
import { Download, Calendar, Filter, FileSpreadsheet, TrendingUp, DollarSign, Package, Wrench } from 'lucide-react';
import { Money } from '../../components/Shared.jsx';

export default function AdminReports({ analyticsData, onExport }) {
  const [period, setPeriod] = useState('6m');

  if (!analyticsData) {
    return <div className="admin-loading">กำลังโหลดข้อมูลรายงาน...</div>;
  }

  const { monthlySales, breakdown, topSellingItems, kpis } = analyticsData;

  function exportAccountingCSV() {
    const headers = ['เดือน', 'ยอดขายสินค้า (บาท)', 'ยอดขายแพ็กเกจติดตั้ง (บาท)', 'ยอดขายรวม (บาท)', 'จำนวนงานติดตั้ง (งาน)'];
    const rows = monthlySales.map((m) => [
      m.month,
      m.productSales,
      m.packageSales,
      m.total,
      m.installations,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SolarService_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="admin-reports-view">
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={15} color="#587b45" />
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#384836' }}>ช่วงเวลาวิเคราะห์:</span>
            <select
              className="admin-filter-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="1m">เดือนปัจจุบัน (พฤศจิกายน 2569)</option>
              <option value="3m">3 เดือนล่าสุด</option>
              <option value="6m">6 เดือนล่าสุด (มิ.ย. - พ.ย. 2569)</option>
              <option value="1y">ปีนี้ (2569)</option>
            </select>
          </div>
        </div>

        <div className="admin-toolbar-right">
          <button
            type="button"
            className="button button-green small-button"
            onClick={exportAccountingCSV}
          >
            <Download size={14} /> ดาวน์โหลดรายงานบัญชี (Excel / CSV)
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <small>รายได้สะสมช่วงที่เลือก</small>
          <strong>฿ {breakdown.grandTotal.toLocaleString('th-TH')}</strong>
          <span style={{ fontSize: '9px', color: '#567c46' }}>ยอดรวมที่ชำระแล้ว</span>
        </div>
        <div className="stat-card">
          <small>สัดส่วนแพ็กเกจติดตั้ง</small>
          <strong>{breakdown.packagePct}%</strong>
          <span style={{ fontSize: '9px', color: '#567c46' }}>
            ฿ {breakdown.packageSales.toLocaleString('th-TH')}
          </span>
        </div>
        <div className="stat-card">
          <small>สัดส่วนซื้อสินค้า/อุปกรณ์</small>
          <strong>{breakdown.productPct}%</strong>
          <span style={{ fontSize: '9px', color: '#567c46' }}>
            ฿ {breakdown.productSales.toLocaleString('th-TH')}
          </span>
        </div>
        <div className="stat-card">
          <small>รวมงานติดตั้งที่เสร็จสมบูรณ์</small>
          <strong>
            {monthlySales.reduce((acc, cur) => acc + cur.installations, 0)} ไซต์งาน
          </strong>
          <span style={{ fontSize: '9px', color: '#567c46' }}>เฉลี่ย 4.5 งาน/เดือน</span>
        </div>
      </div>

      {/* Breakdown Table */}
      <div style={{ marginTop: '20px' }}>
        <div className="workspace-section-heading">
          <div>
            <h2>ตารางสรุปรายได้และผลการดำเนินงานรายเดือน</h2>
            <p>ข้อมูลจำแนกประเภทเพื่อใช้ทำบัญชีและวางแผนการตลาด</p>
          </div>
        </div>

        <div className="admin-table">
          <div
            className="admin-table-head"
            style={{ gridTemplateColumns: 'minmax(100px, 1fr) repeat(4, minmax(130px, 1.2fr))' }}
          >
            <span>เดือน</span>
            <span>ยอดขายสินค้าอุปกรณ์</span>
            <span>ยอดขายแพ็กเกจติดตั้ง</span>
            <span>ยอดขายรวมสุทธิ</span>
            <span>งานติดตั้งสำเร็จ</span>
          </div>

          {monthlySales.map((item) => (
            <div
              key={item.month}
              className="admin-table-row"
              style={{ gridTemplateColumns: 'minmax(100px, 1fr) repeat(4, minmax(130px, 1.2fr))' }}
            >
              <div>
                <strong>{item.month} 2569</strong>
                <small>ปีบัญชีปัจจุบัน</small>
              </div>
              <div>
                <Money value={item.productSales} />
              </div>
              <div>
                <Money value={item.packageSales} />
              </div>
              <div>
                <strong style={{ color: '#2f6920' }}>
                  <Money value={item.total} />
                </strong>
              </div>
              <div>
                <span className="status-pill green">{item.installations} งานเสร็จสิ้น</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
