# Hướng dẫn chạy SmartHospital trên máy local

Đây là **dự án tốt nghiệp** — hướng dẫn chỉ đủ để chạy **dev** trên máy: backend + frontend + PostgreSQL (Docker).

Dành cho người nhận source (đã xóa `node_modules`, `dist`).

---

## 1. Phần mềm cần có

| Yêu cầu | Ghi chú |
|--------|---------|
| **Node.js + npm** | Cài Node ổn định trên máy (npm đi kèm). Miễn `npm install` chạy được. |
| **Docker Desktop** | Bật Docker trước khi chạy database. Kiểm tra: `docker version` |

### `npm install` bị lỗi (peer dependency / ERESOLVE)?

Trong **`sh.server`** hoặc **`sh.client`**:

```bash
npm install --legacy-peer-deps
```

Nếu vẫn lỗi:

```bash
npm install --force
```

Ưu tiên **`--legacy-peer-deps`**.

---

## 2. Cấu trúc thư mục

```
SmartHospital/
├── sh.server/          # Backend NestJS + API
│   ├── docker-compose.yml
│   ├── .env.example
│   └── schema/
│       └── smart-hospital-design.sql
├── sh.client/          # Frontend React + Vite
│   └── .env.example
└── HUONG_DAN_CHAY_DU_AN.md
```

---

## 3. Chuẩn bị môi trường (ENV)

### Backend — `sh.server/.env`

```bash
cd sh.server
cp .env.example .env
```

Mặc định trong `.env.example` đã khớp Docker. Quan trọng:

| Biến | Ý nghĩa |
|------|---------|
| `PORT` | API — thường **3000** |
| `POSTGRES_*` | Khớp `docker-compose.yml` |
| `JWT_SECRET` | Chuỗi ký JWT (dev có thể giữ mặc định) |
| `CLIENT_APP_URL` | Dev: `http://localhost:5431` |

SMTP, PayOS, OpenAI là **tùy chọn** — xem `.env.example`.

### Frontend — `sh.client/.env`

```bash
cd ../sh.client
cp .env.example .env
```

Tối thiểu:

```env
VITE_API_URL=http://localhost:3000
```

**GEMINI_API_KEY**: chỉ khi cần tính năng AI client dùng Gemini.

---

## 4. Database (Docker + PostgreSQL)

NestJS **không** tự tạo bảng (`synchronize: false`). Sau khi container chạy, **import schema một lần**.

### Khởi động Postgres

```bash
cd sh.server
docker compose up -d
```

Đợi vài giây. Kiểm tra: `docker ps` — container **`sh-postgres`**.

### Nạp schema

**macOS / Linux:**

```bash
cd sh.server
docker exec -i sh-postgres psql -U sh_user -d smart_hospital < schema/smart-hospital-design.sql
```

**Windows (PowerShell):**

```powershell
cd sh.server
Get-Content .\schema\smart-hospital-design.sql | docker exec -i sh-postgres psql -U sh_user -d smart_hospital
```

---

## 5. Chạy Backend

```bash
cd sh.server
npm install
# Nếu lỗi: npm install --legacy-peer-deps
npm run dev
```

API: **http://localhost:3000**

---

## 6. Chạy Frontend

Terminal khác:

```bash
cd sh.client
npm install
# Nếu lỗi: npm install --legacy-peer-deps
npm run dev
```

Web: **http://localhost:5431**

---

## 7. Kiểm tra

1. BE: **http://localhost:3000**
2. FE: **http://localhost:5431**
3. Thử đăng ký / đăng nhập sau khi đã import schema.

---

## 8. Tóm tắt (lần đầu)

1. Cài Node + Docker.  
2. Copy `.env.example` → `.env` trong **`sh.server`** và **`sh.client`**, chỉnh `VITE_API_URL` nếu cần.  
3. `cd sh.server` → `docker compose up -d` → import **`schema/smart-hospital-design.sql`**.  
4. `npm install` (hoặc `--legacy-peer-deps`) → `npm run dev` trong **sh.server**.  
5. `npm install` (hoặc `--legacy-peer-deps`) → `npm run dev` trong **sh.client**.  
6. Mở **http://localhost:5431**.
