import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LanguageContext = createContext({
  lang: 'th',
  setLang: () => {},
  toggleLang: () => {},
  t: (th) => th,
  trData: (text) => text,
});

// Comprehensive Exact Dictionary (UI + Admin + Modals + Scanner + Tickets + DB Content + 77 Provinces)
const EXACT_MAP = {
  // ── 77 Thai Provinces ──
  'กรุงเทพมหานคร': 'Bangkok',
  'กระบี่': 'Krabi',
  'กาญจนบุรี': 'Kanchanaburi',
  'กาฬสินธุ์': 'Kalasin',
  'กำแพงเพชร': 'Kamphaeng Phet',
  'ขอนแก่น': 'Khon Kaen',
  'จันทบุรี': 'Chanthaburi',
  'ฉะเชิงเทรา': 'Chachoengsao',
  'ชลบุรี': 'Chonburi',
  'ชัยนาท': 'Chainat',
  'ชัยภูมิ': 'Chaiyaphum',
  'ชุมพร': 'Chumphon',
  'เชียงราย': 'Chiang Rai',
  'เชียงใหม่': 'Chiang Mai',
  'ตรัง': 'Trang',
  'ตราด': 'Trat',
  'ตาก': 'Tak',
  'นครนายก': 'Nakhon Nayok',
  'นครปฐม': 'Nakhon Pathom',
  'นครพนม': 'Nakhon Phanom',
  'นครราชสีมา': 'Nakhon Ratchasima',
  'นครศรีธรรมราช': 'Nakhon Si Thammarat',
  'นครสวรรค์': 'Nakhon Sawan',
  'นนทบุรี': 'Nonthaburi',
  'นราธิวาส': 'Narathiwat',
  'น่าน': 'Nan',
  'บึงกาฬ': 'Bueng Kan',
  'บุรีรัมย์': 'Buriram',
  'ปทุมธานี': 'Pathum Thani',
  'ประจวบคีรีขันธ์': 'Prachuap Khiri Khan',
  'ปราจีนบุรี': 'Prachinburi',
  'ปัตตานี': 'Pattani',
  'พะเยา': 'Phayao',
  'พระนครศรีอยุธยา': 'Phra Nakhon Si Ayutthaya',
  'พังงา': 'Phang Nga',
  'พัทลุง': 'Phatthalung',
  'พิจิตร': 'Phichit',
  'พิษณุโลก': 'Phitsanulok',
  'เพชรบุรี': 'Phetchaburi',
  'เพชรบูรณ์': 'Phetchabun',
  'แพร่': 'Phrae',
  'ภูเก็ต': 'Phuket',
  'มหาสารคาม': 'Maha Sarakham',
  'มุกดาหาร': 'Mukdahan',
  'แม่ฮ่องสอน': 'Mae Hong Son',
  'ยโสธร': 'Yasothon',
  'ยะลา': 'Yala',
  'ร้อยเอ็ด': 'Roi Et',
  'ระนอง': 'Ranong',
  'ระยอง': 'Rayong',
  'ราชบุรี': 'Ratchaburi',
  'ลพบุรี': 'Lopburi',
  'ลำปาง': 'Lampang',
  'ลำพูน': 'Lamphun',
  'เลย': 'Loei',
  'ศรีสะเกษ': 'Si Sa Ket',
  'สกลนคร': 'Sakon Nakhon',
  'สงขลา': 'Songkhla',
  'สตูล': 'Satun',
  'สมุทรปราการ': 'Samut Prakan',
  'สมุทรสงคราม': 'Samut Songkhram',
  'สมุทรสาคร': 'Samut Sakhon',
  'สระแก้ว': 'Sa Kaeo',
  'สระบุรี': 'Saraburi',
  'สิงห์บุรี': 'Sing Buri',
  'สุโขทัย': 'Sukhothai',
  'สุพรรณบุรี': 'Suphan Buri',
  'สุราษฎร์ธานี': 'Surat Thani',
  'สุรินทร์': 'Surin',
  'หนองคาย': 'Nong Khai',
  'หนองบัวลำภู': 'Nong Bua Lam Phu',
  'อ่างทอง': 'Ang Thong',
  'อุดรธานี': 'Udon Thani',
  'อุตรดิตถ์': 'Uttaradit',
  'อุทัยธานี': 'Uthai Thani',
  'อุบลราชธานี': 'Ubon Ratchathani',
  'อำนาจเจริญ': 'Amnat Charoen',

  // ── Venues ──
  'ราชมังคลากีฬาสถาน': 'Rajamangala National Stadium, Bangkok',
  'อิมแพ็ค อารีน่า เมืองทองธานี': 'IMPACT Arena, Muang Thong Thani',
  'ยูโอบี ไลฟ์, เอ็มสเฟียร์': 'UOB LIVE, EMSPHERE Bangkok',
  'ธันเดอร์โดม สเตเดียม': 'Thunderdome Stadium, Muang Thong Thani',
  'ธันเดอร์โดม เมืองทองธานี': 'Thunderdome, Muang Thong Thani',
  'อิมแพ็ค เอ็กซิบิชั่น ฮอลล์ 5, เมืองทองธานี': 'IMPACT Exhibition Hall 5, Muang Thong Thani',
  'สนามกีฬาแห่งชาติ ศุภชลาศัย': 'Suphachalasai National Stadium, Bangkok',
  'ยูเนี่ยน ฮอลล์, ศูนย์การค้ายูเนี่ยน มอลล์': 'Union Hall, Union Mall Bangkok',
  'ยูเนี่ยน ฮอลล์ ชั้น F6 ศูนย์การค้ายูเนี่ยน มอลล์': 'Union Hall (6F), Union Mall Bangkok',
  'Oasis Outdoor Arena, สวนผึ้ง ราชบุรี': 'Oasis Outdoor Arena, Suan Phueng, Ratchaburi',
  'Volume Livehouse ชั้น B, The Street Ratchada': 'Volume Livehouse (Floor B), The Street Ratchada',
  'เซ็นทรัลเวิลด์ ไลฟ์, ชั้น 8 เซ็นทรัลเวิลด์': 'centralwOrld LIVE (8F), centralwOrld Bangkok',
  'SiamPic Hall ชั้น 7, สยามสแควร์วัน': 'SiamPic Hall (7F), Siam Square One',
  'หอประชุมมหิดลสิทธาคาร มหาวิทยาลัยมหิดลศาลายา': 'Prince Mahidol Hall, Mahidol University Salaya',
  'เมืองไทยรัชดาลัย เธียเตอร์': 'Muangthai Rachadalai Theatre',
  'บีซีซี ฮอลล์ เซ็นทรัล พลาซ่า ลาดพร้าว ชั้น 5': 'BCC Hall (5F), Central Ladprao',
  'MCC HALL ชั้น 4, เดอะมอลล์ไลฟ์สโตร์ งามวงศ์วาน': 'MCC Hall (4F), The Mall Lifestore Ngamwongwan',
  'MCC HALL, เดอะมอลล์ไลฟ์สโตร์ งามวงศ์วาน': 'MCC Hall, The Mall Lifestore Ngamwongwan',
  'หอประชุม จุฬาลงกรณ์มหาวิทยาลัย': 'Chulalongkorn University Auditorium',
  'แจ้งวัฒนะ ฮอลล์, เซ็นทรัลแจ้งวัฒนะ ชั้น 5.5': 'Chaengwattana Hall (5.5F), Central Chaengwattana',
  'ศูนย์วัฒนธรรมแห่งประเทศไทย หอประชุมใหญ่': 'Thailand Cultural Centre (Main Hall)',
  'เอ็ม เธียเตอร์ (ถ.เพชรบุรีตัดใหม่)': 'M Theatre (New Phetchaburi Rd.)',
  'หอแสดงดนตรี วิทยาลัยดุริยางคศิลป์ ม.มหิดล(ศาลายา)': 'MACM Hall, College of Music, Mahidol University',

  // ── Months & Days ──
  'มกราคม': 'January',
  'กุมภาพันธ์': 'February',
  'มีนาคม': 'March',
  'เมษายน': 'April',
  'พฤษภาคม': 'May',
  'มิถุนายน': 'June',
  'กรกฎาคม': 'July',
  'สิงหาคม': 'August',
  'กันยายน': 'September',
  'ตุลาคม': 'October',
  'พฤศจิกายน': 'November',
  'ธันวาคม': 'December',
  'อา': 'Sun',
  'จ': 'Mon',
  'อ': 'Tue',
  'พ': 'Wed',
  'พฤ': 'Thu',
  'ศ': 'Fri',
  'ส': 'Sat',
  'วันอาทิตย์': 'Sunday',
  'วันจันทร์': 'Monday',
  'วันอังคาร': 'Tuesday',
  'วันพุธ': 'Wednesday',
  'วันพฤหัสบดี': 'Thursday',
  'วันศุกร์': 'Friday',
  'วันเสาร์': 'Saturday',

  // ── Seed Schedule & Artists ──
  'ประตูเปิด & จุดลงทะเบียน Camping': 'Gates Open & Camping Check-in',
  'ประตูเปิด & เช็กอินเข้าโซนแคมป์ปิ้ง': 'Gates Open & Camping Zone Check-in',
  'เปิดประตูเข้าฮอลล์ (Doors Open)': 'Doors Open',
  'โซนอาหาร Street Food & เครื่องดื่มเปิดบริการ': 'Street Food & Craft Beverage Village Opens',
  'เปิดโซนอาหาร Street Food & เครื่องดื่ม': 'Street Food & Craft Beverage Village Opens',
  'เริ่มการแสดงสดทั้ง 3 เวที': 'Live Performances Begin Across All 3 Stages',
  'เริ่มการแสดงดนตรีทั้ง 3 เวทีพร้อมกัน': 'Live Music Performances Start Across All 3 Stages',
  'การแสดง แสง สี เสียง Neon Light & Pyro Show': 'Special Neon Light & Pyrotechnics Spectacular',
  'การแสดงแสงสี Neon Lights & Pyro Show': 'Special Neon Lights & Pyro Show',
  'Headliner Stage — วง Slot Machine แสดงสด': 'Headliner Stage — Slot Machine Live Performance',
  'After Party DJ Set โซน Camping ลานกว้าง': 'After Party Electronic DJ Set at Camping Grounds',
  'After Party DJ Set ณ โซน Camping': 'After Party DJ Set at Starlight Camping Zone',
  'ร็อกแนวหน้าของไทย พร้อมโชว์เต็มรูปแบบ แสง สี เสียง และวิชวลสุดอลังการปิดท้ายค่ำคืน':
    'Thailand’s premier rock headliner delivering a full-scale arena production with immersive visuals and lasers.',
  'ปลดปล่อยพลังดนตรีสะท้อนสังคม กับเพลงฮิตที่แฟนเพลงตะโกนร้องตามกันสนั่นลานคอนเสิร์ต':
    'High-energy Thai rock anthems that unite the entire stadium in a massive sing-along.',
  'วงป็อปร็อกขวัญใจคนรุ่นใหม่ รวมทุกบทเพลงอกหักและซาวด์ดนตรีสุดซึ้ง':
    'Beloved modern pop-rock band performing chart-topping emotional anthems live.',
  'วงป๊อปร็อกขวัญใจคนรุ่นใหม่ รวมทุกบทเพลงอกหักและซาวด์ดนตรีสุดซึ้ง':
    'Beloved modern pop-rock band performing chart-topping emotional anthems live.',
  'เพลงฮิตติดหูระดับร้อยล้านวิว กับลีลาการร้องสะกดอารมณ์สดๆ บนเวที':
    'Multi-million-stream alternative rock hits delivered with captivating live vocals.',
  'ท่วงทำนองดรีมป็อปละมุนใจ ชวนเคลิ้มไปกับบรรยากาศธรรมชาติใต้แสงดาว':
    'Dreamy indie-pop melodies crafted for an enchanting outdoor night under the stars.',
  'ท่วงทำนองดรีมป๊อปละมุนใจ ชวนเคลิ้มไปกับบรรยากาศธรรมชาติใต้แสงดาว':
    'Dreamy indie-pop melodies crafted for an enchanting outdoor night under the stars.',
  'เดือดพล่านถึงขีดสุดกับแนวดนตรีฮาร์ดคอร์แร็ปเมทัล ชวนมอชพิตติดขอบเวที':
    'Explosive rap-metal and nu-metal energy built for the front-row mosh pit.',
  'จังหวะกีตาร์มีเสน่ห์ เมโลดี้ชวนโยกเบาๆ ในช่วงเวลาพระอาทิตย์ตกดิน':
    'Vibrant indie-pop guitar grooves perfect for the golden sunset hour.',
  'อินดี้ร็อกจากเชียงใหม่ ซาวด์ไซคีเดลิกเฉพาะตัวที่หาฟังสดได้ยาก':
    'Chiang Mai’s acclaimed indie-rock collective known for hypnotic psychedelic soundscapes.',

  // ── Standalone Short Words & Split JSX Fragments ──
  'ใบ': 'tickets',
  'ใบ (': 'tickets (',
  'ใบ):': 'tickets):',
  '/ ใบ': '/ ticket',
  'คน': 'attendees',
  'งาน': 'events',
  'งานใหม่': 'New Found',
  'โซน': 'Zone',
  'โซน)': 'Zones)',
  'โซน:': 'Zone:',
  'โซนที่': 'Zone',
  'ที่นั่ง': 'Seat',
  'ที่นั่ง:': 'Seat:',
  'คอนเสิร์ต': 'Concert',
  'เบอร์โทรศัพท์': 'Phone Number',
  'เบอร์โทรศัพท์:': 'Phone Number:',
  'ยอดชำระ': 'Amount',
  'ยอดชำระ:': 'Total Amount:',
  'สถานะ': 'Status',
  'สถานะจอง': 'Booking Status',
  'สถานะตั๋ว': 'Ticket Status',
  'สแกนเข้างาน': 'Checked In',
  'เวลาสแกน': 'Scanned At',
  'วันเวลาที่จอง': 'Booking Date',
  'การจัดการ': 'Actions',
  'ว่าง': 'Available',
  'เข้างาน': 'checked in',
  '% เข้างาน': '% checked in',
  'ออก (': 'Sign Out (',
  'พบ': 'Found',
  'ดูตั๋ว (': 'View Tickets (',
  'โซนบัตร และผังที่นั่งจำลอง (': 'Ticket Zones & Seat Maps (',
  'คลิกสวิตช์เพื่อเปิด/ปิดขายโซน หรือคลิก': 'Toggle zone sales or click',
  'เพื่อล็อกเก้าอี้': 'to lock/manage seats',
  'รายชื่อศิลปิน ·': 'Artist Lineup ·',
  'ผังที่นั่งแอดมิน ·': 'Admin Seat Map ·',
  'ตารางรายการ (': 'Table View (',
  'ล็อกแถว': 'Lock Row',
  'ปลดแถว': 'Unlock Row',
  'ต้องการล็อกสำรองที่นั่ง': 'Reserve & lock seat',
  'หรือไม่?': '?',
  'รายการตั๋วทั้งหมดในคำสั่งซื้อ #': 'All Tickets in Booking #',
  'สแกนเมื่อ:': 'Scanned at:',
  'แก้ไขข้อมูลคอนเสิร์ต ·': 'Edit Concert ·',
  'เวลา (': 'Time (',
  '(โดย': '(by',
  'ประวัติการสแกนรอบนี้ (': 'Recent Scans (',
  'ใช้ “': 'Use “',
  '” ใน': '” in ',
  ', ประเทศไทย': ', Thailand',
  'น.': 'hrs',
  '🎪 บัตรยืน': '🎪 Standing',
  '💺 บัตรนั่ง': '💺 Seated',
  '⛺ แคมป์ปิ้ง': '⛺ Camping',

  // ── Admin Dashboard Navigation & Headers ──
  'กรุณาเข้าสู่ระบบด้วยบัญชี Supervisor ที่หน้า /scanner ก่อนเปิด Admin':
    'Please sign in with an Organizer/Supervisor account first',
  'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง': 'An error occurred. Please try again.',
  'เซสชันหมดอายุ กรุณาเข้าสู่ระบบเจ้าของงานอีกครั้ง': 'Session expired. Please sign in again.',
  'โหลดข้อมูลล้มเหลว': 'Failed to load dashboard data',
  'ไม่สามารถโหลดข้อมูลที่นั่งได้': 'Failed to load seat map data',
  'เปลี่ยนสถานะคอนเสิร์ตไม่สำเร็จ': 'Failed to update concert status',
  'เปลี่ยนสถานะโซนสำเร็จ': 'Zone sales status updated',
  'เปลี่ยนสถานะโซนไม่สำเร็จ': 'Failed to update zone status',
  'รายการจองนี้ไม่มี LINE ID ของลูกค้า': 'This booking does not have a linked LINE ID',
  'ส่งตั๋วเข้า LINE ไม่สำเร็จ': 'Failed to resend tickets via LINE',
  'ยังไม่มีข้อมูลผู้ถือตั๋วสำหรับส่งออก': 'No attendee records available to export',
  'เลือกไฟล์ JPG, PNG หรือ WebP เท่านั้น': 'Please select a JPG, PNG, or WebP image file',
  'ขนาดไฟล์โปสเตอร์ต้องไม่เกิน 4 MB': 'Poster image file size must not exceed 4 MB',
  'อัปโหลดรูปโปสเตอร์สำเร็จ': 'Poster image uploaded successfully',
  'อัปโหลดรูปศิลปินสำเร็จ': 'Artist photo uploaded successfully',
  'อัปโหลดรูปไม่สำเร็จ': 'Failed to upload image',
  'เลือกวันและเวลาแสดงก่อนสร้างคอนเสิร์ต': 'Please select show date and time before creating the concert',
  'เลือกจังหวัดและสถานที่จัดงานก่อนสร้างคอนเสิร์ต': 'Please select province and venue before creating the concert',
  'อัปโหลดโปสเตอร์ก่อนสร้างคอนเสิร์ต': 'Please upload a concert poster before creating the concert',
  'สร้างและเผยแพร่คอนเสิร์ตใหม่เรียบร้อยแล้ว': 'New concert created and published successfully!',
  'สร้างคอนเสิร์ตไม่สำเร็จ': 'Failed to create concert',
  'กรอกชื่อศิลปินทุกคนก่อนบันทึก': 'Please fill in all artist names before saving',
  'บันทึกรายชื่อศิลปินเรียบร้อยแล้ว': 'Artist lineup saved successfully!',
  'บันทึกศิลปินไม่สำเร็จ': 'Failed to save artist lineup',
  'กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน': 'Please enter both username and password',
  'เข้าสู่ระบบไม่สำเร็จ': 'Sign in failed',
  'ออกจากระบบเรียบร้อยแล้ว': 'Signed out successfully',
  'ตั้งค่ารูปภาพจาก URL สำเร็จ': 'Image URL applied successfully',
  'เข้าสู่ระบบเจ้าของงาน': 'Organizer Sign In',
  'บัญชีเจ้าของงานแยกจากบัญชีพนักงานสแกนบัตร': 'Organizer account is separate from Gate Staff accounts',
  'Username เจ้าของงาน': 'Organizer Username',
  'รหัสผ่านใหม่': 'New Password',
  'ซ่อนรหัสผ่าน': 'Hide Password',
  'แสดงรหัสผ่าน': 'Show Password',
  'กำลังดำเนินการ…': 'Processing…',
  'กำลังดำเนินการ...': 'Processing...',
  'ตั้งรหัสผ่านใหม่': 'Reset Password',
  'เข้าสู่ระบบแดชบอร์ด': 'Sign In to Dashboard',
  'กลับเข้าสู่ระบบ': 'Back to Sign In',
  'ลืมรหัสผ่านเจ้าของงาน?': 'Forgot Organizer Password?',
  'กลับหน้าร้าน': 'Back to Store',
  'ระบบจัดการผู้จัดงาน SoundWave Pass': 'SoundWave Pass Organizer Console',
  'แผงควบคุมและสถิติคอนเสิร์ต': 'Concert Operations & Analytics Dashboard',
  '📊 ภาพรวม & ยอดขาย': '📊 Overview & Sales',
  '🎸 คอนเสิร์ต & ผังที่นั่ง': '🎸 Concerts & Seat Maps',
  '🧾 รายการจอง & ตั๋วลูกค้า': '🧾 Bookings & Attendees',
  '+ เพิ่มงานใหม่': '+ Create Concert',
  'Event Discovery Radar: ตรวจจับคอนเสิร์ตจริงในไทย พร้อมนำเข้าใน 1 คลิก':
    'Event Discovery Radar: Scan live concerts in Thailand & import in 1 click',
  'เรดาร์คอนเสิร์ต 🔔': 'Concert Radar 🔔',
  'สรุปยอดภาพรวมระบบ': 'System Overview & KPIs',
  'ตั๋วที่ขายแล้วทั้งหมด': 'Total Tickets Sold',
  'รายได้รวมทั้งหมด': 'Total Net Revenue',
  'สแกนเข้างานแล้ว (Check-in)': 'Checked-In Attendees',
  'คอนเสิร์ตในระบบ': 'Active Concerts',
  'กำลังเปิดจำหน่าย': 'Currently On Sale',
  'รายงานสรุปภาพรวมและการเงิน (Financial Summary)': 'Financial & Sales Breakdown by Concert',
  'ตรวจสอบสัดส่วนรายได้ ยอดขาย และความเคลื่อนไหวล่าสุดของทุกคอนเสิร์ต':
    'Monitor revenue share, ticket sales progress, and live capacity for every event',
  'ส่งออก CSV ทั้งหมด': 'Export All CSV',
  'รีเฟรชข้อมูล': 'Refresh Data',
  'คัดลอกลิงก์ร้าน': 'Copy Store Link',
  'รายได้รวม:': 'Total Revenue:',
  'ตั๋วที่ขายแล้ว:': 'Tickets Sold:',
  'จัดการโซน & ที่นั่ง': 'Manage Zones & Seats',
  'หน้าร้าน': 'Storefront',
  'จัดการคอนเสิร์ต, ผังที่นั่ง และสถานะการขาย': 'Manage Concerts, Seat Maps & Sales Status',
  'สลับสถานะเปิด-ปิดขายตั๋วทั้งระดับคอนเสิร์ตและระดับโซน พร้อมเปิดผังเก้าอี้ Interactive':
    'Toggle ticket sales per concert or per zone, and manage interactive seat locks',
  '+ สร้างคอนเสิร์ตใหม่': '+ Create New Concert',
  'เปิดจำหน่ายบัตร (ON_SALE)': 'On Sale (ON_SALE)',
  'พักการจำหน่ายชั่วคราว (PAUSED)': 'Sales Paused (PAUSED)',
  'ปิดการจำหน่าย (CLOSED)': 'Sales Closed (CLOSED)',
  'เร็วๆ นี้ (UPCOMING)': 'Upcoming (UPCOMING)',
  'จบงานแล้ว (COMPLETED)': 'Completed (COMPLETED)',
  '🟢 เปิดจำหน่ายบัตร (ON_SALE)': '🟢 On Sale (ON_SALE)',
  '⏸️ พักการจำหน่ายชั่วคราว (PAUSED)': '⏸️ Sales Paused (PAUSED)',
  '🔴 ปิดการจำหน่าย (CLOSED)': '🔴 Sales Closed (CLOSED)',
  '🗓️ เร็วๆ นี้ (UPCOMING)': '🗓️ Upcoming (UPCOMING)',
  '🏁 จัดงานเสร็จสิ้นแล้ว (COMPLETED)': '🏁 Completed (COMPLETED)',
  'เปิดจำหน่ายบัตร': 'Open Ticket Sales',
  'เปิดขาย': 'On Sale',
  'พักการจำหน่ายชั่วคราว': 'Pause Ticket Sales',
  'พักการขาย': 'Paused',
  'ปิดการจำหน่าย': 'Close Ticket Sales',
  'ปิดการจำหน่ายบัตรแล้ว': 'Ticket Sales Closed',
  'ปิดขาย': 'Closed',
  'แก้ไขชื่อ วันแสดง สถานที่ รูปภาพ และรายละเอียดคอนเสิร์ต':
    'Edit concert title, date, venue, poster, and details',
  'แก้ไขข้อมูล': 'Edit Concert',
  'ส่งออก CSV': 'Export CSV',
  'จัดการศิลปิน': 'Manage Lineup',
  'คลิกสวิตช์เพื่อเปิด/ปิดขายโซน หรือคลิก "ผังที่นั่ง Interactive" เพื่อล็อกเก้าอี้':
    'Toggle zone availability or click "Interactive Seat Map" to lock/manage seats',
  'สถานะขาย': 'Sales Status',
  'ชื่อโซน': 'Zone Name',
  'ประเภท': 'Category',
  'ประเภทบัตร': 'Ticket Category',
  'ราคา': 'Price',
  'ขายแล้ว / ความจุ': 'Sold / Capacity',
  'คงเหลือ': 'Available',
  'รายได้โซน': 'Zone Revenue',
  'ผังเก้าอี้แอดมิน': 'Admin Seat Map',
  'บัตรหมด': 'Sold Out',
  'ผังที่นั่ง Interactive': 'Interactive Seat Map',

  // ── Admin Orders & Attendees Table ──
  'รายการจองและข้อมูลผู้ถือตั๋ว (Orders & Attendees)': 'Bookings & Ticket Holders (Orders & Attendees)',
  'ค้นหาด่วนจากรหัสจอง รหัสตั๋ว เบอร์โทร หรือชื่อลูกค้า พร้อมส่งตั๋ว LINE ซ้ำและส่งออกไฟล์':
    'Quick search by booking code, ticket code, phone, or customer name with LINE resend & CSV export',
  'ส่งออก CSV รายชื่อผู้เข้างาน': 'Export Attendees CSV',
  'พิมพ์ค้นหาได้ทันที: รหัสจอง (SW-...), รหัสตั๋ว (SWP-...), เบอร์โทรศัพท์ หรือชื่อลูกค้า...':
    'Instant search: Booking Code (SW-...), Ticket Code (SWP-...), Phone, or Customer Name...',
  'ทุกสถานะการจอง': 'All Booking Statuses',
  'ชำระแล้ว / คืนเงินบางส่วน': 'Paid / Partially Refunded',
  'รหัสจอง / วันเวลา': 'Booking Code / Date',
  'ลูกค้า / เบอร์โทร': 'Customer / Phone',
  'คอนเสิร์ต / โซน': 'Concert / Zone',
  'ตั๋ว & ที่นั่ง': 'Tickets & Seats',
  'ส่งตั๋ว LINE': 'LINE Delivery',
  'ผูก LINE แล้ว': 'LINE Linked',
  'ไม่ระบุโซน': 'Unspecified Zone',
  'คลิกเพื่อขยายดูตั๋วทุกใบพร้อม QR Code และที่นั่งแยกรายคน':
    'Click to view individual tickets, QR codes, and seat numbers',
  'ไม่มีข้อมูลตั๋ว': 'No Tickets',
  '✓ ส่งแล้ว': '✓ Sent',
  'ส่งไม่สำเร็จ': 'Failed',
  'รอส่ง': 'Pending',
  'ไม่มี LINE': 'No LINE',
  'เปิดดูตั๋วรายใบพร้อม QR Code และที่นั่งแยกรายคน': 'View individual tickets & QR codes',
  'ส่งตั๋วเข้า LINE ซ้ำ': 'Resend tickets to LINE',
  'ส่ง LINE ซ้ำ': 'Resend LINE',
  'ยังไม่มีรายการจองในระบบ': 'No bookings found in the system',

  // ── Admin Create / Edit Concert Form ──
  'สร้างคอนเสิร์ตและกำหนดโซนบัตรใหม่': 'Create New Concert & Configure Ticket Zones',
  'กรอกข้อมูลงาน วันเวลาแสดง แผนที่สถานที่จัดงาน และกำหนดราคาของแต่ละโซน':
    'Fill in concert details, showtime, venue coordinates, and ticket zone pricing',
  '✕ ปิดฟอร์ม': '✕ Close Form',
  '1. ข้อมูลทั่วไปของคอนเสิร์ต': '1. General Concert Information',
  'ชื่อคอนเสิร์ต': 'Concert Title',
  'ชื่อคอนเสิร์ต *': 'Concert Title *',
  'เช่น SOUNDWAVE MUSIC FESTIVAL 2026': 'e.g. SOUNDWAVE MUSIC FESTIVAL 2026',
  'Slug สำหรับ URL (ภาษาอังกฤษ)': 'URL Slug (English)',
  'soundwave-festival (เว้นว่างไว้เพื่อสร้างอัตโนมัติ)': 'soundwave-festival (leave blank to auto-generate)',
  'คำอธิบายรายละเอียดคอนเสิร์ต': 'Concert Description',
  'คำอธิบายรายละเอียดงาน': 'Event Description',
  'ระบุจุดเด่น แนวเพลง กิจกรรมในงาน หรือสิ่งอำนวยความสะดวก...':
    'Describe highlights, music genres, stage activities, or facilities...',
  '2. วันที่และเวลาเริ่มแสดง': '2. Show Date & Start Time',
  'วันและเวลาเริ่มแสดง *': 'Show Date & Start Time *',
  'ตารางเวลาแสดง': 'Show Timetable',
  'เพิ่มเวลา ศิลปิน และเวที': 'Add performance time, artist, and stage',
  '+ เพิ่มช่วงเวลา': '+ Add Time Slot',
  'ชื่อศิลปิน': 'Artist Name',
  'เวที เช่น Main Stage': 'Stage e.g. Main Stage',
  '3. สถานที่จัดงานและพิกัดแผนที่': '3. Venue Location & Map Coordinates',
  'สถานที่จัดงานและแผนที่ *': 'Venue Location & Map *',
  '4. รูปโปสเตอร์คอนเสิร์ต': '4. Concert Poster Image',
  'ตัวอย่างโปสเตอร์': 'Poster Preview',
  'ลบรูปโปสเตอร์': 'Remove Poster',
  'คุณต้องการนำรูปโปสเตอร์ออกใช่หรือไม่?': 'Are you sure you want to remove the poster image?',
  'กำลังอัปโหลดรูปภาพ…': 'Uploading image…',
  'เปลี่ยนรูปโปสเตอร์': 'Change Poster Image',
  'เลือกรูปภาพโปสเตอร์งาน': 'Upload Concert Poster Image',
  'แนะนำขนาด 4:5 (1000×1250 px) — JPG, PNG, WebP ไม่เกิน 4 MB':
    'Recommended 4:5 ratio (1000×1250 px) — JPG, PNG, WebP up to 4 MB',
  'หรือวาง URL รูปภาพโดยตรง': 'Or paste direct image URL',
  'URL รูปภาพโปสเตอร์งาน': 'Concert Poster Image URL',
  'ใช้ URL นี้': 'Use This URL',
  '5. โซนบัตรและความจุ': '5. Ticket Zones & Capacity',
  '+ เพิ่มโซนอีก': '+ Add Another Zone',
  'ลบโซนนี้': 'Remove Zone',
  'เช่น Standing Pit A': 'e.g. Standing Pit A',
  'หรือพิมพ์ประเภทเอง เช่น VIP_LOUNGE': 'Or type custom category e.g. VIP_LOUNGE',
  'ราคา (บาท)': 'Price (THB)',
  'เช่น 2500': 'e.g. 2500',
  'จำนวนบัตรทั้งหมด': 'Total Capacity',
  'เช่น 500': 'e.g. 500',
  'กำลังบันทึกคอนเสิร์ต…': 'Saving concert…',
  'สร้างและเผยแพร่คอนเสิร์ต': 'Create & Publish Concert',
  'ลบศิลปินออกจากงาน': 'Remove Artist from Lineup',
  'ลบรูปศิลปิน': 'Remove Artist Photo',
  'ต้องการลบรูปใช่หรือไม่?': 'Are you sure you want to remove this photo?',
  'ยกเลิก': 'Cancel',
  'ยืนยันการลบ': 'Confirm Delete',
  'เพิ่มชื่อ เวที เวลา แนวเพลง และรูปภาพศิลปิน': 'Add artist name, stage, performance time, genre, and photo',
  'ปิด': 'Close',
  'ยังไม่มีศิลปิน เพิ่มรายชื่อแรกได้เลย': 'No artists yet — add the first artist below',
  'ชื่อเวที': 'Stage Name',
  'แนวเพลง (ไม่บังคับ)': 'Genre (Optional)',
  'เวลาแสดง เช่น 19:00–20:00 น.': 'Showtime e.g. 19:00–20:00',
  'วาง URL รูปศิลปิน (ถ้าไม่ต้องการอัปโหลดไฟล์)': 'Paste artist image URL (optional)',
  'ใช้ URL': 'Apply URL',
  'อัปโหลด': 'Upload',
  '+ เพิ่มศิลปิน': '+ Add Artist',
  'กำลังบันทึก…': 'Saving…',
  'บันทึกรายชื่อ': 'Save Lineup',
  'บันทึกการแก้ไข': 'Save Changes',
  'สถานะการจำหน่าย': 'Sales Status',
  'กรุณาระบุชื่อคอนเสิร์ต': 'Please enter the concert title',
  'กรุณาเลือกวันเวลาจัดแสดง': 'Please select the show date and time',
  'กรุณาระบุสถานที่จัดงาน': 'Please enter the venue location',
  'บันทึกการแก้ไขไม่สำเร็จ': 'Failed to save changes',

  // ── Concert Discovery Radar Modal ──
  'ตรวจหาคอนเสิร์ตไม่สำเร็จ': 'Failed to scan concert radar',
  'นำเข้าคอนเสิร์ตไม่สำเร็จ': 'Failed to import concert',
  'ตรวจจับคอนเสิร์ตและเฟสติวัลจริงในไทย 2026': 'Thailand Live Concert & Festival Radar 2026',
  'ศูนย์ตรวจจับคอนเสิร์ตใหม่ในไทย': 'Thailand Live Concert Discovery Center',
  'สแกนหาคอนเสิร์ตใหม่จากเว็บสด': 'Scan Live Web Sources for New Concerts',
  'สแกนเรดาร์สด': 'Scan Live Radar',
  'ระบบเรดาร์ซิงก์ข้อมูลงานจริง (Live Concert Feeds)': 'Live Concert Auto-Discovery Feed (ThaiTicketMajor)',
  'ระบบตรวจพบคอนเสิร์ตจริงที่จัดขึ้นในประเทศไทย คุณสามารถกด':
    'Real concerts discovered in Thailand. Click',
  '"นำเข้าสู่ระบบใน 1 คลิก"': '"Import in 1 Click"',
  'เพื่อสร้างคอนเสิร์ต โซนที่นั่ง ราคา และไลน์อัปศิลปินจริงเข้าสู่ระบบ SoundWave Pass ได้ทันที':
    'to instantly create the concert, venue zones, pricing, and artist lineup in SoundWave Pass.',
  'กำลังสแกนค้นหาคอนเสิร์ตจริงในไทย…': 'Scanning live concerts in Thailand…',
  'นำเข้าคอนเสิร์ตจริงทั้งหมดเข้าสู่ระบบแล้ว!': 'All discovered concerts have been imported!',
  'คอนเสิร์ตที่ตรวจพบบนเรดาร์ทั้งหมดถูกนำเข้าสู่ระบบ SoundWave Pass เรียบร้อยแล้ว สามารถดูและจัดการได้ที่แท็บ "คอนเสิร์ต & ผังที่นั่ง"':
    'All concerts on the radar have been imported into SoundWave Pass. You can manage them under the "Concerts & Seat Maps" tab.',
  'ปิดหน้าต่าง': 'Close Window',
  'งานใหม่พร้อมนำเข้า': 'Ready to Import',
  '🔴 ดึงสดจาก ThaiTicketMajor': '🔴 Live from ThaiTicketMajor',
  'ต้นทาง': 'Source',
  'ไฮไลท์ศิลปิน:': 'Featured Artists:',
  'กำลังนำเข้า…': 'Importing…',
  '📥 นำเข้าสู่ระบบ (1 คลิก)': '📥 Import to System (1-Click)',

  // ── Admin Seat Map Modal ──
  'ไม่สามารถล็อกที่นั่งได้': 'Failed to lock seat',
  'ไม่พบข้อมูลตั๋วสำรอง': 'Reserved seat record not found',
  'ปลดล็อกที่นั่งไม่สำเร็จ': 'Failed to unlock seat',
  'คืนเงิน/ยกเลิกตั๋วไม่สำเร็จ': 'Failed to refund/cancel ticket',
  'กรุณาระบุความจุเป็นจำนวนเต็มบวก': 'Please enter a valid positive integer for capacity',
  'กรุณาระบุราคาที่ถูกต้อง': 'Please enter a valid price',
  'อัปเดตความจุและราคาโซนเรียบร้อยแล้ว': 'Zone capacity and price updated successfully',
  'บันทึกความจุไม่สำเร็จ': 'Failed to update capacity',
  'ผังจำลอง (Visual Map)': 'Visual Seat Map',
  'ตารางรายชื่อ (Table)': 'Seat Table View',
  'ทั้งหมด': 'All',
  '🟢 ว่าง (คลิกเพื่อล็อก)': '🟢 Available (Click to Lock)',
  '🟪 ขายแล้ว': '🟪 Sold',
  '🟡 รอจ่ายเงิน': '🟡 Pending Payment',
  '🟧 สำรองไว้ (คลิกเพื่อปลด)': '🟧 Reserved (Click to Unlock)',
  'คลิกเก้าอี้ว่างเพื่อล็อก / คลิกสีส้มเพื่อปลดล็อกทันที':
    'Click an available seat to lock / Click an orange reserved seat to unlock',
  'ชื่อผู้จองสำรองด่วน:': 'Quick Reserve Label:',
  'เช่น ผู้สนับสนุน, แขก VIP, ล็อกหน้างาน': 'e.g. VIP Sponsor, Artist Guest, Hold',
  'ความจุ:': 'Capacity:',
  'ราคา:': 'Price:',
  'บันทึก…': 'Saving…',
  'อัปเดต': 'Update',
  '🎸 MAIN STAGE / เวทีการแสดง (SCREEN VIEW) 🎬': '🎸 MAIN STAGE / SCREEN VIEW 🎬',
  'ทิศทางด้านหน้าเวทีคอนเสิร์ต': 'Front of Stage Direction',
  'รหัสตั๋ว': 'Ticket Code',
  'ชื่อผู้ถือตั๋ว': 'Attendee Name',
  'รหัสการจอง': 'Booking Code',
  'สำรอง': 'Reserved',
  'ปลดสำรอง': 'Unlock',
  'คืนเงิน / ยกเลิก': 'Refund / Cancel',
  'ยังไม่มีตั๋วหรือที่นั่งที่ถูกจองในโซนนี้': 'No reserved or sold seats in this zone yet',
  'ขายแล้ว (ออกตั๋วสำเร็จ)': 'Sold (Ticket Issued)',
  'ที่นั่งสำรอง (ล็อกโดยแอดมิน)': 'Reserved Seat (Locked by Admin)',
  'ที่นั่งว่าง (พร้อมเปิดขาย)': 'Available Seat (Ready for Sale)',
  'กำลังรอชำระเงิน (Hold 10 นาที)': 'Pending Payment (10-Min Hold)',
  'ระบุชื่อผู้ขอสำรอง (เช่น VIP Sponsor, บัตรศิลปิน, หรือ Admin)':
    'Enter reservation label (e.g. VIP Sponsor, Artist Guest, or Admin)',
  'กำลังล็อก…': 'Locking…',
  '* เมื่อล็อกแล้ว ลูกค้าในหน้าร้านจะไม่สามารถคลิกเลือกที่นั่งนี้ได้':
    '* Once locked, customers on the storefront cannot select this seat.',
  'รหัสตั๋ว (Ticket Code):': 'Ticket Code:',
  'รหัสการจอง (Booking Code):': 'Booking Code:',
  'สถานะการเข้างาน (Gate):': 'Gate Check-in Status:',
  'สแกนเข้างานแล้ว': 'Checked In',
  'ยังไม่เข้างาน': 'Not Checked In',
  'ปลดล็อกที่นั่งนี้': 'Unlock This Seat',
  'คืนเงินและยกเลิกตั๋วใบนี้': 'Refund & Cancel This Ticket',

  // ── Booking Tickets Modal ──
  'ผู้จอง:': 'Customer:',
  'บัตรพร้อมใช้งาน': 'Valid Ticket',
  'ยกเลิก / คืนเงิน': 'Cancelled / Refunded',
  'บัตรยืน (GA)': 'General Admission (Standing)',
  'บัตรยืน': 'Standing',
  'บัตรนั่ง': 'Seated',
  'แคมป์ปิ้ง': 'Camping',
  'ดูตั๋ว': 'View Ticket',
  'พิมพ์ตั๋ว': 'Print Ticket',
  'ไม่พบตั๋วในรายการจองนี้': 'No tickets found in this booking',

  // ── Location Picker & Date Time Picker & Image Crop ──
  'ค้นหาสถานที่ไม่สำเร็จ': 'Venue search failed',
  'ประเทศไทย': 'Thailand',
  'จังหวัด': 'Province',
  'เลือกจังหวัดจากรายการ 77 จังหวัด': 'Select from 77 Thai provinces',
  'พิมพ์ค้นหา หรือเลือกจังหวัด': 'Search or select province',
  'ไม่พบจังหวัดนี้': 'Province not found',
  'พิมพ์ค้นหาหรือกดช่องเพื่อเลือกจาก 77 จังหวัด': 'Type to search or click to choose from 77 provinces',
  'สถานที่จัดงาน': 'Venue Name',
  'เลือกจังหวัดก่อน แล้วพิมพ์ชื่อสถานที่': 'Select a province first, then enter venue name',
  'ไม่พบสถานที่ตรงคำค้น คุณยังใช้ชื่อที่พิมพ์ได้': 'No matching preset venue — your custom venue name will be used',
  'แผนที่ประเทศไทย': 'Thailand Map',
  'แผนที่ประเทศไทยและสถานที่จัดงาน': 'Venue Map Location',
  'เลือกวันและเวลาแสดง': 'Select Show Date & Time',
  'วันที่': 'Date',
  'วันนี้': 'Today',
  'พรุ่งนี้': 'Tomorrow',
  '+7 วัน': '+7 Days',
  'รีเซ็ต': 'Reset',
  'คลิกเลือกวันที่': 'Click to pick a date',
  'ตั้งเวลาต่อ →': 'Set Time →',
  'ชั่วโมง': 'Hour',
  'นาที': 'Minute',
  'เวลากิจกรรมยอดนิยม:': 'Popular Showtimes:',
  'เลือกนาที:': 'Select Minute:',
  '← ย้อนกลับไปวันที่': '← Back to Calendar',
  'บันทึกเวลาแล้ว': 'Time Saved',
  'เปิดประตู': 'Gates Open',
  'เริ่มงาน': 'Show Starts',
  'วงหลัก': 'Main Act',
  'เฮดไลเนอร์': 'Headliner',
  '4:5 โปสเตอร์': '4:5 Poster',
  '16:9 แบนเนอร์': '16:9 Banner',
  '1:1 จัตุรัส/ศิลปิน': '1:1 Square / Artist',
  'เต็มรูป (ไม่ตัดขอบ)': 'Full Image (No Crop)',
  'บันทึกรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง': 'Failed to process image. Please try again.',
  'ไม่สามารถอ่านไฟล์ต้นฉบับได้': 'Unable to read original image file',
  'ปรับแต่งและจัดสัดส่วนรูปภาพ': 'Crop & Adjust Image Ratio',
  'เลือกสัดส่วนที่ต้องการ และลากภาพเพื่อเลือกส่วนสำคัญ ไม่ให้โดนตัดขอบ':
    'Choose an aspect ratio and drag to frame the key area',
  'เลือกสัดส่วนรูปภาพ (Aspect Ratio):': 'Select Aspect Ratio:',
  'พรีวิวรูปภาพ': 'Image Preview',
  'คลิกลากเพื่อเลื่อนตำแหน่งภาพ': 'Drag to reposition image',
  'การแสดงผล:': 'Fit Mode:',
  'เห็นทั้งรูป (ไม่ตัดขอบ)': 'Fit Full Image (No Crop)',
  'เต็มกรอบ (Crop)': 'Fill Frame (Crop)',
  'ซูมรูปภาพ': 'Zoom Image',
  'รีเซ็ตตำแหน่ง': 'Reset Position',
  'ใช้ภาพขนาดและสัดส่วนต้นฉบับ 100% โดยไม่ต้องตัดขอบใดๆ':
    'Use 100% original image dimensions without cropping',
  'ใช้รูปต้นฉบับ (ไม่ตัดขอบ)': 'Use Original (No Crop)',
  'ใช้รูปที่ครอบตัดนี้': 'Apply Cropped Image',

  // ── Scanner Page ──
  'กรุณากรอก Username และ Password ให้ครบถ้วน': 'Please enter both Username and Password',
  'Username หรือ Password ไม่ถูกต้อง': 'Invalid Username or Password',
  'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์หลังบ้านได้ (ตรวจสอบว่า Backend เปิดอยู่หรือไม่)':
    'Cannot connect to backend server (please verify backend is running)',
  'ตั้งรหัสผ่านไม่สำเร็จ': 'Failed to reset password',
  'เจ้าหน้าที่ไม่ระบุตัวตน': 'Unidentified Staff',
  'ไม่สามารถติดต่อเซิร์ฟเวอร์ตรวจสอบตั๋วได้': 'Cannot connect to ticket verification server',
  'ไม่พบกล้องในอุปกรณ์นี้': 'No camera detected on this device',
  'เบราว์เซอร์ยังไม่ได้รับอนุญาตให้ใช้กล้อง โปรดกดไอคอนกุญแจ 🔒 ข้างแถบที่อยู่เว็บ แล้วเลือก "อนุญาตการใช้กล้อง (Allow Camera)"':
    'Camera access denied. Click the lock icon 🔒 in the address bar and select "Allow Camera".',
  'ไม่พบกล้องที่เชื่อมต่อกับอุปกรณ์': 'No camera connected to this device',
  'กล้องกำลังถูกใช้งานโดยแอปพลิเคชันอื่น โปรดปิดโปรแกรมอื่นแล้วลองใหม่':
    'Camera is in use by another application. Please close other apps and try again.',
  'เปิดกล้องไม่สำเร็จ ตรวจสอบสิทธิ์การเข้าถึงกล้องบนเบราว์เซอร์':
    'Failed to start camera. Please check browser camera permissions.',
  'ไม่พบ QR Code ในรูปภาพที่เลือก กรุณาเลือกรูปภาพ QR Code ที่ชัดเจน':
    'No QR Code detected in the selected image. Please choose a clear QR Code image.',
  'ระบบสแกนตั๋วหน้างาน': 'Gate Ticket Scanner System',
  'ชื่อผู้ใช้ (Username)': 'Staff Username',
  'เช่น faye, nam, gate01': 'e.g. faye, nam, staff01',
  'รหัสผ่านใหม่ (Password)': 'New Password',
  'รหัสผ่าน (Password)': 'Password',
  'กรอกรหัสผ่าน': 'Enter password',
  'เข้าสู่ระบบตรวจตั๋ว': 'Sign In to Scanner',
  'ลืมรหัสผ่านพนักงาน?': 'Forgot Staff Password?',
  '⚡ บัญชีทดสอบด่วน (คลิกเพื่อเลือกทันที):': '⚡ Quick Demo Staff Accounts (Click to Autofill):',
  '📱 น้ำ (nam / 1234)': '📱 Nam (nam / 1234)',
  '👑 เฟย์ (faye / 1234)': '👑 Faye (faye / 1234)',
  '🚪 ประตู 1 (gate01 / 1234)': '🚪 Gate 1 (staff01 / 1234)',
  'หัวหน้าสตาฟฟ์': 'Supervisor',
  'เจ้าหน้าที่ตรวจตั๋ว': 'Gate Staff',
  'ปิดเสียงแจ้งเตือน': 'Mute Sound',
  'เปิดเสียงแจ้งเตือน': 'Enable Sound',
  'ออกจากระบบ': 'Sign Out',
  'โหมดสแกนคิวต่อเนื่อง': 'Continuous Queue Scan',
  '(ตรวจคนถัดไปอัตโนมัติ)': '(Auto-ready for next attendee)',
  'สลับกล้อง': 'Switch Camera',
  'ผู้ถือบัตร:': 'Attendee:',
  'บัตรยืน (Standing GA)': 'Standing GA',
  'รหัสตั๋ว:': 'Ticket Code:',
  'เวลาที่บันทึกเข้างาน:': 'Checked-In At:',
  'สแกนคนถัดไป (Next Attendee)': 'Scan Next Attendee',
  'กล้องสแกนเนอร์พร้อมทำงาน': 'QR Scanner Ready',
  'ส่อง QR Code จากแอป LINE, ตั๋วดิจิทัลบนมือถือ หรือตั๋วที่พิมพ์ใส่กระดาษ A4':
    'Scan QR Code from LINE app, mobile digital ticket, or printed A4 souvenir pass',
  'เปิดกล้องสแกนเนอร์': 'Start Camera Scanner',
  'พักกล้อง': 'Pause Camera',
  'เลือกรูปภาพ QR จากเครื่อง / LINE': 'Upload QR Image from Device / LINE',
  'หรือทดสอบด้วยการกรอกรหัสตั๋วโดยตรง (หรือยิงด้วยเครื่องบาร์โค้ด USB):':
    'Or verify manually by entering Ticket Code (or USB barcode scanner):',
  'เช่น SWP-STAN-6BJ6-5306': 'e.g. SWP-STAN-6BJ6-5306',
  'ตรวจ...': 'Verifying...',
  'ตรวจสอบ': 'Verify Ticket',

  // ── Concert Detail, Payment, Ticket & Souvenir Print Pages ──
  'ไม่พบคอนเสิร์ตนี้': 'Concert Not Found',
  'ศิลปิน': 'Artists',
  'เวทีหลัก': 'Main Stage',
  'กำลังโหลดรายละเอียดคอนเสิร์ต…': 'Loading concert details…',
  'กลับหน้าแรก': 'Back to Home',
  'กลับ': 'Back',
  '🟢 เปิดจำหน่ายบัตร': '🟢 Tickets On Sale',
  '⏸️ พักการจำหน่ายชั่วคราว': '⏸️ Sales Temporarily Paused',
  '🔴 ปิดจำหน่ายแล้ว': '🔴 Sales Closed',
  'เกี่ยวกับงาน': 'About the Event',
  'กิจกรรม': 'Activity',
  'ยังไม่มีการประกาศตารางเวลา': 'Schedule to be announced',
  'รายชื่อศิลปิน': 'Artist Lineup',
  'ยังไม่มีการประกาศรายชื่อศิลปิน': 'Artist lineup to be announced',
  'แผนที่จัดงาน': 'Venue Map',
  'โซนบัตร': 'Ticket Zones',
  '⏸️ คอนเสิร์ตนี้พักการจำหน่ายบัตรชั่วคราว': '⏸️ Ticket sales for this concert are temporarily paused',
  '🔴 คอนเสิร์ตนี้ปิดการจำหน่ายแล้ว': '🔴 Ticket sales for this concert are closed',
  'ยังไม่มีโซนบัตรสำหรับงานนี้': 'No ticket zones configured yet',
  'เลือกโซนจากผังคอนเสิร์ต': 'Select Zone on Venue Map',
  'เกิดข้อผิดพลาดในการชำระเงิน': 'Payment processing error',
  'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้': 'Unable to connect to server',
  'ไม่พบรายการจองนี้': 'Booking Not Found',
  'ชำระเงินเรียบร้อยแล้ว!': 'Payment Completed!',
  'รหัสการจอง:': 'Booking Code:',
  'เปิดดูตั๋ว': 'Open Ticket',
  'พิมพ์ A4': 'Print A4',
  'เปิดหน้าตั๋วเข้างานทันที': 'Open Digital Entry Ticket Now',
  'ดูประวัติการซื้อตั๋วทั้งหมดในเครื่องนี้': 'View All Purchased Tickets on This Device',
  'กลับสู่หน้าหลัก': 'Return to Home',
  'หมดเวลาทำรายการ': 'Booking Session Expired',
  'ทำรายการใหม่อีกครั้ง': 'Start New Booking',
  'โปรดชำระเงินภายใน:': 'Please complete payment within:',
  'สแกนชำระเงิน PromptPay': 'Scan PromptPay QR to Pay',
  'PROMPTPAY · พร้อมเพย์': 'PROMPTPAY · Instant QR Payment',
  'สแกนผ่านแอปธนาคารทุกธนาคาร': 'Scan with any Thai Mobile Banking App',
  'ที่นั่งที่ระบุ:': 'Assigned Seats:',
  'จำนวน:': 'Quantity:',
  'กำลังตรวจสอบยอดเงิน...': 'Verifying payment...',
  'ยืนยันการโอนเงินเรียบร้อยแล้ว': 'Confirm Payment Transfer (Simulate Paid)',
  '* ระบบจำลอง: กดเพื่อยืนยันการรับเงินและออกตั๋วเข้า LINE ทันที':
    '* Demo Mode: Click to simulate instant payment confirmation & issue LINE tickets',
  'กำลังโหลดข้อมูลบัตรคอนเสิร์ต...': 'Loading concert ticket...',
  'ไม่พบตั๋วใบนี้ในระบบ': 'Ticket Not Found',
  'กลับสู่หน้าแรก': 'Back to Home',
  'ย้อนกลับ': 'Back',
  'พิมพ์บัตร A4 ที่ระลึก': 'Print A4 Souvenir Ticket',
  'ผู้ถือบัตร': 'Ticket Holder',
  'โซน / ที่นั่ง': 'Zone / Seat',
  'แสดง QR Code นี้ที่ประตูทางเข้างานเพื่อตัดสิทธิ์': 'Present this QR Code at the venue gate for entry check-in',
  'กำลังจัดเตรียมแบบพิมพ์ A4...': 'Preparing A4 souvenir ticket...',
  'ไม่พบข้อมูลตั๋ว': 'Ticket Not Found',
  'A4 Souvenir Ticket — บัตรที่ระลึกคอนเสิร์ต': 'A4 Souvenir Ticket — Commemorative Concert Pass',
  'กระดาษ A4 แนวนอน · พร้อมเส้นปรุ บาร์โค้ด และ QR Code · กดปุ่มพิมพ์หรือ':
    'A4 Landscape · Perforated tear-off stub, barcode & QR Code · Click print or press',
  'พิมพ์บัตรทันที': 'Print Ticket Now',
  'ตัวอย่างการพิมพ์ (Preview) — จะพิมพ์บนกระดาษ A4 แนวนอน':
    'Print Preview — Formatted for A4 Landscape Paper',
  'Cut along the dashed line / ตัดตามรอยประ': 'Cut along the dashed line',
  'ADMIT ONE / เข้างาน 1 ท่าน': 'ADMIT ONE / 1 Attendee',
  'สแกนที่ประตูเข้างาน': 'Scan at Entry Gate',
  'ตัดตามรอยประเพื่อแยกก้านตั๋ว (Tear-off Stub) ออกจากบัตรหลัก':
    'Cut along the dashed line to separate the Tear-off Stub from the main souvenir pass',
  'การแจ้งเตือน': 'Notifications',
  'ปิดการแจ้งเตือน': 'Dismiss notification',

  // ── Team Portal & Insight Page ──
  'พื้นที่สำหรับทีมงาน': 'Team & Staff Portal',
  'เลือกหน้าระบบตามหน้าที่ของคุณ': 'Choose your operational workspace below',
  'เจ้าของงาน': 'Event Organizer',
  'จัดการคอนเสิร์ต โปสเตอร์ รายชื่อศิลปิน โซนบัตร และดูยอดขาย':
    'Manage concerts, posters, artist lineups, ticket zones, and live sales analytics',
  'ไปหน้าแดชบอร์ด': 'Open Admin Dashboard',
  'พนักงานหน้างาน': 'Gate Scanner Staff',
  'เข้าสู่ระบบตรวจสอบ QR และเช็กอินผู้เข้าร่วมงาน': 'Sign in to scan ticket QR codes and check in attendees',
  'ไปหน้าเครื่องสแกน': 'Open Gate Scanner',
  'กลับเว็บไซต์ SoundWave Pass': 'Back to SoundWave Pass Storefront',
  'กลับแดชบอร์ด': 'Back to Dashboard',
  'การเข้างานและ Check-in': 'Attendance & Gate Check-in',
  'รายได้และการชำระเงิน': 'Revenue & Payments',
  'ตั๋วที่ขายแล้ว': 'Tickets Sold',
  'รายละเอียดแบบเต็มหน้า สำหรับตรวจสอบข้อมูลและตัดสินใจจัดการงาน':
    'Full-page operational report for event monitoring and decision making',
  'ขายแล้ว': 'Sold',
  'เช็กอิน': 'Checked In',
  'รายได้สุทธิ': 'Net Revenue',
  'เข้างานแล้ว': 'Checked In',
  'ยังไม่มีข้อมูลรายการ': 'No records found',
  'ไม่ระบุวันที่': 'Date TBA',
  'ไม่ระบุสถานที่': 'Venue TBA',
  'กรุณาเข้าสู่ระบบเจ้าของงานก่อน': 'Please sign in as Organizer first',
  'โหลดข้อมูลไม่สำเร็จ': 'Failed to load data',
};

