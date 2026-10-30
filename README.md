# 🎸 SoundWave Pass — Concert Ticketing & Event Radar System

🌐 **Live Web Demo (Vercel):** [https://soundwave-pas.vercel.app](https://soundwave-pas.vercel.app)

ระบบจองบัตรคอนเสิร์ตตามผังสถานที่จริง (2-Step Venue & Seat Selection), เรดาร์ดึงคอนเสิร์ตสดจาก ThaiTicketMajor (Auto-Discovery Radar), ระบบส่งตั๋วดิจิทัลเข้า LINE OA และสแกนเนอร์ตรวจตั๋วหน้างาน รองรับ 2 ภาษา (`TH | EN`)

---

## 🚀 วิธีติดตั้งและรันโปรเจกต์ (สำหรับทีมงานหลัง Clone)

### 1. เตรียมฐานข้อมูล MySQL 8.0
สร้างฐานข้อมูลชื่อ `soundwave_db` บน MySQL เครื่องของคุณ:
```sql
CREATE DATABASE IF NOT EXISTS soundwave_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. ตั้งค่า Backend & นำเข้าข้อมูลชุดเดียวกันทั้งทีม
```bash
cd backend
npm install
cp .env.example .env
# แก้ไข DATABASE_URL ในไฟล์ .env ให้ตรงกับรหัสผ่าน MySQL ของเครื่องคุณ
# ตัวอย่าง: DATABASE_URL="mysql://root@127.0.0.1:3306/soundwave_db"

npx prisma db push
npm run db:seed
npm run db:import
npm run dev
```
> 💡 คำสั่ง `npm run db:import` จะนำเข้าข้อมูลชุดเดียวกับของทีมจากไฟล์ `backend/prisma/shared-data.json` (4 คอนเสิร์ตหลักบนหน้าเว็บ, 10 โซนที่นั่ง, 58 รายการในเรดาร์, 8 รายการจอง และ 18 ใบตั๋ว)
> หากมีการแก้ไขข้อมูลในฐานข้อมูลและต้องการอัปเดตให้เพื่อนในทีม ใช้คำสั่ง `npm run db:export` แล้ว Commit ไฟล์ `backend/prisma/shared-data.json` ขึ้น GitHub ได้เลย

### 3. รัน Frontend
เปิด Terminal อีกหน้าต่าง:
```bash
cd frontend
npm install
npm run dev
```
- **หน้าเว็บผู้ซื้อบัตร (Storefront):** `http://localhost:5173`
- **พื้นที่ทีมงาน (Team Portal / Scanner / Admin):** `http://localhost:5173/team`
- **Backend API:** `http://localhost:5000/api/health`

---

## 🔑 บัญชีทดสอบเริ่มต้น (หลังรัน `db:seed` หรือ `db:import`)
- **Organizer (เจ้าของงาน - `/admin`):** ชื่อผู้ใช้ `owner` / รหัสผ่าน `1234`
- **Gate Staff & Supervisor (`/scanner`):** ชื่อผู้ใช้ `faye`, `nam`, หรือ `staff01` / รหัสผ่าน `1234`
