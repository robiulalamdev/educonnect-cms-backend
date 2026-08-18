# EduConnect - Backend (Coaching Management System)

> **Version:** 2.0.0 | **Node:** 20+ | **TypeScript** | **Fastify** | **Prisma** | **PostgreSQL**

A production-ready backend API for EduConnect connecting teachers with students/guardians in Bangladesh.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+ (for rate limiting, caching)

### Installation
```bash
# Clone and navigate
cd backend

# Install dependencies
npm ci

# Copy environment template
cp .env.example .env

# Edit .env with your values (required!)
# DATABASE_URL, JWT secrets, Cloudinary, Email, Firebase, etc.

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start development server
npm run dev
```

Server runs at `http://localhost:9000`

### Docker (Recommended)
```bash
# From project root
docker-compose up -d
```

### 👤 Demo Accounts

All demo accounts share the password `123456`:

| Role | Email |
|------|-------|
| Super Admin | `superadmin@ec.com` |
| Teacher | `teacher@ec.com` |
| Student | `student@ec.com` |
| Guardian | `guardian@ec.com` |

> Super Admin signs in via `/api/v1/admin/auth/login`; the rest via `/api/v1/auth/login`.

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ |
| Framework | Fastify 5.x |
| Language | TypeScript 5.x |
| Database | PostgreSQL 16 + Prisma ORM |
| Auth | JWE (jose) + HttpOnly Cookies |
| Real-time | Socket.io |
| File Upload | Cloudinary |
| Validation | Zod 4.x |
| Logging | Pino |
| Rate Limit | @fastify/rate-limit |
| Email | Nodemailer (Gmail SMTP) |
| Push Notifications | Firebase Admin (FCM) |
| Location | Google Places API + Geocoding |

---

## 🏗 Project Structure

```
backend/
├── src/
│   ├── app.ts                 # Fastify app builder
│   ├── server.ts              # Entry point
│   ├── config/                # Configuration
│   │   ├── env.ts             # Validated env vars
│   │   ├── prisma.ts          # Prisma client
│   │   ├── jwt.ts             # JWT utilities
│   │   ├── socket.ts          # Socket.io manager
│   │   └── cloudinary.ts      # Cloudinary config
│   ├── middleware/            # Global middleware
│   │   ├── auth.middleware.ts # JWT verification
│   │   └── parse-body.middleware.ts
│   ├── plugins/               # Fastify plugins
│   │   ├── cors.ts
│   │   └── rateLimit.ts
│   ├── modules/               # Feature modules
│   │   ├── admin/             # Admin panel
│   │   ├── auth/              # Authentication
│   │   ├── user/              # User management
│   │   ├── teacher/           # Teacher profiles
│   │   ├── student/           # Student profiles
│   │   ├── guardian/          # Guardian profiles
│   │   ├── service/           # Coaching services
│   │   ├── batch/             # Batches & schedules
│   │   ├── enrollment/        # Enrollment & payments
│   │   ├── attendance/        # Attendance tracking
│   │   ├── task/              # Tasks/assignments
│   │   ├── daily-note/        # Notes system
│   │   ├── announcement/      # Announcements
│   │   ├── post/              # Posts (seek/offer)
│   │   ├── comment/           # Comments
│   │   ├── like/              # Likes
│   │   ├── follow/            # Follow system
│   │   ├── block/             # Block users
│   │   ├── review/            # Reviews & ratings
│   │   ├── story/             # Stories (24h)
│   │   ├── chat/              # Real-time chat
│   │   ├── notification/      # Notifications
│   │   ├── device/            # Device tokens (FCM)
│   │   ├── notification-preference/
│   │   ├── subscription/      # Subscription packages
│   │   ├── payment/           # Payment processing
│   │   ├── statistics/        # Analytics
│   │   ├── education/         # Education levels
│   │   └── shared/            # Shared services (email, notifications)
│   ├── utils/                 # Utilities
│   │   ├── hash.ts            # Bcrypt
│   │   ├── logger.ts          # Pino logger
│   │   ├── slug.ts            # URL slugs
│   │   ├── pagination.ts      # Pagination helpers
│   │   ├── cloudinary-upload.ts
│   │   ├── geocoding.ts       # Google Geocoding
│   │   └── parse-multipart.ts
│   ├── scripts/               # CLI scripts
│   │   └── create-super-admin.ts
│   └── database/
│       ├── schema.prisma      # Main Prisma schema
│       ├── models/            # Split model files
│       ├── migrations/        # Migration history
│       └── generated/         # Prisma Client output
├── prisma.config.js           # Prisma config
├── tsconfig.json
├── package.json
├── Dockerfile
├── .env.example
└── .gitignore
```

