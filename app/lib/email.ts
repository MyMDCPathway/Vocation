// Outbound transactional email — today only the password reset link.
//
// Same shape as app/lib/durableCache.ts, and for the same reason: this is
// optional infrastructure, so EVERY path here degrades to a no-op rather than
// throwing. Local dev and CI have no Resend credentials and must behave as if
// this file didn't exist; a developer who can't send mail should still be able
// to run the reset flow end to end, and an outage at the mail provider should
// not turn a student's request into a 500.
//
// What "degrade" means concretely: with no API key the message is printed to
// the server console, reset link and all, which is a working local flow rather
// than a dead end. That console fallback is a development affordance and
// nothing else — see the warning where it is used.
//
// The provider sits behind EmailTransport so swapping Resend for anything else
// is one function, not a search through the routes. Resend is imported lazily
// inside the transport so the SDK is never constructed (or its env read) on a
// request that isn't sending mail.

export interface EmailMessage {
  to: string;
  subject: string;
  /** Always present. Plain text is the one body every client can render. */
  text: string;
  html?: string;
}

export interface EmailTransport {
  /** Named so logs say which path actually handled a message. */
  name: string;
  send(message: EmailMessage): Promise<void>;
}

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM;

/**
 * True when real mail can be sent. False locally and in CI.
 *
 * Both values are required: an API key with no verified sender is a request
 * Resend rejects, which would be a silent delivery failure rather than a
 * configuration error anyone notices.
 */
export function emailEnabled(): boolean {
  return Boolean(API_KEY && FROM);
}

/**
 * The development fallback. Prints the message — including the reset link —
 * where whoever is running the server can see it.
 *
 * This is safe precisely because it only runs when no mail provider is
 * configured, which on a deployed environment would itself be the bug. If this
 * ever fires in production the fix is to configure RESEND_API_KEY and
 * EMAIL_FROM, not to make this quieter: reset links do not belong in a log
 * aggregator.
 */
const consoleTransport: EmailTransport = {
  name: "console",
  async send(message) {
    console.info(
      [
        "[email] No mail provider configured (RESEND_API_KEY / EMAIL_FROM unset).",
        "[email] Printing the message instead of sending it:",
        `[email]   to:      ${message.to}`,
        `[email]   subject: ${message.subject}`,
        ...message.text.split("\n").map((line) => `[email]   ${line}`),
      ].join("\n")
    );
  },
};

const resendTransport: EmailTransport = {
  name: "resend",
  async send(message) {
    // Imported here rather than at module scope so the SDK is only loaded on a
    // request that actually sends, and so importing this module stays free for
    // the routes and tests that never send anything.
    const { Resend } = await import("resend");
    const resend = new Resend(API_KEY);

    const { error } = await resend.emails.send({
      from: FROM!,
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
    });

    // Resend reports API-level failures in the response rather than by
    // throwing, so a returned error has to be raised deliberately — otherwise
    // "delivery rejected" and "delivered" look identical from here. sendEmail
    // catches it; this exists so the failure is logged rather than swallowed
    // at the point it happens.
    if (error) {
      throw new Error(`${error.name ?? "send failed"}: ${error.message ?? ""}`);
    }
  },
};

/** Whichever transport the current environment can actually use. */
export function emailTransport(): EmailTransport {
  return emailEnabled() ? resendTransport : consoleTransport;
}

/**
 * Sends a message, or does the closest thing this environment can manage.
 *
 * Never throws and never reports failure to the caller. That is deliberate and
 * it is also the only honest option for the one caller there is: the
 * forgot-password route must return the identical response whether or not the
 * address belongs to an account, so it cannot branch on whether an email went
 * out without reopening the enumeration hole it exists to close. Failures are
 * logged for whoever is watching the server.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const transport = emailTransport();
  try {
    await transport.send(message);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[email] ${transport.name} delivery failed: ${reason}`);
  }
}

/**
 * The password reset message itself.
 *
 * Deliberately says nothing an attacker who guessed the address doesn't
 * already know, and tells a recipient who didn't ask for this that ignoring it
 * is enough — because it is: the old password keeps working until this link is
 * used.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  expiresInMinutes: number
): Promise<void> {
  const subject = "Reset your Vocation password";

  const text = [
    "Someone asked to reset the password for your Vocation account.",
    "",
    "Open this link to choose a new one:",
    resetUrl,
    "",
    `The link works once and expires in ${expiresInMinutes} minutes.`,
    "",
    "If this wasn't you, you can ignore this email — your password stays as it is",
    "until someone uses the link above.",
  ].join("\n");

  const html = [
    `<p>Someone asked to reset the password for your Vocation account.</p>`,
    `<p><a href="${escapeHtml(resetUrl)}">Choose a new password</a></p>`,
    `<p>The link works once and expires in ${expiresInMinutes} minutes.</p>`,
    `<p>If this wasn't you, you can ignore this email — your password stays as it`,
    `is until someone uses the link above.</p>`,
  ].join("\n");

  await sendEmail({ to, subject, text, html });
}

/**
 * The reset URL is built from a token this server generated, so it can't carry
 * anything hostile today. Escaped anyway: the cost is nothing, and the failure
 * mode if that assumption ever stops holding — an attacker-controlled fragment
 * reaching an href in a mail client — is a phishing link sent under this
 * project's own domain.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
