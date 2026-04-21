const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, param, query } = require('express-validator');
const { authenticate, isSuperAdmin, isOrgAdmin, isVolunteer, requireRole } = require('../middleware/auth');

const authController = require('../controllers/authController');
const superAdminController = require('../controllers/superAdminController');
const volunteerController = require('../controllers/volunteerController');
const eventController = require('../controllers/eventController');
const applicationController = require('../controllers/applicationController');
const communicationController = require('../controllers/communicationController');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many login attempts' } });
const validate = (validations) => async (req, res, next) => {
  for (const v of validations) await v.run(req);
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// ─── AUTH ────────────────────────────────────────────────────────────────────
router.post('/auth/register', validate([
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
]), authController.register);

router.post('/auth/login', loginLimiter, validate([
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
]), authController.login);

router.get('/auth/verify/:token', authController.verifyEmail);
router.post('/auth/resend-verification', authController.resendVerification);
router.get('/auth/me', authenticate, authController.me);

// ─── SUPER ADMIN ─────────────────────────────────────────────────────────────
router.get('/admin/dashboard', authenticate, isSuperAdmin, superAdminController.getDashboard);
router.get('/admin/organizations', authenticate, isSuperAdmin, superAdminController.listOrganizations);
router.post('/admin/organizations', authenticate, isSuperAdmin, validate([
  body('name').trim().notEmpty(),
  body('adminEmails').isArray().optional(),
]), superAdminController.createOrganization);
router.patch('/admin/organizations/:id', authenticate, isSuperAdmin, superAdminController.toggleOrganization);
router.post('/admin/invites', authenticate, isSuperAdmin, validate([
  body('organizationId').isUUID(),
  body('email').isEmail().normalizeEmail(),
]), superAdminController.generateInvite);
router.get('/admin/volunteers', authenticate, isSuperAdmin, superAdminController.listAllVolunteers);
router.get('/admin/volunteers/:id', authenticate, isSuperAdmin, superAdminController.getVolunteer);
router.get('/admin/audit-logs', authenticate, isSuperAdmin, superAdminController.getAuditLogs);

// ─── VOLUNTEERS ───────────────────────────────────────────────────────────────
router.post('/volunteers/profile', authenticate, requireRole('volunteer'), validate([
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
]), volunteerController.createProfile);
router.put('/volunteers/profile', authenticate, requireRole('volunteer'), volunteerController.updateProfile);
router.get('/volunteers', authenticate, isOrgAdmin, volunteerController.listVolunteers);
router.get('/volunteers/:id', authenticate, volunteerController.getProfile);

// ─── EVENTS ──────────────────────────────────────────────────────────────────
router.post('/events', authenticate, isOrgAdmin, validate([
  body('name').trim().notEmpty(),
  body('eventDate').isDate(),
  body('startTime').notEmpty(),
  body('endTime').notEmpty(),
  body('maxVolunteers').isInt({ min: 1 }),
]), eventController.createEvent);
router.get('/events', authenticate, eventController.listEvents);
router.get('/events/:id', authenticate, eventController.getEvent);
router.put('/events/:id', authenticate, isOrgAdmin, eventController.updateEvent);
router.delete('/events/:id', authenticate, isOrgAdmin, eventController.deleteEvent);

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────
router.post('/applications', authenticate, requireRole('volunteer'), validate([
  body('eventId').isUUID(),
  body('applicationText').trim().isLength({ min: 10 }),
]), applicationController.submitApplication);
router.get('/applications', authenticate, requireRole('volunteer'), applicationController.myApplications);
router.get('/events/:eventId/applications', authenticate, isOrgAdmin, applicationController.eventApplications);
router.patch('/applications/:id/status', authenticate, isOrgAdmin, validate([
  body('status').isIn(['accepted', 'rejected']),
]), applicationController.updateStatus);
router.get('/summary/:applicationId', authenticate, isOrgAdmin, applicationController.getSummary);

// ─── MESSAGING ────────────────────────────────────────────────────────────────
router.post('/messages', authenticate, validate([
  body('recipientId').isUUID(),
  body('content').trim().notEmpty(),
]), communicationController.sendMessage);
router.get('/messages/conversations', authenticate, communicationController.listConversations);
router.get('/messages/unread-count', authenticate, communicationController.unreadCount);
router.get('/messages/:conversationPartnerId', authenticate, communicationController.getConversation);

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
router.get('/notifications', authenticate, communicationController.listNotifications);
router.patch('/notifications/:id/read', authenticate, communicationController.markRead);

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
router.get('/dashboard/volunteer', authenticate, requireRole('volunteer'), dashboardController.volunteerDashboard);
router.get('/dashboard/admin', authenticate, requireRole('org_admin', 'super_admin'), dashboardController.adminDashboard);

module.exports = router;
