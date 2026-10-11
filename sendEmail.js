// TODO: replace with real email provider (SendGrid, SES, etc.)

/**
 * @description Stub email sender that logs the recipient and subject instead of sending a real email.
 * @param {object} message - Email to send.
 * @param {string} message.to - Recipient address.
 * @param {string} message.subject - Subject line.
 * @param {string} message.body - Message body (not used by the stub).
 * @returns {Promise<{sent: boolean, to: string, subject: string}>} Resolves with a confirmation object.
 */
function sendEmail({ to, subject, body }) {
  console.log('[EMAIL] Sending to:', to, '| Subject:', subject);
  return Promise.resolve({ sent: true, to, subject });
}

module.exports = { sendEmail };
