# COACHING MANAGEMENT SYSTEM — AI DEVELOPMENT CONTEXT

# Version: 1.0.0

# Last Updated: 2025

# Purpose: This file is the single source of truth for any AI assistant

# generating code for this project. Read ALL sections before writing any code.

---

## ⚠️ CRITICAL RULES — READ FIRST

1. **NEVER** use `number` for IDs — all IDs are `String @id @default(cuid())`
2. **NEVER** expose `password` field in any response — always use explicit `select`
3. **NEVER** use `boolean` for user status — use `UserStatus` enum
4. **NEVER** create a new chat if one already exists between two users — check first
5. **NEVER** allow a teacher to post/create services if `is_approved = false`
6. **NEVER** allow blocked/suspended students to see batch content
7. **ALWAYS** validate multipart files using `parseMultipart()` with `MultipartOptions`
8. **ALWAYS** throw named Error strings (e.g. `throw new Error("NOT_FOUND")`) — never raw HTTP codes in services
9. **ALWAYS** handle errors in controllers, not services
10. **ALWAYS** use `snake_case` for database fields and API response keys
11. **ALWAYS** check subscription limits before allowing service creation
12. **ALWAYS** soft delete where `deleted_at` exists — never hard delete user content

---

## 📁 PROJECT STRUCTURE

```
backend/
└── src/
    ├── config/
    │   ├── cloudinary.ts       # Cloudinary config + CLD_FOLDERS + CLD_ACCEPTED_TYPES + CLD_MAX_SIZE
    │   ├── env.ts              # All env variables (zod-validated)
    │   └── prisma.ts           # Prisma client singleton
    │
    ├── database/
    │   └── models/             # Prisma schema files (multi-file)
    │       ├── schema.prisma   # generator + datasource only
    │       ├── enums.prisma
    │       ├── admin.prisma
    │       ├── user.prisma
    │       ├── education.prisma
    │       ├── service.prisma
    │       ├── batch-content.prisma
    │       ├── post.prisma
    │       ├── social.prisma
    │       ├── messaging.prisma
    │       ├── engagement.prisma
    │       └── subscription.prisma
    │
    ├── middleware/
    │   ├── multipart.middleware.ts   # Fastify multipart plugin registration
    │   └── parse-body.middleware.ts  # JSON body parser
    │
    ├── modules/                # Feature modules — one folder per domain
    │   ├── admin/
    │   │   ├── admin.controller.ts
    │   │   ├── admin.middleware.ts
    │   │   ├── admin.route.ts
    │   │   ├── admin.schema.ts
    │   │   ├── admin.service.ts
    │   │   └── admin.types.ts
    │   ├── auth/               # User auth (Teacher/Student/Guardian)
    │   ├── user/               # User profile management
    │   ├── education/          # Levels + Subjects (admin managed)
    │   ├── subscription/       # Packages + user subscriptions
    │   ├── service/            # Coaching services
    │   ├── batch/              # Batches under services
    │   ├── enrollment/         # Join requests, waitlist
    │   ├── payment/            # Payment records
    │   ├── schedule/           # Batch schedule + overrides
    │   ├── attendance/         # Attendance marking + viewing
    │   ├── task/               # Tasks per batch
    │   ├── daily-note/         # Daily notes per batch
    │   ├── announcement/       # Announcements per batch
    │   ├── post/               # Offering + seeking posts
    │   ├── messaging/          # Chats + messages
    │   ├── notification/       # In-app notifications
    │   ├── review/             # Service reviews
    │   ├── follow/             # Follow/unfollow
    │   ├── block/              # Block system
    │   ├── guardian/           # Guardian ↔ student linking
    │   └── upload/             # Cloudinary upload endpoints
    │
    ├── plugins/
    │   ├── cors.ts
    │   ├── jwt.ts
    │   └── rateLimit.ts
    │
    ├── types/                  # Global TypeScript types
    │
    ├── utils/
    │   ├── cloudinary-upload.ts  # uploadToCloudinary, deleteFromCloudinary, replaceInCloudinary
    │   ├── hash.ts
    │   ├── logger.ts
    │   ├── pagination.ts
    │   ├── parse-multipart.ts    # parseMultipart() with MultipartOptions validation
    │   └── slug.ts
    │
    ├── app.ts                  # Fastify app setup + route registration
    └── server.ts               # Server entry point
```

---

## 🌐 ROUTE PREFIXES

