import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { buildEmail } from './emailTemplates.js';

dotenv.config();

let cachedTransporter = null;

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '0', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !port || !user || !pass) {
    return null;
  }

  const secure = port === 465; // true for 465, false for 587/others

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
}

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

export async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const transporter = createTransporter();
  if (!transporter) return null;
  try {
    await transporter.verify();
  } catch (_) {
    // Even if verify fails (some providers block it), we still try to send
  }
  cachedTransporter = transporter;
  return cachedTransporter;
}

export async function sendMail({ to, subject, html, text, from, attachments = [] }) {
  const transporter = await getTransporter();
  if (!transporter) {
    // Email not configured; no-op
    return { skipped: true };
  }

  const mailFrom = from || process.env.EMAIL_FROM || process.env.SMTP_USER;

  const info = await transporter.sendMail({
    from: mailFrom,
    to,
    subject,
    text,
    html,
    attachments
  });

  return { messageId: info.messageId };
}

async function fetchBrandLogoAttachment() {
  try {
    const logoUrl = process.env.EMAIL_BRAND_LOGO_URL || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/sun-lms-logo-compact.png`;
    if (!logoUrl) return null;
    if (typeof fetch !== 'function') return null;
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return {
      filename: 'brand-logo.png',
      content: buffer,
      cid: 'brand-logo'
    };
  } catch (_) {
    return null;
  }
}

export async function sendTemplatedEmail(templateId, { to, variables = {}, from }) {
  const transporter = await getTransporter();
  if (!transporter) return { skipped: true };
  const brandLogoAttachment = await fetchBrandLogoAttachment();
  const { subject, html, text } = buildEmail(templateId, {
    brandLogoCid: brandLogoAttachment ? 'brand-logo' : undefined,
    brandLogoUrl: process.env.EMAIL_BRAND_LOGO_URL || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/sun-lms-logo-compact.png`,
    ...variables
  });
  return sendMail({ to, subject, html, text, from, attachments: brandLogoAttachment ? [brandLogoAttachment] : [] });
}

export function buildPasswordResetHtml({ appName, resetUrl }) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const logoUrl = `${frontendUrl}/sun-lms-logo-compact.png`;
  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <img src="${logoUrl}" alt="${appName} logo" width="28" height="28" style="display:block" />
      <h2 style="margin:0">${appName} — Reset your password</h2>
    </div>
    <p>We received a request to reset your password. Click the button below to set a new password. This link expires in 1 hour.</p>
    <p>
      <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Reset Password</a>
    </p>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  </div>
  `;
}

export async function sendPasswordResetEmail({ to, resetUrl, appName = 'SunLMS' }) {
  const html = buildPasswordResetHtml({ appName, resetUrl });
  const subject = `${appName} — Reset your password`;
  const text = `Reset your ${appName} password: ${resetUrl}`;
  return sendMail({ to, subject, html, text });
}

export default {
  isEmailConfigured,
  getTransporter,
  sendMail,
  sendTemplatedEmail,
  sendPasswordResetEmail,
  buildPasswordResetHtml
};


