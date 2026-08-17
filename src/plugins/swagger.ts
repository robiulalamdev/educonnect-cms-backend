import { FastifyInstance } from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { env } from "../config/env.js";

export async function setupSwagger(app: FastifyInstance) {
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "EduConnect API",
        description: "API documentation for CMS - Connecting teachers with students/guardians",
        version: "2.0.0",
        contact: {
          name: "CMS Team",
          email: "support@cms.example.com",
        },
        license: {
          name: "MIT",
          url: "https://opensource.org/licenses/MIT",
        },
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}/api/v1`,
          description: "Development server",
        },
        {
          url: `https://api.cms.example.com/api/v1`,
          description: "Production server",
        },
      ],
      tags: [
        { name: "Auth", description: "Authentication endpoints" },
        { name: "User", description: "User profile management" },
        { name: "Teacher", description: "Teacher profiles and verification" },
        { name: "Student", description: "Student profiles" },
        { name: "Guardian", description: "Guardian profiles and linking" },
        { name: "Services", description: "Coaching service management" },
        { name: "Batches", description: "Batch and schedule management" },
        { name: "Enrollments", description: "Enrollment and payment" },
        { name: "Attendance", description: "Attendance tracking" },
        { name: "Tasks", description: "Assignments and tasks" },
        { name: "Daily Notes", description: "Notes system" },
        { name: "Announcements", description: "Batch announcements" },
        { name: "Posts", description: "Social posts (seek/offer)" },
        { name: "Comments", description: "Post comments" },
        { name: "Likes", description: "Post likes" },
        { name: "Follows", description: "User follows" },
        { name: "Blocks", description: "User blocks" },
        { name: "Reviews", description: "Teacher/service reviews" },
        { name: "Stories", description: "Ephemeral stories" },
        { name: "Chat", description: "Real-time messaging" },
        { name: "Notifications", description: "Notifications (in-app, email, push)" },
        { name: "Devices", description: "Device tokens for push notifications" },
        { name: "Notification Preferences", description: "Granular notification settings" },
        { name: "Subscriptions", description: "Subscription packages and billing" },
        { name: "Payments", description: "Payment processing" },
        { name: "Statistics", description: "Analytics and dashboards" },
        { name: "Education", description: "Education levels, subjects, categories" },
        { name: "Admin", description: "Admin panel endpoints" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Access token in Authorization header or HttpOnly cookie",
          },
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "cms_access_token",
            description: "Access token in HttpOnly cookie",
          },
          adminCookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "cms_admin_access",
            description: "Admin access token in HttpOnly cookie",
          },
        },
        schemas: {
          Error: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              message: { type: "string", example: "Error message" },
              errors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    field: { type: "string" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          Success: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string", example: "Operation successful" },
              data: { type: "object" },
            },
          },
          PaginatedResponse: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "array", items: { type: "object" } },
              meta: {
                type: "object",
                properties: {
                  page: { type: "integer", example: 1 },
                  limit: { type: "integer", example: 10 },
                  total: { type: "integer", example: 100 },
                  totalPages: { type: "integer", example: 10 },
                },
              },
            },
          },
          User: {
            type: "object",
            properties: {
              id: { type: "string", format: "cuid" },
              email: { type: "string", format: "email" },
              username: { type: "string" },
              role: { type: "string", enum: ["TEACHER", "STUDENT", "GUARDIAN", "ADMIN"] },
              isVerified: { type: "boolean" },
              isActive: { type: "boolean" },
              avatar: { type: "string", format: "uri", nullable: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          TeacherProfile: {
            type: "object",
            properties: {
              id: { type: "string", format: "cuid" },
              userId: { type: "string", format: "cuid" },
              fullName: { type: "string" },
              bio: { type: "string", nullable: true },
              qualifications: { type: "string", nullable: true },
              experienceYears: { type: "integer", nullable: true },
              hourlyRate: { type: "number", nullable: true },
              isApproved: { type: "boolean" },
              approvalStatus: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
              rejectionReason: { type: "string", nullable: true },
              documents: { type: "array", items: { type: "string" } },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          Service: {
            type: "object",
            properties: {
              id: { type: "string", format: "cuid" },
              teacherId: { type: "string", format: "cuid" },
              title: { type: "string" },
              description: { type: "string" },
              subjectId: { type: "string", format: "cuid" },
              levelId: { type: "string", format: "cuid" },
              price: { type: "number" },
              priceType: { type: "string", enum: ["MONTHLY", "PER_SESSION", "PACKAGE"] },
              location: {
                type: "object",
                properties: {
                  division: { type: "string" },
                  district: { type: "string" },
                  area: { type: "string" },
                  addressLine: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                },
              },
              isActive: { type: "boolean" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          Batch: {
            type: "object",
            properties: {
              id: { type: "string", format: "cuid" },
              serviceId: { type: "string", format: "cuid" },
              name: { type: "string" },
              description: { type: "string", nullable: true },
              maxStudents: { type: "integer" },
              currentStudents: { type: "integer" },
              startDate: { type: "string", format: "date-time" },
              endDate: { type: "string", format: "date-time", nullable: true },
              isActive: { type: "boolean" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          Enrollment: {
            type: "object",
            properties: {
              id: { type: "string", format: "cuid" },
              studentId: { type: "string", format: "cuid" },
              batchId: { type: "string", format: "cuid" },
              status: { type: "string", enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "REFUNDED"] },
              paymentStatus: { type: "string", enum: ["PENDING", "PAID", "FAILED", "REFUNDED"] },
              amountPaid: { type: "number" },
              enrolledAt: { type: "string", format: "date-time" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
      security: [
        { bearerAuth: [] },
        { cookieAuth: [] },
        { adminCookieAuth: [] },
      ],
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      tryItOutEnabled: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'"),
  });
}