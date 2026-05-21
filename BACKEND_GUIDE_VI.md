# 📘 SmartHospital Backend - Hướng Dẫn Chi Tiết

## 🎯 Tổng Quan Dự Án

**SmartHospital** là một nền tảng quản lý bệnh viện hiện đại, xây dựng bằng **NestJS** (Node.js framework) và **PostgreSQL**.

### Công nghệ chính:

- **Framework**: NestJS 11 (TypeScript)
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Payment**: PayOS (thanh toán qua ngân hàng)
- **AI**: OpenAI API (tư vấn chuyên khoa, gợi ý lịch)
- **Cloud Storage**: AWS S3 (lưu trữ ảnh đại diện, hình ảnh)
- **Email**: SendGrid (gửi email xác nhận, reset mật khẩu)
- **Scheduler**: NestJS Schedule (@nestjs/schedule)

---

## 📁 Cấu Trúc Thư Mục Backend

```
sh.server/
├── src/
│   ├── main.ts                 # Entry point - khởi động ứng dụng
│   ├── app.module.ts           # Root module chính
│   ├── app.controller.ts       # Controller chung
│   ├── app.service.ts          # Service chung
│   │
│   ├── auth/                   # 🔐 Module Xác Thực
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── jwt.strategy.ts
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   ├── mail.service.ts
│   │   └── ...
│   │
│   ├── doctors/                # 👨‍⚕️ Module Bác Sĩ
│   │   ├── doctors.service.ts
│   │   ├── doctors.controller.ts
│   │   ├── doctor-me.controller.ts
│   │   └── dto/
│   │
│   ├── appointments/           # 📅 Module Đặt Lịch
│   │   ├── appointments.service.ts
│   │   ├── appointments.controller.ts
│   │   ├── admin-appointments.controller.ts
│   │   ├── appointment-reminders.service.ts
│   │   ├── payos-webhook.controller.ts
│   │   └── dto/
│   │
│   ├── medical-records/        # 📋 Module Hồ Sơ Khám Bệnh
│   │   ├── medical-records.service.ts
│   │   ├── medical-records.controller.ts
│   │   ├── patient-medical-records.controller.ts
│   │   ├── medical-record-embeddings.service.ts
│   │   └── ...
│   │
│   ├── departments/            # 🏥 Module Khoa/Bộ Phận
│   │   ├── departments.service.ts
│   │   ├── departments.controller.ts
│   │   └── dto/
│   │
│   ├── admin/                  # 👮 Module Quản Trị Viên
│   │   ├── admin.service.ts
│   │   ├── admin.controller.ts
│   │   ├── admin-ai-usage.service.ts
│   │   └── dto/
│   │
│   ├── ai/                     # 🤖 Module AI Cơ Bản
│   │   ├── openai.service.ts   # Tích hợp OpenAI
│   │   ├── anonymize.service.ts
│   │   └── ai.module.ts
│   │
│   ├── ai-suggest/             # 🧠 Module Gợi Ý AI
│   │   ├── specialty-suggest.service.ts  # Gợi ý chuyên khoa
│   │   ├── slot-suggest.service.ts       # Gợi ý lịch khám
│   │   ├── ai-suggest.controller.ts
│   │   └── ai-suggest.module.ts
│   │
│   ├── doctor-ai/              # 💬 Module Chat AI cho Bác Sĩ
│   │   ├── doctor-chat.service.ts
│   │   ├── doctor-chat-sessions.service.ts
│   │   ├── doctor-ai.controller.ts
│   │   └── doctor-ai.module.ts
│   │
│   ├── ads/                    # 📢 Module Quảng Cáo
│   │   ├── ads.service.ts
│   │   ├── ads.controller.ts
│   │   ├── admin-ads.controller.ts
│   │   └── dto/
│   │
│   ├── leave-requests/         # 🏖️ Module Xin Nghỉ Phép
│   │   ├── leave-requests.service.ts
│   │   ├── admin-leave.controller.ts
│   │   └── leave-requests.module.ts
│   │
│   ├── payos/                  # 💳 Module Thanh Toán PayOS
│   │   └── payos.service.ts
│   │
│   ├── models/                 # 📊 Database Models (Entities)
│   │   ├── user.model.ts
│   │   ├── department.model.ts
│   │   ├── doctor-schedule.model.ts
│   │   ├── appointment-slot.model.ts
│   │   ├── appointment.model.ts
│   │   ├── medical-record.model.ts
│   │   ├── payment.model.ts
│   │   ├── doctor-leave-request.model.ts
│   │   ├── doctor-chat-session.model.ts
│   │   ├── advertisement.model.ts
│   │   ├── enums.ts            # Các enum định nghĩa
│   │   └── ...
│   │
│   └── common/                 # 🛠️ Utilities & Config
│       ├── patient-account.validation.ts
│       ├── doctor-slot-hours.ts
│       ├── s3-upload.service.ts
│       ├── avatar-upload.config.ts
│       ├── image-upload.config.ts
│       ├── weekday-calendar.ts
│       ├── is-uuid.ts
│       └── ...
│
├── schema/                     # 📐 Database Schema & Migrations
│   ├── smart-hospital-design.sql
│   └── migrations/
│
├── scripts/                    # 🔧 Script Cài Đặt
├── docker-compose.yml          # 🐳 Docker configuration
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
└── README.md
```

