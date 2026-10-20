/**
 * SoundWave Pass - Live End-to-End Demonstration Script
 */
async function runFullDemo() {
  console.log('====================================================');
  console.log('🎸 SOUNDWAVE PASS — การจำลองการทำงานครบวงจร (Live Demo)');
  console.log('====================================================\n');

  const BASE_URL = 'http://localhost:5000/api';

  // 1. ดึงข้อมูลคอนเสิร์ตและโซน
  console.log('📌 สเต็ปที่ 1: ดึงข้อมูลคอนเสิร์ตและโซนบัตร...');
  const concertsRes = await fetch(`${BASE_URL}/concerts`);
  const concertsData = await concertsRes.json();
  const concert = concertsData.data[0];
  console.log(`   🎤 คอนเสิร์ต: "${concert.name}"`);
  console.log(`   📍 สถานที่: ${concert.location}`);
  const targetZone = concert.zones[0];
  console.log(`   🎫 เลือกโซน: ${targetZone.name} (ราคา ${targetZone.price.toLocaleString()} บาท, ว่าง ${targetZone.available} ที่)\n`);

  // 2. จำลองลูกค้ากดจองบัตร (กรอก LINE User ID ของคุณน้ำ)
  console.log('📌 สเต็ปที่ 2: จำลองการกดจองบัตร (Hold โควต้า 10 นาที)...');
  const bookingPayload = {
    concertId: concert.id,
    zoneId: targetZone.id,
    quantity: 1,
    customerName: "คุณน้ำ (Team Alpha)",
    customerPhone: "089-111-2233",
    customerLineId: "U08546282a28205f8f8d75df7d71741d0" // LINE User ID ของคุณน้ำ
  };

  const bookingRes = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingPayload)
  });
  const bookingData = await bookingRes.json();
  if (!bookingData.success) {
    console.error('❌ จองไม่สำเร็จ:', bookingData);
    return;
  }
  const booking = bookingData.data;
  console.log(`   ✅ จองสำเร็จ! รหัสการจอง: ${booking.bookingCode}`);
  console.log(`   ⏰ สถานะ: ${booking.status} (หมดอายุใน 10 นาที)\n`);

  // 3. จำลองการชำระเงินสำเร็จ (PromptPay)
  console.log('📌 สเต็ปที่ 3: จำลองการสแกนจ่ายเงินสำเร็จ...');
  const payRes = await fetch(`${BASE_URL}/bookings/${booking.bookingCode}/pay`, {
    method: 'POST'
  });
  const payData = await payRes.json();
  if (!payData.success) {
    console.error('❌ ชำระเงินไม่สำเร็จ:', payData);
    return;
  }

  const generatedTicket = payData.data.tickets[0];
  console.log(`   💰 ชำระเงินเรียบร้อย! ออกตั๋วสำเร็จ:`);
  console.log(`   🎟️ รหัสตั๋วที่ได้: ${generatedTicket.ticketCode}`);
  console.log(`   📱 ยิงการ์ดตั๋ว Flex Message เข้าสู่ LINE ของคุณน้ำแล้วอัตโนมัติ!\n`);

  // 4. จำลองเจ้าหน้าที่สแกนตั๋วหน้างาน
  console.log('📌 สเต็ปที่ 4: เจ้าหน้าที่ใช้เครื่องสแกน (Gate Scanner) ตรวจตั๋ว...');
  const verifyRes = await fetch(`${BASE_URL}/scanner/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticketCode: generatedTicket.ticketCode, scannedBy: 'Gate Staff #1' })
  });
  const verifyData = await verifyRes.json();
  console.log(`   🔔 ผลการสแกนครั้งแรก:`);
  console.log(`      สถานะ: ${verifyData.valid ? '✅ ตรวจสอบผ่าน (VALID)' : '❌ ไม่ผ่าน'}`);
  console.log(`      ข้อความ: ${verifyData.message}`);
  console.log(`      ผู้ถือบัตร: ${verifyData.data.attendeeName} | โซน: ${verifyData.data.zoneName}\n`);

  // 5. จำลองมีคนแอบเอาตั๋วเดิมมาสแกนซ้ำ
  console.log('📌 สเต็ปที่ 5: ทดสอบความปลอดภัย (ลองแอบสแกนตั๋วเดิมซ้ำ)...');
  const verifyAgainRes = await fetch(`${BASE_URL}/scanner/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticketCode: generatedTicket.ticketCode, scannedBy: 'Gate Staff #1' })
  });
  const verifyAgainData = await verifyAgainRes.json();
  console.log(`   🚨 ผลการสแกนซ้ำ:`);
  console.log(`      สถานะ: ⚠️ ${verifyAgainData.status} (${verifyAgainData.message})`);
  console.log(`      สแกนไปแล้วเมื่อ: ${new Date(verifyAgainData.data.usedAt).toLocaleTimeString('th-TH')}\n`);

  console.log('====================================================');
  console.log('🎉 การจำลองการทำงานครบวงจรเสร็จสมบูรณ์ 100%!');
  console.log(`🔗 ดูหน้าพิมพ์บัตร A4 ที่ระลึกได้ที่: http://localhost:5173/tickets/${generatedTicket.ticketCode}/print`);
  console.log('====================================================');
}

runFullDemo().catch(console.error);
