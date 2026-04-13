import admin from "firebase-admin";
import { env } from "../../config/env.js";

/**
 * Optimized Push Notification Service using Firebase Cloud Messaging (FCM)
 */
class NotificationService {
  constructor() {
    // Only initialize if keys are provided
    if (env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    }
  }

  /**
   * Send push notification to a specific FCM token
   */
  async sendToToken(token: string, title: string, body: string, data?: Record<string, string>) {
    try {
      const message = {
        notification: { title, body },
        data: data || {},
        token,
      };
      return await admin.messaging().send(message);
    } catch (error) {
      console.error("Firebase notification failed:", error);
      // We don't throw here to prevent blocking background processes if FCM fails
      return null;
    }
  }

  /**
   * Send notification to a specific user (needs to fetch their active device tokens)
   */
  async sendToUser(userId: string, title: string, body: string, data?: Record<string, string>) {
    // Logic: 
    // 1. Fetch all active device tokens for the user from UserDevice table (to be implemented)
    // 2. Loop and send
    console.log(`[Notification] Would send to user ${userId}: ${title} - ${body}`);
  }

  /**
   * Send notification to a topic (e.g. batch_all_students)
   */
  async sendToTopic(topic: string, title: string, body: string, data?: Record<string, string>) {
    try {
      const message = {
        notification: { title, body },
        data: data || {},
        topic,
      };
      return await admin.messaging().send(message);
    } catch (error) {
      console.error("Firebase topic notification failed:", error);
      return null;
    }
  }
}

export const notificationService = new NotificationService();