---

## 🔄 Luồng Chạy Chính (Architecture Flow)

### 1. **Khởi Động Ứng Dụng**

```
main.ts
  ↓
NestFactory.create(AppModule)
  ↓
app.module.ts (Import tất cả modules)
  ↓
Kết nối Database (TypeORM)
  ↓
Chạy HTTP Server (port 3000)
```

**main.ts**:

```typescript
// Thiết lập timezone VN
process.env.TZ = "Asia/Ho_Chi_Minh";

// Tạo ứng dụng NestJS
const app = await NestFactory.create(AppModule);

// Bật CORS
app.enableCors();

// Lắng nghe port 3000
await app.listen(3000);
```

### 2. **Luồng Xác Thực (Authentication Flow)**

```
[Client] POST /auth/register
   ↓
AuthController.register()
   ↓
AuthService.register()
   ├─ Validate dữ liệu (email, password, phone)
   ├─ Kiểm tra email đã tồn tại?
   ├─ Hash password (bcrypt)
   ├─ Tạo user trong database
   └─ Return UserPublic (không có password)

[Client] POST /auth/login
   ↓
AuthService.login()
   ├─ Tìm user by email
   ├─ Verify password (bcrypt.compare)
   ├─ Generate JWT token (JwtService)
   └─ Return { access_token, user }

[Client] GET /auth/me (Header: Authorization: Bearer <token>)
   ↓
JwtAuthGuard (Middleware)
   ├─ Xác thực token hợp lệ?
   ├─ Extract userId từ token
   └─ Gắn user vào request
   ↓
AuthController.me()
   └─ Return thông tin user hiện tại
```

**JWT Strategy**:

- Thuật toán: HS256
- Secret key: từ `process.env.JWT_SECRET`
- Expiration: từ `process.env.JWT_EXPIRATION`
- Payload: `{ userId, email, role }`

### 3. **Luồng Đặt Lịch Khám (Booking Flow)**

```
[Patient] GET /doctors
   ↓
DoctorsController.findAll()
   ↓
DoctorsService.findAll()
   └─ Query DB: tất cả bác sĩ (hoặc theo departmentId)

[Patient] GET /doctors/:id/slots?from=2026-05-20
   ↓
DoctorsService.findSlotsByDoctor()
   ├─ Tìm appointment_slots của bác sĩ
   ├─ Lọc những slot có status = 'available'
   ├─ Lọc slot >= từ ngày `from`
   └─ Return danh sách slot trống

[Patient] POST /appointments (Body: { slotId, symptoms })
   ↓
AppointmentsController.createBooking()
   ↓
AppointmentsService.createBooking()
   ├─ Validate slotId tồn tại & trống?
   ├─ Tạo appointment (status: 'pending')
   ├─ Update slot status → 'booked'
   ├─ Tạo payment (status: 'pending')
   ├─ Gọi PayOS tạo checkout URL
   └─ Return { appointment, payment, checkoutUrl }

[Patient] Thanh toán trên PayOS
   ↓
PayOS Webhook → POST /appointments/payos-webhook
   ├─ Verify webhook signature
   ├─ Update payment status → 'paid'
   ├─ Update appointment status → 'confirmed'
   └─ Gửi email xác nhận cho patient & doctor

[Doctor] GET /doctor/me/appointments?from=...&to=...
   ↓
DoctorMeController.getAppointments()
   ├─ Lấy các appointment của bác sĩ đó
   ├─ Kèm thông tin patient & slot
   └─ Return danh sách lịch hẹn
```

