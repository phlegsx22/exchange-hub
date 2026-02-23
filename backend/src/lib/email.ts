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
    console.log("[Email] RESEND_API_KEY missing; verification link:", verificationLink);
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
    console.log("[Email] RESEND_API_KEY missing; reset link:", resetLink);
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
