import { ENV } from "./env";
import { logger } from "./logger";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Send an email via the configured provider. No-op (returns false) when
 * EMAIL_PROVIDER=none or no sender is configured, so the app works without
 * email and never fails a request because of it.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  if (ENV.emailProvider === "none" || !ENV.emailFrom) {
    logger.info({ to: message.to, subject: message.subject }, "[Mailer] disabled – email not sent");
    return false;
  }
  try {
    if (ENV.emailProvider === "resend") return await sendViaResend(message);
    if (ENV.emailProvider === "smtp") return await sendViaSmtp(message);
  } catch (error) {
    logger.error({ err: error }, "[Mailer] sending failed");
  }
  return false;
}

async function sendViaResend(message: EmailMessage): Promise<boolean> {
  if (!ENV.resendApiKey) {
    logger.warn("[Mailer] RESEND_API_KEY is not set");
    return false;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: ENV.emailFrom,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });
  if (!response.ok) {
    logger.warn({ status: response.status }, "[Mailer] Resend returned an error");
    return false;
  }
  return true;
}

async function sendViaSmtp(message: EmailMessage): Promise<boolean> {
  if (!ENV.smtpHost) {
    logger.warn("[Mailer] SMTP_HOST is not set");
    return false;
  }
  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: ENV.smtpHost,
    port: ENV.smtpPort,
    secure: ENV.smtpSecure,
    auth: ENV.smtpUser ? { user: ENV.smtpUser, pass: ENV.smtpPass } : undefined,
  });
  await transport.sendMail({
    from: ENV.emailFrom,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
  return true;
}

/** Build + send a team invitation email (fire-and-forget from the caller). */
export async function sendInviteEmail(input: {
  to: string;
  orgName: string;
  role: string;
  invitedBy: string;
}): Promise<boolean> {
  const url = ENV.appOrigin ? ENV.appOrigin.replace(/\/$/, "") : "";
  const teamUrl = url ? `${url}/team` : "die App";
  const subject = `Einladung zu „${input.orgName}" – Agent Control Plane`;
  const text =
    `${input.invitedBy} hat dich als ${input.role} zu „${input.orgName}" eingeladen.\n\n` +
    `Melde dich an${url ? ` unter ${url}` : ""} und nimm die Einladung unter „Team & Mitglieder" (${teamUrl}) an.`;
  const html =
    `<p>${escapeHtml(input.invitedBy)} hat dich als <strong>${escapeHtml(input.role)}</strong> ` +
    `zu „${escapeHtml(input.orgName)}" eingeladen.</p>` +
    `<p>Melde dich an${url ? ` unter <a href="${url}">${url}</a>` : ""} und nimm die Einladung ` +
    `unter <a href="${url ? `${url}/team` : "#"}">Team &amp; Mitglieder</a> an.</p>`;
  return sendEmail({ to: input.to, subject, html, text });
}