### 4. **Luồng Hồ Sơ Khám Bệnh (Medical Records Flow)**

```
[Doctor] POST /medical-records (tạo hồ sơ khám)
   ↓
MedicalRecordsController.create()
   ├─ Kiểm tra doctor có quyền tạo?
   ├─ Tạo record: { doctorId, appointmentId, diagnosis, treatment }
   ├─ Tạo embeddings (AI RAG) từ nội dung
   └─ Lưu vào medical_record_embeddings

[Patient] GET /appointments/:id (xem chi tiết lịch)
   ↓
- Nếu appointment.status == 'completed' && có medical_records
  → Hiển thị kết quả khám (hasMedicalRecord: true)

[Patient] GET /medical-records (xem tất cả hồ sơ)
   ↓
MedicalRecordsController.getMyRecords()
   ├─ Lấy records của patient đó
   ├─ Kèm thông tin doctor & appointment
   └─ Return danh sách hồ sơ khám
```

### 5. **Luồng Gợi Ý AI (AI Suggestion Flow)**

```
[Patient] GET /ai-suggest/specialty?symptoms=...
   ↓
SpecialtySuggestService.suggestSpecialty()
   ├─ Gọi OpenAI API với prompt
   ├─ OpenAI phân tích증상 → gợi ý chuyên khoa
   ├─ Lưu usage log (ai_usage table)
   └─ Return { specialty, confidence, doctors }

[Patient] GET /ai-suggest/slots?doctorId=...&preferences=...
   ↓
SlotSuggestService.suggestSlots()
   ├─ Phân tích thói quen đặt lịch của patient
   ├─ Gọi OpenAI: "based on patient history, suggest best time"
   ├─ Lọc available slots khớp với gợi ý
   └─ Return danh sách slot gợi ý
```

### 6. **Luồng Xin Nghỉ Phép (Leave Request Flow)**

```
[Doctor] POST /leave-requests (xin nghỉ)
   ↓
LeaveRequestsService.create()
   ├─ Tạo leave_request: { doctorId, fromDate, toDate, reason }
   ├─ Status = 'pending' (chờ admin duyệt)
   └─ Gửi email thông báo admin

[Admin] PATCH /admin/leave-requests/:id/approve
   ↓
LeaveRequestsService.approve()
   ├─ Update leave_request.status → 'approved'
   ├─ Tìm tất cả appointment_slots trong khoảng dates
   ├─ Update những slot đó: status → 'on_leave'
   └─ Email thông báo doctor

[Patient] GET /doctors/:id/slots?from=...
   ↓
- Filter slot WHERE status = 'available' (không lấy 'on_leave')
- Patient không thấy slot trong kỳ nghỉ phép
```

### 7. **Luồng Quản Trị (Admin Panel Flow)**

```
[Admin] GET /admin/stats
   ├─ Thống kê số lượng: users, doctors, appointments, revenue
   └─ Dashboard metrics

[Admin] GET /admin/users
   ├─ Danh sách tất cả users
   ├─ Lọc theo role (user/doctor/admin)
   └─ Phân trang

[Admin] PATCH /admin/users/:id/lock
   ├─ Lock / Unlock tài khoản user/doctor
   └─ Email thông báo user

[Admin] GET /admin/appointments
   ├─ Xem tất cả appointments (không giới hạn)
   ├─ Lọc theo status, doctor, dateRange
   └─ Hỗ trợ hủy appointment nếu cần

[Admin] PATCH /admin/appointments/:id/cancel
   ├─ Huỷ appointment
   ├─ Hoàn lại slot (status → 'available')
   ├─ Hoàn tiền cọc (nếu đã thanh toán)
   └─ Email thông báo patient
```

---

## 📊 Database Models (Schema)

### **Các Bảng Chính**:

#### 1️⃣ **users** - Bảng Người Dùng

