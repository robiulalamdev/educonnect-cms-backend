import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/coaching_management_test?schema=public';
process.env.JWT_ACCESS_SECRET = 'test-secret-access-key-min-32-chars';
process.env.JWT_REFRESH_SECRET = 'test-secret-refresh-key-min-32-chars';
process.env.JWT_ACCESS_EXPIRES = '1h';
process.env.JWT_REFRESH_EXPIRES = '7d';
process.env.COOKIE_SECRET = 'test-cookie-secret-min-32-chars';
process.env.COOKIE_ACCESS_NAME = 'cms_access_token';
process.env.COOKIE_REFRESH_NAME = 'cms_refresh_token';
process.env.COOKIE_ACCESS_MAX_AGE = '3600000';
process.env.COOKIE_REFRESH_MAX_AGE = '604800000';
process.env.ADMIN_JWT_ACCESS_SECRET = 'test-admin-access-secret-min-32-chars';
process.env.ADMIN_JWT_REFRESH_SECRET = 'test-admin-refresh-secret-min-32-chars';
process.env.ADMIN_JWT_ACCESS_EXPIRES = '1h';
process.env.ADMIN_JWT_REFRESH_EXPIRES = '7d';
process.env.ADMIN_COOKIE_ACCESS_NAME = 'cms_admin_access';
process.env.ADMIN_COOKIE_REFRESH_NAME = 'cms_admin_refresh';
process.env.ADMIN_COOKIE_ACCESS_MAX_AGE = '3600000';
process.env.ADMIN_COOKIE_REFRESH_MAX_AGE = '604800000';
process.env.ADMIN_PANEL_ORIGINS = 'https://educonnect-cms.vercel.app';
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';
process.env.CLOUDINARY_ACCOUNT_ID = 'test';
process.env.GMAIL_USER = 'test@test.com';
process.env.GMAIL_APP_PASS = 'test';
process.env.FIREBASE_PROJECT_ID = 'test';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----\n';
process.env.FRONTEND_URL = 'https://educonnect-cms.vercel.app';
process.env.ADMIN_FRONTEND_URL = 'https://educonnect-cms.vercel.app';
process.env.CORS_ORIGINS = 'https://educonnect-cms.vercel.app';

// Global test timeout
vi.setConfig({ testTimeout: 10000 });

// Mock external services
vi.mock('@fastify/rate-limit', () => ({
  default: vi.fn(),
}));

vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: vi.fn().mockResolvedValue({ secure_url: 'https://test.cloudinary.com/test.jpg' }),
      destroy: vi.fn().mockResolvedValue({ result: 'ok' }),
    },
  },
}));

vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({
    sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  })),
}));

vi.mock('firebase-admin', () => ({
  initializeApp: vi.fn(),
  credential: {
    cert: vi.fn(),
  },
  messaging: vi.fn(() => ({
    send: vi.fn().mockResolvedValue('test-message-id'),
  })),
}));

// Global Prisma client for tests
let prisma: PrismaClient;

beforeAll(async () => {
  prisma = new PrismaClient();
  // Clean database before tests
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean before each test
  await cleanDatabase();
});

afterEach(async () => {
  // Clean after each test
  await cleanDatabase();
});

async function cleanDatabase() {
  const models = [
    'messageReadReceipt',
    'message',
    'chatParticipant',
    'chat',
    'storyView',
    'story',
    'review',
    'follow',
    'block',
    'like',
    'comment',
    'post',
    'attendance',
    'enrollment',
    'scheduleOverride',
    'batchSchedule',
    'batch',
    'serviceSubject',
    'serviceLevel',
    'servicePaymentMethod',
    'service',
    'subjectCategory',
    'subject',
    'educationLevelGroup',
    'educationLevel',
    'taskVisibility',
    'task',
    'noteVisibility',
    'dailyNote',
    'announcement',
    'paymentRecord',
    'subscriptionHistory',
    'userSubscription',
    'packageFeature',
    'subscriptionPackage',
    'notificationPreference',
    'notification',
    'device',
    'teacherInvite',
    'guardianStudent',
    'guardianProfile',
    'studentProfile',
    'teacherProfile',
    'user',
    'adminNote',
    'auditLog',
    'admin',
    'media',
  ];

  for (const model of models) {
    try {
      await (prisma as any)[model].deleteMany();
    } catch (e) {
      // Model might not exist, ignore
    }
  }
}

// Export for test files
export { prisma };