// Substring & Phrase Replacements (longer phrases MUST come before shorter substrings)
const PHRASE_REPLACEMENTS = [
  ['เทศกาลดนตรีร็อกและอินดี้เอาต์ดอร์ที่ยิ่งใหญ่ที่สุด แสงสีนีออนเต็มพิกัด 3 เวที 15 ศิลปิน พร้อมโซนกางเต็นท์สัมผัสธรรมชาติและอาหารสตรีทฟู้ดตลอดคืน',
   'The ultimate outdoor neon rock & indie music festival featuring 3 stages, 15 top artists, starlight camping grounds, and all-night street food.'],
  ['โซนบัตรยืนติดขอบเวทีหลัก สัมผัสความเดือดแบบชิดติดศิลปิน พร้อมช่องทางพิเศษ Fast Lane',
   'Front-row standing pit right against the main stage barrier with Fast Lane priority entry.'],
  ['โซนบัตรยืนกึ่งกลางลานคอนเสิร์ต จุดรับฟังระบบเสียงเซอร์ราวด์ที่ดีที่สุด กระโดดมันส์ได้เต็มที่',
   'Central soundwave standing pit engineered for the best surround acoustics and high-energy crowd experience.'],
  ['อัฒจันทร์ยกระดับมองเห็นทั้ง 3 เวทีแบบพาโนรามา มีเก้าอี้และแถวที่นั่งส่วนตัว พร้อมบาร์แยกเฉพาะโซน',
   'Elevated VIP grandstand with reserved seating, panoramic views of all stages, and an exclusive lounge bar.'],
  ['พื้นที่กางเต็นท์ใต้แสงดาว รวมสิทธิ์เข้างานทั้ง 2 วัน ห้องอาบน้ำและจุดชาร์จไฟตลอด 24 ชม.',
   'Starlight camping grounds including a 2-day festival pass, 24-hour showers, and charging stations.'],
  ['โซนนี้ไม่มีการระบุหมายเลขที่นั่งเฉพาะ ระบบจึงแสดงผลเป็นตารางจัดการโควตาและรายชื่อผู้ถือตั๋ว (',
   'This zone is General Admission without fixed seat numbers. Manage capacity and view ticket holders ('],
  ['ใบ) เป็นค่าเริ่มต้น สามารถปรับเปลี่ยนความจุและราคาต่อใบได้ทันที',
   'tickets). You can update capacity and price per ticket anytime.'],
  ['โซนบัตรยืน / แคมป์ปิ้ง (General Admission -', 'Standing / Camping Zone (General Admission -'],
  ['ดึงข้อมูลสดอัตโนมัติจาก ThaiTicketMajor', 'Live synced from ThaiTicketMajor'],
  ['ดึงข้อมูลสดจาก ThaiTicketMajor สำเร็จ', 'Live synced from ThaiTicketMajor'],
  ['ดึงสดจาก ThaiTicketMajor', 'Live from ThaiTicketMajor'],
  ['ตามรายการงานแสดงของ ThaiTicketMajor', 'as listed on ThaiTicketMajor'],
  ['ตามประกาศ ThaiTicketMajor', 'per official ThaiTicketMajor announcement'],
  ['รายการเทศกาลในไทย', 'Thailand festival catalog'],
  ['คอนเสิร์ตในกรุงเทพฯ วันที่', 'Live concert in Bangkok on'],
  ['คอนเสิร์ตวันที่', 'Official live concert on'],
  ['รอบการแสดงวันที่', 'Show dates:'],
  ['รอบการแสดง:', 'Show dates:'],
  ['รอบการแสดง', 'Show dates:'],
  ['สถานที่:', 'Venue:'],
  ['งานแสดงวันที่', 'Live event on'],
  ['เทศกาลดนตรีและศิลปะวันที่', 'Music & arts festival on'],
  ['เทศกาลดนตรีวันที่', 'Music festival on'],
  ['ข้อมูลบัตรและการซื้อ:', 'Official ticket info:'],
  ['เปิดประตูเข้าฮอลล์ (Doors Open)', 'Doors Open'],
  // Venues inside composite strings
  ['Volume Livehouse ชั้น B, The Street Ratchada', 'Volume Livehouse (Floor B), The Street Ratchada'],
  ['เซ็นทรัลเวิลด์ ไลฟ์, ชั้น 8 เซ็นทรัลเวิลด์', 'centralwOrld LIVE (8F), centralwOrld Bangkok'],
  ['SiamPic Hall ชั้น 7, สยามสแควร์วัน', 'SiamPic Hall (7F), Siam Square One'],
  ['หอประชุมมหิดลสิทธาคาร มหาวิทยาลัยมหิดลศาลายา', 'Prince Mahidol Hall, Mahidol University Salaya'],
  ['เมืองไทยรัชดาลัย เธียเตอร์', 'Muangthai Rachadalai Theatre'],
  ['ยูเนี่ยน ฮอลล์ ชั้น F6 ศูนย์การค้ายูเนี่ยน มอลล์', 'Union Hall (6F), Union Mall Bangkok'],
  ['อิมแพ็ค อารีน่า เมืองทองธานี', 'IMPACT Arena, Muang Thong Thani'],
  ['ราชมังคลากีฬาสถาน', 'Rajamangala National Stadium, Bangkok'],
  ['ยูโอบี ไลฟ์, เอ็มสเฟียร์', 'UOB LIVE, EMSPHERE Bangkok'],
  ['บีซีซี ฮอลล์ เซ็นทรัล พลาซ่า ลาดพร้าว ชั้น 5', 'BCC Hall (5F), Central Ladprao'],
  ['MCC HALL ชั้น 4, เดอะมอลล์ไลฟ์สโตร์ งามวงศ์วาน', 'MCC Hall (4F), The Mall Lifestore Ngamwongwan'],
  ['MCC HALL, เดอะมอลล์ไลฟ์สโตร์ งามวงศ์วาน', 'MCC Hall, The Mall Lifestore Ngamwongwan'],
  ['ธันเดอร์โดม สเตเดียม', 'Thunderdome Stadium, Muang Thong Thani'],
  ['ธันเดอร์โดม เมืองทองธานี', 'Thunderdome, Muang Thong Thani'],
  ['หอประชุม จุฬาลงกรณ์มหาวิทยาลัย', 'Chulalongkorn University Auditorium'],
  ['อิมแพ็ค เอ็กซิบิชั่น ฮอลล์ 5, เมืองทองธานี', 'IMPACT Exhibition Hall 5, Muang Thong Thani'],
  ['แจ้งวัฒนะ ฮอลล์, เซ็นทรัลแจ้งวัฒนะ ชั้น 5.5', 'Chaengwattana Hall (5.5F), Central Chaengwattana'],
  ['ยูเนี่ยน ฮอลล์, ศูนย์การค้ายูเนี่ยน มอลล์', 'Union Hall, Union Mall Bangkok'],
  ['ศูนย์วัฒนธรรมแห่งประเทศไทย หอประชุมใหญ่', 'Thailand Cultural Centre (Main Hall)'],
  ['สนามกีฬาแห่งชาติ ศุภชลาศัย', 'Suphachalasai National Stadium, Bangkok'],
  ['เอ็ม เธียเตอร์ (ถ.เพชรบุรีตัดใหม่)', 'M Theatre (New Phetchaburi Rd.)'],
  ['หอแสดงดนตรี วิทยาลัยดุริยางคศิลป์ ม.มหิดล(ศาลายา)', 'MACM Hall, College of Music, Mahidol University'],
  ['Oasis Outdoor Arena, สวนผึ้ง ราชบุรี', 'Oasis Outdoor Arena, Suan Phueng, Ratchaburi'],
  ['บัตรยืนทั่วไป', 'General Standing'],
  ['บัตรนั่ง VIP', 'VIP Seated'],
  ['เวทีอินดี้ซินธ์', 'Indie Synth Stage'],
  ['เวทีอะคูสติก & ดรีมป็อป', 'Acoustic & Dream Pop Stage'],
  ['เวทีหลัก', 'Main Stage'],
  ['เสาร์ 28 พ.ย. 2026', 'Sat, 28 Nov 2026'],
  ['อาทิตย์ 29 พ.ย. 2026', 'Sun, 29 Nov 2026'],
  // Dynamic Admin, Seat Map & Booking phrases (longer phrases first!)
  ['ปลดล็อกทั้งแถว', 'Unlock Row'],
  ['ล็อกทั้งแถว', 'Lock Row'],
  ['(ว่าง) - คลิกเพื่อล็อกสำรอง', '(Available) - Click to Lock'],
  [') - คลิกเพื่อปลดล็อก', ') - Click to Unlock'],
  [') - คลิกดูรายละเอียด', ') - Click for Details'],
  ['(สำรองโดย:', '(Reserved by:'],
  ['(ขายแล้ว:', '(Sold to:'],
  ['(รอชำระเงิน:', '(Pending Payment:'],
  ['ว่างสำหรับจำหน่าย (ราคา', 'is available for sale (Price'],
  ['ข้อมูลผู้ถือตั๋ว:', 'Attendee:'],
  ['ยืนยันล็อกที่นั่ง', 'Confirm Seat Lock'],
  ['จากความจุทั้งหมด', 'of total capacity'],
  ['จากตั๋วที่ขายแล้ว', 'of sold tickets'],
  ['ราคาเฉลี่ยต่อใบ', 'Avg. ticket price'],
  ['รายการชำระแล้ว', 'paid orders'],
  ['รายการรอชำระเงิน', 'pending orders'],
  ['ไม่มีที่นั่งสำรองในแถว', 'No reserved seats in row'],
  ['ที่นั่งว่าง', 'available seats'],
  ['ที่นั่งสำรอง', 'reserved seats'],
  ['ลบช่วงเวลา', 'Remove Slot'],
  ['เวลาแสดง', 'Slot'],
  ['ไม่พบรายการที่ตรงกับ', 'No records matching'],
  ['(สตาฟฟ์:', '(Staff:'],
  ['พิมพ์ชื่อสถานที่ใน', 'Enter venue name in '],
  ['เปลี่ยนสถานะคอนเสิร์ตเป็น', 'Concert status updated to'],
  ['คัดลอกลิงก์ร้านคอนเสิร์ต', 'Copied store link for'],
  ['แล้ว พร้อมส่งต่อให้ลูกค้า!', '— ready to share!'],
  ['ลิงก์ร้านค้า:', 'Store Link:'],
  ['ส่งตั๋วเข้า LINE ลูกค้า', 'Sent tickets to LINE'],
  ['ส่งออกรายชื่อผู้เข้างาน', 'Exported'],
  ['รายการเป็น CSV เรียบร้อยแล้ว', 'attendee records to CSV'],
  ['ยินดีต้อนรับคุณ', 'Welcome,'],
  ['ต้องการลบ', 'Are you sure you want to remove'],
  ['ออกจากรายชื่อใช่หรือไม่?', 'from the lineup?'],
  ['ศิลปินคนนี้', 'this artist'],
  ['ล็อกสำรองที่นั่งแถว', 'Locked row'],
  ['ปลดล็อกที่นั่งแถว', 'Unlocked row'],
  ['ล็อกสำรองที่นั่ง', 'Locked seat'],
  ['ปลดล็อกที่นั่ง', 'Unlocked seat'],
  ['คืนโควตาเรียบร้อย', 'and restored quota'],
  ['ยืนยันการยกเลิกตั๋วที่นั่ง', 'Confirm cancelling ticket for seat'],
  ['และคืนโควตาบัตร?', 'and restoring quota?'],
  ['ยกเลิกตั๋วที่นั่ง', 'Cancelled ticket for seat'],
  ['และคืนโควตาสำเร็จ', 'and restored quota'],
  ['ที่นั่งในแถว', 'All seats in row'],
  ['ถูกใช้งานหรือล็อกเต็มแล้ว', 'are already occupied or locked'],
  ['ไม่สามารถปลดล็อกแถว', 'Failed to unlock row'],
  ['ไม่สามารถล็อกแถว', 'Failed to lock row'],
  ['ระบบได้ยกเลิกคำสั่งจอง', 'Booking'],
  ['และคืนโควต้าที่นั่งแล้ว', 'has been cancelled and seat quota restored.'],
  ['เบราว์เซอร์ยังไม่ได้รับอนุญาตให้ใช้กล้อง โปรดกดไอคอนกุญแจ 🔒 ข้างแถบที่อยู่เว็บ แล้วเลือก',
   'Camera access denied. Click the lock icon 🔒 in the address bar and select'],
  ['"อนุญาตการใช้กล้อง (Allow Camera)"', '"Allow Camera"'],
  ['อัปเดตข้อมูลคอนเสิร์ต', 'Updated concert'],
  ['สแกนเรดาร์สดสำเร็จ! พบงานใหม่พร้อมนำเข้า', 'Live radar scan complete! Found'],
  ['นำเข้าคอนเสิร์ต', 'Imported'],
  ['สำเร็จ พร้อมเปิดขายทันที!', 'successfully — now on sale!'],
  ['ค้นพบ', 'Found'],
  ['เรียบร้อยแล้ว', 'successfully'],
  ['สำเร็จแล้ว!', 'successfully!'],
  ['สำเร็จแล้ว', 'successfully'],
  ['โปสเตอร์', 'Poster'],
  ['แผนที่', 'Map'],
  ['งานสด', 'live events'],
  ['เหลือ', 'Remaining'],
  // Thai full months
  ['มกราคม', 'January'],
  ['กุมภาพันธ์', 'February'],
  ['มีนาคม', 'March'],
  ['เมษายน', 'April'],
  ['พฤษภาคม', 'May'],
  ['มิถุนายน', 'June'],
  ['กรกฎาคม', 'July'],
  ['สิงหาคม', 'August'],
  ['กันยายน', 'September'],
  ['ตุลาคม', 'October'],
  ['พฤศจิกายน', 'November'],
  ['ธันวาคม', 'December'],
  // Thai short months
  ['ม.ค.', 'Jan'],
  ['ก.พ.', 'Feb'],
  ['มี.ค.', 'Mar'],
  ['เม.ย.', 'Apr'],
  ['พ.ค.', 'May'],
  ['มิ.ย.', 'Jun'],
  ['ก.ค.', 'Jul'],
  ['ส.ค.', 'Aug'],
  ['ก.ย.', 'Sep'],
  ['ต.ค.', 'Oct'],
  ['พ.ย.', 'Nov'],
  ['ธ.ค.', 'Dec'],
  // Thai day prefixes in date strings
  ['วันอาทิตย์ที่', 'Sunday,'],
  ['วันจันทร์ที่', 'Monday,'],
  ['วันอังคารที่', 'Tuesday,'],
  ['วันพุธที่', 'Wednesday,'],
  ['วันพฤหัสบดีที่', 'Thursday,'],
  ['วันศุกร์ที่', 'Friday,'],
  ['วันเสาร์ที่', 'Saturday,'],
  ['อาทิตย์ที่', 'Sun,'],
  ['จันทร์ที่', 'Mon,'],
  ['อังคารที่', 'Tue,'],
  ['พุธที่', 'Wed,'],
  ['พฤหัสบดีที่', 'Thu,'],
  ['ศุกร์ที่', 'Fri,'],
  ['เสาร์ที่', 'Sat,'],
  ['วันอาทิตย์', 'Sunday'],
  ['วันจันทร์', 'Monday'],
  ['วันอังคาร', 'Tuesday'],
  ['วันพุธ', 'Wednesday'],
  ['วันพฤหัสบดี', 'Thursday'],
  ['วันศุกร์', 'Friday'],
  ['วันเสาร์', 'Saturday'],
  [', ประเทศไทย', ', Thailand'],
  ['กรุงเทพมหานคร', 'Bangkok'],
];