```typescript
interface User {
  id: UUID; // Primary Key
  email: string; // Unique
  full_name: string;
  phone: string; // Chuẩn hóa VN: 0xxxxxxxxx
  password_hash: string; // bcrypt hash
  role: "user" | "doctor" | "admin";
  avatar_url?: string;
  is_locked: boolean; // Admin có thể khóa

  // Chỉ doctor:
  department_id?: UUID;
  bio?: string;
  experience_years?: number;
  university?: string;
  preferred_time_pattern?: JSON; // AI gợi ý thời gian

  created_at: timestamp;
  updated_at: timestamp;
}
```

#### 2️⃣ **departments** - Bảng Khoa/Bộ Phận

```typescript
interface Department {
  id: UUID;
  name: string;
  description?: string;
  icon_url?: string;
  is_active: boolean;
}
```

#### 3️⃣ **doctor_schedules** - Lịch Làm Việc Bác Sĩ

```typescript
interface DoctorSchedule {
  id: UUID;
  doctor_id: UUID;
  work_day: string; // 'MON', 'TUE', 'WED', ...
  start_time: time; // 08:30
  end_time: time; // 17:00
  break_start?: time; // 12:00
  break_end?: time; // 13:00
}
```

#### 4️⃣ **appointment_slots** - Slot Đặt Lịch

```typescript
interface AppointmentSlot {
  id: UUID;
  doctor_id: UUID;
  slot_time: timestamp; // 2026-05-20 09:30:00
  status: "available" | "booked" | "on_leave";
  created_at: timestamp;
}
```

#### 5️⃣ **appointments** - Lịch Hẹn Bệnh Nhân

```typescript
interface Appointment {
  id: UUID;
  user_id: UUID;
  doctor_id: UUID;
  slot_id: UUID?; // Null nếu chưa chọn slot
  symptoms?: string; // Triệu chứng bệnh nhân
  status: "pending" | "confirmed" | "completed" | "cancelled";
  deposit_amount?: number; // VND
  cancel_reason?: string;
  cancelled_at?: timestamp;
  created_at: timestamp;
}
```

#### 6️⃣ **payments** - Giao Dịch Thanh Toán

```typescript
interface Payment {
  id: UUID;
  appointment_id: UUID;
  amount: decimal(10,2);  // VND
  payment_type: 'deposit' | 'full';
  payment_method?: string; // 'payos', 'cash', ...
  status: 'pending' | 'paid' | 'failed';
  payos_order_code?: number;
  created_at: timestamp;
}
```

#### 7️⃣ **medical_records** - Hồ Sơ Khám Bệnh

```typescript
interface MedicalRecord {
  id: UUID;
  doctor_id: UUID;
  patient_id: UUID;
  appointment_id: UUID?;
  diagnosis: text; // Chẩn đoán
  treatment: text; // Hướng điều trị
  notes?: text;
  created_at: timestamp;
}
```

#### 8️⃣ **medical_record_embeddings** - Vector Embeddings (RAG)

```typescript
interface MedicalRecordEmbedding {
  id: UUID;
  medical_record_id: UUID;
  embedding: vector; // OpenAI embedding 1536 chiều
  text_chunk: text; // Đoạn text tương ứng
  created_at: timestamp;
}
```

#### 9️⃣ **doctor_leave_requests** - Xin Nghỉ Phép

```typescript
interface DoctorLeaveRequest {
  id: UUID;
  doctor_id: UUID;
  from_date: date;
  to_date: date;
  reason: text;
  status: "pending" | "approved" | "rejected";
  created_at: timestamp;
}
```

#### 🔟 **doctor_chat_sessions** - Session Chat AI cho Bác Sĩ

```typescript
interface DoctorChatSession {
  id: UUID;
  doctor_id: UUID;
  title?: string;
  created_at: timestamp;
}
```

---

## 🔒 Quản Lý Quyền Hạn (RBAC)

### **Roles & Permissions**:

