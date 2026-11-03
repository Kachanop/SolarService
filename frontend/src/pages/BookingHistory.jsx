import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CalendarDays, Clock3, MapPin, Phone, RefreshCw } from 'lucide-react';
import { cancelBooking, getMyBookings, getSlotAvailability, rescheduleBooking } from '../services/bookingService.js';

const STATUS_LABELS = {
  pending: 'รอดำเนินการ',
  assigned: 'มอบหมายแล้ว',
  confirmed: 'ยืนยันแล้ว',
  surveying: 'กำลังสำรวจ',
  quoted: 'เสนอราคาแล้ว',
  approved: 'อนุมัติแล้ว',
  installing: 'กำลังติดตั้ง',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
};

const STATUS_TONES = {
  pending: 'yellow',
  assigned: 'blue',
  confirmed: 'green',
  surveying: 'blue',
  quoted: 'yellow',
  approved: 'green',
  installing: 'blue',
  completed: 'green',
  cancelled: 'gray',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

function getTodayDateValue() {
  const today = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}

export default function BookingHistory({ authUser, setToast }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const previousStatuses = useRef(new Map());

  useEffect(() => {
    let active = true;
    let hasLoaded = false;

    async function loadBookings() {
      if (!authUser?.id) {
        setBookings([]);
        setErrorMessage('กรุณาเข้าสู่ระบบเพื่อดูรายการจอง');
        setLoading(false);
        return;
      }

      if (!hasLoaded) setLoading(true);
      setErrorMessage('');

      try {
        const result = await getMyBookings();
        if (!active) return;

        const previous = previousStatuses.current;
        const statusChanges = result.filter((booking) => (
          previous.has(booking.id) && previous.get(booking.id) !== booking.status
        ));
        if (statusChanges.length > 0) {
          const booking = statusChanges[0];
          setToast(`การจอง ${booking.booking_number} เปลี่ยนสถานะเป็น “${STATUS_LABELS[booking.status] || booking.status}”`);
        }

        previousStatuses.current = new Map(result.map((booking) => [booking.id, booking.status]));
        setBookings(result);
      } catch (error) {
        if (active) setErrorMessage(error instanceof Error ? error.message : 'โหลดประวัติการจองไม่สำเร็จ');
      } finally {
        if (active) {
          hasLoaded = true;
          setLoading(false);
        }
      }
    }

    loadBookings();
    const intervalId = window.setInterval(loadBookings, 30000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [authUser?.id, refreshKey, setToast]);

  useEffect(() => {
    let active = true;
    if (!rescheduleDate || !rescheduleTarget) {
      setRescheduleSlots([]);
      setSelectedSlot('');
      return undefined;
    }

    async function loadSlots() {
      setSlotsLoading(true);
      setActionError('');
      try {
        const slots = await getSlotAvailability(rescheduleDate, rescheduleTarget.id);
        if (active) {
          setRescheduleSlots(slots);
          setSelectedSlot('');
        }
      } catch (error) {
        if (active) setActionError(error instanceof Error ? error.message : 'โหลดเวลาว่างไม่สำเร็จ');
      } finally {
        if (active) setSlotsLoading(false);
      }
    }

    loadSlots();
    return () => { active = false; };
  }, [rescheduleDate, rescheduleTarget]);

  async function handleCancel(booking) {
    if (!window.confirm(`ยืนยันยกเลิกการจอง ${booking.booking_number} หรือไม่?`)) return;
    setActionError('');
    try {
      await cancelBooking(booking.id);
      setToast('ยกเลิกการจองเรียบร้อยแล้ว');
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'ไม่สามารถแก้ไขรายการจองได้');
    }
  }

  async function handleReschedule(event) {
    event.preventDefault();
    if (!rescheduleTarget || !selectedSlot) return;

    setActionError('');
    try {
      await rescheduleBooking(rescheduleTarget.id, selectedSlot);
      setToast('เลื่อนนัดหมายเรียบร้อยแล้ว');
      setRescheduleTarget(null);
      setRescheduleDate('');
      setSelectedSlot('');
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'ไม่สามารถเลื่อนนัดหมายได้');
    }
  }

  return (
    <div className="page-wrap">
      <section className="page-intro">
        <div className="eyebrow">MY BOOKINGS</div>
        <h1>การจองของฉัน</h1>
        <p>รายการนี้แสดงเฉพาะการจองของบัญชีที่เข้าสู่ระบบ สถานะจะตรวจสอบซ้ำทุก 30 วินาทีขณะเปิดหน้านี้</p>
      </section>

      <div className="workspace-heading-actions" style={{ justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="button button-outline small-button" type="button" onClick={() => setRefreshKey((key) => key + 1)} disabled={loading}>
          <RefreshCw size={14} /> รีเฟรช
        </button>
      </div>

      {errorMessage && (
        <div className="bk-form-error" role="alert">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
          <button type="button" className="button button-outline small-button" onClick={() => setRefreshKey((key) => key + 1)}>ลองใหม่</button>
        </div>
      )}
      {actionError && <p className="bk-error" role="alert">{actionError}</p>}
      {loading && <p className="bk-hint" role="status">กำลังโหลดประวัติการจอง…</p>}
      {!loading && !errorMessage && bookings.length === 0 && (
        <div className="technician-empty">
          <CalendarDays size={26} />
          <strong>ยังไม่มีรายการจอง</strong>
          <span>เมื่อคุณจองบริการ รายการจะแสดงที่นี่</span>
        </div>
      )}
      {!loading && !errorMessage && bookings.length > 0 && (
        <div className="bk-history-list">
          {bookings.map((booking) => (
            <article className="bk-history-card" key={booking.id}>
              <div className="bk-history-heading">
                <strong>{booking.booking_number}</strong>
                <span className={`status-pill ${STATUS_TONES[booking.status] || 'gray'}`}>
                  {STATUS_LABELS[booking.status] || booking.status}
                </span>
              </div>
              <div className="bk-history-details">
                <span><CalendarDays size={15} /> {formatDate(booking.preferred_at)}</span>
                <span><MapPin size={15} /> {booking.address} · {booking.province}</span>
                <span><Phone size={15} /> {booking.phone}</span>
                <span><Clock3 size={15} /> {booking.service_type_label || 'ไม่ระบุประเภทบริการ'}</span>
                {booking.notes && <p>{booking.notes}</p>}
              </div>
              <div className="bk-history-actions">
                <button
                  type="button"
                  className="button button-outline small-button"
                  disabled={booking.status !== 'pending'}
                  onClick={() => {
                    setActionError('');
                    setRescheduleTarget(booking);
                    setRescheduleDate('');
                  }}
                >
                  เลื่อนนัด
                </button>
                <button
                  type="button"
                  className="button button-outline small-button"
                  disabled={booking.status !== 'pending'}
                  onClick={() => handleCancel(booking)}
                >
                  ยกเลิก
                </button>
              </div>
              {rescheduleTarget?.id === booking.id && (
                <form className="bk-reschedule-form" onSubmit={handleReschedule}>
                  <label className="bk-field">
                    เลือกวันนัดใหม่
                    <input
                      type="date"
                      min={getTodayDateValue()}
                      value={rescheduleDate}
                      onChange={(event) => setRescheduleDate(event.target.value)}
                      required
                    />
                  </label>
                  {slotsLoading && <p className="bk-hint" role="status">กำลังตรวจสอบเวลา…</p>}
                  {!slotsLoading && rescheduleSlots.length > 0 && (
                    <div className="bk-slot-grid" role="radiogroup" aria-label="เลือกเวลานัดใหม่">
                      {rescheduleSlots.map((slot) => (
                        <label key={slot.slot_start} className={`bk-slot ${selectedSlot === slot.slot_start ? 'selected' : ''} ${slot.is_available ? '' : 'disabled'}`}>
                          <input
                            type="radio"
                            name={`reschedule-${booking.id}`}
                            value={slot.slot_start}
                            checked={selectedSlot === slot.slot_start}
                            disabled={!slot.is_available}
                            onChange={() => setSelectedSlot(slot.slot_start)}
                          />
                          <strong>{slot.slot_label}</strong>
                          <small>
                            {slot.is_available
                              ? 'ยังไม่พบรายการจองที่มองเห็น'
                              : slot.unavailable_reason === 'past'
                                ? 'เวลาผ่านไปแล้ว'
                                : 'มีรายการจองแล้ว'}
                          </small>
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="bk-hint">คิวที่แสดงตรวจสอบจากรายการที่ RLS อนุญาตให้บัญชีนี้อ่านเท่านั้น</p>
                  <div className="bk-history-actions">
                    <button className="button button-green small-button" type="submit" disabled={!selectedSlot}>ยืนยันเลื่อนนัด</button>
                    <button className="button button-outline small-button" type="button" onClick={() => setRescheduleTarget(null)}>ปิด</button>
                  </div>
                </form>
              )}
            </article>
          ))}
        </div>
      )}

      <p className="bk-hint bk-history-limitation">
        การตรวจสอบเวลาว่างในขณะนี้เห็นได้เฉพาะรายการที่ RLS อนุญาตให้บัญชีนี้อ่าน และการเลื่อน/ยกเลิกอาจถูกปฏิเสธจนกว่า Supabase จะมี policy อนุญาตการแก้ไขรายการของเจ้าของ
      </p>
    </div>
  );
}