```
/api/v1/admin/***            Admin dashboard APIs  (admin JWT cookies)
/api/v1/auth/***             User register/login/verify
/api/v1/user/***             User profile (all roles)

/api/v1/teacher/***          Teacher dashboard APIs
/api/v1/student/***          Student APIs
/api/v1/guardian/***         Guardian APIs + guardian↔student linking

/api/v1/service/***          Coaching services
/api/v1/batch/***            Batch management
/api/v1/enrollment/***       Enrollment flow
/api/v1/payment/***          Payment records
/api/v1/schedule/***         Schedule + overrides
/api/v1/attendance/***       Attendance
/api/v1/task/***             Tasks
/api/v1/daily-note/***       Daily notes
/api/v1/announcement/***     Announcements
/api/v1/post/***             Posts feed
/api/v1/messaging/***        Chats + messages
/api/v1/notification/***     Notifications
/api/v1/review/***           Reviews
/api/v1/follow/***           Follow system
/api/v1/education/***        Subjects + levels (public read, admin write)
/api/v1/subscription/***     Packages + subscriptions
/api/v1/upload/***           File uploads
```

### app.ts route registration pattern:

```typescript
app.register(adminRoutes, { prefix: "/api/v1/admin" });
app.register(authRoutes, { prefix: "/api/v1/auth" });
app.register(userRoutes, { prefix: "/api/v1/user" });
app.register(teacherRoutes, { prefix: "/api/v1/teacher" });
app.register(studentRoutes, { prefix: "/api/v1/student" });
app.register(guardianRoutes, { prefix: "/api/v1/guardian" });
app.register(serviceRoutes, { prefix: "/api/v1/service" });
app.register(batchRoutes, { prefix: "/api/v1/batch" });
app.register(enrollmentRoutes, { prefix: "/api/v1/enrollment" });
app.register(paymentRoutes, { prefix: "/api/v1/payment" });
app.register(scheduleRoutes, { prefix: "/api/v1/schedule" });
app.register(attendanceRoutes, { prefix: "/api/v1/attendance" });
app.register(taskRoutes, { prefix: "/api/v1/task" });
app.register(dailyNoteRoutes, { prefix: "/api/v1/daily-note" });
app.register(announcementRoutes, { prefix: "/api/v1/announcement" });
app.register(postRoutes, { prefix: "/api/v1/post" });
app.register(messagingRoutes, { prefix: "/api/v1/messaging" });
app.register(notificationRoutes, { prefix: "/api/v1/notification" });
app.register(reviewRoutes, { prefix: "/api/v1/review" });
app.register(followRoutes, { prefix: "/api/v1/follow" });
app.register(educationRoutes, { prefix: "/api/v1/education" });
app.register(subscriptionRoutes, { prefix: "/api/v1/subscription" });
app.register(uploadRoutes, { prefix: "/api/v1/upload" });
```

---

## 🔐 AUTHENTICATION SYSTEM

### Two Completely Separate Auth Systems:

#### 1. Admin Auth

- **Cookies:** `admin_access` + `admin_refresh` (httpOnly, signed, secure in prod)
- **Token type:** JWE (encrypted JWT) using `jose` library — `alg: "dir", enc: "A256GCM"`
- **Secrets:** `ADMIN_JWT_ACCESS_SECRET` + `ADMIN_JWT_REFRESH_SECRET` (32+ chars)
- **Payload:** `{ adminId: string, email: string, role: IAdminRole }`
- **Middleware:** `verifyAdminToken` + `requireRole(...roles)`
- **req extension:** `req.admin?: JwtPayload`

#### 2. User Auth (Teacher / Student / Guardian)

- **Cookies:** `user_access` + `user_refresh` (httpOnly, signed, secure in prod)
- **Token type:** JWE (encrypted JWT) same pattern as admin
- **Secrets:** `USER_JWT_ACCESS_SECRET` + `USER_JWT_REFRESH_SECRET`
- **Payload:** `{ userId: string, email: string, role: UserRole }`
- **Middleware:** `verifyUserToken` + `requireUserRole(...roles)`
- **req extension:** `req.user?: UserJwtPayload`

### Token Refresh Logic (same for both):

```
1. Check access token cookie exists
2. If exists → try decrypt → if valid → attach to req → next
3. If expired → check refresh token cookie
4. If refresh valid → generate new access token → set cookie → attach → next
5. If refresh expired → clear both cookies → 401
6. If no access token → check refresh → same as step 4-5
```

### Cookie Options:

```typescript
// httpOnly: true — JS cannot read these cookies
// secure: true in production
// sameSite: "lax"
// signed: true — tamper protection
// path: "/"
```

---

## 📦 MODULE FILE PATTERN

Every module follows this exact structure:

```
moduleName.schema.ts    — Zod schemas + inferred TypeScript types
moduleName.service.ts   — Business logic + Prisma queries (throws named errors)
moduleName.controller.ts — HTTP handlers (catches errors, sends responses)
moduleName.route.ts     — Fastify route registration + preHandlers
moduleName.types.ts     — Constants, enums, permission arrays (if needed)
moduleName.middleware.ts — Module-specific middleware (if needed)
```

### Service pattern — always throw named strings:

```typescript
export async function getSomething(id: string) {
  const item = await prisma.something.findUnique({ where: { id } });
  if (!item) throw new Error("NOT_FOUND");
  if (item.deleted_at) throw new Error("NOT_FOUND");
  return item;
}
```