| Chức năng            | User (Bệnh nhân) |  Doctor (Bác sĩ)   | Admin |
| -------------------- | :--------------: | :----------------: | :---: |
| Đăng ký / Đăng nhập  |        ✅        |         ✅         |  ✅   |
| Xem danh sách bác sĩ |        ✅        |         ✅         |  ✅   |
| Đặt lịch khám        |        ✅        |         ❌         |  ❌   |
| Xem lịch cá nhân     |        ✅        |         ✅         |  ✅   |
| Xem hồ sơ khám       |        ✅        | ✅ (của bệnh nhân) |  ✅   |
| Tạo hồ sơ khám       |        ❌        |         ✅         |  ✅   |
| Xin nghỉ phép        |        ❌        |         ✅         |  ❌   |
| Duyệt nghỉ phép      |        ❌        |         ❌         |  ✅   |
| Quản lý users        |        ❌        |         ❌         |  ✅   |
| Xem analytics        |        ❌        |         ❌         |  ✅   |

### **Guard & Decorator**:

```typescript
// Kiểm tra JWT token
@UseGuards(JwtAuthGuard)

// Kiểm tra role
@UseGuards(RolesGuard)
@Roles('doctor', 'admin')

// Lấy user hiện tại
@CurrentUser() user: UserPublic
```

---

## ⏰ Scheduled Tasks (Cron Jobs)

### **Appointment Reminders** (mỗi 1 phút)

```typescript
@Cron('*/1 * * * *')
async remindUpcomingAppointments()
```

- Tìm appointment sắp diễn ra (trong 24 giờ)
- Gửi email nhắc nhở patient & doctor
- Update `appointment_reminders` table

### **Auto-Cancel Pending Bookings** (mỗi 1 phút)

```typescript
@Cron('*/1 * * * *')
async cancelExpiredPendingBookings()
```

- Tìm appointment chưa thanh toán > 5 phút
- Auto cancel (status → 'cancelled')
- Hoàn slot (status → 'available')

---

## 🛠️ Các Service Chính

### **1. AuthService** - Xác Thực

```typescript
register(dto: RegisterDto)          // Đăng ký
login(dto: LoginDto)                // Đăng nhập
resetPassword(dto: ResetPasswordDto) // Reset mật khẩu
updateProfile(dto: UpdateMeDto)     // Cập nhật hồ sơ
```

### **2. DoctorsService** - Quản Lý Bác Sĩ

```typescript
findAll(departmentId?)              // Danh sách bác sĩ
findOne(id)                         // Chi tiết bác sĩ
findSchedulesByDoctor(id)           // Lịch làm việc
findSlotsByDoctor(id, from)         // Slot trống
getMyPatients()                     // Bệnh nhân của tôi (Doctor only)
getMyAppointments(from, to)         // Lịch hẹn của tôi (Doctor only)
```

### **3. AppointmentsService** - Đặt Lịch

```typescript
createBooking(dto); // Tạo appointment & payment
getMyAppointments(); // Lịch cá nhân
getAppointmentDetails(id); // Chi tiết lịch
cancelAppointment(id, reason); // Hủy lịch
getPaymentHistory(); // Lịch sử thanh toán
```

### **4. MedicalRecordsService** - Hồ Sơ Khám

```typescript
createMedicalRecord(dto); // Tạo hồ sơ
getMedicalRecords(); // Xem hồ sơ cá nhân
getMedicalRecordsByDoctor(); // Hồ sơ bác sĩ tạo
getPatientRecords(patientId); // Hồ sơ bệnh nhân (Doctor only)
searchRecords(query); // Tìm kiếm hồ sơ (RAG)
```

### **5. LeaveRequestsService** - Xin Nghỉ

```typescript
createLeaveRequest(dto); // Xin nghỉ
getMyRequests(); // Yêu cầu của tôi (Doctor only)
approveLeaveRequest(id); // Duyệt (Admin only)
rejectLeaveRequest(id); // Từ chối (Admin only)
```

### **6. AdminService** - Quản Trị

```typescript
getStats(); // Thống kê
getAllUsers(filter); // Danh sách users
lockUser(id); // Khóa tài khoản
unlockUser(id); // Mở khóa
getAllAppointments(filter); // Xem tất cả appointments
cancelAppointment(id, reason); // Hủy appointment
getAiUsageStats(); // Thống kê AI usage
```

### **7. OpenAiService** - Tích Hợp OpenAI

```typescript
suggestSpecialty(symptoms); // Gợi ý chuyên khoa
suggestSlots(doctorId, preferences); // Gợi ý slot
anonymizeText(text); // Ẩn danh bệnh nhân
createEmbedding(text); // Tạo embedding (RAG)
```

