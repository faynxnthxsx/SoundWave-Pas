require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sendTicketToLineUser, createTicketFlexMessage } = require('./services/lineService');

// Read User ID from argument or env
const targetUserId = process.argv[2] || process.env.TEST_LINE_USER_ID;

if (!targetUserId) {
  console.log('\n❌ กรุณาระบุ LINE User ID เพื่อทดสอบยิงตั๋ว:');
  console.log('ตัวอย่าง: node backend/src/test-line.js U1234567890abcdef1234567890abcdef\n');
  console.log('💡 วิธีดู LINE User ID ของตัวเอง:');
  console.log('1. เข้าเว็บ LINE Developers Console');
  console.log('2. คลิกแท็บ "Basic settings"');
  console.log('3. เลื่อนลงไปดูที่หัวข้อ "Your user ID" (ขึ้นต้นด้วยตัว U)\n');
  process.exit(1);
}

// Mock Concert Data
const mockConcert = {
  name: "Sound Wave Music Festival 2026",
  eventDate: new Date(),
  venue: "Sound Wave Outdoor Park นครปฐม",
  location: "นครปฐม",
  bannerUrl: "https://i.ibb.co/RpM1nNbS/6c567333-7642-45f0-8f42-ef283393e6b7.webp3"
};

const mockZone = {
  name: "Standing Pit B (Soundwave Pit)"
};

const mockTicket = {
  ticketCode: "SWP-PIT-DEMO-9999",
  seatNumber: null
};

const mockBooking = {
  bookingCode: "SW-8899"
};

async function runTest() {
  console.log(`🚀 กำลังส่งตั๋ว Flex Message ไปยัง LINE User: ${targetUserId}...`);
  const result = await sendTicketToLineUser(targetUserId, mockConcert, mockTicket, mockZone, mockBooking);
  if (result.success) {
    console.log('🎉 ส่งตั๋วสำเร็จ! ลองเปิดแอป LINE ในมือถือดูได้เลยครับ');
  } else {
    console.error('❌ ส่งไม่สำเร็จ:', result);
  }
}

runTest();
