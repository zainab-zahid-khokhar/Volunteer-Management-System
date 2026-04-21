const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const notificationService = require('../services/notificationService');

// --- MESSAGES ---

// POST /api/messages
const sendMessage = async (req, res, next) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user.id;

    const recipient = await db('users').where({ id: recipientId, is_active: true }).first();
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

    const message = await db('messages')
      .insert({ id: uuidv4(), sender_id: senderId, recipient_id: recipientId, content })
      .returning('*');

    // In-app notification for recipient
    await notificationService.dispatch({
      userId: recipientId,
      type: 'message',
      referenceId: message[0].id,
      title: 'New Message',
      body: `You have a new message from ${req.user.email}`,
    });

    res.status(201).json({ data: message[0] });
  } catch (err) {
    next(err);
  }
};

// GET /api/messages/conversations  (list of unique conversation partners)
const listConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const rows = await db.raw(`
      SELECT DISTINCT ON (partner_id)
        partner_id,
        u.email AS partner_email,
        COALESCE(vp.first_name || ' ' || vp.last_name, u.email) AS partner_name,
        latest_msg.content AS last_message,
        latest_msg.created_at AS last_message_at,
        (SELECT COUNT(*) FROM messages WHERE recipient_id = ? AND sender_id = partner_id AND is_read = false) AS unread_count
      FROM (
        SELECT 
          CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END AS partner_id,
          id, content, created_at
        FROM messages
        WHERE sender_id = ? OR recipient_id = ?
        ORDER BY created_at DESC
      ) AS latest_msg
      JOIN users u ON u.id = latest_msg.partner_id
      LEFT JOIN volunteer_profiles vp ON vp.user_id = u.id
      ORDER BY partner_id, latest_msg.created_at DESC
    `, [userId, userId, userId, userId]);

    res.json({ data: rows.rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/messages/:conversationPartnerId
const getConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationPartnerId } = req.params;

    const messages = await db('messages')
      .where(function () {
        this.where({ sender_id: userId, recipient_id: conversationPartnerId })
          .orWhere({ sender_id: conversationPartnerId, recipient_id: userId });
      })
      .orderBy('created_at', 'asc');

    // Mark messages as read
    await db('messages')
      .where({ sender_id: conversationPartnerId, recipient_id: userId, is_read: false })
      .update({ is_read: true });

    res.json({ data: messages });
  } catch (err) {
    next(err);
  }
};

// GET /api/messages/unread-count
const unreadCount = async (req, res, next) => {
  try {
    const [{ count }] = await db('messages')
      .where({ recipient_id: req.user.id, is_read: false })
      .count('id as count');
    res.json({ data: { unreadCount: +count } });
  } catch (err) {
    next(err);
  }
};

// --- NOTIFICATIONS ---

// GET /api/notifications
const listNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;

    const notifications = await db('notifications')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc')
      .limit(limit).offset(offset);

    const [{ count }] = await db('notifications')
      .where({ user_id: req.user.id, is_read: false }).count('id as count');

    res.json({ data: notifications, unreadCount: +count });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read
const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    // "all" marks all as read
    if (id === 'all') {
      await db('notifications').where({ user_id: req.user.id }).update({ is_read: true });
      return res.json({ message: 'All notifications marked as read' });
    }
    await db('notifications').where({ id, user_id: req.user.id }).update({ is_read: true });
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, listConversations, getConversation, unreadCount, listNotifications, markRead };
