import React, { useEffect, useState } from 'react';
import { Download, Calendar, Filter, FileSpreadsheet, TrendingUp, DollarSign, Package, Wrench } from 'lucide-react';
import { Money } from '../../components/Shared.jsx';
import { adminService } from '../../services/adminService.js';

export default function AdminReports({ analyticsData, onExport }) {
  const [period, setPeriod] = useState('6m');
  const [reportData, setReportData] = useState(analyticsData);
  const [loading, setLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    let active = true;
    if (period === '6m') {
      setReportData(analyticsData);
      setReportError('');
      setLoading(false);
      return () => { active = false; };
    }

    setReportData(null);
    setReportError('');
    setLoading(true);
    adminService.getAnalytics(period)
      .then((data) => { if (active) setReportData(data); })
      .catch((error) => {
        if (active) setReportError(error?.message || 'โหลดรายงานไม่สำเร็จ');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [period, analyticsData]);

  const { monthlySales = [], breakdown, kpis } = reportData || {};

  function exportAccountingCSV() {
    if (!reportData) return;
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
              <option value="1m">เดือนนี้</option>
              <option value="3m">3 เดือนล่าสุด</option>
              <option value="6m">6 เดือนล่าสุด</option>
              <option value="1y">12 เดือนล่าสุด</option>
            </select>
          </div>
        </div>

        <div className="admin-toolbar-right">
          <button
            type="button"
            className="button button-green small-button"
            onClick={exportAccountingCSV}
            disabled={!reportData || loading}
          >
            <Download size={14} /> ดาวน์โหลดรายงานบัญชี (Excel / CSV)
          </button>
        </div>
      </div>

      {reportError ? (
        <div className="admin-message error" role="alert">{reportError}</div>
      ) : loading || !reportData ? (
        <div className="admin-loading">
          {period === '6m' && !analyticsData ? 'ไม่สามารถโหลดข้อมูลรายงานได้ โปรดตรวจสอบการเชื่อมต่อฐานข้อมูล' : 'กำลังโหลดข้อมูลรายงาน...'}
        </div>
      ) : (
      <>
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
          <span style={{ fontSize: '9px', color: '#567c46' }}>
            เฉลี่ย {(monthlySales.reduce((acc, cur) => acc + cur.installations, 0) / Math.max(monthlySales.length, 1)).toFixed(1)} งาน/เดือน
          </span>
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
                <strong>{item.month}</strong>
                <small>ข้อมูลจากระบบ</small>
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
      </>
      )}
    </div>
  );
}