### Controller pattern — always catch named errors:

```typescript
export async function getController(req: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await getSomething(id);
    return reply.send({ success: true, data });
  } catch (err: any) {
    if (err.message === "NOT_FOUND")
      return reply.status(404).send({ success: false, message: "Not found" });
    throw err; // unexpected errors bubble up to Fastify error handler
  }
}
```

### Standard response shapes:

```typescript
// Success
{ success: true, data: {...} }
{ success: true, data: [...], meta: { total, page, limit, total_pages, has_next } }
{ success: true, message: "Action done" }

// Error
{ success: false, message: "Human readable message" }
{ success: false, errors: { fieldName: ["error"] } }  // validation errors
{ success: false, message: "...", field: "fieldName" } // multipart errors
```

---

## 🗄️ DATABASE — PRISMA SCHEMA SUMMARY

### Key Rules:

- All IDs: `String @id @default(cuid())`
- Timestamps: `created_at DateTime @default(now())`, `updated_at DateTime @updatedAt`
- Soft delete: `deleted_at DateTime?` — check `deleted_at: null` in queries
- Decimals: `Decimal @db.Decimal(10, 2)` for money, `Decimal @db.Decimal(10, 7)` for coordinates
- Text: `String @db.Text` for long content
- All field names: `snake_case`

### Models Quick Reference:

#### ADMIN SYSTEM (separate from users)

```
Admin          — id, full_name, email, password, role(AdminRole), status(AdminStatus), avatar_url, last_login
AuditLog       — id, admin_id, action(AuditAction), target_type, target_id, meta(Json)
TeacherApproval — id, user_id, reviewed_by(admin_id), status, note, reviewed_at
AdminNote      — id, user_id, admin_id, note
```

#### USERS

```
User           — id, role(UserRole), full_name, email, password, phone, gender, dob,
                 avatar_url, bio, country, city, area, address_line, lat, lng,
                 is_email_verified, email_verified_at, status(UserStatus), is_approved,
                 deleted_at
TeacherProfile — id, user_id(unique), tagline, experience_years, qualifications,
                 achievements, average_rating, total_reviews
StudentProfile — id, user_id(unique), education_level_id, institution_name, roll_number
GuardianProfile — id, user_id(unique), occupation
GuardianStudent — id, guardian_profile_id, student_profile_id, status, initiated_by,
                  relation_label
UserSubscription — id, user_id(unique), package_id, status, billing_cycle,
                   started_at, expires_at, payment_method, transaction_id, amount_paid
```

#### EDUCATION (admin managed, public read)

```
EducationLevelGroup — id, name(unique), sort_order, is_active
EducationLevel      — id, group_id, name, sort_order, is_active
SubjectCategory     — id, name(unique), is_active
Subject             — id, category_id, name, is_active
```

#### SERVICES & BATCHES

```
Service        — id, teacher_id, title, slug(unique), description, format(ServiceFormat),
                 mode(ServiceMode), status(ServiceStatus), location fields, meeting fields,
                 joining_fee, monthly_fee, per_session_fee, currency, fee_note,
                 average_rating, total_reviews, deleted_at
ServicePaymentMethod — id, service_id, method, account_name, account_number, instructions
ServiceSubject — service_id + subject_id (composite PK)
ServiceLevel   — service_id + level_id (composite PK)

Batch          — id, service_id, name, description, status(BatchStatus),
                 max_students(required!), enrolled_count(cached), waitlist_enabled,
                 waitlist_count, start_date, end_date
BatchSchedule  — id, batch_id, day(DayOfWeek), start_time, end_time
                 UNIQUE: [batch_id, day]
ScheduleOverride — id, batch_id, override_date, type(ScheduleOverrideType),
                   reason, new_start, new_end
```

#### ENROLLMENT & PAYMENT

```
Enrollment     — id, batch_id, student_profile_id, status(EnrollmentStatus),
                 suspension_reason, suspension_until, removal_reason,
                 waitlist_position, invited_by_teacher, enrolled_at
                 UNIQUE: [batch_id, student_profile_id]
PaymentRecord  — id, enrollment_id, amount, currency, method, transaction_id,
                 sender_name, sender_number, screenshot_url, note, payment_for,
                 status(PaymentStatus), reviewed_by_id, rejection_note, reviewed_at,
                 gateway_name, gateway_transaction
TeacherInvite  — id, batch_id, teacher_id, student_profile_id, status, note
```

#### BATCH CONTENT (visible to active enrolled students + their guardians)

```
Attendance     — id, batch_id, student_profile_id, class_date, status(AttendanceStatus),
                 note, marked_by_id
                 UNIQUE: [batch_id, student_profile_id, class_date]
Task           — id, batch_id, title, description, due_date, class_date,
                 status(TaskStatus), created_by_id
TaskVisibility — id, task_id, student_profile_id, can_view
                 UNIQUE: [task_id, student_profile_id]
DailyNote      — id, batch_id, note_date, title, content, next_day_plan, created_by_id
                 UNIQUE: [batch_id, note_date]
NoteVisibility — id, note_id, student_profile_id, can_view
                 UNIQUE: [note_id, student_profile_id]
Announcement   — id, batch_id, title, body, created_by_id
```

