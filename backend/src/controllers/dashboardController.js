const db = require('../db');

// GET /api/dashboard/volunteer
const volunteerDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const myApplications = await db('applications')
      .join('events', 'events.id', 'applications.event_id')
      .join('organizations', 'organizations.id', 'events.organization_id')
      .select('applications.id', 'applications.status', 'events.id as event_id',
        'events.name as event_name', 'events.event_date', 'events.start_time', 'organizations.name as org_name')
      .where('applications.volunteer_id', userId)
      .orderBy('events.event_date', 'asc');

    const upcomingEvents = await db('events')
      .join('organizations', 'organizations.id', 'events.organization_id')
      .select('events.*', 'organizations.name as organization_name',
        db.raw('(SELECT COUNT(*) FROM applications a WHERE a.event_id = events.id AND a.status = \'accepted\') as accepted_count'))
      .where('events.status', 'active')
      .where('events.event_date', '>=', new Date())
      .orderBy('events.event_date', 'asc')
      .limit(6);

    const [{ count: unreadMessages }] = await db('messages')
      .where({ recipient_id: userId, is_read: false }).count('id as count');

    const recentNotifications = await db('notifications')
      .where({ user_id: userId }).orderBy('created_at', 'desc').limit(5);

    res.json({
      data: {
        myApplications,
        upcomingEvents,
        stats: {
          totalApplications: myApplications.length,
          acceptedCount: myApplications.filter(a => a.status === 'accepted').length,
          pendingCount: myApplications.filter(a => a.status === 'pending').length,
          unreadMessages: +unreadMessages,
        },
        recentNotifications,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/admin
const adminDashboard = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;

    const [{ count: activeVolunteers }] = await db('applications')
      .join('events', 'events.id', 'applications.event_id')
      .where('events.organization_id', orgId)
      .where('applications.status', 'accepted')
      .countDistinct('applications.volunteer_id as count');

    const upcomingEvents = await db('events')
      .select('events.*',
        db.raw('(SELECT COUNT(*) FROM applications a WHERE a.event_id = events.id AND a.status = \'pending\') as pending_apps'),
        db.raw('(SELECT COUNT(*) FROM applications a WHERE a.event_id = events.id AND a.status = \'accepted\') as accepted_apps'))
      .where({ organization_id: orgId, status: 'active' })
      .where('event_date', '>=', new Date())
      .orderBy('event_date', 'asc')
      .limit(5);

    const [{ count: pendingApplications }] = await db('applications')
      .join('events', 'events.id', 'applications.event_id')
      .where('events.organization_id', orgId)
      .where('applications.status', 'pending')
      .count('applications.id as count');

    const [{ count: totalEvents }] = await db('events')
      .where({ organization_id: orgId }).count('id as count');

    const [{ count: unreadMessages }] = await db('messages')
      .where({ recipient_id: req.user.id, is_read: false }).count('id as count');

    res.json({
      data: {
        stats: {
          activeVolunteers: +activeVolunteers,
          upcomingEventsCount: upcomingEvents.length,
          pendingApplications: +pendingApplications,
          totalEvents: +totalEvents,
          unreadMessages: +unreadMessages,
        },
        upcomingEvents,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { volunteerDashboard, adminDashboard };
