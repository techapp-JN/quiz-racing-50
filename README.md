# 🎮 QUIZ JUSTNEW

**“ตอบให้ไว แข่งให้สุด ใครจะเป็น Champion?”**
เว็บเกม Multiplayer สไตล์ Kahoot แต่เน้นการแข่งขันและ Racing Animation รองรับผู้เล่น 50 คน ออกแบบมาสำหรับนำไปเซ็ตอัพและเล่นคลาส อบรม สัมมนา ฟรี 100%

## ✨ Features
- 🏎️ **Racing UI** - รถ/ตัวละครของผู้เล่นจะวิ่งไปข้างหน้าเมื่อตอบถูกตามลำดับคะแนน
- 📱 **Mobile First** - หน้าจอผู้เล่นใช้งานง่ายผ่านมือถือเพียงมือเดียว ปุ่มกดขนาดใหญ่
- 👥 **50 Concurrent Players** - รองรับผู้เล่นพร้อมกันกว่า 50 คน โดยใช้โครงสร้างพื้นฐาน Free Tier
- ⚡ **Real-time Status** - อัปเดตสถานะเกม คะแนน และอันดับแบบเรียลไทม์
- 🔗 **QR Code Join** - พิธีกรเปิดหน้าเดียว ผู้เล่นใช้มือถือสแกนเพื่อเข้าร่วมได้เลย ไม่ต้องโหลดแอป

## 🏗️ Technology Stack (Free Tier)
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend & Database**: Supabase (PostgreSQL)
- **Real-time Multiplayer**: Supabase Broadcast / Postgres Changes
- **Hosting**: Vercel (ฟรี), หรือ Netlify (ฟรี)

> **📝 Note เรื่อง Free Tier**: 
> Supabase มีแบบ Free Tier รองรับ 200 Concurrent Connections (เพียงพอสำหรับ 50 คน) DB ขนาด 500MB
> Vercel Free Tier เพียงพอสำหรับการรัน Next.js สำหรับเกมนี้

---

## 🚀 ก้าวแรก: วิธีนำไปใช้งานบนเครื่อง (Local Development)

### 1. ติดตั้ง Dependencies
```bash
cd quiz-racing-50
npm install
```

### 2. ตั้งค่า Database (Supabase)
1. ไปที่ [Supabase](https://supabase.com/) และสร้างโปรเจกต์ใหม่ (ฟรี)
2. ไปที่เมนู **SQL Editor** มองหาส่วน Query
3. กอปปี้โค้ดทั้งหมดที่อยู่ในไฟล์ `supabase-setup.sql` ในโปรเจกต์นี้ 
4. นำไปวางแล้วกด **Run** เพื่อสร้างตารางข้อมูล เกมจะทำงานไม่ได้ถ้ายังไม่ทำขั้นตอนนี้

### 3. ตั้งค่า Environment Variables
ในโฟลเดอร์หลัก สร้างไฟล์ `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...................
```
*(หาค่าเหล่านี้ได้จากโปรเจกต์ Supabase -> Settings -> API)*

### 4. รันระบบ 
```bash
npm run dev
```

---

## 🌍 วิธีเปิดให้ทุกคนเล่นฟรี (Deployment)

เพื่อให้คนอื่นใช้มือถือเล่นได้จริง เราต้องนำโค้ดไปขึ้นเซิฟเวอร์ (Deploy) บนระบบที่ให้บริการฝากเว็บฟรี:

1. นำโค้ดนี้ผลักขึ้น **GitHub** ของคุณ (สร้าง Repository ใหม่)
2. สมัครใช้งาน [Vercel](https://vercel.com/) (ฟรี)
3. เลือก **Add New Project** แล้ว Import แหล่งโค้ดจาก GitHub ของคุณ
4. ในขั้นตอน Configure ให้หาช่อง **Environment Variables**
5. ใส่ค่า `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY` แบบเดียวกันกับตอนรันบนเครื่อง
6. กด **Deploy**
7. รอประมาณ 1 นาที คุณจะได้ URL จริงเช่น `https://quiz-racing-50-xyz.vercel.app`

### 🎈 วิธีเล่น
- **พิธีกร**: นำ URL นั้นไปเปิดบนคอมพิวเตอร์ที่ต่อโปรเจกเตอร์ กด "สำหรับพิธีกร" > "สร้างเกมใหม่" เพื่อรับ QR Code
- **ผู้เล่น**: ใช้กล้องมือถือสแกน QR Code บนจอโปรเจกเตอร์ พิมพ์ชื่อ แล้วรอเริ่มเกมได้เลย!

---

## 🛠️ โหมดจำลอง 50 Bot (Demo Mode)

เนื่องจากระบบใช้ Realtime WebSocket การทดสอบด้วยระบบ Bot 50 ตัวในครั้งแรกอาจทำให้เบราว์เซอร์กินทรัพยากร สำหรับการทดสอบ 50 คนให้สมบูรณ์ แนะนำให้เปิดด้วยเบราว์เซอร์โหมดไม่ระบุตัวตน (Incognito) หลายๆ แท็บ หรือส่งให้เพื่อนในองค์กรทดสอบ หากใช้ Next.js โดยไม่ตั้ง DB ระบบจะรัน Mock State ให้คุณกดทดสอบ UI ปุ่มได้อย่างอิสระโดยไม่ต้องพึ่งเซิฟเวอร์ 

---

## ⚠️ ปัญหาที่พบบ่อย (Troubleshooting)

**1. ผู้เล่นเข้าไม่ได้ / สแกน QR Code แล้วไม่ไปไหน**
- **วิธีแก้**: ตรวจสอบว่าโทรศัพท์ของผู้เล่นเชื่อมต่ออินเทอร์เน็ตหรือไม่ หากใช้ Wi-Fi องค์กร บางครั้งจะบล็อก WebSocket ของ Supabase ให้ลองเปลี่ยนไปใช้ 4G/5G

**2. เกมบอกว่า "ไม่พบห้องเกม" ตลอด**
- **วิธีแก้**: ตรวจสอบ `.env.local` ใน Vercel อีกครั้งว่าใส่ถูกไหม และใน `supabase-setup.sql` คุณลืมรันคำสั่ง **Enable RLS & Policy** หรือเปล่า

**3. หน้าจอไม่ยอมอัปเดตแบบเรียลไทม์ (ค้าง)**
- **วิธีแก้**: ใน Supabase หน้า **Replication** (หรือ Database > Publications) ตรวจสอบว่า `supabase_realtime` ได้รับการติ๊กเลือกให้ `rooms, players, answers` ทำงานแล้ว

**4. ผู้เล่น Refresh มือถือแล้วหลุด**
- **วิธีแก้**: ในเวอร์ชั่นนี้ได้ทำระบบ Session ID แนวนอนไว้แล้ว (ใช้ `localStorage`) หากกลับเข้ามาโค้ดห้องเดิมและระบบพบ Session ID เดิม ระบบจะจับคู่ให้เข้าเกมต่อจากจุดเดิมได้