// Context-aware Regex Replacements (units with numbers, Buddhist Era years, seat tooltips, etc.)
const REGEX_REPLACEMENTS = [
  // Buddhist Era years 2567-2572 -> 2024-2029
  [/\b2567\b/g, '2024'],
  [/\b2568\b/g, '2025'],
  [/\b2569\b/g, '2026'],
  [/\b2570\b/g, '2027'],
  [/\b2571\b/g, '2028'],
  // Number + unit patterns
  [/(\d[\d,]*)\s*ใบ/g, '$1 tickets'],
  [/(\d[\d,]*)\s*คน/g, '$1 attendees'],
  [/(\d[\d,]*)\s*งานใหม่/g, '$1 new events'],
  [/(\d[\d,]*)\s*งาน/g, '$1 events'],
  [/(\d[\d,]*)\s*โซน/g, '$1 zones'],
  [/(\d[\d,]*)%\s*เข้างาน/g, '$1% checked in'],
  [/ทั้งหมด\s*(\d[\d,]*)\s*ที่นั่งสำเร็จ/g, '($1 seats) successfully'],
  [/ทั้งหมด\s*(\d[\d,]*)\s*ที่นั่งเรียบร้อย/g, '($1 seats) successfully'],
  [/(\d[\d,]*)\s*ที่นั่ง/g, '$1 seats'],
  [/ที่นั่ง\s+([A-Z0-9-]+)/g, 'Seat $1'],
  [/โซนที่\s*(\d+)/g, 'Zone $1'],
  [/รูป\s+(.+)/g, 'Photo of $1'],
  [/\s*น\.$/g, ''],
  [/\s*น\.\s*/g, ' '],
  [/\s+ได้$/g, ''],
  [/\s+และ\s+/g, ' & '],
];

