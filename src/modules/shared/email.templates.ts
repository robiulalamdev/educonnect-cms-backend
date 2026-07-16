import { env } from "../../config/env.js";

const BASE_STYLE = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 0;
`;

const CARD_STYLE = `
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
`;

const HEADER_STYLE = `
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  padding: 32px 24px;
  text-align: center;
`;

const BODY_STYLE = `
  padding: 32px 24px;
  color: #374151;
  line-height: 1.6;
`;

const BUTTON_STYLE = `
  display: inline-block;
  background: #6366f1;
  color: #ffffff !important;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  margin: 16px 0;
`;

const FOOTER_STYLE = `
  padding: 16px 24px;
  text-align: center;
  color: #9ca3af;
  font-size: 12px;
  border-top: 1px solid #f3f4f6;
`;

function wrap(title: string, headerTitle: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="${BASE_STYLE}">
  <div style="${CARD_STYLE}">
    <div style="${HEADER_STYLE}">
      <h1 style="color: #fff; margin: 0; font-size: 24px;">${headerTitle}</h1>
    </div>
    <div style="${BODY_STYLE}">
      ${bodyHtml}
    </div>
    <div style="${FOOTER_STYLE}">
      Coaching Management System &copy; ${new Date().getFullYear()}
    </div>
  </div>
</body>
</html>`;
}

// ── Templates ─────────────────────────────────────────────

export function verificationEmail(code: string): { subject: string; html: string } {
  return {
    subject: "Verify your email address",
    html: wrap("Verify Email", "Verify Your Email", `
      <p>Hi there,</p>
      <p>Your email verification code is:</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6366f1;">${code}</span>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes. If you didn't create an account, you can safely ignore this email.</p>
    `),
  };
}

export function passwordResetEmail(token: string): { subject: string; html: string } {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  return {
    subject: "Reset your password",
    html: wrap("Reset Password", "Reset Your Password", `
      <p>Hi there,</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" style="${BUTTON_STYLE}">Reset Password</a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
    `),
  };
}

export function enrollmentApprovedEmail(studentName: string, batchName: string): { subject: string; html: string } {
  const dashUrl = `${env.FRONTEND_URL}/dashboard`;
  return {
    subject: "Enrollment Approved",
    html: wrap("Enrollment", "Enrollment Approved! 🎉", `
      <p>Hi ${studentName},</p>
      <p>Your enrollment in <strong>${batchName}</strong> has been approved!</p>
      <p>You can now access the batch chat, assignments, and class materials.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${dashUrl}" style="${BUTTON_STYLE}">Go to Dashboard</a>
      </div>
    `),
  };
}

export function enrollmentRejectedEmail(studentName: string, batchName: string, reason?: string): { subject: string; html: string } {
  return {
    subject: "Enrollment Update",
    html: wrap("Enrollment", "Enrollment Update", `
      <p>Hi ${studentName},</p>
      <p>Your enrollment request for <strong>${batchName}</strong> was not approved${reason ? `: ${reason}` : ""}.</p>
      <p>You can browse other available services and try again.</p>
    `),
  };
}

export function paymentApprovedEmail(studentName: string, batchName: string, amount: number, currency: string): { subject: string; html: string } {
  return {
    subject: "Payment Approved",
    html: wrap("Payment", "Payment Approved ✅", `
      <p>Hi ${studentName},</p>
      <p>Your payment of <strong>${currency} ${amount}</strong> for <strong>${batchName}</strong> has been approved.</p>
      <p>Thank you for your payment!</p>
    `),
  };
}

export function paymentRejectedEmail(studentName: string, batchName: string, reason?: string): { subject: string; html: string } {
  return {
    subject: "Payment Update",
    html: wrap("Payment", "Payment Not Approved", `
      <p>Hi ${studentName},</p>
      <p>Your payment for <strong>${batchName}</strong> was not approved${reason ? `: ${reason}` : ""}.</p>
      <p>Please check the payment details and try again.</p>
    `),
  };
}

