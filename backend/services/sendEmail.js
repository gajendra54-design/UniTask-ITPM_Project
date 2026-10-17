import { sendEmail as sendSendGridEmail } from "../utils/emailService.js";

/**
 * Send an email using the shared SendGrid delivery utility.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content of the email
 * @param {string} [text] - Optional text version of the email content
 */
const sendEmail = async (to, subject, html, text) => {
  try {
    return await sendSendGridEmail({ to, subject, html, text });
  } catch (error) {
    console.error("Shared email send wrapper error:");
    if (error.response?.body) {
      console.error(JSON.stringify(error.response.body, null, 2));
    } else {
      console.error(error.message || error);
    }
    return false;
  }
};

export default sendEmail;
