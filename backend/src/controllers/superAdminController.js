const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { sendInviteEmail } = require('../services/emailService');
const logger = require('../utils/logger');

// POST /api/admin/organizations
const createOrganization = async (req, res, next) => {
  try {
    const { name, description, adminEmails } = req.body;

    const existing = await db('organizations').where({ name }).first();
    if (existing) return res.status(409).json({ error: 'Organization name already exists' });

    const orgId = uuidv4();
    await db('organizations').insert({
      id: orgId,
      name,
      description: description || null,
      onboarded_by: req.user.id,
    });

    const invites = [];
    for (const email of (adminEmails || [])) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const inviteId = uuidv4();
      await db('invite_tokens').insert({
        id: inviteId,
        organization_id: orgId,
        email,
        token,
        expires_at: expires,
        created_by: req.user.id,
      });
      await sendInviteEmail(email, token, name);
      invites.push({ email, token });
    }

    // Audit log
    await db('audit_logs').insert({
      user_id: req.user.id,
      action: 'org_onboard',
      resource_type: 'organization',
      resource_id: orgId,
      details: { name, adminEmails },
    });

    res.status(201).json({ message: 'Organization created', data: { id: orgId, name, invites } });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/organizations
const listOrganizations = async (req, res, next) => {
  try {
    const orgs = await db('organizations')
      .select('organizations.*', db.raw('COUNT(DISTINCT u.id) as admin_count'),
        db.raw('COUNT(DISTINCT e.id) as event_count'))
      .leftJoin('users as u', function () {
        this.on('u.organization_id', '=', 'organizations.id').andOn('u.role', db.raw("'org_admin'"));
      })
      .leftJoin('events as e', 'e.organization_id', 'organizations.id')
      .groupBy('organizations.id')
      .orderBy('organizations.created_at', 'desc');
    res.json({ data: orgs });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/organizations/:id
const toggleOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const org = await db('organizations').where({ id }).first();
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    const newStatus = !org.is_active;
    await db('organizations').where({ id }).update({ is_active: newStatus, updated_at: new Date() });

    // If deactivating, deactivate org admins
    if (!newStatus) {
      await db('users').where({ organization_id: id, role: 'org_admin' }).update({ is_active: false });
    }

    await db('audit_logs').insert({
      user_id: req.user.id,
      action: newStatus ? 'org_reactivate' : 'org_deactivate',
      resource_type: 'organization',
      resource_id: id,
      details: {},
    });

    res.json({ message: `Organization ${newStatus ? 'activated' : 'deactivated'}`, data: { id, is_active: newStatus } });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/invites
const generateInvite = async (req, res, next) => {
  try {
    const { organizationId, email } = req.body;
    const org = await db('organizations').where({ id: organizationId, is_active: true }).first();
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const inviteId = uuidv4();

    await db('invite_tokens').insert({
      id: inviteId,
      organization_id: organizationId,
      email,
      token,
      expires_at: expires,
      created_by: req.user.id,
    });

    await sendInviteEmail(email, token, org.name);

    await db('audit_logs').insert({
      user_id: req.user.id,
      action: 'invite_generated',
      resource_type: 'invite_token',
      resource_id: inviteId,
      details: { email, organizationId },
    });

    res.status(201).json({ message: 'Invite sent', data: { inviteId, email, token } });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/volunteers
const listAllVolunteers = async (req, res, next) => {
  try {
    const { search, orgId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('users')
      .join('volunteer_profiles as vp', 'vp.user_id', 'users.id')
      .leftJoin('organizations as o', 'o.id', 'users.organization_id')
      .select(
        'users.id', 'users.email', 'users.is_active', 'users.created_at',
        'vp.first_name', 'vp.last_name', 'vp.phone', 'vp.skills',
        'o.name as organization_name',
        db.raw('(SELECT COUNT(*) FROM applications a WHERE a.volunteer_id = users.id) as application_count')
      )
      .where('users.role', 'volunteer');

    if (search) {
      query = query.where(function () {
        this.whereILike('users.email', `%${search}%`)
          .orWhereILike('vp.first_name', `%${search}%`)
          .orWhereILike('vp.last_name', `%${search}%`);
      });
    }
    if (orgId) query = query.where('users.organization_id', orgId);

    const [{ count }] = await query.clone().count('users.id as count');
    const volunteers = await query.orderBy('users.created_at', 'desc').limit(limit).offset(offset);

    await db('audit_logs').insert({
      user_id: req.user.id,
      action: 'view_all_volunteers',
      resource_type: 'user',
      resource_id: null,
      details: { search, orgId },
    });

    res.json({ data: volunteers, pagination: { page: +page, limit: +limit, total: +count } });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/volunteers/:id
const getVolunteer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const volunteer = await db('users')
      .join('volunteer_profiles as vp', 'vp.user_id', 'users.id')
      .leftJoin('organizations as o', 'o.id', 'users.organization_id')
      .select('users.id', 'users.email', 'users.created_at', 'vp.*', 'o.name as organization_name')
      .where('users.id', id).where('users.role', 'volunteer').first();

    if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });

    await db('audit_logs').insert({
      user_id: req.user.id,
      action: 'view_volunteer_profile',
      resource_type: 'user',
      resource_id: id,
      details: {},
    });

    res.json({ data: volunteer });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, userId, from, to, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('audit_logs')
      .join('users', 'users.id', 'audit_logs.user_id')
      .select('audit_logs.*', 'users.email as user_email');

    if (action) query = query.where('audit_logs.action', action);
    if (userId) query = query.where('audit_logs.user_id', userId);
    if (from) query = query.where('audit_logs.created_at', '>=', from);
    if (to) query = query.where('audit_logs.created_at', '<=', to);

    const [{ count }] = await query.clone().count('audit_logs.id as count');
    const logs = await query.orderBy('audit_logs.created_at', 'desc').limit(limit).offset(offset);

    res.json({ data: logs, pagination: { page: +page, limit: +limit, total: +count } });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const [orgCount] = await db('organizations').count('id as count');
    const [volunteerCount] = await db('users').where({ role: 'volunteer' }).count('id as count');
    const [eventCount] = await db('events').count('id as count');
    const [applicationCount] = await db('applications').count('id as count');

    res.json({
      data: {
        totalOrganizations: +orgCount.count,
        totalVolunteers: +volunteerCount.count,
        totalEvents: +eventCount.count,
        totalApplications: +applicationCount.count,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrganization, listOrganizations, toggleOrganization,
  generateInvite, listAllVolunteers, getVolunteer, getAuditLogs, getDashboard,
};
