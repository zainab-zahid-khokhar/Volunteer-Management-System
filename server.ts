import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import knex from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { summarizeApplication } from './src/services/aiService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET || 'vms-pro-secret-key-123';

// Database Initialization
const knexConfig: any = {
  client: process.env.DB_CLIENT || (process.env.DATABASE_URL ? 'pg' : 'better-sqlite3'),
  connection: process.env.DATABASE_URL || (process.env.DB_CLIENT === 'pg' ? {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  } : {
    filename: path.join(__dirname, 'vms.sqlite')
  }),
  useNullAsDefault: true,
  migrations: { directory: path.join(__dirname, 'migrations') },
  seeds: { directory: path.join(__dirname, 'seeds') }
};

if (knexConfig.client === 'better-sqlite3') {
  knexConfig.pool = {
    afterCreate: (conn: any, cb: any) => {
      conn.pragma('foreign_keys = ON');
      cb();
    }
  };
}

const db = knex(knexConfig);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Run migrations on startup
  try {
    await db.migrate.latest();
    
    const usersCount = await db('users').count('id as count').first();
    const count = parseInt((usersCount?.count || usersCount?.['count(*)'] || 0) as string);
    
    if (count === 0) {
      console.log('Database empty, seeding initial data...');
      await db.seed.run();
      console.log('Seeding complete.');
    }
  } catch (err) {
    console.error('Database Initialization Error:', err);
  }

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('GLOBAL ERROR:', err);
    res.status(500).json({ error: 'Global server error', details: err.message });
  });

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // --- API ROUTES ---

  app.post('/api/auth/register', async (req, res) => {
    const { email, password, role } = req.body;
    try {
      const normalizedEmail = email?.toLowerCase().trim();
      const existingUser = await db('users').where({ email: normalizedEmail }).first();
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const password_hash = await bcrypt.hash(password, 12);
      const id = uuidv4();
      
      await db('users').insert({
        id,
        email: normalizedEmail,
        password_hash,
        role: role || 'volunteer',
        onboarding_completed: role === 'volunteer' ? false : true // Only volunteers need onboarding for now
      });

      const user = await db('users').where({ id }).first();
      const userPayload = { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        organizationId: user.organization_id,
        onboardingCompleted: user.onboarding_completed
      };
      
      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: userPayload });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
      const normalizedEmail = email?.toLowerCase().trim();
      const normalizedPassword = password?.trim();
      
      const users = await db('users').where({ email: normalizedEmail });
      const user = users[0];
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const validPassword = await bcrypt.compare(normalizedPassword, user.password_hash);
      
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const userPayload = { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        organizationId: user.organization_id,
        onboardingCompleted: !!user.onboarding_completed,
        needsPasswordReset: !!user.needs_password_reset
      };
      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: userPayload });
    } catch (err: any) {
      console.error('--- Login FAILED ---', err);
      res.status(500).json({ 
        error: 'Server error', 
        details: err.message
      });
    }
  });

  app.get('/api/auth/me', authenticate, async (req: any, res) => {
    try {
      const user = await db('users').where({ id: req.user.id }).first();
      if (!user) return res.status(401).json({ error: 'User not found' });
      
      res.json({
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id,
        onboardingCompleted: !!user.onboarding_completed,
        needsPasswordReset: !!user.needs_password_reset,
        fullName: user.full_name,
        phone: user.phone,
        bio: user.bio,
        skills: user.skills
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/onboarding', authenticate, async (req: any, res) => {
    try {
      const { fullName, phone, bio, skills } = req.body;
      await db('users')
        .where({ id: req.user.id })
        .update({
          full_name: fullName,
          phone,
          bio,
          skills,
          onboarding_completed: true
        });
      
      const user = await db('users').where({ id: req.user.id }).first();
      const userPayload = { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        organizationId: user.organization_id,
        onboardingCompleted: !!user.onboarding_completed,
        needsPasswordReset: !!user.needs_password_reset,
        fullName: user.full_name,
        phone: user.phone,
        bio: user.bio,
        skills: user.skills
      };
      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: userPayload });
    } catch (err) {
      res.status(500).json({ error: 'Failed to complete onboarding' });
    }
  });

  app.patch('/api/auth/profile', authenticate, async (req: any, res) => {
    try {
      const { fullName, phone, bio, skills, password } = req.body;
      const updateData: any = {
        full_name: fullName,
        phone,
        bio,
        skills
      };

      if (password) {
        updateData.password_hash = await bcrypt.hash(password, 12);
        updateData.needs_password_reset = false;
      }

      await db('users')
        .where({ id: req.user.id })
        .update(updateData);
      
      const user = await db('users').where({ id: req.user.id }).first();
      const userPayload = { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        organizationId: user.organization_id,
        onboardingCompleted: !!user.onboarding_completed,
        needsPasswordReset: !!user.needs_password_reset,
        fullName: user.full_name,
        phone: user.phone,
        bio: user.bio,
        skills: user.skills
      };
      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: userPayload });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  app.get('/api/events', authenticate, async (req: any, res) => {
    const { search, status } = req.query;
    try {
      let query = db('events')
        .join('organizations', 'events.organization_id', 'organizations.id')
        .leftJoin('applications', function() {
          this.on('events.id', '=', 'applications.event_id')
            .andOn('applications.volunteer_id', '=', db.raw('?', [req.user.id]));
        })
        .select(
          'events.*', 
          'organizations.name as organization_name',
          'applications.status as user_app_status',
          db.raw('(SELECT COUNT(*) FROM applications WHERE event_id = events.id AND status = \'accepted\') as accepted_count'),
          db.raw('(SELECT COUNT(*) FROM applications WHERE event_id = events.id AND status = \'pending\') as pending_count'),
          db.raw('(SELECT COUNT(*) FROM applications WHERE event_id = events.id) as application_count')
        );
      
      if (req.user.role === 'org_admin') {
        query = query.where('events.organization_id', req.user.organizationId);
      }

      if (search) {
        const s = `%${String(search).toLowerCase()}%`;
        query = query.where(function() {
          this.whereILike('events.name', s)
            .orWhereILike('events.location', s)
            .orWhereILike('organizations.name', s);
        });
      }

      if (status && status !== 'all') {
        if (['pending', 'accepted', 'rejected'].includes(status)) {
          query = query.where('applications.status', status);
        } else if (status === 'not_applied') {
          query = query.whereNull('applications.status');
        } else {
          query = query.where('events.status', status);
        }
      }

      const events = await query.orderBy('events.event_date', 'asc');
      res.json({ data: events });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/events/:id', authenticate, async (req: any, res) => {
    try {
      const event = await db('events')
        .join('organizations', 'events.organization_id', 'organizations.id')
        .select(
          'events.*', 
          'organizations.name as organization_name',
          db.raw('(SELECT COUNT(*) FROM applications WHERE event_id = events.id AND status = \'accepted\') as accepted_count')
        )
        .where('events.id', req.params.id)
        .first();

      if (!event) return res.status(404).json({ error: 'Not found' });

      let userApplication = await db('applications')
        .where({ event_id: req.params.id, volunteer_id: req.user.id })
        .first();

      if (userApplication && req.user.role === 'volunteer') {
        delete userApplication.ai_summary;
      }

      res.json({ data: { ...event, user_application: userApplication || null } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/events', authenticate, async (req: any, res) => {
    if (req.user.role === 'volunteer') return res.status(403).json({ error: 'Forbidden' });
    
    try {
      const { name, description, location, event_date, start_time, end_time, max_volunteers, organization_id } = req.body;
      const id = uuidv4();
      
      // Use the provided organization_id if super_admin, otherwise use their own
      const orgId = req.user.role === 'super_admin' ? (organization_id || req.user.organizationId) : req.user.organizationId;
      
      await db('events').insert({
        id,
        organization_id: orgId,
        name,
        description,
        location,
        event_date,
        start_time,
        end_time,
        max_volunteers: max_volunteers || 10
      });
      
      const newEvent = await db('events').where({ id }).first();
      res.json({ data: newEvent });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create event' });
    }
  });

  app.post('/api/applications', authenticate, async (req: any, res) => {
    try {
      const { eventId, applicationText } = req.body;
      const id = uuidv4();
      
      const aiSummary = await summarizeApplication(applicationText);
      
      await db('applications').insert({
        id,
        event_id: eventId,
        volunteer_id: req.user.id,
        application_text: applicationText,
        ai_summary: aiSummary,
        status: 'pending'
      });

      const application = await db('applications').where({ id }).first();
      res.json({ message: 'Success', data: application });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to submit application' });
    }
  });

  app.get('/api/applications', authenticate, async (req: any, res) => {
    const { event_id, search } = req.query;
    try {
      const columns = [
        'applications.id',
        'applications.event_id',
        'applications.volunteer_id',
        'applications.application_text',
        'applications.status',
        'applications.created_at',
        'applications.updated_at',
        'users.email as volunteer_email', 
        'events.name as event_name',
        'events.event_date',
        'events.location'
      ];

      if (req.user.role !== 'volunteer') {
        columns.push('applications.ai_summary');
      }

      let query = db('applications')
        .join('users', 'applications.volunteer_id', 'users.id')
        .join('events', 'applications.event_id', 'events.id')
        .select(columns);

      if (req.user.role === 'volunteer') {
        query = query.where('applications.volunteer_id', req.user.id);
      } else if (req.user.role === 'org_admin') {
        query = query.where('events.organization_id', req.user.organizationId);
      }

      if (event_id && event_id !== 'all') {
        query = query.where('applications.event_id', event_id);
      }

      if (search) {
        const s = `%${String(search).toLowerCase()}%`;
        query = query.where(function() {
          this.whereILike('users.email', s)
            .orWhereILike('events.name', s);
        });
      }

      const apps = await query.orderBy('applications.created_at', 'desc');
      res.json({ data: apps });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/events/:id/applications', authenticate, async (req: any, res) => {
    if (req.user.role === 'volunteer') return res.status(403).json({ error: 'Forbidden' });
    try {
      const apps = await db('applications')
        .join('users', 'applications.volunteer_id', 'users.id')
        .select('applications.*', 'users.email as volunteer_email')
        .where('applications.event_id', req.params.id)
        .orderBy('applications.created_at', 'desc');

      // Hide AI summary from volunteer in the individual records if somehow they access this
      // But this route is already forbidden for volunteers.
      
      res.json({ data: apps });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/volunteers', authenticate, async (req: any, res) => {
    if (req.user.role === 'volunteer') return res.status(403).json({ error: 'Forbidden' });
    try {
      let query = db('users')
        .where('role', 'volunteer')
        .select('id', 'email', 'full_name', 'onboarding_completed', 'created_at')
        .select(db.raw('(SELECT COUNT(*) FROM applications WHERE volunteer_id = users.id) as application_count'))
        .select(db.raw('(SELECT COUNT(*) FROM applications WHERE volunteer_id = users.id AND status = \'accepted\') as accepted_count'));

      if (req.user.role === 'org_admin') {
        // Only show volunteers who have applied to their organization's events
        query = query.whereIn('id', function() {
          this.select('volunteer_id')
            .from('applications')
            .join('events', 'applications.event_id', 'events.id')
            .where('events.organization_id', req.user.organizationId);
        });
      }

      const volunteers = await query;
      res.json({ data: volunteers });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/volunteers/:id', authenticate, async (req: any, res) => {
    if (req.user.role === 'volunteer') return res.status(403).json({ error: 'Forbidden' });
    try {
      const volunteer = await db('users')
        .where({ id: req.params.id, role: 'volunteer' })
        .select('id', 'email', 'full_name', 'phone', 'bio', 'skills', 'created_at')
        .first();

      if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });

      const history = await db('applications')
        .join('events', 'applications.event_id', 'events.id')
        .join('organizations', 'events.organization_id', 'organizations.id')
        .select('applications.*', 'events.name as event_name', 'organizations.name as organization_name')
        .where('applications.volunteer_id', req.params.id)
        .orderBy('applications.created_at', 'desc');

      res.json({ data: { ...volunteer, history } });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.patch('/api/applications/:id', authenticate, async (req: any, res) => {
    if (req.user.role === 'volunteer') return res.status(403).json({ error: 'Forbidden' });
    
    try {
      const { status } = req.body;
      await db('applications')
        .where({ id: req.params.id })
        .update({ status, updated_at: db.fn.now() });
      
      const updated = await db('applications').where({ id: req.params.id }).first();
      res.json({ data: updated });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update status' });
    }
  });

  app.get('/api/organizations', authenticate, async (req: any, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    try {
      const orgs = await db('organizations')
        .leftJoin('users', function() {
          this.on('organizations.id', '=', 'users.organization_id')
            .andOn('users.role', '=', db.raw("'org_admin'"));
        })
        .select('organizations.*', 'users.email as admin_email');
      res.json({ data: orgs });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/organizations', authenticate, async (req: any, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    try {
      const { name, admin_email } = req.body;
      const normalizedEmail = admin_email?.toLowerCase().trim();
      const orgId = uuidv4();
      await db('organizations').insert({ id: orgId, name });
      
      const userId = uuidv4();
      const otp = Math.random().toString(36).substring(2, 10).toUpperCase();
      const password_hash = await bcrypt.hash(otp, 12);
      
      await db('users').insert({
        id: userId,
        email: normalizedEmail,
        password_hash,
        role: 'org_admin',
        organization_id: orgId,
        needs_password_reset: true
      });
      
      const newOrg = await db('organizations').where({ id: orgId }).first();
      
      // Log OTP to console (SMTP disabled)
      console.log(`[AUTH] Organization Created: ${name}, Admin: ${normalizedEmail}, Temporary Password/OTP: ${otp}`);
      
      res.json({ data: { ...newOrg, admin_email: normalizedEmail, temporaryPassword: otp } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create organization' });
    }
  });

  app.delete('/api/organizations/:id', authenticate, async (req: any, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
    try {
      const orgId = req.params.id;
      
      // We use a manual "cascade" delete to ensure metrics are updated perfectly
      // 1. Delete all applications for events belonging to this organization
      await db('applications')
        .whereIn('event_id', function() {
          this.select('id').from('events').where('organization_id', orgId);
        })
        .delete();
      
      // 2. Delete all events belonging to this organization
      await db('events').where({ organization_id: orgId }).delete();
      
      // 3. Delete all users belonging to this organization
      await db('users').where({ organization_id: orgId }).delete();
      
      // 4. Finally delete the organization itself
      await db('organizations').where({ id: orgId }).delete();
      
      res.json({ message: 'Organization and all related data (events, members) deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete organization' });
    }
  });

  app.get('/api/dashboard/volunteer', authenticate, async (req: any, res) => {
    try {
      const stats = await db('applications')
        .where({ volunteer_id: req.user.id })
        .select(
          db.raw('COUNT(*) as totalApplications'),
          db.raw("SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as acceptedCount")
        ).first();

      // Count all upcoming events the user hasn't applied to yet
      const upcomingCountRes = await db('events')
        .join('organizations', 'events.organization_id', 'organizations.id')
        .where('events.event_date', '>=', db.raw("date('now')"))
        .whereNotIn('events.id', function() {
          this.select('event_id').from('applications').where('volunteer_id', req.user.id);
        })
        .count('events.id as count')
        .first();

      const upcomingEvents = await db('events')
        .join('organizations', 'events.organization_id', 'organizations.id')
        .leftJoin('applications', function() {
          this.on('events.id', '=', 'applications.event_id')
            .andOn('applications.volunteer_id', '=', db.raw('?', [req.user.id]));
        })
        .select('events.*', 'organizations.name as organization_name')
        .where('events.event_date', '>=', db.raw("date('now')"))
        .whereNull('applications.id') // Only show events they haven't applied to
        .orderBy('events.event_date', 'asc')
        .limit(3);

      res.json({ data: {
        stats: {
          totalApplications: parseInt(((stats as any)?.totalApplications || (stats as any)?.totalapplications || 0) as string),
          acceptedCount: parseInt(((stats as any)?.acceptedCount || (stats as any)?.acceptedcount || 0) as string),
          upcomingEventsCount: parseInt(((upcomingCountRes as any)?.count || 0) as string)
        },
        upcomingEvents,
        recentNotifications: [{ id: 'n1', title: 'Welcome', body: 'We are glad to have you on board!', created_at: new Date() }]
      }});
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/dashboard/admin', authenticate, async (req: any, res) => {
    try {
      let stats;
      if (req.user.role === 'super_admin') {
        const sRes = await db.raw(`
          SELECT 
            (SELECT count(distinct volunteer_id) FROM applications JOIN events ON applications.event_id = events.id JOIN organizations ON events.organization_id = organizations.id WHERE events.status = 'active' AND applications.status = 'accepted') as activevolunteers,
            (SELECT count(*) FROM events JOIN organizations ON events.organization_id = organizations.id) as totalevents,
            (SELECT count(*) FROM applications JOIN events ON applications.event_id = events.id JOIN organizations ON events.organization_id = organizations.id WHERE applications.status = 'pending') as pendingapplications
        `);
        // SQLite returns result directly as an array of rows
        stats = sRes.rows ? sRes.rows[0] : sRes[0];
      } else {
        const sRes = await db('events')
          .join('organizations', 'events.organization_id', 'organizations.id')
          .where('events.organization_id', req.user.organizationId)
          .select(
            db.raw('(SELECT count(distinct volunteer_id) FROM applications JOIN events ON applications.event_id = events.id WHERE events.organization_id = ? AND events.status = \'active\' AND applications.status = \'accepted\') as activevolunteers', [req.user.organizationId]),
            db.raw('count(events.id) as totalevents'),
            db.raw('(SELECT count(*) FROM applications JOIN events ON applications.event_id = events.id WHERE events.organization_id = ? AND applications.status = \'pending\') as pendingapplications', [req.user.organizationId])
          );
        stats = sRes[0];
      }
      
      const eventsQuery = db('events')
        .join('organizations', 'events.organization_id', 'organizations.id')
        .select(
          'events.*', 
          'organizations.name as organization_name',
          db.raw('(SELECT COUNT(*) FROM applications WHERE event_id = events.id AND status = \'accepted\') as accepted_count'),
          db.raw('(SELECT COUNT(*) FROM applications WHERE event_id = events.id AND status = \'pending\') as pending_count')
        )
        .where('events.event_date', '>=', db.raw('date(\'now\')'))
        .orderBy('events.event_date', 'asc')
        .limit(3);
        
      if (req.user.role === 'org_admin') {
        eventsQuery.where('events.organization_id', req.user.organizationId);
      }

      const upcomingEvents = await eventsQuery;

      res.json({ data: {
        stats: {
          activeVolunteers: parseInt((stats?.activevolunteers || stats?.activeVolunteers || 0) as string),
          totalEvents: parseInt((stats?.totalevents || stats?.totalEvents || 0) as string),
          pendingApplications: parseInt((stats?.pendingapplications || stats?.pendingApplications || 0) as string)
        },
        upcomingEvents
      }});
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log('Initializing Vite middleware...');
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('Vite middleware initialized.');
    } catch (viteErr) {
      console.error('Failed to initialize Vite middleware:', viteErr);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
