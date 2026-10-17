import sgMail from "@sendgrid/mail";
import nodemailer from "nodemailer";

let sendGridInitialized = false;
let lastLoggedConfigState = null;
let googleSmtpLoggedState = null;

const ensureSendGridConfigured = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  const configuredEmailFrom = process.env.EMAIL_FROM || "noreply@unitask.com";
  const configuredSenderName = process.env.NAME_FROM || "UniTask";
  const hasSendGridApiKey = Boolean(apiKey);

  if (!hasSendGridApiKey) {
    if (lastLoggedConfigState !== "missing") {
      console.warn("SendGrid not configured: SENDGRID_API_KEY is missing.");
      lastLoggedConfigState = "missing";
    }
    return { hasSendGridApiKey, configuredEmailFrom, configuredSenderName };
  }

  if (!sendGridInitialized) {
    sgMail.setApiKey(apiKey);
    sendGridInitialized = true;
  }

  if (lastLoggedConfigState !== "configured") {
    console.log(
      `SendGrid configured: API key loaded, sender=${configuredEmailFrom}`,
    );
    lastLoggedConfigState = "configured";
  }

  return { hasSendGridApiKey, configuredEmailFrom, configuredSenderName };
};

const ensureGoogleSmtpConfigured = () => {
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure =
    String(process.env.SMTP_SECURE || "false").toLowerCase() === "true" ||
    smtpPort === 465;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const configuredEmailFrom =
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    smtpUser ||
    "noreply@unitask.com";
  const configuredSenderName = process.env.NAME_FROM || "UniTask";
  const hasGoogleSmtpConfig = Boolean(smtpHost && smtpPort && smtpUser && smtpPass);

  if (!hasGoogleSmtpConfig) {
    if (googleSmtpLoggedState !== "missing") {
      console.warn(
        "Google SMTP not configured: SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS are required.",
      );
      googleSmtpLoggedState = "missing";
    }

    return {
      hasGoogleSmtpConfig,
      configuredEmailFrom,
      configuredSenderName,
      transportConfig: null,
    };
  }

  if (googleSmtpLoggedState !== "configured") {
    console.log(`Google SMTP configured: host=${smtpHost}, sender=${configuredEmailFrom}`);
    googleSmtpLoggedState = "configured";
  }

  return {
    hasGoogleSmtpConfig,
    configuredEmailFrom,
    configuredSenderName,
    transportConfig: {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    },
  };
};

/**
 * Send an email using SendGrid
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content (will use default template if text is provided)
 * @param {string} text - Plain text fallback
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const { hasSendGridApiKey, configuredEmailFrom, configuredSenderName } =
    ensureSendGridConfigured();

  if (!hasSendGridApiKey) {
    console.log("Skipping email send: SENDGRID_API_KEY not set.");
    return false;
  }

  const msg = {
    to,
    from: {
      email: configuredEmailFrom,
      name: configuredSenderName,
    },
    subject,
    text: text || "",
    html: html || text,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error("SendGrid Error:", error.message);
    if (error.response) {
      console.error(error.response.body);
    }
    return false;
  }
};

/**
 * Send an email using Google SMTP
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @param {string} text - Plain text fallback
 * @returns {Promise<boolean>} Whether the email was sent through Google SMTP
 */
export const sendGoogleSmtpEmail = async ({ to, subject, html, text }) => {
  const {
    hasGoogleSmtpConfig,
    configuredEmailFrom,
    configuredSenderName,
    transportConfig,
  } = ensureGoogleSmtpConfigured();

  if (!hasGoogleSmtpConfig || !transportConfig) {
    console.log("Skipping Google SMTP send: SMTP settings are incomplete.");
    return false;
  }

  const transporter = nodemailer.createTransport(transportConfig);

  try {
    await transporter.sendMail({
      to,
      from: {
        address: configuredEmailFrom,
        name: configuredSenderName,
      },
      subject,
      text: text || "",
      html: html || text,
    });

    console.log(`Email sent via Google SMTP to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error("Google SMTP Error:", error.message);
    return false;
  }
};

/**
 * Try Google SMTP first for auth emails, then fall back to the existing SendGrid setup.
 * This keeps the previous provider intact while allowing welcome/reset emails to move to SMTP.
 */
export const sendAuthEmail = async ({ to, subject, html, text }) => {
  const sentViaGoogleSmtp = await sendGoogleSmtpEmail({ to, subject, html, text });

  if (sentViaGoogleSmtp) {
    return true;
  }

  return sendEmail({ to, subject, html, text });
};
