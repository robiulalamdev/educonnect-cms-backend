import admin from "firebase-admin";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";

class NotificationService {
  private initialized = false;

  constructor() {
    try {
      if (env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: env.FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
            privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          }),
        });
        this.initialized = true;
      }
    } catch (err) {
      console.error("[FCM] Initialization failed:", err);
    }
  }

  /**
   * Send push notification to a specific FCM token.
   * Always returns gracefully — never throws.
   */
  async sendToToken(token: string, title: string, body: string, data?: Record<string, string>) {
    if (!this.initialized) return null;
    try {
      return await admin.messaging().send({
        notification: { title, body },
        data: data || {},
        token,
      });
    } catch (error: any) {
      if (error.code === "messaging/registration-token-not-registered") {
        await prisma.userDevice.deleteMany({ where: { fcm_token: token } }).catch(() => {});
      }
      console.error("[FCM] Send failed:", error.message);
      return null;
    }
  }

  /**
   * Send push notification to all active devices of a user.
   * Always returns gracefully — never throws.
   */
  async sendToUser(userId: string, title: string, body: string, data?: Record<string, string>) {
    if (!this.initialized) return null;

    try {
      const devices = await prisma.userDevice.findMany({
        where: { user_id: userId, is_active: true },
        select: { fcm_token: true },
      }).catch(() => []);

      if (devices.length === 0) return null;

      const results = await Promise.allSettled(
        devices.map((d) =>
          admin.messaging().send({
            notification: { title, body },
            data: data || {},
            token: d.fcm_token,
          })
        )
      );

      // Clean up invalid tokens
      const invalidTokens: string[] = [];
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          const err = r.reason as any;
          if (err.code === "messaging/registration-token-not-registered") {
            invalidTokens.push(devices[i].fcm_token);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await prisma.userDevice.deleteMany({
          where: { fcm_token: { in: invalidTokens } },
        }).catch(() => {});
      }

      return results;
    } catch (err) {
      console.error("[FCM] sendToUser failed:", err);
      return null;
    }
  }

  /**
   * Return the public Firebase config needed by the frontend for Web Push.
   */
  getPublicConfig() {
    return {
      project_id: env.FIREBASE_PROJECT_ID,
      vapid_public_key: env.FIREBASE_VAPID_PUBLIC_KEY,
      sender_id: env.FIREBASE_SENDER_ID,
    };
  }

  /**
   * Send notification to a topic.
   * Always returns gracefully — never throws.
   */
  async sendToTopic(topic: string, title: string, body: string, data?: Record<string, string>) {
    if (!this.initialized) return null;
    try {
      return await admin.messaging().send({
        notification: { title, body },
        data: data || {},
        topic,
      });
    } catch (error) {
      console.error("[FCM] Topic send failed:", error);
      return null;
    }
  }
}

export const notificationService = new NotificationService();
