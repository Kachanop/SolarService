import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, Eye, EyeOff, Sun } from 'lucide-react';
import { supabase, supabaseConfigError } from '../lib/supabase.js';

export function formatAuthError(error) {
  const messages = {
    'Invalid login credentials': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
    'Email not confirmed': 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ',
    'User already registered': 'อีเมลนี้มีบัญชีอยู่แล้ว',
    'Password should be at least 8 characters': 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
    'New password should be different from the old password': 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม',
    'Failed to fetch': 'เชื่อมต่อ Supabase ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตและการตั้งค่า URL',
  };
  return messages[error.message] || error.message;
}
export default function AuthPage({ route, navigate, onAuthenticated, setToast }) {
  const isRegister = route === '/register';
  const isForgot = route === '/forgot-password';
  const isReset = route === '/reset-password';
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!supabase) {
      setErrorMessage(supabaseConfigError);
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get('email') || '');
    const password = String(formData.get('password') || '');
    setSubmitting(true);

    try {
      if (isForgot) {
        const redirectUrl = new URL(window.location.href);
        redirectUrl.hash = '';
        redirectUrl.searchParams.set('flow', 'reset');
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl.toString() });
        if (error) throw error;
        setSuccessMessage('ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลแล้ว กรุณาตรวจสอบกล่องจดหมาย');
      } else if (isReset) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        const url = new URL(window.location.href);
        url.searchParams.delete('flow');
        window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
        setToast('ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว');
        onAuthenticated();
      } else if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: String(formData.get('full_name') || '') } },
        });
        if (error) throw error;
        if (data.session) {
          onAuthenticated();
        } else {
          setSuccessMessage('สมัครสมาชิกสำเร็จ กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthenticated();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      setErrorMessage(`ดำเนินการไม่สำเร็จ: ${formatAuthError({ message })}`);
    } finally {
      setSubmitting(false);
    }
  }

  const title = isRegister ? 'สร้างบัญชีของคุณ' : isForgot ? 'ลืมรหัสผ่าน?' : isReset ? 'ตั้งรหัสผ่านใหม่' : 'ยินดีต้อนรับกลับ';
  return <div className="auth-page">
    <div className="auth-aside"><div className="auth-aside-content">
      <div className="eyebrow">POWER YOUR EVERYDAY</div>
      <h2>ทุกวันที่สดใส<br />เริ่มต้นที่บ้านคุณ</h2>
      <p>จัดการระบบโซลาร์เซลล์ สั่งซื้อสินค้า และติดตามบริการได้ในที่เดียว</p>
      <div className="auth-benefit"><BadgeCheck size={18} /> สมัครง่าย ใช้งานสะดวก ดูแลครบทุกขั้นตอน</div>
      <div className="auth-sun"><Sun size={120} /></div>
    </div></div>
    <div className="auth-form-wrap"><form className="auth-form" onSubmit={handleSubmit}>
      <a href="#/" className="back-link"><ArrowLeft size={16} /> กลับหน้าหลัก</a>
      <div className="eyebrow">{isRegister ? 'CREATE ACCOUNT' : isForgot || isReset ? 'RESET PASSWORD' : 'WELCOME BACK'}</div>
      <h1>{title}</h1>
      <p>{isRegister ? 'เริ่มต้นจัดการพลังงานในบ้านของคุณ' : isForgot ? 'กรอกอีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่' : isReset ? 'ตั้งรหัสผ่านใหม่เพื่อเข้าใช้งานบัญชี' : 'เข้าสู่ระบบเพื่อใช้งาน SolarService'}</p>
      {isRegister && <label>ชื่อ-นามสกุล<input name="full_name" required autoComplete="name" placeholder="ชื่อของคุณ" /></label>}
      {!isReset && <label>อีเมล<input name="email" type="email" required autoComplete="email" placeholder="name@example.com" /></label>}
      {!isForgot && <label>รหัสผ่าน
        <span className="password-input-wrap">
          <input name="password" type={showPassword ? 'text' : 'password'} required minLength="8" autoComplete={isRegister || isReset ? 'new-password' : 'current-password'} placeholder="อย่างน้อย 8 ตัวอักษร" />
          <button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} aria-pressed={showPassword}>
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </span>
      </label>}
      {!isRegister && !isForgot && !isReset && <a className="forgot-link" href="#/forgot-password">ลืมรหัสผ่าน?</a>}
      {errorMessage && <div className="auth-message error" role="alert">{errorMessage}</div>}
      {successMessage && <div className="auth-message success" role="status">{successMessage}</div>}
      <button type="submit" className="button button-green auth-submit" disabled={submitting}>{submitting ? 'กำลังดำเนินการ…' : isRegister ? 'สมัครสมาชิก' : isForgot ? 'ส่งลิงก์ตั้งรหัสผ่าน' : isReset ? 'บันทึกรหัสผ่านใหม่' : 'เข้าสู่ระบบ'} <ArrowRight size={16} /></button>
      {!isReset && <div className="auth-switch">{isRegister ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชี?'} <a href={isRegister ? '#/login' : '#/register'}>{isRegister ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</a></div>}
      {isRegister || isForgot || isReset ? null : <div className="demo-hint"><strong>ระบบสมาชิกผ่าน Supabase</strong><span>การสมัครสมาชิกอาจต้องยืนยันอีเมลก่อนเข้าใช้งาน</span></div>}
    </form></div>
  </div>;
}