#### POSTS

```
Post           — id, author_id, type(PostType), title, content, status(PostStatus),
                 service_id(optional link), preferred_mode, budget_min, budget_max,
                 currency, location fields, deleted_at
PostSubject    — post_id + subject_id (composite PK)
PostLevel      — post_id + level_id (composite PK)
PostMedia      — id, post_id, url, type(MediaType), sort_order
```

#### SOCIAL

```
Follow         — id, follower_id, following_id  UNIQUE: [follower_id, following_id]
Block          — id, blocker_id, blocked_id     UNIQUE: [blocker_id, blocked_id]
```

#### MESSAGING

```
Chat           — id, type(ChatType), batch_id(unique, for group), name, avatar_url
ChatParticipant — id, chat_id, user_id, joined_at, last_read, is_muted
                  UNIQUE: [chat_id, user_id]
Message        — id, chat_id, sender_id, body, media_url, media_type,
                 context_service_id, status, is_deleted, reply_to_id
MessageReadReceipt — id, message_id, user_id, read_at
                     UNIQUE: [message_id, user_id]
```

#### ENGAGEMENT

```
Review         — id, service_id, reviewer_id, enrollment_id(unique),
                 rating(1-5), comment, status(ReviewStatus),
                 teacher_reply, teacher_replied_at
                 UNIQUE: [service_id, reviewer_id]
Notification   — id, user_id, type(NotificationType), channel, title, body,
                 reference_type, reference_id, is_read, read_at, email_sent
EmailQueue     — id, to_email, to_name, subject, template, payload(Json),
                 attempts, max_attempts, sent, error
```

#### SUBSCRIPTIONS

```
SubscriptionPackage — id, name, slug(unique), description, status(PackageStatus),
                      price_monthly, price_quarterly, price_yearly, price_lifetime,
                      currency, max_services, max_batches_per_service,
                      max_students_per_batch, can_use_analytics, can_export_data,
                      is_featured, sort_order, badge_label
PackageFeature     — id, package_id, label, is_included, sort_order
SubscriptionHistory — id, user_id, package_id, status, billing_cycle,
                      started_at, expires_at, amount_paid, snapshot(Json)
```

---

## 🔢 ENUMS REFERENCE

```typescript
UserRole: TEACHER | STUDENT | GUARDIAN;
UserStatus: PENDING_VERIFICATION | ACTIVE | SUSPENDED | BANNED;
Gender: MALE | FEMALE | OTHER;
AdminRole: SUPER_ADMIN | ADMIN | MODERATOR;
AdminStatus: ACTIVE | INACTIVE;
AuditAction: USER_APPROVED |
  USER_SUSPENDED |
  USER_BANNED |
  POST_REMOVED |
  REVIEW_HIDDEN |
  SERVICE_CLOSED |
  ADMIN_CREATED |
  ADMIN_ROLE_CHANGED |
  PACKAGE_CREATED |
  PACKAGE_UPDATED |
  PACKAGE_ARCHIVED |
  SUBSCRIPTION_GRANTED |
  SUBSCRIPTION_REVOKED;
ServiceMode: ONLINE | OFFLINE | HYBRID;
ServiceFormat: BATCH | INDIVIDUAL | HOME_PRIVATE;
ServiceStatus: DRAFT | ACTIVE | PAUSED | CLOSED;
BatchStatus: UPCOMING | ONGOING | COMPLETED | CANCELLED;
DayOfWeek: SUNDAY | MONDAY | TUESDAY | WEDNESDAY | THURSDAY | FRIDAY | SATURDAY;
ScheduleOverrideType: CANCELLED | EXTRA | HOLIDAY | RESCHEDULED;
EnrollmentStatus: PENDING |
  APPROVED |
  REJECTED |
  WAITLISTED |
  REMOVED |
  SUSPENDED |
  LEFT;
PaymentStatus: PENDING | APPROVED | REJECTED;
PaymentMethod: BKASH | NAGAD | ROCKET | BANK_TRANSFER | CASH | OTHER;
PostType: OFFERING | SEEKING;
PostStatus: ACTIVE | CLOSED | DELETED;
MediaType: IMAGE | VIDEO | DOCUMENT;
ChatType: DIRECT | BATCH_GROUP;
MessageStatus: SENT | DELIVERED | READ;
AttendanceStatus: PRESENT | ABSENT | LATE | EXCUSED;
TaskStatus: ACTIVE | COMPLETED | CANCELLED;
ReviewStatus: VISIBLE | HIDDEN;
NotificationType: ACCOUNT_APPROVED |
  ACCOUNT_SUSPENDED |
  JOIN_REQUEST_RECEIVED |
  JOIN_REQUEST_ACCEPTED |
  JOIN_REQUEST_REJECTED |
  PAYMENT_SUBMITTED |
  PAYMENT_APPROVED |
  PAYMENT_REJECTED |
  ENROLLMENT_SUSPENDED |
  ENROLLMENT_REMOVED |
  ENROLLMENT_WAITLISTED |
  NEW_ANNOUNCEMENT |
  NEW_TASK |
  NEW_DAILY_NOTE |
  NEW_MESSAGE |
  ATTENDANCE_MARKED |
  GUARDIAN_LINK_REQUEST |
  GUARDIAN_LINK_ACCEPTED |
  FOLLOW_NEW |
  CLASS_CANCELLED |
  CLASS_RESCHEDULED;
NotificationChannel: IN_APP | EMAIL;
GuardianStudentStatus: PENDING | ACTIVE | REMOVED;
TeacherInviteStatus: PENDING | ACCEPTED | REJECTED;
SubscriptionStatus: ACTIVE | EXPIRED | CANCELLED;
PackageStatus: ACTIVE | INACTIVE | ARCHIVED;
BillingCycle: MONTHLY | QUARTERLY | YEARLY | LIFETIME;
```

