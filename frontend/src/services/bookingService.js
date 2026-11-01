const bookingBackendUnavailable = () => new Error('ระบบจองบริการยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง');

export const SERVICE_TYPES = [
  { value: 'survey', label: 'สำรวจหน้างาน', description: 'ประเมินพื้นที่และการใช้ไฟก่อนติดตั้ง' },
  { value: 'installation', label: 'ติดตั้งระบบ', description: 'นัดหมายติดตั้งระบบโซลาร์เซลล์' },
  { value: 'maintenance', label: 'บำรุงรักษา', description: 'ตรวจสอบและดูแลระบบที่ติดตั้งแล้ว' },
];

export async function createBooking() {
  throw bookingBackendUnavailable();
}

export async function getMyProfile() {
  throw bookingBackendUnavailable();
}

export async function getSlotAvailability() {
  throw bookingBackendUnavailable();
}
