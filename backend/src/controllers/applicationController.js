const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { summarizeApplication } = require('../services/aiService');
const notificationService = require('../services/notificationService');

// POST /api/applications
const submitApplication = async (req, res, next) => {
  try {
    const { eventId, applicationText } = req.body;
    const volunteerId = req.user.id;

    const event = await db('events').where({ id: eventId, status: 'active' }).first();
    if (!event) return res.status(404).json({ error: 'Event not found or not active' });

    const duplicate = await db('applications').where({ volunteer_id: volunteerId, event_id: eventId }).first();
    if (duplicate) return res.status(409).json({ error: 'You have already applied for this event' });

    // Check slots
    const [{ count: acceptedCount }] = await db('applications')
      .where({ event_id: eventId, status: 'accepted' }).count('id as count');
    if (+acceptedCount >= event.max_volunteers) {
      return res.status(400).json({ error: 'This event has no remaining volunteer slots' });
    }

    const appId = uuidv4();
    const application = await db('applications')
      .insert({ id: appId, volunteer_id: volunteerId, event_id: eventId, application_text: applicationText })
      .returning('*');

    // Trigger AI summary asynchronously
    setImmediate(async () => {
      try {
        const result = await summarizeApplication(applicationText);
        if (result) {
          await db('ai_summaries').insert({
            application_id: appId,
            summary_text: result.summary,
            model_version: result.modelVersion,
          });
        }
      } catch (_) { /* graceful degradation */ }
    });

    // Notify org admins
    const orgAdmins = await db('users')
      .where({ organization_id: event.organization_id, role: 'org_admin', is_active: true });
    for (const admin of orgAdmins) {
      await notificationService.dispatch({
        userId: admin.id,
        type: 'general',
        referenceId: appId,
        title: `New Application: ${event.name}`,
        body: 'A volunteer has submitted a new application for your event.',
      });
    }

    res.status(201).json({ message: 'Application submitted', data: application[0] });
  } catch (err) {
    next(err);
  }
};

// GET /api/applications (volunteer's own)
const myApplications = async (req, res, next) => {
  try {
    const volunteerId = req.user.id;
    const applications = await db('applications')
      .join('events', 'events.id', 'applications.event_id')
      .join('organizations', 'organizations.id', 'events.organization_id')
      .leftJoin('ai_summaries', 'ai_summaries.application_id', 'applications.id')
      .select(
        'applications.*',
        'events.name as event_name', 'events.event_date', 'events.location',
        'organizations.name as organization_name'
      )
      .where('applications.volunteer_id', volunteerId)
      .orderBy('applications.created_at', 'desc');

    res.json({ data: applications });
  } catch (err) {
    next(err);
  }
};

// GET /api/events/:eventId/applications (admin)
const eventApplications = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { status } = req.query;

    const event = await db('events').where({ id: eventId }).first();
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Org admin can only see their org's events
    if (req.user.role === 'org_admin' && event.organization_id !== req.user.organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = db('applications')
      .join('users', 'users.id', 'applications.volunteer_id')
      .join('volunteer_profiles as vp', 'vp.user_id', 'users.id')
      .leftJoin('ai_summaries', 'ai_summaries.application_id', 'applications.id')
      .select(
        'applications.*',
        'users.email as volunteer_email',
        'vp.first_name', 'vp.last_name', 'vp.skills', 'vp.bio',
        'ai_summaries.summary_text as ai_summary',
        'ai_summaries.generated_at as ai_summary_generated_at'
      )
      .where('applications.event_id', eventId);

    if (status) query = query.where('applications.status', status);

    const applications = await query.orderBy('applications.created_at', 'desc');
    res.json({ data: applications });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/applications/:id/status
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // accepted | rejected

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted or rejected' });
    }

    const application = await db('applications').where({ id }).first();
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const event = await db('events').where({ id: application.event_id }).first();

    if (req.user.role === 'org_admin' && event.organization_id !== req.user.organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending applications can be reviewed' });
    }

    // Check slot limit on acceptance
    if (status === 'accepted') {
      const [{ count }] = await db('applications')
        .where({ event_id: event.id, status: 'accepted' }).count('id as count');
      if (+count >= event.max_volunteers) {
        return res.status(400).json({ error: 'No remaining volunteer slots for this event' });
      }
    }

    await db('applications').where({ id }).update({
      status,
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
      updated_at: new Date(),
    });

    // Notify volunteer
    const volunteer = await db('users').where({ id: application.volunteer_id }).first();
    await notificationService.dispatch({
      userId: application.volunteer_id,
      type: 'application_update',
      referenceId: id,
      title: `Application ${status === 'accepted' ? 'Accepted ✅' : 'Not Accepted'}`,
      body: `Your application for "${event.name}" has been ${status}.`,
      email: volunteer.email,
      emailData: { eventName: event.name, status },
    });

    res.json({ message: `Application ${status}`, data: { id, status } });
  } catch (err) {
    next(err);
  }
};

// GET /api/summary/:applicationId
const getSummary = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const application = await db('applications').where({ id: applicationId }).first();
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const event = await db('events').where({ id: application.event_id }).first();
    if (req.user.role === 'org_admin' && event.organization_id !== req.user.organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let summary = await db('ai_summaries').where({ application_id: applicationId }).first();

    // Generate on-demand if not yet available
    if (!summary) {
      const result = await summarizeApplication(application.application_text);
      if (result) {
        const inserted = await db('ai_summaries').insert({
          application_id: applicationId,
          summary_text: result.summary,
          model_version: result.modelVersion,
        }).returning('*');
        summary = inserted[0];
      }
    }

    res.json({ data: summary || null });
  } catch (err) {
    next(err);
  }
};

module.exports = { submitApplication, myApplications, eventApplications, updateStatus, getSummary };