---

## 🛡️ ADMIN PERMISSIONS

```typescript
PERMISSIONS: {
  CAN_VIEW: ["SUPER_ADMIN", "ADMIN", "MODERATOR"];
  CAN_WRITE: ["SUPER_ADMIN", "ADMIN", "MODERATOR"];
  CAN_DELETE: ["SUPER_ADMIN", "ADMIN"];
  CAN_VIEW_ADMINS: ["SUPER_ADMIN", "ADMIN"];
  CAN_EDIT_ADMIN: ["SUPER_ADMIN", "ADMIN"];
  CAN_REGISTER_ADMIN: ["SUPER_ADMIN"];
  CAN_DELETE_ADMIN: ["SUPER_ADMIN"];
  CAN_APPROVE_TEACHER: ["SUPER_ADMIN", "ADMIN"];
  CAN_SUSPEND_USER: ["SUPER_ADMIN", "ADMIN"];
  CAN_BAN_USER: ["SUPER_ADMIN"];
  CAN_MODERATE_POST: ["SUPER_ADMIN", "ADMIN", "MODERATOR"];
  CAN_MODERATE_REVIEW: ["SUPER_ADMIN", "ADMIN", "MODERATOR"];
  CAN_CLOSE_SERVICE: ["SUPER_ADMIN", "ADMIN"];
  CAN_VIEW_AUDIT_LOG: ["SUPER_ADMIN", "ADMIN"];
  CAN_MANAGE_EDUCATION: ["SUPER_ADMIN", "ADMIN"];
  CAN_ADD_ADMIN_NOTE: ["SUPER_ADMIN", "ADMIN", "MODERATOR"];
}
```

---

## ☁️ CLOUDINARY UPLOAD SYSTEM

### Folders:

```typescript
CLD_FOLDERS = {
  USER_AVATARS: "cms-dev/users/avatars",
  ADMIN_AVATARS: "cms-dev/admins/avatars",
  POST_MEDIA: "cms-dev/posts/media",
  SERVICE_COVERS: "cms-dev/services/covers",
  PAYMENT_SCREENSHOTS: "cms-dev/payments/screenshots",
  TASK_ATTACHMENTS: "cms-dev/tasks/attachments",
  NOTE_ATTACHMENTS: "cms-dev/notes/attachments",
  ANNOUNCEMENT_MEDIA: "cms-dev/announcements/media",
  MESSAGE_MEDIA: "cms-dev/messages/media",
};
```

### Max sizes:

```
USER_AVATARS, ADMIN_AVATARS  → 2MB
POST_MEDIA, NOTE_ATTACHMENTS,
ANNOUNCEMENT_MEDIA, SERVICE_COVERS,
PAYMENT_SCREENSHOTS          → 3-5MB
TASK_ATTACHMENTS, MESSAGE_MEDIA → 10MB
```

### Upload functions (utils/cloudinary-upload.ts):

```typescript
uploadToCloudinary(input: UploadInput): Promise<UploadResult>
deleteFromCloudinary(public_id: string, mimetype: string): Promise<void>
replaceInCloudinary(oldPublicId: string, oldMimetype: string, input: UploadInput): Promise<UploadResult>

type UploadInput = {
  buffer: Buffer;
  mimetype: string;
  originalFilename: string;  // REQUIRED — no unknown files
  folder: CldFolder;
  size: number;
}

type UploadResult = {
  url: string;        // Cloudinary secure URL
  public_id: string;  // used to delete/replace
  filename: string;
  mimetype: string;
  size: number;
  width?: number;     // images only
  height?: number;    // images only
}
```

