import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { supabase, supabaseConfigError } from '../lib/supabase.js';

const roleMeta = {
  Customer: { label: 'ลูกค้าทั่วไป', tone: 'green', desc: 'สามารถสั่งซื้อสินค้า จองช่างสำรวจ และติดตามงานติดตั้ง' },
  customer: { label: 'ลูกค้าทั่วไป', tone: 'green', desc: 'สามารถสั่งซื้อสินค้า จองช่างสำรวจ และติดตามงานติดตั้ง' },
  Technician: { label: 'ช่างผู้เชี่ยวชาญ', tone: 'blue', desc: 'สามารถรับงานสำรวจหน้างาน บันทึกผล และอัปเดตสถานะงาน' },
  technician: { label: 'ช่างผู้เชี่ยวชาญ', tone: 'blue', desc: 'สามารถรับงานสำรวจหน้างาน บันทึกผล และอัปเดตสถานะงาน' },
  Admin: { label: 'ผู้ดูแลระบบ (Admin)', tone: 'purple', desc: 'มีสิทธิ์จัดการสินค้า ผู้ใช้งาน การจอง และรายงานทั้งหมด' },
  admin: { label: 'ผู้ดูแลระบบ (Admin)', tone: 'purple', desc: 'มีสิทธิ์จัดการสินค้า ผู้ใช้งาน การจอง และรายงานทั้งหมด' },
};