---

## 🔐 Authentication

### Token Strategy
- **Access Token**: 1 day expiry, JWE encrypted, HttpOnly cookie
- **Refresh Token**: 30 days expiry, JWE encrypted, HttpOnly cookie
- **Admin Tokens**: Separate secrets, separate cookies

### Auth Flow
```
1. Register → Email OTP sent
2. Verify OTP → Account created (unverified)
3. Login → Returns access + refresh cookies
4. Access token expires → Auto-refresh via refresh token
5. Refresh token expires → Re-login required
```

### Roles
| Role | Registration | Approval |
|------|-------------|----------|
| Teacher | Email OTP | Admin manual approval |
| Student | Email OTP | Auto-approved |
| Guardian | Email OTP | Auto-separated from users |

---

## 🌍 Location System (Bangladesh)

```
Division → District → Area/Upazila
(e.g., Dhaka → Dhaka → Dhanmondi)
```

- Division: 8 fixed options (dropdown)
- District: Filtered by division (dropdown)
- Area: Searchable, filtered by district (autocomplete)
- Address Line: Free text
- On save: Geocode → lat/lng for radius search

---

## 📚 API Documentation

### Base URL
```
Development: http://localhost:9000/api/v1
Production:  https://api.yourdomain.com/api/v1
```

### Endpoints by Module

| Module | Prefix | Description |
|--------|--------|-------------|
| Auth | `/auth` | Register, login, logout, refresh, verify, reset |
| User | `/user` | Profile, avatar, settings |
| Teacher | `/teacher` | Profile, verification, dashboard |
| Student | `/student` | Profile, enrollments, progress |
| Guardian | `/guardian` | Children linking, monitoring |
| Services | `/services` | CRUD, search, categories |
| Batches | `/batches` | CRUD, schedules, overrides |
| Enrollments | `/enrollments` | Join, payments, status |
| Attendance | `/attendance` | Mark, reports, calendar |
| Tasks | `/tasks` | Create, submit, grade |
| Daily Notes | `/daily-notes` | CRUD, visibility |
| Announcements | `/announcements` | CRUD, batch-wide |
| Posts | `/posts` | Seek/offer, feed, moderate |
| Comments | `/posts` | Nested comments |
| Likes | `/posts` | Like/unlike |
| Follows | `/follows` | Follow/unfollow |
| Blocks | `/blocks` | Block/unblock |
| Reviews | `/reviews` | Rate teachers/services |
| Stories | `/stories` | 24h ephemeral content |
| Chat | `/chats` | Direct + group, real-time |
| Notifications | `/notifications` | In-app + email + push |
| Devices | `/devices` | FCM token management |
| Notification Prefs | `/notification-preferences` | Granular settings |
| Subscriptions | `/subscription` | Packages, billing |
| Payments | `/payment` | Stripe/bKash/Nagad |
| Statistics | `/statistics` | Analytics dashboards |
| Education | `/education` | Levels, subjects, categories |
| Admin | `/admin` | Panel: users, teachers, content, analytics |

### Health Checks
```
GET /health        # Liveness probe
GET /ready         # Readiness probe (DB, Redis)
```

### Swagger UI
```
Development: http://localhost:9000/docs
```

---

## 🗄 Database Schema

### Core Models
- **User** - Base user with roles (TEACHER, STUDENT, GUARDIAN, ADMIN)
- **TeacherProfile** - Qualifications, experience, verification status
- **StudentProfile** - Education level, interests, guardian links
- **GuardianProfile** - Children management
- **Service** - Teacher's coaching offerings
- **Batch** - Class groups with schedules
- **Enrollment** - Student ↔ Batch with payment status
- **Attendance** - Session attendance records
- **Task** - Assignments with submissions/grades
- **DailyNote** - Teacher/student notes with visibility
- **Announcement** - Batch-wide announcements
- **Post** - Seeking/Offering posts
- **Chat/Message** - Real-time messaging
- **Notification** - In-app + email + push
- **Subscription** - Packages, features, billing
- **Review** - Teacher/service ratings