### DB storage rule:

- Store `public_id` in DB (not URL) — URL can be rebuilt anytime
- Use `public_id` to delete from Cloudinary on record deletion

---

## 📤 MULTIPART PARSING (utils/parse-multipart.ts)

```typescript
// Always pass options — never call without allowedFileFields
const { fields, file, files } = await parseMultipart(req, {
  allowedFileFields: {
    avatar: {
      folder: CLD_FOLDERS.USER_AVATARS,
      maxCount: 1,
      required: false,
    },
  },
});

// Multiple files example:
const { files } = await parseMultipart(req, {
  allowedFileFields: {
    media: { folder: CLD_FOLDERS.POST_MEDIA, maxCount: 5 },
  },
});
const mediaFiles = files["media"] ?? [];

// Catch validation errors in controller:
import { MultipartValidationError } from "../../utils/parse-multipart.js";
try {
  const { fields, file } = await parseMultipart(req, options);
} catch (err) {
  if (err instanceof MultipartValidationError) {
    return reply.status(400).send({
      success: false,
      message: err.message,
      field: err.field,
    });
  }
  throw err;
}
```

---

## 🔑 BUSINESS LOGIC RULES

### Teacher Rules:

- Cannot create services until `is_approved = true` AND `is_email_verified = true`
- Free tier (no subscription): max **1 active** service
- Pro tier: max **4 active** services (check `UserSubscription.package.max_services`)
- Each service can have multiple batches (check `package.max_batches_per_service`)
- Teacher can directly invite students to a batch (`TeacherInvite`)
- Teacher marks attendance — students/guardians only view
- Teacher can suspend/remove/block students

### Student Rules:

- Can join a batch: submit enrollment request → teacher approves
- If batch is full + `waitlist_enabled = true` → status becomes `WAITLISTED`
- Can view tasks, daily notes, announcements ONLY if enrollment status is `APPROVED`
- Blocked students: cannot see teacher's profile, services, or any batch content
- Suspended students: temporarily cannot see batch content (check `suspension_until`)

### Guardian Rules:

- Must link to student first (mutual acceptance via `GuardianStudent`)
- Can see all their linked student's: attendance, tasks, daily notes, announcements
- Can enroll their child in a batch (on behalf of student)
- Cannot see content of batches where student is blocked/suspended

### Chat Rules:

- **DIRECT chat:** Check if chat already exists between two users before creating
  ```typescript
  // Find existing direct chat between userA and userB:
  const existing = await prisma.chat.findFirst({
    where: {
      type: "DIRECT",
      participants: {
        every: { user_id: { in: [userAId, userBId] } },
      },
    },
  });
  if (existing) return existing; // never create duplicate
  ```
- **BATCH_GROUP chat:** Auto-created when batch is created. Link via `batch_id`
- Blocked users cannot message each other

### Service Rules:

- `slug` must be unique — auto-generate from title using `slugify()`
- `format: INDIVIDUAL | HOME_PRIVATE` → max_students capped at 1 or 2
- `format: BATCH` → teacher sets max_students on each batch
- Location fields required for `OFFLINE` and `HYBRID` modes
- `meeting_link` required for `ONLINE` mode
- `status: DRAFT` → not visible publicly
- `status: ACTIVE` → visible in search and profiles

### Enrollment Slot Logic:

```typescript
// Before approving enrollment:
const batch = await prisma.batch.findUnique({ where: { id } });
if (batch.enrolled_count >= batch.max_students) {
  if (batch.waitlist_enabled) {
    // set status WAITLISTED, increment waitlist_count
  } else {
    throw new Error("BATCH_FULL");
  }
}
// On approval: increment enrolled_count
// On removal/left: decrement enrolled_count
```

### Visibility Logic (batch content):

```typescript
// Students can view task/note if:
// 1. Enrollment status = APPROVED
// 2. Not blocked by teacher
// 3. Not suspended (or suspension_until < now)
// 4. TaskVisibility.can_view = true for their student_profile_id

// Guardians can view if:
// 1. GuardianStudent link is ACTIVE for the student
// 2. Student passes all above checks
```

### Payment Flow:

```
1. Teacher adds payment methods on service (ServicePaymentMethod)
2. Student/Guardian submits PaymentRecord with transaction details + screenshot
3. PaymentRecord status = PENDING
4. Teacher reviews → APPROVED or REJECTED (with rejection_note)
5. On APPROVED for joining fee → enrollment can proceed
6. On APPROVED for monthly fee → update payment history
```

### Review Rules:

- Only allowed if enrollment status was ever `APPROVED` (use `enrollment_id` FK)
- One review per student per service (`UNIQUE: [service_id, reviewer_id]`)
- Teacher can reply once (`teacher_reply`, `teacher_replied_at`)
- Admin can hide reviews (`status: HIDDEN`)
- Rating 1–5 only

### Follow Rules:

