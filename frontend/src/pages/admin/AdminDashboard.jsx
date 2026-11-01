import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  ShoppingBag,
  ShieldCheck,
  Wrench,
  Download,
  LifeBuoy,
  BellRing,
  ArrowRight,
  Package,
  Layers,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';

export default function AdminDashboard({ analyticsData, navigate, onExport }) {
  const [hoveredMonth, setHoveredMonth] = useState(null);

  if (!analyticsData) {
    return <div className="admin-loading">กำลังประมวลผลข้อมูลสถิติ...</div>;
  }

  const { monthlySales, breakdown, topSellingItems, kpis } = analyticsData;

  // SVG Chart Dimensions
  const chartHeight = 180;
  const chartWidth = 540;
  const paddingX = 40;
  const paddingY = 25;
  const plotWidth = chartWidth - paddingX * 2;
  const plotHeight = chartHeight - paddingY * 2;

  const maxTotal = Math.max(...monthlySales.map((m) => m.total), 1500000);

  // Compute points for SVG curve
  const points = monthlySales.map((item, idx) => {
    const x = paddingX + (idx / (monthlySales.length - 1)) * plotWidth;
    const y = chartHeight - paddingY - (item.total / maxTotal) * plotHeight;
    return { ...item, x, y };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[idx - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  // Donut chart calculation
  const donutRadius = 50;
  const circumference = 2 * Math.PI * donutRadius;
  const packageStroke = (breakdown.packagePct / 100) * circumference;
  const productStroke = (breakdown.productPct / 100) * circumference;

  return (
    <div className="admin-dashboard-view">
      {/* KPI Cards Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <span style={{ background: '#eaf4e6', color: '#447233' }}>
            <TrendingUp size={16} />
          </span>
          <small>ยอดขายรวมเดือนนี้</small>
          <strong>฿ {kpis.monthlyRevenue.toLocaleString('th-TH')}</strong>
          <span style={{ fontSize: '9px', color: '#527c42', marginTop: '3px' }}>
            ▲ +18.4% จากเดือนก่อน
          </span>
        </div>

        <div className="stat-card">
          <span style={{ background: '#eaf1f8', color: '#33628e' }}>
            <Wrench size={16} />
          </span>
          <small>งานติดตั้งสำเร็จเดือนนี้</small>
          <strong>{kpis.completedJobsMonth} ไซต์งาน</strong>
          <span style={{ fontSize: '9px', color: '#687766', marginTop: '3px' }}>
            ครบ 100% ตามกำหนด
          </span>
        </div>

        <div className="stat-card">
          <span style={{ background: '#f5ebfa', color: '#6a3692' }}>
            <ShieldCheck size={16} />
          </span>
          <small>อุปกรณ์ในระบบรับประกัน</small>
          <strong>{kpis.activeWarranties} รายการ</strong>
          <span style={{ fontSize: '9px', color: '#687766', marginTop: '3px' }}>
            ทะเบียน Serial No. ครบถ้วน
          </span>
        </div>

        <div className="stat-card">
          <span style={{ background: '#fff1ee', color: '#a03b30' }}>
            <CreditCard size={16} />
          </span>
          <small>สลิปรอตรวจสอบ</small>
          <strong style={{ color: kpis.pendingPayments > 0 ? '#b23727' : '#334832' }}>
            {kpis.pendingPayments} รายการ
          </strong>
          <button
            type="button"
            onClick={() => navigate('/manage-payments')}
            style={{ border: 0, background: 'none', color: '#587b45', fontSize: '9px', cursor: 'pointer', textAlign: 'left', padding: 0 }}
          >
            ตรวจสลิปทันที →
          </button>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="admin-charts-grid">
        {/* Chart 1: Sales Trend */}
        <div className="admin-chart-card">
          <div className="admin-chart-header">
            <div>
              <h3>📈 กราฟแสดงยอดขายและการเติบโต (Sales Revenue Trend)</h3>
              <p>ยอดขายอุปกรณ์และแพ็กเกจติดตั้งย้อนหลัง 6 เดือน</p>
            </div>
            <div className="chart-legend">
              <span>
                <i className="legend-dot" style={{ background: '#587b45' }} /> ยอดขายรวม (บาท)
              </span>
            </div>
          </div>

          <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            >
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#689352" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#689352" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = chartHeight - paddingY - ratio * plotHeight;
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#edf2e9"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 6}
                      y={y + 3}
                      fontSize="8"
                      fill="#8ea08c"
                      textAnchor="end"
                    >
                      {(Math.round((maxTotal * ratio) / 100000) * 10).toLocaleString()}k
                    </text>
                  </g>
                );
              })}

              {/* Area & Line */}
              <path d={areaD} fill="url(#salesGrad)" />
              <path d={pathD} fill="none" stroke="#587b45" strokeWidth="2.5" />

              {/* Points */}
              {points.map((pt, idx) => (
                <g
                  key={pt.month}
                  onMouseEnter={() => setHoveredMonth(pt)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredMonth?.month === pt.month ? 6 : 4}
                    fill="#ffffff"
                    stroke="#436832"
                    strokeWidth="2.5"
                  />
                  <text
                    x={pt.x}
                    y={chartHeight - 6}
                    fontSize="9"
                    fontWeight="500"
                    fill="#6c7a6a"
                    textAnchor="middle"
                  >
                    {pt.month}
                  </text>
                </g>
              ))}
            </svg>

            {hoveredMonth && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '15px',
                  background: 'rgba(32,45,34,0.95)',
                  color: '#ffffff',
                  padding: '7px 11px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  lineHeight: '1.5',
                  pointerEvents: 'none',
                }}
              >
                <strong>เดือน {hoveredMonth.month}</strong>
                <div>ยอดรวม: ฿ {hoveredMonth.total.toLocaleString('th-TH')}</div>
                <small style={{ color: '#c7e0be' }}>
                  แพ็กเกจ: ฿ {hoveredMonth.packageSales.toLocaleString('th-TH')} | สินค้า: ฿{' '}
                  {hoveredMonth.productSales.toLocaleString('th-TH')}
                </small>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Product vs Package Ratio Donut */}
        <div className="admin-chart-card">
          <div className="admin-chart-header">
            <div>
              <h3>สัดส่วนลูกค้า (Product vs Package)</h3>
              <p>ยอดขายอุปกรณ์ vs แพ็กเกจติดตั้ง</p>
            </div>
          </div>

          <div className="admin-donut-container">
            <div className="donut-svg-wrap">
              <svg width="130" height="130" viewBox="0 0 130 130">
                <circle
                  cx="65"
                  cy="65"
                  r={donutRadius}
                  fill="transparent"
                  stroke="#e8ede4"
                  strokeWidth="16"
                />
                {/* Package segment */}
                <circle
                  cx="65"
                  cy="65"
                  r={donutRadius}
                  fill="transparent"
                  stroke="#587b45"
                  strokeWidth="16"
                  strokeDasharray={`${packageStroke} ${circumference}`}
                  strokeDashoffset="0"
                  transform="rotate(-90 65 65)"
                  strokeLinecap="round"
                />
                {/* Product segment */}
                <circle
                  cx="65"
                  cy="65"
                  r={donutRadius}
                  fill="transparent"
                  stroke="#89b275"
                  strokeWidth="16"
                  strokeDasharray={`${productStroke} ${circumference}`}
                  strokeDashoffset={-packageStroke}
                  transform="rotate(-90 65 65)"
                  strokeLinecap="round"
                />
              </svg>
              <div className="donut-center-text">
                <strong>{breakdown.packagePct}%</strong>
                <small>แพ็กเกจติดตั้ง</small>
              </div>
            </div>

            <div className="donut-stats-list">
              <div className="donut-stat-row">
                <span>
                  <i className="legend-dot" style={{ background: '#587b45' }} /> แพ็กเกจติดตั้งครบวงจร
                </span>
                <strong>
                  ฿ {breakdown.packageSales.toLocaleString('th-TH')}{' '}
                  <span style={{ fontSize: '10px', color: '#687766' }}>({breakdown.packagePct}%)</span>
                </strong>
              </div>
              <div className="donut-stat-row">
                <span>
                  <i className="legend-dot" style={{ background: '#89b275' }} /> ซื้อสินค้าและอุปกรณ์
                </span>
                <strong>
                  ฿ {breakdown.productSales.toLocaleString('th-TH')}{' '}
                  <span style={{ fontSize: '10px', color: '#687766' }}>({breakdown.productPct}%)</span>
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Monthly Installations & Top Selling Leaderboard */}
      <div className="admin-charts-grid" style={{ marginTop: '0' }}>
        {/* Monthly Completed Installations */}
        <div className="admin-chart-card">
          <div className="admin-chart-header">
            <div>
              <h3>🔨 จำนวนงานติดตั้งที่สำเร็จในแต่ละเดือน</h3>
              <p>ประสิทธิภาพทีมช่าง SolarService ย้อนหลัง 6 เดือน</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '18px', height: '140px', padding: '10px 10px 0' }}>
            {monthlySales.map((item) => {
              const maxJobs = 10;
              const barHeightPct = Math.round((item.installations / maxJobs) * 100);
              return (
                <div
                  key={item.month}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#38532f' }}>
                    {item.installations} งาน
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: `${barHeightPct}%`,
                      background: 'linear-gradient(180deg, #60884d 0%, #3e5e30 100%)',
                      borderRadius: '5px 5px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                  />
                  <span style={{ fontSize: '10px', color: '#6b7a69' }}>{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Selling Products / Packages */}
        <div className="admin-chart-card">
          <div className="admin-chart-header">
            <div>
              <h3>⭐ สินค้าและแพ็กเกจที่ขายดีที่สุด (Top Sellers)</h3>
              <p>เรียงตามมูลค่ายอดขายสะสม</p>
            </div>
          </div>

          <div className="admin-leaderboard">
            {topSellingItems.map((item, index) => (
              <div className="leaderboard-item" key={item.name}>
                <div className="leaderboard-top">
                  <div className="leaderboard-name">
                    <span className="leaderboard-rank">{index + 1}</span>
                    <span>{item.name}</span>
                    <span className={`status-pill ${item.type === 'แพ็กเกจ' ? 'green' : 'blue'}`}>
                      {item.type}
                    </span>
                  </div>
                  <strong>฿ {item.revenue.toLocaleString('th-TH')}</strong>
                </div>
                <div className="leaderboard-progress-bg">
                  <div
                    className="leaderboard-progress-fill"
                    style={{ width: `${item.pct * 2}%` }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#798777' }}>
                  <span>ขายได้ {item.units} ชุด/ชิ้น</span>
                  <span>{item.pct}% ของยอดขาย</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div style={{ marginTop: '20px' }}>
        <div className="workspace-section-heading">
          <div>
            <h2>ศูนย์สั่งการและจัดการระบบ (Quick Management Hub)</h2>
            <p>เข้าสู่ฟังก์ชันการทำงานหลักของ SolarService</p>
          </div>
          <button
            type="button"
            className="button button-outline small-button"
            onClick={onExport}
          >
            <Download size={14} /> ดาวน์โหลดรายงานสถิติ (Excel/CSV)
          </button>
        </div>

        <div className="quick-actions" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <button type="button" onClick={() => navigate('/manage-products')}>
            <span style={{ background: '#eaf3e5', color: '#4d753b' }}>
              <Package size={16} />
            </span>
            <strong>จัดการสินค้า & สต็อก</strong>
            <ArrowRight size={14} />
          </button>

          <button type="button" onClick={() => navigate('/manage-packages')}>
            <span style={{ background: '#eaf1fa', color: '#33618f' }}>
              <Layers size={16} />
            </span>
            <strong>จัดการแพ็กเกจติดตั้ง</strong>
            <ArrowRight size={14} />
          </button>

          <button type="button" onClick={() => navigate('/warranties')}>
            <span style={{ background: '#f5ebfa', color: '#6e3798' }}>
              <ShieldCheck size={16} />
            </span>
            <strong>ทะเบียนรับประกัน (SN)</strong>
            <ArrowRight size={14} />
          </button>

          <button type="button" onClick={() => navigate('/maintenance')}>
            <span style={{ background: '#fef7e6', color: '#9a7027' }}>
              <BellRing size={16} />
            </span>
            <strong>แจ้งเตือนล้างแผง ({kpis.pendingMaintenance})</strong>
            <ArrowRight size={14} />
          </button>

          <button type="button" onClick={() => navigate('/tickets')}>
            <span style={{ background: '#fdf0ed', color: '#a33b30' }}>
              <LifeBuoy size={16} />
            </span>
            <strong>ระบบแจ้งซ่อม Tickets</strong>
            <ArrowRight size={14} />
          </button>

          <button type="button" onClick={() => navigate('/manage-payments')}>
            <span style={{ background: '#eaf4ea', color: '#406f36' }}>
              <CreditCard size={16} />
            </span>
            <strong>ตรวจสอบสลิปโอนเงิน</strong>
            <ArrowRight size={14} />
          </button>

          <button type="button" onClick={() => navigate('/manage-users')}>
            <span style={{ background: '#f2f4ef', color: '#4a5747' }}>
              <ShieldCheck size={16} />
            </span>
            <strong>CRM ข้อมูลลูกค้า 360°</strong>
            <ArrowRight size={14} />
          </button>

          <button type="button" onClick={() => navigate('/reports')}>
            <span style={{ background: '#eaf3e5', color: '#4d753b' }}>
              <FileSpreadsheet size={16} />
            </span>
            <strong>วิเคราะห์และรายงานบัญชี</strong>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
