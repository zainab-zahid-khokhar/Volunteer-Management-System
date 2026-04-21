const logger = require('../utils/logger');

// In production, replace with AWS SES SDK calls.
// For local dev, this logs email to console.

const sendEmail = async ({ to, subject, html }) => {
  if (process.env.NODE_ENV === 'production') {
    // AWS SES integration
    const AWS = require('aws-sdk');
    const ses = new AWS.SES({ region: process.env.AWS_REGION });
    await ses.sendEmail({
      Source: process.env.AWS_SES_FROM_EMAIL,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: { Html: { Data: html } },
      },
    }).promise();
  } else {
    // Dev: log to console
    logger.info(`📧 [DEV EMAIL] To: ${to} | Subject: ${subject}`);
    logger.info(`   Body: ${html.replace(/<[^>]+>/g, ' ')}`);
  }
};

const sendVerificationEmail = async (email, token) => {
  const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Verify your VMS account',
    html: `<p>Welcome to VMS! Please verify your email by clicking the link below:</p>
           <a href="${link}">${link}</a>
           <p>This link expires in 24 hours.</p>`,
  });
};

const sendInviteEmail = async (email, token, orgName) => {
  const link = `${process.env.FRONTEND_URL}/register?invite=${token}`;
  await sendEmail({
    to: email,
    subject: `You're invited to manage ${orgName} on VMS`,
    html: `<p>You have been invited to become an Organization Administrator for <strong>${orgName}</strong>.</p>
           <p>Click the link below to complete your registration:</p>
           <a href="${link}">${link}</a>
           <p>This invite expires in 48 hours.</p>`,
  });
};

const sendEventReminderEmail = async (email, eventName, eventDate) => {
  await sendEmail({
    to: email,
    subject: `Reminder: ${eventName} is tomorrow`,
    html: `<p>This is a reminder that you are registered for <strong>${eventName}</strong> on <strong>${eventDate}</strong>.</p>
           <p>Log in to VMS for event details.</p>`,
  });
};

const sendApplicationDecisionEmail = async (email, eventName, status) => {
  const statusText = status === 'accepted' ? 'accepted ✅' : 'not accepted this time';
  await sendEmail({
    to: email,
    subject: `Application Update: ${eventName}`,
    html: `<p>Your application for <strong>${eventName}</strong> has been <strong>${statusText}</strong>.</p>
           <p>Log in to VMS to view details.</p>`,
  });
};

module.exports = {
  sendVerificationEmail,
  sendInviteEmail,
  sendEventReminderEmail,
  sendApplicationDecisionEmail,
};
