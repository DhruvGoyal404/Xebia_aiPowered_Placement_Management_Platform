const nodemailer = require('nodemailer');

// True only when Gmail credentials are present.
const isMailConfigured = () =>
  !!(process.env.MAIL && process.env.MAIL_PASSWORD);

const getTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.MAIL, pass: process.env.MAIL_PASSWORD },
  });

const sendApprovalEmail = async ({ to, username }) => {
  if (!isMailConfigured()) return; // gracefully no-op if email isn't set up

  const loginUrl =
    (process.env.CLIENT_LOGIN_URL ||
      'https://xebia-placeiq.dhruvgoyal.tech') + '/login';

  const html = `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #18181b; line-height: 1.6;">
      <p>Hi <strong>${username}</strong>,</p>
      <p>Your registration on <strong>PlaceIQ</strong> has been approved by the placement cell.</p>
      <p>You can now log in, complete your placement profile and start applying to drives:</p>
      <p><a href="${loginUrl}" style="color: #4f46e5;">${loginUrl}</a></p>
      <p>Good luck with your placements. 🎯</p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">— PlaceIQ · Training &amp; Placement Cell</p>
    </div>
  `;

  const text = `Hi ${username},

Your registration on PlaceIQ has been approved by the placement cell.
You can now log in: ${loginUrl}

Good luck with your placements.
— PlaceIQ Team`;

  return getTransporter().sendMail({
    from: `"PlaceIQ" <${process.env.MAIL}>`,
    to,
    subject: 'Your PlaceIQ registration is approved',
    text,
    html,
  });
};

module.exports = { sendApprovalEmail, isMailConfigured };
