const productImage = (name) => `${import.meta.env.BASE_URL}images/products/${name}.jpg`;

export const PHOTO_CREDITS = {
  'panel': 'David Hawgood / Geograph Britain and Ireland · CC BY-SA 2.0',
  'mounting-kit': 'Kristian Buus / 1010 Climate Action · CC BY 2.0',
  'battery': 'HasanAbuarja · CC BY-SA 4.0',
  'inverter': 'Zátonyi Sándor · CC BY 4.0',
  'inverter-huawei': 'Asurnipal · CC BY-SA 4.0',
  'package-3kw': 'Lena Netkach · Pexels',
  'package-5kw': 'Robert So · Pexels',
  'package-10kw': 'U.S. Bureau of Land Management · Public domain',
};

export const products = [
  { id: 1, name: 'แผงโซลาร์เซลล์ LONGi 580W', category: 'แผงโซลาร์เซลล์', price: 4_290, oldPrice: 4_890, badge: 'ขายดี', icon: '▰', tone: 'blue', image_url: productImage('panel'), photoCredit: PHOTO_CREDITS.panel, detail: 'ประสิทธิภาพสูง ทนทานต่อทุกสภาพอากาศ' },
  { id: 2, name: 'อินเวอร์เตอร์ Huawei 5kW', category: 'อินเวอร์เตอร์', price: 32_500, badge: 'รับประกัน 10 ปี', icon: '⌁', tone: 'green', image_url: productImage('inverter-huawei'), photoCredit: PHOTO_CREDITS['inverter-huawei'], detail: 'แปลงพลังงานได้เต็มประสิทธิภาพ พร้อมระบบติดตาม' },
  { id: 3, name: 'แบตเตอรี่ Huawei LUNA 5kWh', category: 'แบตเตอรี่', price: 68_900, icon: '▥', tone: 'sand', image_url: productImage('battery'), photoCredit: PHOTO_CREDITS.battery, detail: 'สำรองพลังงานไว้ใช้ได้แม้ในเวลากลางคืน' },
  { id: 4, name: 'ชุดติดตั้งและอุปกรณ์ครบเซ็ต', category: 'อุปกรณ์ติดตั้ง', price: 12_900, badge: 'ครบชุด', icon: '⌘', tone: 'lilac', image_url: productImage('mounting-kit'), photoCredit: PHOTO_CREDITS['mounting-kit'], detail: 'อุปกรณ์มาตรฐานสำหรับระบบโซลาร์บนหลังคา' },
];

export const packages = [
  { name: 'แพ็กเกจเริ่มต้น', size: '3 kW', image: `${import.meta.env.BASE_URL}images/packages/package-3kw.jpg`, photoCredit: PHOTO_CREDITS['package-3kw'], price: '89,000', description: 'เหมาะสำหรับบ้านขนาดเล็ก ค่าไฟไม่เกิน 3,000 บาท/เดือน', items: ['แผงโซลาร์เซลล์ 6 แผง', 'อินเวอร์เตอร์ 3 kW', 'ติดตั้งพร้อมอุปกรณ์', 'รับประกันงานติดตั้ง 5 ปี'] },
  { name: 'แพ็กเกจยอดนิยม', size: '5 kW', image: `${import.meta.env.BASE_URL}images/packages/package-5kw.jpg`, photoCredit: PHOTO_CREDITS['package-5kw'], price: '149,000', description: 'ลงตัวสำหรับครอบครัวทั่วไป ช่วยประหยัดค่าไฟได้มากขึ้น', items: ['แผงโซลาร์เซลล์ 10 แผง', 'อินเวอร์เตอร์ 5 kW', 'ติดตั้งพร้อมอุปกรณ์', 'รับประกันงานติดตั้ง 5 ปี'], popular: true },
  { name: 'แพ็กเกจครอบครัวใหญ่', size: '10 kW', image: `${import.meta.env.BASE_URL}images/packages/package-10kw.jpg`, photoCredit: PHOTO_CREDITS['package-10kw'], price: '269,000', description: 'รองรับบ้านขนาดใหญ่และการใช้พลังงานสูง', items: ['แผงโซลาร์เซลล์ 18 แผง', 'อินเวอร์เตอร์ 10 kW', 'ติดตั้งพร้อมอุปกรณ์', 'รับประกันงานติดตั้ง 5 ปี'] },
];
