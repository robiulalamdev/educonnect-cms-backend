import nodemailer from "nodemailer";
import { env } from "../../config/env.js";
import * as templates from "./email.templates.js";

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

  private async send(to: string, subject: string, html: string) {
    try {
      return await this.transporter.sendMail({
        from: `"EduConnect" <${env.GMAIL_USER}>`,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error("[Email] Send failed:", error);
    }
  }

  // ── Auth ──────────────────────────────────────────────────

  async sendVerificationEmail(to: string, code: string) {
    const { subject, html } = templates.verificationEmail(code);
    return this.send(to, subject, html);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const { subject, html } = templates.passwordResetEmail(token);
    return this.send(to, subject, html);
  }

  // ── Enrollment ────────────────────────────────────────────

  async sendEnrollmentApprovalEmail(to: string, studentName: string, batchName: string) {
    const { subject, html } = templates.enrollmentApprovedEmail(studentName, batchName);
    return this.send(to, subject, html);
  }

  async sendEnrollmentRejectionEmail(to: string, studentName: string, batchName: string, reason?: string) {
    const { subject, html } = templates.enrollmentRejectedEmail(studentName, batchName, reason);
    return this.send(to, subject, html);
  }

  // ── Payment ───────────────────────────────────────────────

  async sendPaymentApprovedEmail(to: string, studentName: string, batchName: string, amount: number, currency: string) {
    const { subject, html } = templates.paymentApprovedEmail(studentName, batchName, amount, currency);
    return this.send(to, subject, html);
  }

  async sendPaymentRejectedEmail(to: string, studentName: string, batchName: string, reason?: string) {
    const { subject, html } = templates.paymentRejectedEmail(studentName, batchName, reason);
    return this.send(to, subject, html);
  }

  // ── Account ───────────────────────────────────────────────

  async sendTeacherApprovedEmail(to: string, teacherName: string) {
    const { subject, html } = templates.teacherApprovedEmail(teacherName);
    return this.send(to, subject, html);
  }

  async sendAccountSuspendedEmail(to: string, userName: string) {
    const { subject, html } = templates.accountSuspendedEmail(userName);
    return this.send(to, subject, html);
  }

  async sendAccountBannedEmail(to: string, userName: string) {
    const { subject, html } = templates.accountBannedEmail(userName);
    return this.send(to, subject, html);
  }

  // ── Batch Content ─────────────────────────────────────────

  async sendNewAnnouncementEmail(to: string, studentName: string, batchName: string, title: string) {
    const { subject, html } = templates.newAnnouncementEmail(studentName, batchName, title);
    return this.send(to, subject, html);
  }

  async sendClassCancelledEmail(to: string, studentName: string, batchName: string, date: string, reason?: string) {
    const { subject, html } = templates.classCancelledEmail(studentName, batchName, date, reason);
    return this.send(to, subject, html);
  }

  async sendClassRescheduledEmail(to: string, studentName: string, batchName: string, date: string, newTime: string, reason?: string) {
    const { subject, html } = templates.classRescheduledEmail(studentName, batchName, date, newTime, reason);
    return this.send(to, subject, html);
  }

  async sendNewTaskEmail(to: string, studentName: string, batchName: string, taskTitle: string) {
    const { subject, html } = templates.newTaskEmail(studentName, batchName, taskTitle);
    return this.send(to, subject, html);
  }

  async sendNewDailyNoteEmail(to: string, studentName: string, batchName: string, title?: string) {
    const { subject, html } = templates.newDailyNoteEmail(studentName, batchName, title);
    return this.send(to, subject, html);
  }

  // ── Guardian ──────────────────────────────────────────────

  async sendGuardianLinkRequestEmail(to: string, studentName: string) {
    const { subject, html } = templates.guardianLinkRequestEmail(studentName);
    return this.send(to, subject, html);
  }

  async sendGuardianLinkAcceptedEmail(to: string, guardianName: string) {
    const { subject, html } = templates.guardianLinkAcceptedEmail(guardianName);
    return this.send(to, subject, html);
  }
}

export const emailService = new EmailService();