- Any user can follow any other user
- Teacher profile → followers see their posts + services
- Student/Guardian profile → followers see their posts only
- No mutual requirement (one-way follow)

### Notification Rules:

- Always create in-app notification for every significant action
- Email notifications via `EmailQueue` table (processed by background worker)
- Reference fields: `reference_type` + `reference_id` for deep linking

---

## 📋 EXISTING COMPLETED MODULES

### ✅ admin/ — FULLY COMPLETE

Routes:

```
POST   /api/v1/admin/auth/login
POST   /api/v1/admin/auth/refresh
POST   /api/v1/admin/auth/logout          🔒 verifyAdminToken
GET    /api/v1/admin/auth/me              🔒 verifyAdminToken
PATCH  /api/v1/admin/auth/me              🔒 verifyAdminToken (multipart: avatar 1 file)
PATCH  /api/v1/admin/auth/me/password     🔒 verifyAdminToken
POST   /api/v1/admin/dashboard/admins     🔒 CAN_REGISTER_ADMIN
GET    /api/v1/admin/dashboard/admins     🔒 CAN_VIEW_ADMINS (query: page,limit,search,role,status)
GET    /api/v1/admin/dashboard/admins/:id 🔒 CAN_VIEW_ADMINS
PATCH  /api/v1/admin/dashboard/admins/:id 🔒 CAN_EDIT_ADMIN (multipart: avatar 1 file)
DELETE /api/v1/admin/dashboard/admins/:id 🔒 CAN_DELETE_ADMIN
```

Key service functions:

- `loginAdmin(input)` → `{ admin, tokens }`
- `generateTokens(payload)` → `{ accessToken, refreshToken }`
- `generateAccessToken(payload)` → `string`
- `refreshAdminToken(token)` → `{ accessToken, refreshToken }`
- `getAdminProfile(adminId)` → admin
- `updateOwnProfile(adminId, input, avatarFile?)` → admin
- `changeOwnPassword(adminId, input)` → void
- `registerAdmin(input, avatarFile?)` → admin
- `getAdminList(query)` → `{ data, meta }`
- `getAdminById(id)` → admin
- `updateAdminById(targetId, requestorId, requestorRole, input, avatarFile?)` → admin
- `deleteAdminById(targetId, requestorId)` → void

Named errors thrown by services:

```
INVALID_CREDENTIALS, ACCOUNT_SUSPENDED, EMAIL_TAKEN, NOT_FOUND,
WRONG_PASSWORD, USE_PROFILE_ENDPOINT, FORBIDDEN, CANNOT_CHANGE_ROLE,
CANNOT_DELETE_SELF, INVALID_REFRESH_TOKEN
```

---

## 🚧 MODULES TO BUILD (in recommended order)

```
1.  auth/           — user register, login, email verify, forgot/reset password
2.  user/           — profile CRUD for all roles
3.  education/      — level groups, levels, categories, subjects (admin write, public read)
4.  subscription/   — packages CRUD, subscribe, grant/revoke (admin)
5.  upload/         — cloudinary upload endpoints
6.  guardian/       — guardian↔student link requests
7.  service/        — CRUD + search by location/subject/level
8.  batch/          — CRUD under service
9.  schedule/       — default schedule + overrides
10. enrollment/     — join request, approve, reject, waitlist, invite
11. payment/        — submit, review, history
12. attendance/     — mark, bulk mark, view by student/batch
13. task/           — CRUD + visibility management
14. daily-note/     — CRUD + visibility management
15. announcement/   — CRUD per batch
16. post/           — OFFERING + SEEKING posts with media
17. messaging/      — chat creation, messages, read receipts
18. notification/   — list, mark read, mark all read
19. review/         — create, reply, list by service
20. follow/         — follow, unfollow, followers list, following list
21. block/          — block, unblock, check block status
```

---

## 🔒 SECURITY CHECKLIST FOR EVERY ENDPOINT

When generating any new endpoint, verify:

- [ ] Is auth middleware applied? (`verifyAdminToken` or `verifyUserToken`)
- [ ] Is role checked? (`requireRole` or `requireUserRole`)
- [ ] Is ownership verified? (user can only edit their own resources)
- [ ] Is soft-delete respected? (`deleted_at: null` in queries)
- [ ] Is `password` excluded from all selects?
- [ ] Is multipart validated with `parseMultipart()` options?
- [ ] Is `enrolled_count` updated when enrollment status changes?
- [ ] Is visibility checked for batch content?
- [ ] Is block status checked before returning teacher/service data?
- [ ] Is subscription limit checked before service creation?
- [ ] Is notification created for significant actions?
- [ ] Are named errors thrown and caught correctly?
- [ ] Is `audit_log` created for admin actions?

---

## 🧩 UTILITY FUNCTIONS AVAILABLE

