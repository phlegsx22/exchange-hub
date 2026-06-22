import { Resend } from "resend";

function htmlEscape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return c;
    }
  });
}

function verificationEmailHtml(verificationLink: string): string {
  const safeLink = htmlEscape(verificationLink);
  return `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
    <h2 style="margin:0 0 12px;">Verify your Annex‑Ebank email</h2>
    <p style="margin:0 0 16px; color:#444;">
      Please confirm your email address to activate your account.
    </p>
    <p style="margin:0 0 16px;">
      <a href="${safeLink}"
         style="display:inline-block; background:#111827; color:#fff; text-decoration:none; padding:10px 16px; border-radius:8px;">
        Verify email
      </a>
    </p>
    <p style="margin:0; color:#666; font-size:12px;">
      If the button doesn’t work, copy and paste this link into your browser:<br/>
      <span style="word-break:break-all;">${safeLink}</span>
    </p>
  </div>
  `;
}

/**
 * Resend transactional email sender.
 *
 * Required env:
 * - RESEND_API_KEY
 * - VERIFY_FROM_EMAIL (e.g. verify@annex-ebank.com) or EMAIL_FROM
 */
export async function sendVerificationEmail(
  to: string,
  verificationLink: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.VERIFY_FROM_EMAIL ??
    process.env.EMAIL_FROM ??
    "verify@annex-ebank.com";

  if (!apiKey) {
    // Dev fallback: keep things moving if key isn't set yet.
    console.log("[Email] RESEND_API_KEY missing; verification email skipped");
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    subject: "Verify your Annex‑Ebank email",
    html: verificationEmailHtml(verificationLink),
    text: `Verify your email: ${verificationLink}`,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESET_FROM_EMAIL ??
    process.env.EMAIL_FROM ??
    "no-reply@annex-ebank.com";

  if (!apiKey) {
    console.log("[Email] RESEND_API_KEY missing; password reset email skipped");
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    subject: "Reset your Annex‑Ebank password",
    html: `<p>Reset your password using this link:</p><p><a href="${htmlEscape(resetLink)}">${htmlEscape(resetLink)}</a></p>`,
    text: `Reset your password: ${resetLink}`,
  });
}

function getAdminNotificationRecipients(): string[] {
  const raw =
    process.env.ADMIN_NOTIFICATION_EMAILS ??
    process.env.ADMIN_EMAIL ??
    process.env.SUPPORT_EMAIL ??
    "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Send an operational/admin notification email for important user actions.
 * If no admin recipients are configured, this is a no-op.
 */
export async function sendAdminNotificationEmail(params: {
  subject: string;
  title: string;
  lines: string[];
}): Promise<void> {
  const recipients = getAdminNotificationRecipients();
  if (recipients.length === 0) return;

  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.NOTIFY_FROM_EMAIL ??
    process.env.EMAIL_FROM ??
    "no-reply@annex-ebank.com";

  const safeTitle = htmlEscape(params.title);
  const safeLines = params.lines.map((l) => `<li>${htmlEscape(l)}</li>`).join("");
  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
    <h2 style="margin:0 0 12px;">${safeTitle}</h2>
    <ul style="margin:0; padding-left:18px; color:#444;">
      ${safeLines}
    </ul>
  </div>
  `;
  const text = [params.title, ...params.lines.map((l) => `- ${l}`)].join("\n");

  if (!apiKey) {
    console.log("[AdminNotify] RESEND_API_KEY missing; notification skipped:", params.subject);
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to: recipients,
    subject: params.subject,
    html,
    text,
  });
}
