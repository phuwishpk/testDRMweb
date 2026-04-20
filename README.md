# Simple Web Application with MySQL

โปรเจคเว็บแอปพลิเคชันแบบง่ายๆ ที่มี Backend (Node.js/Express) และ Frontend (HTML/CSS/JavaScript)

## 📁 โครงสร้างโปรเจค

```
webprojectdrmtest/
├── backend/              # Backend Node.js + Express
│   ├── server.js        # Main server file
│   ├── package.json     # Dependencies
│   ├── .env             # Environment variables
│   └── database.sql     # SQL script สำหรับสร้าง database
└── frontend/            # Frontend
    ├── index.html       # Main HTML
    ├── style.css        # Stylesheet
    └── script.js        # JavaScript logic
```

## 🚀 การติดตั้ง

### 1. ติดตั้ง MySQL Database

```sql
-- ใช้ MySQL Workbench หรือ phpMyAdmin
-- Import file: backend/database.sql
-- หรือรัน SQL command ในด้านล่าง:

CREATE DATABASE IF NOT EXISTS simple_web_db;
USE simple_web_db;
CREATE TABLE IF NOT EXISTS items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. ตั้งค่า Backend

```bash
cd backend
npm install
```

เปิดไฟล์ `.env` และแก้ไข MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=simple_web_db
PORT=5000
```

ถ้าบนโฮสติ้งตั้ง Environment Variables ไม่ได้ ให้ใช้ไฟล์ตั้งค่าแบบโค้ดแทน:

1. คัดลอก `backend/db.config.example.js` เป็น `backend/db.config.js`
2. แก้ค่า `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` ในไฟล์นั้น
3. รีสตาร์ตแอป

### 3. รัน Backend Server

```bash
cd backend
npm start
```

สำหรับ development ใช้:
```bash
npm run dev
```

Server จะทำงานที่ `http://localhost:5000`

### 4. เปิด Frontend

เปิด `frontend/index.html` ด้วย Web Browser:
- คลิกขวา → Open with → Browser
- หรือลาก `index.html` เข้าไปในปลั๊กพอร์ตของ Browser

## 📡 API Endpoints

- `GET /api/items` - ดึงรายการทั้งหมด
- `GET /api/items/:id` - ดึงรายการตาม ID
- `POST /api/items` - เพิ่มรายการใหม่
- `PUT /api/items/:id` - แก้ไขรายการ
- `DELETE /api/items/:id` - ลบรายการ
- `GET /health` - ตรวจสอบสถานะ Server

## 🔧 Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Tools**: Nodemon, CORS, Body Parser

## 📝 ข้อมูล Request Body

### POST /api/items (Create)
```json
{
  "name": "ชื่อรายการ",
  "description": "รายละเอียด"
}
```

### PUT /api/items/:id (Update)
```json
{
  "name": "ชื่อรายการใหม่",
  "description": "รายละเอียดใหม่"
}
```

## 🐛 Troubleshooting

### Cannot connect to database
- ตรวจสอบว่า MySQL Server ทำงานอยู่
- ตรวจสอบ credentials ในไฟล์ `.env`
- ตรวจสอบว่า database `simple_web_db` ถูกสร้างแล้ว
- ถ้าใช้โฮสติ้งที่ตั้ง env ยาก ให้สร้างไฟล์ `backend/db.config.js` จาก `backend/db.config.example.js`

### CORS Error
- ตรวจสอบว่า Backend server ทำงานอยู่ที่ port 5000
- ตรวจสอบ CORS settings ใน `server.js`

### Frontend cannot fetch data
- เปิด Browser DevTools (F12) ดู Console
- ตรวจสอบ Network tab เพื่อดู API calls
- ตรวจสอบว่า API_URL ใน `script.js` ถูกต้อง

## 🪟 Deploy บน Plesk/IIS (Windows)

โครงสร้างที่แนะนำบนโฮสติ้ง:

```
home.am-drm-radio.net/
├── index.html
├── frontend/
├── images/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env
├── server.js          # entrypoint (อยู่ที่ root)
└── package.json       # dependencies สำหรับ npm install ครั้งเดียว (อยู่ที่ root)
```

ตั้งค่าใน Plesk > Node.js:

- **Document Root**: โฟลเดอร์ root ของเว็บ (ที่มี `index.html`, `frontend/`, `images/`)
- **Application Root**: โฟลเดอร์เดียวกับ Document Root
- **Application Startup File**: `server.js` (ที่ root)

จากนั้นกด **NPM install** (ครั้งเดียว) แล้วกด **Restart App**

หมายเหตุ: หลีกเลี่ยงการกด Run script เป็น `npm start` เพราะจะชนพอร์ตได้ง่าย (`EADDRINUSE`)

ทดสอบ:

- เปิด `https://<domain>/health` ควรได้ JSON สถานะ
- เปิด `https://<domain>/frontend/style-index.css` ควรเป็นไฟล์ CSS (ไม่ใช่ HTML)

ถ้าเปิด `/health` แล้วขึ้น 404 แบบหน้า Web Server (ยังไม่เข้า Node) ให้ตรวจว่า Node.js app ถูก Enable และ Startup file ชี้ไปที่ `server.js` (ที่ root) แล้ว หากใช้ IIS/iisnode ให้มีไฟล์ `web.config` อยู่ที่ root ด้วย (โปรเจกต์นี้มีให้แล้ว)

หมายเหตุ:

- ระบบอัปโหลดจะพยายามใช้โฟลเดอร์ `App_Data/uploads` (ถ้ามี) ซึ่งมักเขียนได้บน IIS
- ถ้าเจอ iisnode 500.1002 ให้เช็คสิทธิ์เขียน (Write/Modify) ของ Application Pool กับโฟลเดอร์เว็บ/`App_Data`

## 🎯 ขั้นตอนต่อไป

- [ ] ปรับปรุง UI/UX
- [ ] เพิ่ม input validation
- [ ] เพิ่ม authentication
- [ ] เพิ่ม error handling
- [ ] Deploy ไปบน server จริง

---

สร้างมาด้วย ❤️
