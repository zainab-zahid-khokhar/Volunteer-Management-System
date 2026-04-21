const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const notificationService = require('../services/notificationService');

// POST /api/events
const createEvent = async (req, res, next) => {
  try {
    const { name, description, location, eventDate, startTime, endTime, maxVolunteers } = req.body;
    const orgId = req.user.organizationId;

    const event = await db('events')
      .insert({
        id: uuidv4(),
        organization_id: orgId,
        name,
        description: description || null,
        location: location || null,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        max_volunteers: maxVolunteers,
        created_by: req.user.id,
      })
      .returning('*');

    res.status(201).json({ message: 'Event created', data: event[0] });
  } catch (err) {
    next(err);
  }
};

// GET /api/events
const listEvents = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const role = req.user.role;
    const orgId = req.user.organizationId;

    let query = db('events')
      .join('organizations', 'organizations.id', 'events.organization_id')
      .select(
        'events.*',
        'organizations.name as organization_name',
        db.raw('(SELECT COUNT(*) FROM applications a WHERE a.event_id = events.id AND a.status != \'closed\') as application_count'),
        db.raw('(SELECT COUNT(*) FROM applications a WHERE a.event_id = events.id AND a.status = \'accepted\') as accepted_count')
      );

    // Volunteers see all active events; org admins see their org's events
    if (role === 'volunteer') {
      query = query.where('events.status', 'active').where('organizations.is_active', true);
    } else if (role === 'org_admin') {
      query = query.where('events.organization_id', orgId);
    }
    // super_admin sees all

    if (status) query = query.where('events.status', status);
    if (search) query = query.whereILike('events.name', `%${search}%`);

    const [{ count }] = await query.clone().count('events.id as count');
    const events = await query.orderBy('events.event_date', 'asc').limit(limit).offset(offset);

    res.json({ data: events, pagination: { page: +page, limit: +limit, total: +count } });
  } catch (err) {
    next(err);
  }
};

// GET /api/events/:id
const getEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await db('events')
      .join('organizations', 'organizations.id', 'events.organization_id')
      .join('users as creator', 'creator.id', 'events.created_by')
      .select(
        'events.*',
        'organizations.name as organization_name',
        'creator.email as created_by_email',
        db.raw('(SELECT COUNT(*) FROM applications a WHERE a.event_id = events.id AND a.status = \'accepted\') as accepted_count')
      )
      .where('events.id', id).first();

    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Check if requesting volunteer has already applied
    if (req.user.role === 'volunteer') {
      const existing = await db('applications')
        .where({ volunteer_id: req.user.id, event_id: id }).first();
      event.user_application = existing || null;
    }

    res.json({ data: event });
  } catch (err) {
    next(err);
  }
};

// PUT /api/events/:id
const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, location, eventDate, startTime, endTime, maxVolunteers } = req.body;

    const event = await db('events').where({ id }).first();
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Org admin can only edit their org's events
    if (req.user.role === 'org_admin' && event.organization_id !== req.user.organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await db('events').where({ id })
      .update({ name, description, location, event_date: eventDate, start_time: startTime, end_time: endTime, max_volunteers: maxVolunteers, updated_at: new Date() })
      .returning('*');

    // Notify accepted volunteers of change
    const accepted = await db('applications')
      .join('users', 'users.id', 'applications.volunteer_id')
      .where({ event_id: id, status: 'accepted' })
      .select('applications.volunteer_id', 'users.email');

    for (const v of accepted) {
      await notificationService.dispatch({
        userId: v.volunteer_id,
        type: 'general',
        referenceId: id,
        title: `Event Updated: ${name}`,
        body: 'Details of an event you\'re registered for have been updated. Please check the event page.',
      });
    }

    res.json({ message: 'Event updated', data: updated[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/events/:id
const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await db('events').where({ id }).first();
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (req.user.role === 'org_admin' && event.organization_id !== req.user.organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get affected volunteers before deletion
    const affected = await db('applications')
      .join('users', 'users.id', 'applications.volunteer_id')
      .where({ 'applications.event_id': id })
      .whereNot('applications.status', 'closed')
      .select('applications.volunteer_id', 'users.email');

    // Cancel instead of hard-delete to preserve audit trail
    await db('events').where({ id }).update({ status: 'cancelled', updated_at: new Date() });
    await db('applications').where({ event_id: id }).update({ status: 'closed', updated_at: new Date() });

    for (const v of affected) {
      await notificationService.dispatch({
        userId: v.volunteer_id,
        type: 'general',
        referenceId: id,
        title: `Event Cancelled: ${event.name}`,
        body: 'An event you applied for has been cancelled.',
      });
    }

    res.json({ message: 'Event cancelled and applications closed' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createEvent, listEvents, getEvent, updateEvent, deleteEvent };