export function teacherApprovedEmail(teacherName: string): { subject: string; html: string } {
  const dashUrl = `${env.FRONTEND_URL}/dashboard`;
  return {
    subject: "Teacher Account Approved",
    html: wrap("Account", "Teacher Account Approved! 🎓", `
      <p>Hi ${teacherName},</p>
      <p>Your teacher account has been approved. You can now create coaching services and start teaching!</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${dashUrl}" style="${BUTTON_STYLE}">Go to Dashboard</a>
      </div>
    `),
  };
}

export function accountSuspendedEmail(userName: string): { subject: string; html: string } {
  return {
    subject: "Account Suspended",
    html: wrap("Account", "Account Suspended", `
      <p>Hi ${userName},</p>
      <p>Your account has been suspended. You will not be able to access the platform until this is resolved.</p>
      <p>Please contact support if you believe this is a mistake.</p>
    `),
  };
}

export function accountBannedEmail(userName: string): { subject: string; html: string } {
  return {
    subject: "Account Banned",
    html: wrap("Account", "Account Banned", `
      <p>Hi ${userName},</p>
      <p>Your account has been permanently banned due to a violation of our terms of service.</p>
    `),
  };
}

export function newAnnouncementEmail(studentName: string, batchName: string, title: string): { subject: string; html: string } {
  return {
    subject: `New Announcement: ${title}`,
    html: wrap("Announcement", "New Announcement", `
      <p>Hi ${studentName},</p>
      <p>A new announcement has been posted in <strong>${batchName}</strong>:</p>
      <div style="background: #f9fafb; border-left: 4px solid #6366f1; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
        <strong>${title}</strong>
      </div>
    `),
  };
}

export function classCancelledEmail(studentName: string, batchName: string, date: string, reason?: string): { subject: string; html: string } {
  return {
    subject: `Class Cancelled - ${batchName}`,
    html: wrap("Schedule", "Class Cancelled ❌", `
      <p>Hi ${studentName},</p>
      <p>The class for <strong>${batchName}</strong> on <strong>${date}</strong> has been cancelled${reason ? `: ${reason}` : ""}.</p>
    `),
  };
}

export function classRescheduledEmail(studentName: string, batchName: string, date: string, newTime: string, reason?: string): { subject: string; html: string } {
  return {
    subject: `Class Rescheduled - ${batchName}`,
    html: wrap("Schedule", "Class Rescheduled 📅", `
      <p>Hi ${studentName},</p>
      <p>The class for <strong>${batchName}</strong> on <strong>${date}</strong> has been rescheduled to <strong>${newTime}</strong>.</p>
      ${reason ? `<p>Reason: ${reason}</p>` : ""}
    `),
  };
}

export function guardianLinkRequestEmail(studentName: string): { subject: string; html: string } {
  return {
    subject: "Guardian Link Request",
    html: wrap("Guardian", "Guardian Link Request", `
      <p>Hi there,</p>
      <p><strong>${studentName}</strong> has sent you a guardian link request. This allows them to view your attendance, tasks, and class notes.</p>
      <p>Log in to accept or reject this request.</p>
    `),
  };
}

export function guardianLinkAcceptedEmail(guardianName: string): { subject: string; html: string } {
  return {
    subject: "Guardian Link Accepted",
    html: wrap("Guardian", "Guardian Link Accepted ✅", `
      <p>Hi there,</p>
      <p>Your guardian link request from <strong>${guardianName}</strong> has been accepted. You are now linked.</p>
    `),
  };
}

export function newTaskEmail(studentName: string, batchName: string, taskTitle: string): { subject: string; html: string } {
  return {
    subject: `New Task: ${taskTitle}`,
    html: wrap("Task", "New Task Assigned 📝", `
      <p>Hi ${studentName},</p>
      <p>A new task has been assigned in <strong>${batchName}</strong>:</p>
      <div style="background: #f9fafb; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
        <strong>${taskTitle}</strong>
      </div>
    `),
  };
}

export function newDailyNoteEmail(studentName: string, batchName: string, title?: string): { subject: string; html: string } {
  return {
    subject: `New Class Note - ${batchName}`,
    html: wrap("Note", "New Class Note 📒", `
      <p>Hi ${studentName},</p>
      <p>A new class note has been posted in <strong>${batchName}</strong>${title ? `: <strong>${title}</strong>` : ""}.</p>
    `),
  };
}
