import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_APP_NAME = process.env.APP_NAME || 'SunLMS';
const DEFAULT_FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function layout({ title, bodyHtml, appName = DEFAULT_APP_NAME, frontendUrl = DEFAULT_FRONTEND_URL, brandLogoCid, brandLogoUrl }) {
  const fallbackLogoUrl = brandLogoUrl || `${frontendUrl}/sun-lms-logo-compact.png`;
  return `
  <div style="background:#f6f8fb;padding:24px">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
      <div style="padding:24px 24px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:12px">
        ${(brandLogoCid || fallbackLogoUrl) ? `<img src="${brandLogoCid ? `cid:${brandLogoCid}` : fallbackLogoUrl}" alt="${appName} Logo" style="height:48px;width:auto;display:block" />` : ''}
        <h1 style="margin:0;font-size:20px;color:#0f172a">${appName}</h1>
      </div>
      <div style="padding:24px;color:#0f172a;line-height:1.6">
        <h2 style="margin:0 0 12px 0;font-size:20px;color:#0f172a">${title}</h2>
        ${bodyHtml}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #f1f5f9;color:#475569;font-size:12px">
        This message was sent by ${appName}. If you did not expect this message, you can ignore it.
      </div>
    </div>
    <div style="max-width:640px;margin:12px auto 0;text-align:center;color:#64748b;font-size:12px">
      © ${new Date().getFullYear()} ${appName}
    </div>
  </div>`;
}