### **8. PayOSService** - Thanh Toán

```typescript
createCheckoutUrl(order); // Tạo link thanh toán
verifyWebhook(signature, data); // Xác minh webhook
getOrderStatus(orderCode); // Trạng thái order
```

---

## 📋 DTO (Data Transfer Objects)

DTOs định nghĩa dạng dữ liệu gửi đi / nhận về từ API:

```typescript
// auth/dto
├── RegisterDto         // { email, password, fullName, phone }
├── LoginDto            // { email, password }
├── ResetPasswordDto    // { token, password, confirmPassword }
└── UpdateMeDto         // { fullName, phone }

// appointments/dto
├── CreateBookingDto    // { slotId, symptoms? }
└── CancelAppointmentDto // { reason? }

// medical-records/dto
├── CreateMedicalRecordDto // { appointmentId?, diagnosis, treatment, notes? }
└── UpdateMedicalRecordDto

// doctors/dto
├── CreateDoctorScheduleDto
└── UpdateDoctorScheduleDto

// admin/dto
├── LockUserDto         // { reason? }
└── CancelAppointmentDto
```

---

## 🌐 API Endpoints Chính

### **Authentication**

```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /auth/me                    [JWT Required]
PATCH  /auth/me                    [JWT Required]
POST   /auth/upload-avatar         [JWT Required]
```

### **Doctors**

```
GET    /doctors
GET    /doctors/:id
GET    /doctors/:id/schedules
GET    /doctors/:id/slots          # Lấy slot trống
GET    /doctor/me                  [JWT Required, Doctor only]
GET    /doctor/me/patients         [JWT Required, Doctor only]
GET    /doctor/me/appointments     [JWT Required, Doctor only]
PATCH  /doctor/me/profile          [JWT Required, Doctor only]
```

### **Appointments**

```
GET    /appointments/me            [JWT Required]
POST   /appointments               [JWT Required]
GET    /appointments/:id           [JWT Required]
PATCH  /appointments/:id/cancel    [JWT Required]
GET    /appointments/me/payments   [JWT Required]
POST   /appointments/payos-webhook # Webhook PayOS
```

### **Medical Records**

```
GET    /medical-records            [JWT Required]
POST   /medical-records            [JWT Required, Doctor only]
GET    /medical-records/:id        [JWT Required]
PATCH  /medical-records/:id        [JWT Required, Doctor only]
GET    /patient-medical-records/:patientId [JWT Required, Doctor only]
POST   /medical-records/search     [JWT Required]
```

### **AI Suggest**

```
GET    /ai-suggest/specialty?symptoms=...
GET    /ai-suggest/slots?doctorId=...&preferences=...
```

### **Admin**

```
GET    /admin/stats                [JWT Required, Admin only]
GET    /admin/users                [JWT Required, Admin only]
PATCH  /admin/users/:id/lock       [JWT Required, Admin only]
GET    /admin/appointments         [JWT Required, Admin only]
PATCH  /admin/appointments/:id/cancel [JWT Required, Admin only]
PATCH  /admin/leave-requests/:id/approve [JWT Required, Admin only]
PATCH  /admin/leave-requests/:id/reject  [JWT Required, Admin only]
GET    /admin/ai-usage            [JWT Required, Admin only]
```

### **Leave Requests**

```
POST   /leave-requests             [JWT Required, Doctor only]
GET    /leave-requests/me          [JWT Required, Doctor only]
GET    /admin/leave-requests       [JWT Required, Admin only]
PATCH  /admin/leave-requests/:id/approve [JWT Required, Admin only]
```

---

## 🚀 Cách Chạy Backend

### **1. Cài Đặt Dependencies**

```bash
cd sh.server
npm install
```

### **2. Cấu Hình Environment**

Tạo file `.env` trong `sh.server/`:

```env
# Server
PORT=3000

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=sh_user
POSTGRES_PASSWORD=sh_password
POSTGRES_DB=smart_hospital
POSTGRES_SSL=false

# JWT
JWT_SECRET=your-secret-key-here-min-32-chars
JWT_EXPIRATION=7d

# AWS S3
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_BUCKET_NAME=smart-hospital-bucket

# SendGrid
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=no-reply@smarthospital.vn

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo

# PayOS
PAYOS_CLIENT_ID=your-client-id
PAYOS_API_KEY=your-api-key
PAYOS_CHECKSUM_KEY=your-checksum-key

# App
APP_URL=http://localhost:3000
CLIENT_URL=http://localhost:5173
```