export default function AccountPage({ authUser, role, navigate, setToast, signOut }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState(null);

  // Direct password update
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState(null);

  // Send reset email
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState(null);

  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchProfile() {
      if (!authUser || !supabase) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, phone, role, created_at, updated_at')
          .eq('id', authUser.id)
          .maybeSingle();

        if (error) throw error;
        if (!active) return;

        if (data) {
          setProfile(data);
          setFullName(data.full_name || authUser.user_metadata?.full_name || '');
          setPhone(data.phone || authUser.user_metadata?.phone || '');
        } else {
          // Fallback from auth metadata
          const metaName = authUser.user_metadata?.full_name || '';
          const metaPhone = authUser.user_metadata?.phone || '';
          setFullName(metaName);
          setPhone(metaPhone);
        }
      } catch (err) {
        if (!active) return;
        setProfileNotice({
          type: 'error',
          text: `โหลดข้อมูลโปรไฟล์ไม่สำเร็จ: ${err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'}`,
        });
        setFullName(authUser.user_metadata?.full_name || '');
        setPhone(authUser.user_metadata?.phone || '');
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchProfile();
    return () => { active = false; };
  }, [authUser]);

  async function handleUpdateProfile(e) {
    e.preventDefault();
    if (!supabase) {
      setToast(supabaseConfigError || 'ไม่สามารถเชื่อมต่อ Supabase');
      return;
    }
    setSavingProfile(true);
    setProfileNotice(null);

    try {
      // 1. Update public.profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
        })
        .eq('id', authUser.id);

      if (profileError) throw profileError;

      // 2. Update auth user metadata
      await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
        },
      });

      setProfileNotice({ type: 'success', text: 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว' });
      setToast('อัปเดตข้อมูลบัญชีสำเร็จ');
    } catch (err) {
      setProfileNotice({
        type: 'error',
        text: `บันทึกไม่สำเร็จ: ${err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'}`,
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordNotice(null);

    if (newPassword.length < 8) {
      setPasswordNotice({ type: 'error', text: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordNotice({ type: 'error', text: 'รหัสผ่านทั้งสองช่องไม่ตรงกัน' });
      return;
    }

    if (!supabase) {
      setPasswordNotice({ type: 'error', text: supabaseConfigError || 'ไม่สามารถเชื่อมต่อ Supabase' });
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordNotice({
        type: 'success',
        text: 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว คุณสามารถใช้รหัสผ่านใหม่นี้ในการเข้าสู่ระบบครั้งถัดไป',
      });
      setNewPassword('');
      setConfirmPassword('');
      setToast('เปลี่ยนรหัสผ่านใหม่เรียบร้อยแล้ว');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setPasswordNotice({
        type: 'error',
        text: `เปลี่ยนรหัสผ่านไม่สำเร็จ: ${msg === 'New password should be different from the old password' ? 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม' : msg}`,
      });
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleSendResetEmail() {
    setEmailNotice(null);
    if (!authUser?.email) {
      setEmailNotice({ type: 'error', text: 'ไม่พบที่อยู่อีเมลของบัญชีนี้' });
      return;
    }
    if (!supabase) {
      setEmailNotice({ type: 'error', text: supabaseConfigError || 'ไม่สามารถเชื่อมต่อ Supabase' });
      return;
    }

    setSendingResetEmail(true);
    try {
      const redirectUrl = new URL(window.location.href);
      redirectUrl.hash = '';
      redirectUrl.searchParams.set('flow', 'reset');

      const { error } = await supabase.auth.resetPasswordForEmail(authUser.email, {
        redirectTo: redirectUrl.toString(),
      });
      if (error) throw error;

      setEmailNotice({
        type: 'success',
        text: `ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยัง ${authUser.email} แล้ว กรุณาตรวจสอบกล่องข้อความหรืออีเมลขยะ`,
      });
      setToast('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลแล้ว');
    } catch (err) {
      setEmailNotice({
        type: 'error',
        text: `ส่งอีเมลไม่สำเร็จ: ${err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'}`,
      });
    } finally {
      setSendingResetEmail(false);
    }
  }

  function handleCopyId() {
    if (!authUser?.id) return;
    navigator.clipboard.writeText(authUser.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  const effectiveRole = profile?.role || role || 'Customer';
  const roleInfo = roleMeta[effectiveRole] || roleMeta.Customer;
  const displayName = fullName || authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'ผู้ใช้งาน';
  const displayInitial = displayName.charAt(0).toUpperCase() || 'U';

  const memberSince = authUser?.created_at
    ? new Date(authUser.created_at).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'ไม่ระบุ';

  return (
    <div className="account-page-wrap">
      {/* Account Hero Card */}
      <div className="account-hero-card">
        <div className="account-hero-main">
          <div className="account-avatar-circle">
            <span>{displayInitial}</span>
            <div className="account-avatar-badge" title="ยืนยันแล้ว">
              <ShieldCheck size={14} />
            </div>
          </div>
          <div className="account-hero-text">
            <div className="account-hero-badges">
              <span className={`account-role-badge tone-${roleInfo.tone}`}>
                <Sparkles size={12} />
                {roleInfo.label}
              </span>
              {authUser?.email_confirmed_at && (
                <span className="account-verified-badge">
                  <Check size={12} /> ยืนยันอีเมลแล้ว
                </span>
              )}
            </div>
            <h1>{displayName}</h1>
            <p className="account-hero-email">
              <Mail size={14} /> {authUser?.email}
            </p>
          </div>
        </div>

        <div className="account-hero-meta">
          <div className="meta-item">
            <span className="meta-label">
              <Calendar size={13} /> เป็นสมาชิกตั้งแต่
            </span>
            <strong>{memberSince}</strong>
          </div>
          <div className="meta-item">
            <span className="meta-label">รหัสผู้ใช้งาน (UID)</span>
            <div className="uid-copy-wrap">
              <code>{authUser?.id?.slice(0, 13)}…</code>
              <button
                type="button"
                className="copy-uid-btn"
                onClick={handleCopyId}
                title="คัดลอก UID เต็ม"
                aria-label="คัดลอก UID"
              >
                {copiedId ? <Check size={13} className="text-green" /> : <Copy size={13} />}
                <span>{copiedId ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="account-loading-box">
          <RefreshCw size={20} className="spin-icon" /> กำลังโหลดข้อมูลบัญชี…
        </div>
      )}

      {/* Main Account Grid */}
      <div className="account-grid">
        {/* Column 1: Personal Profile Form */}
        <div className="account-card">
          <div className="account-card-header">
            <div className="account-icon-wrap">
              <User size={20} />
            </div>
            <div>
              <h2>ข้อมูลบัญชีและโปรไฟล์</h2>
              <p>จัดการข้อมูลส่วนตัวที่ใช้ในการติดต่อและการให้บริการ</p>
            </div>
          </div>

          {profileNotice && (
            <div className={`account-alert ${profileNotice.type}`}>
              {profileNotice.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>{profileNotice.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="account-form">
            <div className="account-form-group">
              <label htmlFor="acc-name">ชื่อ-นามสกุล</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  id="acc-name"
                  type="text"
                  required
                  placeholder="กรอกชื่อ-นามสกุลของคุณ"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="account-form-group">
              <label htmlFor="acc-email">อีเมล (ใช้สำหรับเข้าสู่ระบบ)</label>
              <div className="input-with-icon disabled">
                <Mail size={16} className="input-icon" />
                <input
                  id="acc-email"
                  type="email"
                  disabled
                  value={authUser?.email || ''}
                  title="อีเมลบัญชีไม่สามารถแก้ไขได้โดยตรง"
                />
              </div>
              <small className="form-hint">อีเมลใช้ระบุตัวตนในระบบ หากต้องการเปลี่ยนกรุณาติดต่อเจ้าหน้าที่</small>
            </div>

            <div className="account-form-group">
              <label htmlFor="acc-phone">เบอร์โทรศัพท์ติดต่อ</label>
              <div className="input-with-icon">
                <Phone size={16} className="input-icon" />
                <input
                  id="acc-phone"
                  type="tel"
                  placeholder="เช่น 081-234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <small className="form-hint">ใช้สำหรับนัดหมายงานสำรวจหรือแจ้งสถานะคำสั่งซื้อ</small>
            </div>

            <div className="account-form-group">
              <label>สิทธิ์การใช้งานในระบบ</label>
              <div className="role-explainer-card">
                <strong>{roleInfo.label}</strong>
                <p>{roleInfo.desc}</p>
              </div>
            </div>

            <div className="account-form-actions">
              <button
                type="submit"
                disabled={savingProfile}
                className="button button-green account-submit-btn"
              >
                {savingProfile ? (
                  <>
                    <RefreshCw size={15} className="spin-icon" /> กำลังบันทึก…
                  </>
                ) : (
                  <>
                    <Check size={16} /> บันทึกข้อมูลโปรไฟล์
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Column 2: Password Reset & Security */}
        <div className="account-card">
          <div className="account-card-header">
            <div className="account-icon-wrap security-icon">
              <Lock size={20} />
            </div>
            <div>
              <h2>ความปลอดภัยและรหัสผ่าน</h2>
              <p>เปลี่ยนรหัสผ่านเพื่อความปลอดภัยของบัญชี หรือขอรับลิงก์รีเซ็ต</p>
            </div>
          </div>

          {passwordNotice && (
            <div className={`account-alert ${passwordNotice.type}`}>
              {passwordNotice.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>{passwordNotice.text}</span>
            </div>
          )}

          {/* Direct Password Change */}
          <form onSubmit={handleChangePassword} className="account-form">
            <h3 className="sub-form-heading">
              <KeyRound size={16} /> เปลี่ยนรหัสผ่านโดยตรง
            </h3>

            <div className="account-form-group">
              <label htmlFor="acc-new-password">รหัสผ่านใหม่</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  id="acc-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="account-form-group">
              <label htmlFor="acc-confirm-password">ยืนยันรหัสผ่านใหม่</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  id="acc-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="password-rules-box">
              <div className={`rule-check ${newPassword.length >= 8 ? 'valid' : ''}`}>
                <Check size={13} /> ความยาวอย่างน้อย 8 ตัวอักษร
              </div>
              <div className={`rule-check ${confirmPassword && newPassword === confirmPassword ? 'valid' : ''}`}>
                <Check size={13} /> รหัสผ่านทั้งสองช่องตรงกัน
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPassword || !newPassword || !confirmPassword}
              className="button button-dark account-submit-btn"
            >
              {savingPassword ? (
                <>
                  <RefreshCw size={15} className="spin-icon" /> กำลังเปลี่ยนรหัสผ่าน…
                </>
              ) : (
                <>
                  <KeyRound size={16} /> ยืนยันเปลี่ยนรหัสผ่าน
                </>
              )}
            </button>
          </form>

          {/* Alternative: Send Reset Link via Email */}
          <div className="account-divider">
            <span>หรือ</span>
          </div>

          <div className="email-reset-card">
            <div className="email-reset-header">
              <Mail size={18} className="email-reset-icon" />
              <div>
                <strong>ส่งลิงก์รีเซ็ตรหัสผ่านทางอีเมล</strong>
                <p>ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมล {authUser?.email}</p>
              </div>
            </div>

            {emailNotice && (
              <div className={`account-alert ${emailNotice.type}`}>
                {emailNotice.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                <span>{emailNotice.text}</span>
              </div>
            )}

            <button
              type="button"
              disabled={sendingResetEmail}
              onClick={handleSendResetEmail}
              className="button button-outline email-reset-btn"
            >
              {sendingResetEmail ? (
                <>
                  <RefreshCw size={14} className="spin-icon" /> กำลังส่งอีเมล…
                </>
              ) : (
                <>
                  <Send size={14} /> ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมล
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation & Logout */}
      <div className="account-footer-bar">
        <div className="account-quick-links">
          <span>เมนูด่วน:</span>
          {effectiveRole === 'admin' || effectiveRole === 'Admin' ? (
            <>
              <button type="button" onClick={() => navigate('/admin')}>
                ภาพรวมระบบ Dashboard <ArrowRight size={13} />
              </button>
              <button type="button" onClick={() => navigate('/manage-users')}>
                จัดการผู้ใช้งาน <ArrowRight size={13} />
              </button>
            </>
          ) : effectiveRole === 'technician' || effectiveRole === 'Technician' ? (
            <>
              <button type="button" onClick={() => navigate('/technician')}>
                งานของคุณ <ArrowRight size={13} />
              </button>
              <button type="button" onClick={() => navigate('/schedule')}>
                ตารางนัดหมาย <ArrowRight size={13} />
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => navigate('/customer')}>
                ภาพรวมของฉัน <ArrowRight size={13} />
              </button>
              <button type="button" onClick={() => navigate('/bookings')}>
                การจองของฉัน <ArrowRight size={13} />
              </button>
              <button type="button" onClick={() => navigate('/quotes')}>
                ใบเสนอราคา <ArrowRight size={13} />
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={signOut}
          className="button button-outline logout-button-account"
        >
          <LogOut size={15} /> ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