### Key Conventions
- All IDs: `String @id @default(cuid())`
- All fields: `snake_case`
- Soft deletes: `deletedAt DateTime?` on all user content
- Timestamps: `createdAt`, `updatedAt` on all models
- Indexes on foreign keys and query fields

---

## 🔧 Configuration

### Required Environment Variables
See `.env.example` for all variables. Key categories:

| Category | Variables |
|----------|-----------|
| App | `NODE_ENV`, `PORT`, `DATABASE_URL`, `CORS_ORIGINS` |
| Auth (User) | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_EXPIRES` |
| Cookies (User) | `COOKIE_SECRET`, `COOKIE_ACCESS_NAME`, `COOKIE_REFRESH_NAME`, `COOKIE_ACCESS_MAX_AGE`, `COOKIE_REFRESH_MAX_AGE` |
| Auth (Admin) | `ADMIN_JWT_ACCESS_SECRET`, `ADMIN_JWT_REFRESH_SECRET`, `ADMIN_JWT_ACCESS_EXPIRES`, `ADMIN_JWT_REFRESH_EXPIRES` |
| Cookies (Admin) | `ADMIN_COOKIE_ACCESS_NAME`, `ADMIN_COOKIE_REFRESH_NAME`, `ADMIN_COOKIE_ACCESS_MAX_AGE`, `ADMIN_COOKIE_REFRESH_MAX_AGE` |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_ACCOUNT_ID` |
| Email | `GMAIL_USER`, `GMAIL_APP_PASS` |
| Firebase | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| Frontend URLs | `FRONTEND_URL`, `ADMIN_FRONTEND_URL` |

---

## 🧪 Testing

```bash
# Unit tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Setup
- **Framework**: Vitest
- **Database**: Test PostgreSQL instance (Docker)
- **Mocking**: MSW for external APIs

---

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run production build |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run migrations (dev) |
| `npm run prisma:migrate deploy` | Run migrations (prod) |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run create:super-admin` | Create initial admin user |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |

---

## 🐳 Docker

### Build Image
```bash
docker build -t cms-backend ./backend
```

### Run Container
```bash
docker run -d \
  --name cms-backend \
  -p 9000:9000 \
  --env-file ./backend/.env \
  cms-backend
```

### Multi-service (with DB + Redis)
```bash
# From project root
docker-compose up -d
```

---

## 🚀 Deployment

### Environment Variables (Production)
Set all variables from `.env.example` with production values:
- Use strong secrets (32+ chars)
- Set `NODE_ENV=production`
- Use managed PostgreSQL (RDS, Cloud SQL, etc.)
- Use managed Redis (ElastiCache, etc.)
- Configure Cloudinary, Firebase, Email with production credentials

### Database Migrations
```bash
# On deployment
npm run prisma:migrate deploy
```

### Health Checks
- **Liveness**: `GET /health` - Returns 200 if process alive
- **Readiness**: `GET /ready` - Returns 200 if DB + Redis connected

### Reverse Proxy (Nginx)
```nginx
location /api/ {
    proxy_pass http://localhost:9000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_cache_bypass $http_upgrade;
}
```

---

## 🔒 Security

- **Helmet**: Security headers
- **CORS**: Configured origins only
- **Rate Limiting**: Per-IP, stricter on auth endpoints
- **JWE Tokens**: Encrypted, not just signed
- **HttpOnly Cookies**: No XSS token theft
- **Input Validation**: Zod schemas on all endpoints
- **SQL Injection**: Prisma parameterized queries
- **Soft Deletes**: No hard deletion of user data

---

## 📊 Monitoring

- **Logs**: Pino JSON logs (stdout)
- **Metrics**: Custom `/metrics` endpoint (Prometheus format)
- **Tracing**: OpenTelemetry ready
- **Error Tracking**: Sentry integration ready

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- ESLint + Prettier configured
- TypeScript strict mode
- Conventional commits

---

## 📄 License

MIT License - see LICENSE file for details.

---

## 📞 Support

- **Documentation**: `/docs` folder
- **API Docs**: `/docs` endpoint (Swagger)
- **Issues**: GitHub Issues