function toText(html) {
  return html
    .replace(/<[^>]+>/g, ' ') // strip tags
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const templates = {
  password_reset: ({ appName = DEFAULT_APP_NAME, resetUrl, frontendUrl = DEFAULT_FRONTEND_URL, brandLogoCid, brandLogoUrl }) => {
    const url = resetUrl || `${frontendUrl}/reset-password`;
    const title = 'Reset your password';
    const bodyHtml = `
      <p>We received a request to reset your password.</p>
      <p><a href="${url}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">Reset Password</a></p>
      <p>If the button doesn't work, use this link: <a href="${url}">${url}</a></p>
      <p>This link expires in 1 hour.</p>
    `;
    const html = layout({ title, bodyHtml, appName, frontendUrl, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — Reset your password`, html, text: toText(`${title} ${url}`) };
  },

  welcome_user: ({ appName = DEFAULT_APP_NAME, firstName, dashboardUrl, frontendUrl = DEFAULT_FRONTEND_URL, brandLogoCid, brandLogoUrl }) => {
    const url = dashboardUrl || `${frontendUrl}/dashboard`;
    const title = `Welcome to ${appName}`;
    const bodyHtml = `
      <p>${firstName ? `Hi ${firstName},` : 'Hello,'}</p>
      <p>Welcome to ${appName}! Your account is ready.</p>
      <p><a href="${url}" style="display:inline-block;background:#16a34a;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">Open Dashboard</a></p>
    `;
    const html = layout({ title, bodyHtml, appName, frontendUrl, brandLogoCid, brandLogoUrl });
    return { subject: `Welcome to ${appName}`, html, text: toText(`${title} ${url}`) };
  },

  admin_password_reset_notification: ({ appName = DEFAULT_APP_NAME, firstName, loginUrl, frontendUrl = DEFAULT_FRONTEND_URL, temporaryPassword, brandLogoCid, brandLogoUrl }) => {
    const url = loginUrl || `${frontendUrl}/login`;
    const title = 'Your password has been reset by an administrator';
    const bodyHtml = `
      <p>${firstName ? `Hi ${firstName},` : 'Hello,'} your password was reset by an administrator.</p>
      ${temporaryPassword ? `<p>Your temporary password: <strong>${temporaryPassword}</strong></p>` : ''}
      <p>For security, please sign in and change it immediately.</p>
      <p><a href="${url}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">Sign in</a></p>
    `;
    const html = layout({ title, bodyHtml, appName, frontendUrl: DEFAULT_FRONTEND_URL, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — Password reset notification`, html, text: toText(`${title} ${url}`) };
  },

  user_invitation: ({ appName = DEFAULT_APP_NAME, firstName, inviteUrl, role = 'member', brandLogoCid, brandLogoUrl }) => {
    const title = `You're invited to join ${appName}`;
    const bodyHtml = `
      <p>${firstName ? `Hi ${firstName},` : 'Hello,'} you've been invited to join ${appName} as <strong>${role}</strong>.</p>
      <p><a href="${inviteUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">Accept Invitation</a></p>
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — Invitation`, html, text: toText(`${title} ${inviteUrl}`) };
  },

  enrollment_created: ({ appName = DEFAULT_APP_NAME, firstName, courseName, courseUrl, brandLogoCid, brandLogoUrl }) => {
    const title = 'Enrollment confirmed';
    const bodyHtml = `
      <p>${firstName ? `Hi ${firstName},` : 'Hello,'} you have been enrolled in <strong>${courseName}</strong>.</p>
      ${courseUrl ? `<p><a href="${courseUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">Go to course</a></p>` : ''}
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — Enrollment confirmed: ${courseName}`, html, text: toText(`${title} ${courseName}`) };
  },

  course_assigned: ({ appName = DEFAULT_APP_NAME, firstName, courseName, courseUrl, brandLogoCid, brandLogoUrl }) => {
    const title = 'New course assigned';
    const bodyHtml = `
      <p>${firstName ? `Hi ${firstName},` : 'Hello,'} a new course has been assigned: <strong>${courseName}</strong>.</p>
      ${courseUrl ? `<p><a href="${courseUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">Start course</a></p>` : ''}
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — New course: ${courseName}`, html, text: toText(`${title} ${courseName}`) };
  },

  course_completed_certificate: ({ appName = DEFAULT_APP_NAME, firstName, courseName, certificateUrl, brandLogoCid, brandLogoUrl }) => {
    const title = 'Congratulations! Certificate available';
    const bodyHtml = `
      <p>${firstName ? `Hi ${firstName},` : 'Hello,'} you completed <strong>${courseName}</strong>.</p>
      ${certificateUrl ? `<p>Your certificate is ready: <a href="${certificateUrl}">${certificateUrl}</a></p>` : ''}
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — Certificate available: ${courseName}`, html, text: toText(`${title} ${courseName}`) };
  },

  quiz_assigned: ({ appName = DEFAULT_APP_NAME, firstName, quizName, quizUrl, courseName, moduleName, dueAt, timeLimit, attemptsAllowed, brandLogoCid, brandLogoUrl }) => {
    const title = 'New quiz assigned';
    const bodyHtml = `
      <p>${firstName ? `Hi ${firstName},` : 'Hello,'} you've been assigned a quiz in <strong>${courseName || 'your course'}</strong>.</p>
      <ul style="margin:0 0 12px 18px;padding:0">
        <li><strong>Quiz:</strong> ${quizName}</li>
        ${moduleName ? `<li><strong>Module:</strong> ${moduleName}</li>` : ''}
        ${dueAt ? `<li><strong>Due:</strong> ${dueAt}</li>` : ''}
        ${typeof timeLimit !== 'undefined' ? `<li><strong>Time limit:</strong> ${timeLimit} min</li>` : ''}
        ${typeof attemptsAllowed !== 'undefined' ? `<li><strong>Attempts allowed:</strong> ${attemptsAllowed}</li>` : ''}
      </ul>
      ${quizUrl ? `<p><a href="${quizUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">Start Quiz</a></p>` : ''}
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — Quiz assigned: ${quizName}`, html, text: toText(`${title} ${quizName}`) };
  },

  quiz_result: ({ appName = DEFAULT_APP_NAME, firstName, quizName, score, resultUrl, brandLogoCid, brandLogoUrl }) => {
    const title = 'Quiz results ready';
    const bodyHtml = `
      <p>${firstName ? `Hi ${firstName},` : 'Hello,'} your results for <strong>${quizName}</strong> are ready.</p>
      ${typeof score !== 'undefined' ? `<p>Score: <strong>${score}</strong></p>` : ''}
      ${resultUrl ? `<p><a href="${resultUrl}">View details</a></p>` : ''}
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — Quiz results: ${quizName}`, html, text: toText(`${title} ${quizName}`) };
  },

  goal_achieved: ({ appName = DEFAULT_APP_NAME, firstName, goalName, detailsUrl, brandLogoCid, brandLogoUrl }) => {
    const title = 'Goal achieved';
    const bodyHtml = `
      <p>${firstName ? `Hi ${firstName},` : 'Hello,'} you achieved the goal: <strong>${goalName}</strong>.</p>
      ${detailsUrl ? `<p><a href="${detailsUrl}">View details</a></p>` : ''}
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — Goal achieved: ${goalName}`, html, text: toText(`${title} ${goalName}`) };
  },

  inactivity_reminder: ({ appName = DEFAULT_APP_NAME, firstName, resumeUrl, brandLogoCid, brandLogoUrl }) => {
    const title = 'We miss you — pick up where you left off';
    const bodyHtml = `
      <p>${firstName ? `Hi ${firstName},` : 'Hello,'} it's been a while since your last activity. Continue your learning journey.</p>
      ${resumeUrl ? `<p><a href="${resumeUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">Resume learning</a></p>` : ''}
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — Come back and continue learning`, html, text: toText(`${title}`) };
  },

  tenant_welcome_admin: ({ appName = DEFAULT_APP_NAME, adminName, tenantName, adminDashboardUrl, brandLogoCid, brandLogoUrl }) => {
    const title = 'Your organization is ready';
    const bodyHtml = `
      <p>${adminName ? `Hi ${adminName},` : 'Hello,'} your organization <strong>${tenantName}</strong> is set up.</p>
      ${adminDashboardUrl ? `<p><a href="${adminDashboardUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">Open Admin Dashboard</a></p>` : ''}
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — ${tenantName} is ready`, html, text: toText(`${title} ${tenantName}`) };
  },

  account_activated: ({ appName = DEFAULT_APP_NAME, firstName, dashboardUrl, frontendUrl = DEFAULT_FRONTEND_URL, brandLogoCid, brandLogoUrl }) => {
    const url = dashboardUrl || `${frontendUrl}/dashboard`;
    const title = 'Your account has been activated';
    const bodyHtml = `
      <p>${firstName ? `Hi ${firstName},` : 'Hello,'} your ${appName} account is now active.</p>
      <p><a href="${url}" style="display:inline-block;background:#16a34a;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">Open Dashboard</a></p>
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — Account activated`, html, text: toText(`${title} ${url}`) };
  },

  account_deactivated: ({ appName = DEFAULT_APP_NAME, firstName, supportUrl, brandLogoCid, brandLogoUrl }) => {
    const title = 'Your account has been deactivated';
    const bodyHtml = `
      <p>${firstName ? `Hi ${firstName},` : 'Hello,'} your ${appName} account has been deactivated.</p>
      ${supportUrl ? `<p>If you believe this is a mistake, please contact support: <a href="${supportUrl}">${supportUrl}</a></p>` : ''}
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — Account deactivated`, html, text: toText(title) };
  },

  account_deleted: ({ appName = DEFAULT_APP_NAME, firstName, brandLogoCid, brandLogoUrl }) => {
    const title = 'Your account has been deleted';
    const bodyHtml = `
      <p>${firstName ? `Hi ${firstName},` : 'Hello,'} your ${appName} account has been permanently deleted.</p>
      <p>If this was unexpected, please reply to this email.</p>
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — Account deleted`, html, text: toText(title) };
  },

  // 2FA Email Templates
  '2fa_enabled': ({ firstName, timestamp, appName = DEFAULT_APP_NAME, brandLogoCid, brandLogoUrl }) => {
    const title = 'Two-Factor Authentication Enabled';
    const bodyHtml = `
      <p>Hi ${firstName},</p>
      <p>Two-factor authentication (2FA) has been successfully enabled for your ${appName} account on ${timestamp}.</p>
      <p>This adds an extra layer of security to your account by requiring a verification code from your authenticator app when logging in.</p>
      <p><strong>Important Security Information:</strong></p>
      <ul>
        <li>Keep your authenticator app secure and backed up</li>
        <li>You'll need to enter a 6-digit code from your app each time you log in</li>
        <li>If you lose access to your authenticator app, contact support immediately</li>
      </ul>
      <p>If you did not enable 2FA on your account, please contact our support team immediately as your account may be compromised.</p>
      <p>Best regards,<br>The ${appName} Security Team</p>
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `Two-Factor Authentication Enabled - ${appName}`, html, text: toText(title) };
  },

  '2fa_disabled': ({ firstName, timestamp, appName = DEFAULT_APP_NAME, brandLogoCid, brandLogoUrl }) => {
    const title = 'Two-Factor Authentication Disabled';
    const bodyHtml = `
      <p>Hi ${firstName},</p>
      <p>Two-factor authentication (2FA) has been disabled for your ${appName} account on ${timestamp}.</p>
      <p><strong>Security Notice:</strong> Your account is now less secure without 2FA enabled. We strongly recommend re-enabling it as soon as possible.</p>
      <p>To re-enable 2FA:</p>
      <ol>
        <li>Log into your account</li>
        <li>Go to Settings → Security</li>
        <li>Click "Setup 2FA" and follow the instructions</li>
      </ol>
      <p>If you did not disable 2FA on your account, please contact our support team immediately as your account may be compromised.</p>
      <p>Best regards,<br>The ${appName} Security Team</p>
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `Two-Factor Authentication Disabled - ${appName}`, html, text: toText(title) };
  },

  // Course Update Email Templates
  course_updated: ({ firstName, courseName, courseUrl, updateDetails, appName = DEFAULT_APP_NAME, brandLogoCid, brandLogoUrl }) => {
    const title = 'Course Updated';
    const bodyHtml = `
      <p>Hi ${firstName},</p>
      <p>The course <strong>${courseName}</strong> has been updated with new content.</p>
      ${updateDetails ? `<p><strong>What's new:</strong> ${updateDetails}</p>` : ''}
      <p>Check out the latest updates and continue your learning journey.</p>
      ${courseUrl ? `<p><a href="${courseUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">View Course</a></p>` : ''}
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — Course Updated: ${courseName}`, html, text: toText(`${title} ${courseName}`) };
  },

  course_published: ({ firstName, courseName, courseUrl, appName = DEFAULT_APP_NAME, brandLogoCid, brandLogoUrl }) => {
    const title = 'New Course Available';
    const bodyHtml = `
      <p>Hi ${firstName},</p>
      <p>A new course <strong>${courseName}</strong> is now available for you to start.</p>
      <p>Begin your learning journey and expand your knowledge with this exciting new content.</p>
      ${courseUrl ? `<p><a href="${courseUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">Start Course</a></p>` : ''}
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — New Course: ${courseName}`, html, text: toText(`${title} ${courseName}`) };
  },

  // Module Update Email Templates
  module_updated: ({ firstName, moduleName, courseName, moduleUrl, updateDetails, appName = DEFAULT_APP_NAME, brandLogoCid, brandLogoUrl }) => {
    const title = 'Module Updated';
    const bodyHtml = `
      <p>Hi ${firstName},</p>
      <p>The module <strong>${moduleName}</strong> in course <strong>${courseName}</strong> has been updated.</p>
      ${updateDetails ? `<p><strong>What's new:</strong> ${updateDetails}</p>` : ''}
      <p>Review the updated content to stay on track with your learning.</p>
      ${moduleUrl ? `<p><a href="${moduleUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">View Module</a></p>` : ''}
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — Module Updated: ${moduleName}`, html, text: toText(`${title} ${moduleName}`) };
  },

  module_published: ({ firstName, moduleName, courseName, moduleUrl, appName = DEFAULT_APP_NAME, brandLogoCid, brandLogoUrl }) => {
    const title = 'New Module Available';
    const bodyHtml = `
      <p>Hi ${firstName},</p>
      <p>A new module <strong>${moduleName}</strong> has been added to course <strong>${courseName}</strong>.</p>
      <p>Continue your learning journey with this new content.</p>
      ${moduleUrl ? `<p><a href="${moduleUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">Start Module</a></p>` : ''}
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — New Module: ${moduleName}`, html, text: toText(`${title} ${moduleName}`) };
  },

  // Quiz Update Email Templates
  quiz_updated: ({ firstName, quizName, courseName, quizUrl, updateDetails, appName = DEFAULT_APP_NAME, brandLogoCid, brandLogoUrl }) => {
    const title = 'Quiz Updated';
    const bodyHtml = `
      <p>Hi ${firstName},</p>
      <p>The quiz <strong>${quizName}</strong> in course <strong>${courseName}</strong> has been updated.</p>
      ${updateDetails ? `<p><strong>What's new:</strong> ${updateDetails}</p>` : ''}
      <p>Take the updated quiz to test your knowledge.</p>
      ${quizUrl ? `<p><a href="${quizUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">Take Quiz</a></p>` : ''}
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — Quiz Updated: ${quizName}`, html, text: toText(`${title} ${quizName}`) };
  },

  quiz_published: ({ firstName, quizName, courseName, quizUrl, dueDate, appName = DEFAULT_APP_NAME, brandLogoCid, brandLogoUrl }) => {
    const title = 'New Quiz Available';
    const bodyHtml = `
      <p>Hi ${firstName},</p>
      <p>A new quiz <strong>${quizName}</strong> is now available in course <strong>${courseName}</strong>.</p>
      ${dueDate ? `<p><strong>Due Date:</strong> ${dueDate}</p>` : ''}
      <p>Test your knowledge and track your progress.</p>
      ${quizUrl ? `<p><a href="${quizUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">Take Quiz</a></p>` : ''}
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — New Quiz: ${quizName}`, html, text: toText(`${title} ${quizName}`) };
  },

  // Lesson Update Email Templates
  lesson_updated: ({ firstName, lessonName, moduleName, courseName, lessonUrl, updateDetails, appName = DEFAULT_APP_NAME, brandLogoCid, brandLogoUrl }) => {
    const title = 'Lesson Updated';
    const bodyHtml = `
      <p>Hi ${firstName},</p>
      <p>The lesson <strong>${lessonName}</strong> in module <strong>${moduleName}</strong> of course <strong>${courseName}</strong> has been updated.</p>
      ${updateDetails ? `<p><strong>What's new:</strong> ${updateDetails}</p>` : ''}
      <p>Review the updated lesson content to enhance your understanding.</p>
      ${lessonUrl ? `<p><a href="${lessonUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">View Lesson</a></p>` : ''}
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — Lesson Updated: ${lessonName}`, html, text: toText(`${title} ${lessonName}`) };
  },

  lesson_published: ({ firstName, lessonName, moduleName, courseName, lessonUrl, appName = DEFAULT_APP_NAME, brandLogoCid, brandLogoUrl }) => {
    const title = 'New Lesson Available';
    const bodyHtml = `
      <p>Hi ${firstName},</p>
      <p>A new lesson <strong>${lessonName}</strong> is now available in module <strong>${moduleName}</strong> of course <strong>${courseName}</strong>.</p>
      ${lessonUrl ? `<p><a href="${lessonUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">View Lesson</a></p>` : ''}
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — New Lesson: ${lessonName}`, html, text: toText(`${title} ${lessonName}`) };
  },

  course_added_school: ({ firstName, courseName, courseUrl, appName = DEFAULT_APP_NAME, brandLogoCid, brandLogoUrl }) => {
    const title = 'New course added to your school';
    const bodyHtml = `
      <p>Hi ${firstName || ''}</p>
      <p>A new course <strong>${courseName}</strong> has been added to your school.</p>
      ${courseUrl ? `<p><a href="${courseUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none">View Course</a></p>` : ''}
    `;
    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return { subject: `${appName} — New Course: ${courseName}`, html, text: toText(`${title} ${courseName}`) };
  },

  announcement_broadcast: ({
    appName = DEFAULT_APP_NAME,
    firstName,
    announcementTitle,
    announcementSummary,
    announcementBodyHtml,
    ctaUrl,
    primaryColor = '#2563eb',
    brandLogoCid,
    brandLogoUrl,
  }) => {
    const safePrimary = primaryColor || '#2563eb';
    const title = announcementTitle || 'New Announcement';
    const bodyHtml = `
      ${firstName ? `<p style="margin:0 0 12px 0;">Hi ${firstName},</p>` : ''}
      ${announcementSummary ? `<p style="margin:0 0 16px 0;color:#334155;">${announcementSummary}</p>` : ''}
      <div style="margin:0 0 16px 0;color:#0f172a;">${announcementBodyHtml || ''}</div>
      ${
        ctaUrl
          ? `<p style="margin:24px 0 0;">
              <a href="${ctaUrl}"
                 style="display:inline-block;background:${safePrimary};color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
                View Announcement
              </a>
            </p>`
          : ''
      }
    `;

    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return {
      subject: `${appName} — ${title}`,
      html,
      text: toText(`${title} ${announcementSummary || ''}`),
    };
  },

  support_question_notification: ({
    appName = DEFAULT_APP_NAME,
    recipientName,
    courseTitle,
    questionTitle,
    questionCategory,
    questionBody,
    questionAuthor,
    attachmentsCount = 0,
    supportUrl,
    brandLogoCid,
    brandLogoUrl,
  }) => {
    const title = `New support question in ${courseTitle || 'your course'}`;
    const safeBody = escapeHtml(questionBody || '');
    const categoryLabel = questionCategory
      ? questionCategory
          .split('_')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ')
      : null;

    const bodyHtml = `
      <p>${recipientName ? `Hi ${escapeHtml(recipientName)},` : 'Hello,'}</p>
      <p><strong>${escapeHtml(questionAuthor || 'A learner')}</strong> posted a new support question in <strong>${escapeHtml(courseTitle || 'your course')}</strong>.</p>
      ${
        categoryLabel
          ? `<p style="margin:0 0 8px 0;color:#475569;">Category: <strong>${escapeHtml(
              categoryLabel
            )}</strong></p>`
          : ''
      }
      <p style="margin:16px 0 8px 0;font-weight:600;color:#0f172a;">${escapeHtml(
        questionTitle || 'Support Question'
      )}</p>
      ${
        safeBody
          ? `<div style="margin:0 0 16px 0;color:#334155;background:#f8fafc;padding:16px;border-radius:10px;border:1px solid #e2e8f0;">${safeBody}</div>`
          : ''
      }
      ${
        attachmentsCount > 0
          ? `<p style="margin:0 0 16px 0;color:#475569;">Attachments: <strong>${attachmentsCount}</strong></p>`
          : ''
      }
      ${
        supportUrl
          ? `<p style="margin:24px 0 0;">
              <a href="${supportUrl}"
                 style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
                Open Support Thread
              </a>
            </p>`
          : ''
      }
      <p style="margin:24px 0 0;color:#64748b;font-size:14px;">Please log in to SunLMS to reply and keep the learner moving forward.</p>
    `;

    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return {
      subject: `${appName} — New support question: ${questionTitle || courseTitle || ''}`.trim(),
      html,
      text: toText(`${title} ${questionTitle || ''} ${supportUrl || ''}`),
    };
  },

  support_reply_notification: ({
    appName = DEFAULT_APP_NAME,
    recipientName,
    courseTitle,
    questionTitle,
    questionAuthor,
    replyAuthor,
    replyBody,
    attachmentsCount = 0,
    supportUrl,
    brandLogoCid,
    brandLogoUrl,
  }) => {
    const title = `New reply on a support question`;
    const safeBody = escapeHtml(replyBody || '');

    const bodyHtml = `
      <p>${recipientName ? `Hi ${escapeHtml(recipientName)},` : 'Hello,'}</p>
      <p><strong>${escapeHtml(replyAuthor || 'A user')}</strong> replied to the support question <strong>${escapeHtml(
        questionTitle || 'Support Question'
      )}</strong> in <strong>${escapeHtml(courseTitle || 'your course')}</strong>.</p>
      <p style="margin:12px 0 4px 0;color:#475569;">Original asker: ${escapeHtml(questionAuthor || 'Learner')}</p>
      ${
        safeBody
          ? `<div style="margin:8px 0 16px 0;color:#334155;background:#f8fafc;padding:16px;border-radius:10px;border:1px solid #e2e8f0;">${safeBody}</div>`
          : ''
      }
      ${
        attachmentsCount > 0
          ? `<p style="margin:0 0 16px 0;color:#475569;">Attachments: <strong>${attachmentsCount}</strong></p>`
          : ''
      }
      ${
        supportUrl
          ? `<p style="margin:24px 0 0;">
              <a href="${supportUrl}"
                 style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
                View Reply
              </a>
            </p>`
          : ''
      }
      <p style="margin:24px 0 0;color:#64748b;font-size:14px;">Respond in SunLMS to keep the conversation moving.</p>
    `;

    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return {
      subject: `${appName} — New support reply: ${questionTitle || courseTitle || ''}`.trim(),
      html,
      text: toText(`${title} ${questionTitle || ''} ${supportUrl || ''}`),
    };
  },

  review_submitted_notification: ({
    appName = DEFAULT_APP_NAME,
    recipientName,
    courseTitle,
    reviewerName,
    reviewTitle,
    reviewBody,
    rating,
    reviewUrl,
    brandLogoCid,
    brandLogoUrl,
  }) => {
    const title = `New course review submitted`;
    const safeBody = escapeHtml(reviewBody || '');
    const bodyHtml = `
      <p>${recipientName ? `Hi ${escapeHtml(recipientName)},` : 'Hello,'}</p>
      <p><strong>${escapeHtml(reviewerName || 'A learner')}</strong> shared a new review for <strong>${escapeHtml(
        courseTitle || 'your course'
      )}</strong>. It is awaiting moderation.</p>
      ${
        typeof rating === 'number'
          ? `<p style="margin:12px 0;color:#475569;">Rating: <strong>${rating}/5</strong></p>`
          : ''
      }
      ${
        reviewTitle
          ? `<p style="margin:12px 0 4px 0;font-weight:600;color:#0f172a;">${escapeHtml(reviewTitle)}</p>`
          : ''
      }
      ${
        safeBody
          ? `<div style="margin:0 0 16px 0;color:#334155;background:#f8fafc;padding:16px;border-radius:10px;border:1px solid #e2e8f0;">${safeBody}</div>`
          : ''
      }
      ${
        reviewUrl
          ? `<p style="margin:24px 0 0;">
              <a href="${reviewUrl}"
                 style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
                Review & Moderate
              </a>
            </p>`
          : ''
      }
      <p style="margin:24px 0 0;color:#64748b;font-size:14px;">Remember to moderate the review to make it visible.</p>
    `;

    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return {
      subject: `${appName} — New review for ${courseTitle || 'your course'}`,
      html,
      text: toText(`${title} ${courseTitle || ''} ${reviewUrl || ''}`),
    };
  },

  review_comment_notification: ({
    appName = DEFAULT_APP_NAME,
    recipientName,
    courseTitle,
    commentAuthor,
    reviewBody,
    commentBody,
    reviewUrl,
    brandLogoCid,
    brandLogoUrl,
  }) => {
    const title = `New comment on a course review`;
    const safeReview = escapeHtml(reviewBody || '');
    const safeComment = escapeHtml(commentBody || '');
    const bodyHtml = `
      <p>${recipientName ? `Hi ${escapeHtml(recipientName)},` : 'Hello,'}</p>
      <p><strong>${escapeHtml(commentAuthor || 'A team member')}</strong> responded to a review for <strong>${escapeHtml(courseTitle || 'your course')}</strong>.</p>
      ${
        safeReview
          ? `<div style="margin:16px 0;color:#475569;font-size:13px;">
               <div style="font-weight:600;margin-bottom:6px;">Learner said:</div>
               <div style="background:#f8fafc;padding:14px;border-radius:10px;border:1px solid #e2e8f0;">${safeReview}</div>
             </div>`
          : ''
      }
      ${
        safeComment
          ? `<div style="margin:16px 0;color:#1f2937;font-size:13px;">
               <div style="font-weight:600;margin-bottom:6px;">Response:</div>
               <div style="background:#ecfdf5;padding:14px;border-radius:10px;border:1px solid #bbf7d0;">${safeComment}</div>
             </div>`
          : ''
      }
      ${
        reviewUrl
          ? `<p style="margin:24px 0 0;">
              <a href="${reviewUrl}"
                 style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
                View Conversation
              </a>
            </p>`
          : ''
      }
      <p style="margin:24px 0 0;color:#64748b;font-size:14px;">Continue the dialogue to keep learners supported.</p>
    `;

    const html = layout({ title, bodyHtml, appName, brandLogoCid, brandLogoUrl });
    return {
      subject: `${appName} — New comment on review`,
      html,
      text: toText(`${title} ${courseTitle || ''} ${reviewUrl || ''}`),
    };
  },
};

export function getEmailTemplate(templateId) {
  return templates[templateId];
}

export function buildEmail(templateId, variables = {}) {
  const tpl = getEmailTemplate(templateId);
  if (!tpl) {
    throw new Error(`Unknown email template: ${templateId}`);
  }
  return tpl(variables);
}

export default {
  getEmailTemplate,
  buildEmail,
};


