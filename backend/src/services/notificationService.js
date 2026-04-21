const db = require('../db');
const { sendEventReminderEmail, sendApplicationDecisionEmail } = require('./emailService');
const logger = require('../utils/logger');

const dispatch = async ({ userId, type, referenceId, title, body, email = null, emailData = null }) => {
  try {
    await db('notifications').insert({
      user_id: userId,
      type,
      reference_id: referenceId || null,
      title,
      body,
    });

    // Send email for critical notifications
    if (email && emailData) {
      if (type === 'event_reminder') {
        await sendEventReminderEmail(email, emailData.eventName, emailData.eventDate);
      } else if (type === 'application_update') {
        await sendApplicationDecisionEmail(email, emailData.eventName, emailData.status);
      }
    }
  } catch (err) {
    logger.error('Failed to dispatch notification:', err);
  }
};

module.exports = { dispatch };
