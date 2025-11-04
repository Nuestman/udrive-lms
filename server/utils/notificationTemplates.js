const DEFAULT_APP_NAME = process.env.APP_NAME || 'SunLMS';
const DEFAULT_FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const appIcon = `${DEFAULT_FRONTEND_URL}/sun-lms-logo-compact.png`;

// Simple in-app notification templates for reuse across events
// Returns: { title, body, icon?, link?, severity? }
const templates = {
  password_reset_requested: ({ appName = DEFAULT_APP_NAME }) => ({
    title: 'Password reset requested',
    body: 'We sent you an email with instructions to reset your password.',
    icon: appIcon,
    severity: 'info',
  }),

  admin_password_reset: ({ temporaryPassword }) => ({
    title: 'Password reset by administrator',
    body: temporaryPassword
      ? `Your temporary password is ${temporaryPassword}. Please change it after login.`
      : 'Your password was reset by an administrator. Please change it after login.',
    icon: appIcon,
    severity: 'warning',
  }),

  welcome_user: ({ firstName, appName = DEFAULT_APP_NAME }) => ({
    title: `Welcome to ${appName}`,
    body: firstName ? `Hi ${firstName}, your account is ready.` : 'Your account is ready.',
    icon: appIcon,
    severity: 'success',
  }),

  enrollment_created: ({ courseName, link }) => ({
    title: 'Enrollment confirmed',
    body: `You have been enrolled in ${courseName}.`,
    link,
    icon: appIcon,
    severity: 'success',
  }),

  course_assigned: ({ courseName, link }) => ({
    title: 'New course assigned',
    body: `A new course has been assigned: ${courseName}.`,
    link,
    icon: appIcon,
    severity: 'info',
  }),

  course_completed: ({ courseName, certificateLink }) => ({
    title: 'Course completed',
    body: `You completed ${courseName}. Your certificate is available.`,
    link: certificateLink,
    icon: appIcon,
    severity: 'success',
  }),

  quiz_assigned: ({ quizName, dueAt, link }) => ({
    title: 'New quiz assigned',
    body: dueAt ? `${quizName} — due ${dueAt}` : `${quizName} assigned.`,
    link,
    icon: appIcon,
    severity: 'info',
  }),

  quiz_result: ({ quizName, score, link }) => ({
    title: 'Quiz results ready',
    body: typeof score !== 'undefined' ? `${quizName} — score ${score}` : `${quizName} results are available.`,
    link,
    icon: appIcon,
    severity: 'success',
  }),

  goal_achieved: ({ goalName, link }) => ({
    title: 'Goal achieved',
    body: `You achieved the goal: ${goalName}.`,
    link,
    icon: appIcon,
    severity: 'success',
  }),

  inactivity_reminder: ({ link }) => ({
    title: 'We miss you',
    body: 'It has been a while. Continue your learning journey.',
    link,
    icon: appIcon,
    severity: 'info',
  }),
  account_activated: () => ({
    title: 'Account activated',
    body: 'Your account is now active.',
    icon: appIcon,
    severity: 'success',
  }),
  account_deactivated: () => ({
    title: 'Account deactivated',
    body: 'Your account has been deactivated.',
    icon: appIcon,
    severity: 'warning',
  }),
  account_deleted: () => ({
    title: 'Account deleted',
    body: 'Your account has been permanently deleted.',
    icon: appIcon,
    severity: 'warning',
  }),

  // 2FA Notifications
  '2fa_enabled': ({ firstName, timestamp }) => ({
    title: 'Two-Factor Authentication Enabled',
    body: `Hi ${firstName}, 2FA has been successfully enabled for your account on ${timestamp}. Your account is now more secure.`,
    icon: appIcon,
    severity: 'success',
  }),

  '2fa_disabled': ({ firstName, timestamp }) => ({
    title: 'Two-Factor Authentication Disabled',
    body: `Hi ${firstName}, 2FA has been disabled for your account on ${timestamp}. We recommend re-enabling it for better security.`,
    icon: appIcon,
    severity: 'warning',
  }),
};

export function buildNotification(templateId, variables = {}) {
  const tpl = templates[templateId];
  if (!tpl) throw new Error(`Unknown notification template: ${templateId}`);
  return tpl(variables);
}

export default {
  buildNotification,
};


