const db = require('../db');

// POST /api/volunteers/profile
const createProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, skills, interests, bio } = req.body;
    const userId = req.user.id;

    const existing = await db('volunteer_profiles').where({ user_id: userId }).first();
    if (existing) return res.status(409).json({ error: 'Profile already exists. Use PUT to update.' });

    const profile = await db('volunteer_profiles')
      .insert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        skills: skills ? `{${skills.map(s => `"${s}"`).join(',')}}` : null,
        interests: interests ? `{${interests.map(i => `"${i}"`).join(',')}}` : null,
        bio: bio || null,
      })
      .returning('*');

    res.status(201).json({ message: 'Profile created', data: profile[0] });
  } catch (err) {
    next(err);
  }
};

// GET /api/volunteers/:id
const getProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    const requesterOrgId = req.user.organizationId;

    const user = await db('users').where({ id, role: 'volunteer' }).first();
    if (!user) return res.status(404).json({ error: 'Volunteer not found' });

    // Access control: volunteer can only see own profile
    if (requesterRole === 'volunteer' && requesterId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Org admin can only see volunteers who applied to their org's events
    if (requesterRole === 'org_admin') {
      const hasAccess = await db('applications')
        .join('events', 'events.id', 'applications.event_id')
        .where('applications.volunteer_id', id)
        .where('events.organization_id', requesterOrgId)
        .first();
      if (!hasAccess) return res.status(403).json({ error: 'Access denied' });
    }

    const profile = await db('volunteer_profiles').where({ user_id: id }).first();
    res.json({ data: { ...user, profile, password_hash: undefined } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/volunteers/profile
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, skills, interests, bio } = req.body;
    const userId = req.user.id;

    const existing = await db('volunteer_profiles').where({ user_id: userId }).first();
    if (!existing) return res.status(404).json({ error: 'Profile not found. Please create one first.' });

    const updated = await db('volunteer_profiles')
      .where({ user_id: userId })
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        skills: skills ? `{${skills.map(s => `"${s}"`).join(',')}}` : null,
        interests: interests ? `{${interests.map(i => `"${i}"`).join(',')}}` : null,
        bio: bio || null,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({ message: 'Profile updated', data: updated[0] });
  } catch (err) {
    next(err);
  }
};

// GET /api/volunteers (org admin: list volunteers in their org)
const listVolunteers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const orgId = req.user.organizationId;

    // Get volunteers who applied to this org's events
    let query = db('users')
      .join('volunteer_profiles as vp', 'vp.user_id', 'users.id')
      .whereIn('users.id', function () {
        this.select('applications.volunteer_id')
          .from('applications')
          .join('events', 'events.id', 'applications.event_id')
          .where('events.organization_id', orgId);
      })
      .where('users.role', 'volunteer')
      .select('users.id', 'users.email', 'users.created_at', 'vp.first_name', 'vp.last_name', 'vp.skills', 'vp.phone');

    if (search) {
      query = query.where(function () {
        this.whereILike('users.email', `%${search}%`)
          .orWhereILike('vp.first_name', `%${search}%`)
          .orWhereILike('vp.last_name', `%${search}%`);
      });
    }

    const [{ count }] = await query.clone().count('users.id as count');
    const volunteers = await query.limit(limit).offset(offset);

    res.json({ data: volunteers, pagination: { page: +page, limit: +limit, total: +count } });
  } catch (err) {
    next(err);
  }
};

module.exports = { createProfile, getProfile, updateProfile, listVolunteers };