### **3. Chạy Database (Docker)**

```bash
npm run docker:up          # Start PostgreSQL
npm run db:init            # Initialize
npm run db:schema          # Load schema từ db.sql
npm run db:seed            # Seed data (optional)
```

### **4. Chạy Server**

```bash
npm run dev                # Development mode (watch)
npm run build              # Build TypeScript
npm run start:prod         # Production mode
```

Server sẽ chạy tại `http://localhost:3000`

### **5. Test**

```bash
npm run test               # Unit tests
npm run test:e2e           # End-to-end tests
npm run test:cov           # Test coverage
```

---

## 🔗 Liên Kết Giữa Modules

```
┌─────────────────────────────────────────────────────────┐
│                    AppModule (Root)                      │
└─────────────────────────────────────────────────────────┘
              │           │           │          │
        ┌─────┴─────┐ ┌───┴────┐ ┌───┴────┐ ┌───┴────┐
        │           │ │        │ │        │ │        │
    AuthModule  DoctorsModule AppointmentsModule MedicalRecordsModule
        │           │ │        │ │        │ │        │
        └─────┬─────┘ └───┬────┘ └───┬────┘ └───┬────┘
              │           │          │          │
          JwtService   DoctorSchedule  PayOS    OpenAI
                       AppointmentSlot  Service  Service
```

---

## 📝 Tóm Tắt Các Khái Niệm Quan Trọng

| Khái Niệm       | Giải Thích                                                      |
| --------------- | --------------------------------------------------------------- |
| **Module**      | Nhóm các controller, service, entity liên quan (VD: AuthModule) |
| **Controller**  | Tiếp nhận request HTTP, gọi service, trả response               |
| **Service**     | Logic business, truy vấn database, gọi external API             |
| **Entity**      | TypeORM class mapping bảng database                             |
| **DTO**         | Object chứa dữ liệu gửi/nhận từ client                          |
| **Guard**       | Middleware kiểm tra quyền hạn (JWT, Role)                       |
| **Decorator**   | Annotation giúp đơn giản hóa code (@Get, @UseGuards, ...)       |
| **Pipe**        | Transform/Validate dữ liệu đầu vào (ParseUUIDPipe)              |
| **Interceptor** | Xử lý request/response (upload file, ...)                       |
| **Middleware**  | Process chạy trước controller (CORS, logging, ...)              |

---

## 🎓 Quy Trình Phát Triển Feature Mới

1. **Tạo Entity** (trong `models/`)
   - Định nghĩa database structure
   - Tạo TypeORM class

2. **Tạo Service** (trong feature module)
   - Viết business logic
   - Gọi repository để truy vấn DB

3. **Tạo Controller** (trong feature module)
   - Viết endpoint
   - Validate input
   - Gọi service
   - Return response

4. **Tạo DTO** (trong `feature/dto/`)
   - Định nghĩa dạng dữ liệu request/response
   - Add validation decorators

5. **Tạo Module** (nếu cần)
   - Import các providers (Service, Controller)
   - Import entities từ models

6. **Test & Document**
   - Viết unit tests
   - Viết API documentation
   - Update README

---

## ✅ Danh Sách Kiểm Tra Cho New Developer

- [ ] Hiểu NestJS Architecture (Module, Controller, Service)
- [ ] Đọc hiểu Database Schema
- [ ] Cài đặt môi trường (Node.js, PostgreSQL, Docker)
- [ ] Chạy được backend locally
- [ ] Hiểu JWT Authentication flow
- [ ] Biết cách test API (Postman / cURL)
- [ ] Đọc hiểu ít nhất 2-3 modules chính (Auth, Doctors, Appointments)
- [ ] Biết cách thêm endpoint mới
- [ ] Hiểu RBAC (Role-Based Access Control)
- [ ] Đọc error logs khi có bug

---

**Chúc bạn thành công! 🎉**

Nếu có câu hỏi, hãy hỏi các senior trong team hoặc check documentation: [NestJS Docs](https://docs.nestjs.com)
