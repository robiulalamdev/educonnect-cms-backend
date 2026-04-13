import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

/**
 * Optimized Email Service using Gmail SMTP
 */
class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.GMAIL_USER,
        pass: env.GMAIL_APP_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"Coaching Management System" <${env.GMAIL_USER}>`,
        to,
        subject,
        html,
      });
      return info;
    } catch (error) {
      console.error("Email sending failed:", error);
      throw new Error("EMAIL_SEND_FAILED");
    }
  }

  // -- Predefined Templates --

  async sendVerificationEmail(to: string, code: string) {
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
        <h2>Verify your Email</h2>
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `;
    return this.sendEmail(to, "Email Verification Code", html);
  }

  async sendEnrollmentApprovalEmail(to: string, studentName: string, batchName: string) {
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #6366f1; color: #fff; background: #1e1b4b;">
        <h2>Enrollment Approved! 🎉</h2>
        <p>Hi ${studentName},</p>
        <p>Your enrollment in <strong>${batchName}</strong> has been approved. You can now access the batch chat and materials.</p>
        <br/>
        <a href="${env.FRONTEND_URL}/dashboard" style="background: #fff; color: #1e1b4b; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
      </div>
    `;
    return this.sendEmail(to, "Enrollment Approved", html);
  }
}

export const emailService = new EmailService();
