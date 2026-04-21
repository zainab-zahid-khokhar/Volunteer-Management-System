const request = require('supertest');
const app = require('../index');
const db = require('../db');

let superAdminToken;
let volunteerToken;
let orgAdminToken;
let testOrgId;

beforeAll(async () => {
  // Run migrations
  await db.migrate.latest();
  // Seed super admin
  await db.seed.run();
});

afterAll(async () => {
  await db.destroy();
});

describe('Auth – Registration & Login', () => {
  it('POST /api/auth/register – volunteer registers successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'volunteer@test.com', password: 'Password123' });
    expect(res.status).toBe(201);
    expect(res.body.message).toContain('verify');
  });

  it('POST /api/auth/register – duplicate email returns 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'volunteer@test.com', password: 'Password123' });
    expect(res.status).toBe(409);
  });

  it('POST /api/auth/login – super admin login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'superadmin@vms.com', password: 'SuperAdmin@123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('super_admin');
    superAdminToken = res.body.token;
  });

  it('POST /api/auth/login – wrong password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'superadmin@vms.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me – returns authenticated user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('super_admin');
  });

  it('GET /api/auth/me – rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Super Admin – Organization Onboarding', () => {
  it('POST /api/admin/organizations – creates org and sends invites', async () => {
    const res = await request(app)
      .post('/api/admin/organizations')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ name: 'Test Org', description: 'A test org', adminEmails: ['orgadmin@test.com'] });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    testOrgId = res.body.data.id;
  });

  it('POST /api/admin/organizations – duplicate name returns 409', async () => {
    const res = await request(app)
      .post('/api/admin/organizations')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ name: 'Test Org' });
    expect(res.status).toBe(409);
  });

  it('GET /api/admin/organizations – lists all orgs', async () => {
    const res = await request(app)
      .get('/api/admin/organizations')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/admin/organizations – blocked for volunteer', async () => {
    // Force-verify volunteer so we can log in
    await db('users').where({ email: 'volunteer@test.com' }).update({ email_verified: true });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'volunteer@test.com', password: 'Password123' });
    volunteerToken = loginRes.body.token;

    const res = await request(app)
      .get('/api/admin/organizations')
      .set('Authorization', `Bearer ${volunteerToken}`);
    expect(res.status).toBe(403);
  });
});

describe('Org Admin – Registration via Invite', () => {
  it('POST /api/auth/register – org admin registers with invite token', async () => {
    const invite = await db('invite_tokens').where({ email: 'orgadmin@test.com' }).first();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'orgadmin@test.com', password: 'Password123', inviteToken: invite.token });
    expect(res.status).toBe(201);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'orgadmin@test.com', password: 'Password123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.role).toBe('org_admin');
    orgAdminToken = loginRes.body.token;
  });
});

describe('Events – CRUD', () => {
  let testEventId;

  it('POST /api/events – admin creates event', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${orgAdminToken}`)
      .send({
        name: 'Beach Cleanup',
        description: 'Help clean the beach',
        location: 'Clifton Beach',
        eventDate: '2027-06-15',
        startTime: '09:00',
        endTime: '13:00',
        maxVolunteers: 10,
      });
    expect(res.status).toBe(201);
    testEventId = res.body.data.id;
  });

  it('GET /api/events – volunteer sees active events', async () => {
    const res = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${volunteerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/events – volunteer cannot create event', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${volunteerToken}`)
      .send({ name: 'Hack', eventDate: '2027-01-01', startTime: '10:00', endTime: '12:00', maxVolunteers: 5 });
    expect(res.status).toBe(403);
  });

  it('PUT /api/events/:id – admin edits event', async () => {
    const res = await request(app)
      .put(`/api/events/${testEventId}`)
      .set('Authorization', `Bearer ${orgAdminToken}`)
      .send({ name: 'Beach Cleanup Updated', eventDate: '2027-06-15', startTime: '09:00', endTime: '14:00', maxVolunteers: 15 });
    expect(res.status).toBe(200);
  });
});

describe('Applications – Submit & Review', () => {
  let appId;
  let eventId;

  beforeAll(async () => {
    // Create a fresh event for application tests
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${orgAdminToken}`)
      .send({ name: 'App Test Event', eventDate: '2027-08-01', startTime: '10:00', endTime: '12:00', maxVolunteers: 5 });
    eventId = res.body.data.id;
  });

  it('POST /api/applications – volunteer submits application', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${volunteerToken}`)
      .send({ eventId, applicationText: 'I am passionate about volunteering and have 3 years of experience.' });
    expect(res.status).toBe(201);
    appId = res.body.data.id;
  });

  it('POST /api/applications – duplicate application rejected', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${volunteerToken}`)
      .send({ eventId, applicationText: 'Another application' });
    expect(res.status).toBe(409);
  });

  it('GET /api/events/:id/applications – admin sees applications', async () => {
    const res = await request(app)
      .get(`/api/events/${eventId}/applications`)
      .set('Authorization', `Bearer ${orgAdminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it('PATCH /api/applications/:id/status – admin accepts application', async () => {
    const res = await request(app)
      .patch(`/api/applications/${appId}/status`)
      .set('Authorization', `Bearer ${orgAdminToken}`)
      .send({ status: 'accepted' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('accepted');
  });

  it('PATCH /api/applications/:id/status – already reviewed cannot be re-reviewed', async () => {
    const res = await request(app)
      .patch(`/api/applications/${appId}/status`)
      .set('Authorization', `Bearer ${orgAdminToken}`)
      .send({ status: 'rejected' });
    expect(res.status).toBe(400);
  });
});

describe('Messaging', () => {
  it('POST /api/messages – volunteer sends message to org admin', async () => {
    const orgAdmin = await db('users').where({ email: 'orgadmin@test.com' }).first();
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${volunteerToken}`)
      .send({ recipientId: orgAdmin.id, content: 'Hello, I have a question about the event.' });
    expect(res.status).toBe(201);
  });

  it('GET /api/messages/conversations – lists conversations', async () => {
    const res = await request(app)
      .get('/api/messages/conversations')
      .set('Authorization', `Bearer ${volunteerToken}`);
    expect(res.status).toBe(200);
  });
});

describe('RBAC – Access Control', () => {
  it('GET /api/admin/audit-logs – only super admin can access', async () => {
    const volunteerRes = await request(app).get('/api/admin/audit-logs').set('Authorization', `Bearer ${volunteerToken}`);
    expect(volunteerRes.status).toBe(403);

    const orgAdminRes = await request(app).get('/api/admin/audit-logs').set('Authorization', `Bearer ${orgAdminToken}`);
    expect(orgAdminRes.status).toBe(403);

    const superAdminRes = await request(app).get('/api/admin/audit-logs').set('Authorization', `Bearer ${superAdminToken}`);
    expect(superAdminRes.status).toBe(200);
  });

  it('GET /api/dashboard/volunteer – only for volunteers', async () => {
    const res = await request(app).get('/api/dashboard/volunteer').set('Authorization', `Bearer ${orgAdminToken}`);
    expect(res.status).toBe(403);
  });
});