```typescript
// utils/hash.ts
hashPassword(password: string): Promise<string>
comparePassword(password: string, hash: string): Promise<boolean>

// utils/slug.ts
generateSlug(title: string): string
generateUniqueSlug(title: string, checkExists: (slug: string) => Promise<boolean>): Promise<string>

// utils/pagination.ts
getPaginationMeta(total: number, page: number, limit: number) →
  { total, page, limit, total_pages, has_next, has_prev }

// utils/logger.ts
logger.info(msg)
logger.error(msg)
logger.warn(msg)

// utils/cloudinary-upload.ts
uploadToCloudinary(input: UploadInput): Promise<UploadResult>
deleteFromCloudinary(public_id: string, mimetype: string): Promise<void>
replaceInCloudinary(oldPublicId, oldMimetype, input): Promise<UploadResult>
extractKeyFromUrl(url: string): string

// utils/parse-multipart.ts
parseMultipart(req, options: MultipartOptions): Promise<ParsedMultipart>
// throws MultipartValidationError with { message, field }
```

---

## 🌍 ENVIRONMENT VARIABLES

```env
# Database
DATABASE_URL=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_ACCOUNT_ID=   # for reference only, not used in SDK

# Admin JWT (JWE encrypted)
ADMIN_JWT_ACCESS_SECRET=    # 32+ chars
ADMIN_JWT_REFRESH_SECRET=   # 32+ chars
ADMIN_JWT_ACCESS_EXPIRES=   # e.g. "15m"
ADMIN_JWT_REFRESH_EXPIRES=  # e.g. "7d"
ADMIN_COOKIE_ACCESS_NAME=   # e.g. "admin_access"
ADMIN_COOKIE_REFRESH_NAME=  # e.g. "admin_refresh"
ADMIN_COOKIE_ACCESS_MAX_AGE=   # seconds e.g. 900
ADMIN_COOKIE_REFRESH_MAX_AGE=  # seconds e.g. 604800

# User JWT (JWE encrypted)
USER_JWT_ACCESS_SECRET=    # 32+ chars
USER_JWT_REFRESH_SECRET=   # 32+ chars
USER_JWT_ACCESS_EXPIRES=   # e.g. "15m"
USER_JWT_REFRESH_EXPIRES=  # e.g. "7d"
USER_COOKIE_ACCESS_NAME=   # e.g. "user_access"
USER_COOKIE_REFRESH_NAME=  # e.g. "user_refresh"
USER_COOKIE_ACCESS_MAX_AGE=
USER_COOKIE_REFRESH_MAX_AGE=

# Cookie signing
COOKIE_SECRET=   # 32+ chars (used by @fastify/cookie for signed cookies)

# App
NODE_ENV=development
PORT=3000
```

---

## 📦 TECH STACK

```
Runtime:     Node.js + TypeScript
Framework:   Fastify
ORM:         Prisma (PostgreSQL)
Auth:        jose (JWE encrypted tokens) + @fastify/cookie (signed)
Validation:  Zod
Upload:      Cloudinary (cloudinary npm package)
Password:    bcryptjs
Schema:      Prisma multi-file (prismaSchemaFolder preview feature)
```

### Key Fastify plugins registered:

```typescript
@fastify/cookie    // cookie support + signing
@fastify/multipart // multipart form parsing
@fastify/cors      // CORS
@fastify/rate-limit // rate limiting
```

---

## 💬 EXAMPLE: How to Generate a New Module

When asked to generate a module (e.g. "generate the service module"), follow this process:

1. **Read this context file first**
2. **Generate in this order:** schema → service → controller → route
3. **Apply all critical rules from the top of this file**
4. **Follow the admin module as the gold standard pattern**
5. **Use snake_case** for all DB fields and response keys
6. **Check the business logic rules section** for module-specific rules
7. **Add to the security checklist** before finalizing

### Quick module template:

```typescript
// module.schema.ts
import { z } from "zod";
export const createXSchema = z.object({ ... });
export type CreateXInput = z.infer<typeof createXSchema>;

// module.service.ts
import { prisma } from "../../config/prisma.js";
export async function createX(input: CreateXInput, userId: string) {
  // business logic + throw named errors
}

// module.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
export async function createXController(req: FastifyRequest, reply: FastifyReply) {
  const body = createXSchema.safeParse(req.body);
  if (!body.success) return reply.status(400).send({ success: false, errors: body.error.flatten().fieldErrors });
  try {
    const data = await createX(body.data, req.user!.userId);
    return reply.status(201).send({ success: true, data });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return reply.status(404).send({ success: false, message: "Not found" });
    throw err;
  }
}

// module.route.ts
import { FastifyInstance } from "fastify";
import { verifyUserToken, requireUserRole } from "../auth/auth.middleware.js";
export async function xRoutes(fastify: FastifyInstance) {
  fastify.post("/", { preHandler: [verifyUserToken, requireUserRole("TEACHER")] }, createXController);
}
```

---

_End of context file. Share this entire file with any AI assistant to enable consistent, correct code generation for this project._