const THAI_CHAR_RE = /[\u0E01-\u0E3A\u0E40-\u0E5B]/;

function translateThaiString(rawText) {
  if (!rawText || typeof rawText !== 'string' || !THAI_CHAR_RE.test(rawText)) return rawText;
  const leading = rawText.match(/^\s*/)?.[0] || '';
  const trailing = rawText.match(/\s*$/)?.[0] || '';
  const trimmed = rawText.trim();
  if (EXACT_MAP[trimmed]) {
    return leading + EXACT_MAP[trimmed] + trailing;
  }
  let out = trimmed;
  for (const [th, en] of PHRASE_REPLACEMENTS) {
    if (out.includes(th)) {
      out = out.split(th).join(en);
    }
  }
  for (const [re, replacement] of REGEX_REPLACEMENTS) {
    out = out.replace(re, replacement);
  }
  return leading + out + trailing;
}

// WeakMaps to store original Thai text on DOM nodes and attributes so switching back to TH is 100% lossless
const originalTextNodeMap = new WeakMap();
const originalAttrMap = new WeakMap();
const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label'];

function applyDomTranslation(lang) {
  if (typeof document === 'undefined' || !document.body) return;

  // 1. Walk Text Nodes
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  let node;
  while ((node = walker.nextNode())) {
    const parentTag = node.parentElement?.tagName;
    if (parentTag === 'SCRIPT' || parentTag === 'STYLE' || parentTag === 'TEXTAREA') continue;

    const currentVal = node.nodeValue || '';
    if (lang === 'en') {
      if (THAI_CHAR_RE.test(currentVal)) {
        originalTextNodeMap.set(node, currentVal);
        const translated = translateThaiString(currentVal);
        if (translated !== currentVal) {
          node.nodeValue = translated;
        }
      }
    } else if (originalTextNodeMap.has(node)) {
      const orig = originalTextNodeMap.get(node);
      originalTextNodeMap.delete(node);
      if (orig && node.nodeValue !== orig) {
        node.nodeValue = orig;
      }
    }
  }

  // 2. Walk Element Attributes (placeholder, title, aria-label)
  const elements = document.body.querySelectorAll('[placeholder],[title],[aria-label]');
  elements.forEach((el) => {
    let savedAttrs = originalAttrMap.get(el);
    for (const attr of TRANSLATABLE_ATTRS) {
      const val = el.getAttribute(attr);
      if (!val) continue;
      if (lang === 'en') {
        if (THAI_CHAR_RE.test(val)) {
          if (!savedAttrs) {
            savedAttrs = {};
            originalAttrMap.set(el, savedAttrs);
          }
          savedAttrs[attr] = val;
          const translated = translateThaiString(val);
          if (translated !== val) {
            el.setAttribute(attr, translated);
          }
        }
      } else if (savedAttrs && savedAttrs[attr]) {
        const origVal = savedAttrs[attr];
        delete savedAttrs[attr];
        if (el.getAttribute(attr) !== origVal) {
          el.setAttribute(attr, origVal);
        }
      }
    }
  });
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('soundwave_lang') || 'th';
    } catch {
      return 'th';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('soundwave_lang', lang);
    } catch {
      /* ignore */
    }
    applyDomTranslation(lang);

    if (lang !== 'en') return undefined;

    const obsConfig = {
      childList: true,
      subtree: true,
      characterData: true,
    };

    const observer = new MutationObserver(() => {
      observer.disconnect();
      applyDomTranslation('en');
      observer.observe(document.body, obsConfig);
    });

    observer.observe(document.body, obsConfig);

    return () => {
      observer.disconnect();
    };
  }, [lang]);

  const toggleLang = useCallback(() => setLang((prev) => (prev === 'th' ? 'en' : 'th')), []);
  const t = useCallback((thText, enText) => (lang === 'en' ? enText : thText), [lang]);
  const trData = useCallback(
    (rawText) => {
      if (!rawText || typeof rawText !== 'string' || lang !== 'en') return rawText;
      return translateThaiString(rawText);
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, trData }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
