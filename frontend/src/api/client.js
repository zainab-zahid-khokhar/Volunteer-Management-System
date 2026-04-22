// import axios from 'axios';

// const api = axios.create({
//   baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
//   headers: { 'Content-Type': 'application/json' },
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('vms_token');
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     if (err.response?.status === 401) {
//       localStorage.removeItem('vms_token');
//       localStorage.removeItem('vms_user');
//       window.location.href = '/login';
//     }
//     return Promise.reject(err);
//   }
// );

// export default api;

// ─── MOCK API CLIENT ──────────────────────────────────────────────────────────
// Simulates backend with fake data so the UI works without a database.
// Swap this file out for the real axios client when your backend is ready.

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

const store = {
  users: [
    { id: 'u1', email: 'superadmin@vms.com', password: 'SuperAdmin@123', role: 'super_admin', organization_id: null },
    { id: 'u2', email: 'admin@greenearth.com', password: 'Password123', role: 'org_admin', organization_id: 'o1' },
    { id: 'u3', email: 'volunteer@test.com', password: 'Password123', role: 'volunteer', organization_id: null },
  ],
  profiles: [
    { user_id: 'u3', first_name: 'Sara', last_name: 'Khan', phone: '0300-1234567', bio: 'Passionate about community work.', skills: ['First Aid', 'Teaching'], interests: ['Environment', 'Education'] },
  ],
  organizations: [
    { id: 'o1', name: 'Green Earth Foundation', description: 'Environmental NGO focused on urban greening.', is_active: true, admin_count: 1, event_count: 3, created_at: '2026-01-10T10:00:00Z' },
    { id: 'o2', name: 'Helping Hands', description: 'Community welfare organization.', is_active: true, admin_count: 1, event_count: 2, created_at: '2026-02-14T10:00:00Z' },
    { id: 'o3', name: 'Youth Connect', description: 'Empowering youth through education.', is_active: false, admin_count: 0, event_count: 1, created_at: '2026-03-01T10:00:00Z' },
  ],
  events: [
    { id: 'e1', organization_id: 'o1', name: 'Karachi Beach Cleanup', description: 'Join us for a morning of cleaning Clifton Beach. Gloves and bags provided.', location: 'Clifton Beach, Karachi', event_date: '2026-05-20', start_time: '08:00', end_time: '12:00', max_volunteers: 20, status: 'active', accepted_count: 7, application_count: 11, organization_name: 'Green Earth Foundation', created_by_email: 'admin@greenearth.com' },
    { id: 'e2', organization_id: 'o1', name: 'Tree Plantation Drive', description: 'Help us plant 500 trees in Gulshan-e-Iqbal park.', location: 'Gulshan-e-Iqbal Park', event_date: '2026-05-28', start_time: '07:30', end_time: '11:00', max_volunteers: 30, status: 'active', accepted_count: 12, application_count: 15, organization_name: 'Green Earth Foundation', created_by_email: 'admin@greenearth.com' },
    { id: 'e3', organization_id: 'o2', name: 'Food Distribution Drive', description: 'Monthly food distribution for underprivileged families in Lyari.', location: 'Lyari, Karachi', event_date: '2026-06-05', start_time: '10:00', end_time: '14:00', max_volunteers: 15, status: 'active', accepted_count: 3, application_count: 6, organization_name: 'Helping Hands', created_by_email: 'admin@helping.com' },
    { id: 'e4', organization_id: 'o1', name: 'Climate Awareness Walk', description: 'Walk through Saddar to raise climate awareness.', location: 'Saddar, Karachi', event_date: '2026-04-01', start_time: '08:00', end_time: '10:00', max_volunteers: 50, status: 'completed', accepted_count: 42, application_count: 48, organization_name: 'Green Earth Foundation', created_by_email: 'admin@greenearth.com' },
  ],
  applications: [
    { id: 'a1', volunteer_id: 'u3', event_id: 'e1', application_text: 'I have been volunteering for beach cleanups for 3 years. I am physically fit and own my own equipment.', status: 'accepted', created_at: '2026-04-18T09:00:00Z', event_name: 'Karachi Beach Cleanup', event_date: '2026-05-20', organization_name: 'Green Earth Foundation', first_name: 'Sara', last_name: 'Khan', volunteer_email: 'volunteer@test.com', skills: ['First Aid', 'Teaching'], ai_summary: 'The applicant has 3 years of beach cleanup experience, is physically prepared, and brings their own equipment — a strong candidate.' },
    { id: 'a2', volunteer_id: 'u3', event_id: 'e2', application_text: 'I love nature and want to contribute to the green initiative. I have participated in 2 plantation drives before.', status: 'pending', created_at: '2026-04-19T11:00:00Z', event_name: 'Tree Plantation Drive', event_date: '2026-05-28', organization_name: 'Green Earth Foundation', first_name: 'Sara', last_name: 'Khan', volunteer_email: 'volunteer@test.com', skills: ['First Aid'], ai_summary: 'Applicant shows genuine environmental interest with prior plantation experience.' },
  ],
  messages: [
    { id: 'm1', sender_id: 'u2', recipient_id: 'u3', content: 'Hi Sara! Thanks for applying to the Beach Cleanup. We\'d love to have you.', is_read: true, created_at: '2026-04-18T10:00:00Z' },
    { id: 'm2', sender_id: 'u3', recipient_id: 'u2', content: 'Thank you! Really excited. What should I bring?', is_read: true, created_at: '2026-04-18T10:30:00Z' },
    { id: 'm3', sender_id: 'u2', recipient_id: 'u3', content: 'Just wear comfortable clothes and bring water. We provide gloves and bags!', is_read: false, created_at: '2026-04-18T11:00:00Z' },
  ],
  notifications: [
    { id: 'n1', user_id: 'u3', type: 'application_update', title: 'Application Accepted ✅', body: 'Your application for "Karachi Beach Cleanup" has been accepted.', is_read: false, created_at: '2026-04-18T10:00:00Z' },
    { id: 'n2', user_id: 'u3', type: 'message', title: 'New Message', body: 'You have a new message from admin@greenearth.com', is_read: false, created_at: '2026-04-18T11:00:00Z' },
    { id: 'n3', user_id: 'u2', type: 'general', title: 'New Application: Beach Cleanup', body: 'A volunteer submitted a new application.', is_read: false, created_at: '2026-04-18T09:00:00Z' },
  ],
  auditLogs: [
    { id: 'al1', user_email: 'superadmin@vms.com', action: 'org_onboard', resource_type: 'organization', resource_id: 'o1', details: { name: 'Green Earth Foundation' }, created_at: '2026-01-10T10:00:00Z' },
    { id: 'al2', user_email: 'superadmin@vms.com', action: 'invite_generated', resource_type: 'invite_token', resource_id: 'it1', details: { email: 'admin@greenearth.com' }, created_at: '2026-01-10T10:05:00Z' },
    { id: 'al3', user_email: 'superadmin@vms.com', action: 'org_onboard', resource_type: 'organization', resource_id: 'o2', details: { name: 'Helping Hands' }, created_at: '2026-02-14T10:00:00Z' },
    { id: 'al4', user_email: 'superadmin@vms.com', action: 'view_all_volunteers', resource_type: 'user', resource_id: null, details: {}, created_at: '2026-04-20T14:00:00Z' },
  ],
};

const getUserFromToken = (token) => {
  if (!token) return null;
  const parts = token.split('-');
  return store.users.find(u => u.id === parts[3]) || null;
};

const handlers = {
  'POST /auth/login': async ({ data }) => {
    await delay();
    const user = store.users.find(u => u.email === data.email && u.password === data.password);
    if (!user) throw { response: { data: { error: 'Invalid credentials' }, status: 401 } };
    const token = `mock-jwt-${user.role}-${user.id}`;
    return { token, user: { id: user.id, email: user.email, role: user.role, organizationId: user.organization_id } };
  },
  'POST /auth/register': async ({ data }) => {
    await delay();
    if (store.users.find(u => u.email === data.email)) throw { response: { data: { error: 'Email already registered' }, status: 409 } };
    store.users.push({ id: `u${Date.now()}`, email: data.email, password: data.password, role: 'volunteer', organization_id: null });
    return { message: 'Registration successful. Please check your email to verify your account.' };
  },
  'GET /auth/me': async ({ token }) => {
    await delay(100);
    const user = getUserFromToken(token);
    if (!user) throw { response: { status: 401 } };
    const profile = store.profiles.find(p => p.user_id === user.id) || null;
    return { id: user.id, email: user.email, role: user.role, organizationId: user.organization_id, emailVerified: true, profile };
  },
  'GET /admin/dashboard': async () => { await delay(); return { data: { totalOrganizations: 3, totalVolunteers: 24, totalEvents: 6, totalApplications: 38 } }; },
  'GET /admin/organizations': async () => { await delay(); return { data: store.organizations }; },
  'POST /admin/organizations': async ({ data }) => {
    await delay(500);
    const org = { id: `o${Date.now()}`, name: data.name, description: data.description || '', is_active: true, admin_count: (data.adminEmails || []).length, event_count: 0, created_at: new Date().toISOString() };
    store.organizations.push(org);
    return { message: 'Organization created', data: org };
  },
  'PATCH /admin/organizations/:id': async ({ urlParts }) => {
    await delay();
    const org = store.organizations.find(o => o.id === urlParts[2]);
    if (org) org.is_active = !org.is_active;
    return { message: 'Updated', data: org };
  },
  'GET /admin/volunteers': async () => {
    await delay();
    const vols = store.users.filter(u => u.role === 'volunteer').map(u => { const p = store.profiles.find(pr => pr.user_id === u.id); return { id: u.id, email: u.email, created_at: '2026-03-15T10:00:00Z', first_name: p?.first_name || 'Demo', last_name: p?.last_name || 'User', skills: p?.skills || [], phone: p?.phone || '', organization_name: null, application_count: store.applications.filter(a => a.volunteer_id === u.id).length }; });
    return { data: vols, pagination: { page: 1, limit: 20, total: vols.length } };
  },
  'GET /admin/audit-logs': async () => { await delay(); return { data: store.auditLogs }; },
  'POST /admin/invites': async () => { await delay(400); return { message: 'Invite sent', data: { inviteId: `inv${Date.now()}` } }; },
  'GET /events': async ({ params, token }) => {
    await delay();
    const user = getUserFromToken(token);
    let events = [...store.events];
    if (user?.role === 'volunteer') events = events.filter(e => e.status === 'active');
    if (params?.search) events = events.filter(e => e.name.toLowerCase().includes(params.search.toLowerCase()));
    if (params?.status) events = events.filter(e => e.status === params.status);
    return { data: events, pagination: { total: events.length } };
  },
  'GET /events/:id': async ({ urlParts, token }) => {
    await delay();
    const event = store.events.find(e => e.id === urlParts[1]);
    if (!event) throw { response: { data: { error: 'Not found' }, status: 404 } };
    const user = getUserFromToken(token);
    const userApp = store.applications.find(a => a.volunteer_id === user?.id && a.event_id === urlParts[1]);
    return { data: { ...event, user_application: userApp || null } };
  },
  'POST /events': async ({ data }) => {
    await delay(400);
    const event = { id: `e${Date.now()}`, name: data.name, description: data.description || '', location: data.location || '', event_date: data.eventDate, start_time: data.startTime, end_time: data.endTime, max_volunteers: data.maxVolunteers, status: 'active', accepted_count: 0, application_count: 0, organization_name: 'Green Earth Foundation' };
    store.events.push(event);
    return { message: 'Event created', data: event };
  },
  'PUT /events/:id': async ({ urlParts, data }) => {
    await delay(400);
    const idx = store.events.findIndex(e => e.id === urlParts[1]);
    if (idx === -1) throw { response: { data: { error: 'Not found' }, status: 404 } };
    store.events[idx] = { ...store.events[idx], name: data.name, description: data.description, location: data.location, event_date: data.eventDate || store.events[idx].event_date, start_time: data.startTime || store.events[idx].start_time, end_time: data.endTime || store.events[idx].end_time, max_volunteers: data.maxVolunteers };
    return { message: 'Event updated', data: store.events[idx] };
  },
  'DELETE /events/:id': async ({ urlParts }) => {
    await delay(400);
    const idx = store.events.findIndex(e => e.id === urlParts[1]);
    if (idx !== -1) store.events[idx].status = 'cancelled';
    return { message: 'Event cancelled' };
  },
  'GET /applications': async ({ token }) => {
    await delay();
    const user = getUserFromToken(token);
    return { data: store.applications.filter(a => a.volunteer_id === user?.id) };
  },
  'POST /applications': async ({ data, token }) => {
    await delay(500);
    const user = getUserFromToken(token);
    if (store.applications.find(a => a.volunteer_id === user?.id && a.event_id === data.eventId)) throw { response: { data: { error: 'You have already applied for this event' }, status: 409 } };
    const event = store.events.find(e => e.id === data.eventId);
    const app = { id: `a${Date.now()}`, volunteer_id: user?.id, event_id: data.eventId, application_text: data.applicationText, status: 'pending', created_at: new Date().toISOString(), event_name: event?.name, event_date: event?.event_date, organization_name: event?.organization_name };
    store.applications.push(app);
    return { message: 'Application submitted', data: app };
  },
  'GET /events/:id/applications': async ({ urlParts }) => {
    await delay();
    return { data: store.applications.filter(a => a.event_id === urlParts[1]) };
  },
  'PATCH /applications/:id/status': async ({ urlParts, data }) => {
    await delay(400);
    const app = store.applications.find(a => a.id === urlParts[1]);
    if (!app) throw { response: { data: { error: 'Not found' }, status: 404 } };
    if (app.status !== 'pending') throw { response: { data: { error: 'Only pending applications can be reviewed' }, status: 400 } };
    app.status = data.status;
    return { message: `Application ${data.status}`, data: { id: urlParts[1], status: data.status } };
  },
  'GET /summary/:applicationId': async ({ urlParts }) => {
    await delay(800);
    const app = store.applications.find(a => a.id === urlParts[1]);
    return { data: app?.ai_summary ? { summary_text: app.ai_summary } : null };
  },
  'GET /volunteers': async () => {
    await delay();
    return { data: store.users.filter(u => u.role === 'volunteer').map(u => { const p = store.profiles.find(pr => pr.user_id === u.id); return { id: u.id, email: u.email, first_name: p?.first_name || 'Demo', last_name: p?.last_name || 'User', skills: p?.skills || [], phone: p?.phone || '' }; }) };
  },
  'POST /volunteers/profile': async ({ data, token }) => {
    await delay(400);
    const user = getUserFromToken(token);
    const profile = { user_id: user?.id, first_name: data.firstName, last_name: data.lastName, phone: data.phone, bio: data.bio, skills: data.skills, interests: data.interests };
    store.profiles.push(profile);
    return { message: 'Profile created', data: profile };
  },
  'PUT /volunteers/profile': async ({ data, token }) => {
    await delay(400);
    const user = getUserFromToken(token);
    const idx = store.profiles.findIndex(p => p.user_id === user?.id);
    const profile = { user_id: user?.id, first_name: data.firstName, last_name: data.lastName, phone: data.phone, bio: data.bio, skills: data.skills, interests: data.interests };
    if (idx >= 0) store.profiles[idx] = profile; else store.profiles.push(profile);
    return { message: 'Profile updated', data: profile };
  },
  'POST /messages': async ({ data, token }) => {
    await delay(300);
    const user = getUserFromToken(token);
    const msg = { id: `m${Date.now()}`, sender_id: user?.id, recipient_id: data.recipientId, content: data.content, is_read: false, created_at: new Date().toISOString() };
    store.messages.push(msg);
    return { data: msg };
  },
  'GET /messages/conversations': async ({ token }) => {
    await delay();
    const user = getUserFromToken(token);
    if (!user) return { data: [] };
    const partners = [...new Set(store.messages.filter(m => m.sender_id === user.id || m.recipient_id === user.id).map(m => m.sender_id === user.id ? m.recipient_id : m.sender_id))];
    return { data: partners.map(pid => { const partner = store.users.find(u => u.id === pid); const msgs = store.messages.filter(m => (m.sender_id === user.id && m.recipient_id === pid) || (m.sender_id === pid && m.recipient_id === user.id)); const last = msgs[msgs.length - 1]; return { partner_id: pid, partner_email: partner?.email, partner_name: partner?.email?.split('@')[0], last_message: last?.content, last_message_at: last?.created_at, unread_count: msgs.filter(m => m.recipient_id === user.id && !m.is_read).length }; }) };
  },
  'GET /messages/unread-count': async ({ token }) => {
    await delay(100);
    const user = getUserFromToken(token);
    return { data: { unreadCount: store.messages.filter(m => m.recipient_id === user?.id && !m.is_read).length } };
  },
  'GET /messages/:partnerId': async ({ urlParts, token }) => {
    await delay();
    const user = getUserFromToken(token);
    const pid = urlParts[1];
    return { data: store.messages.filter(m => (m.sender_id === user?.id && m.recipient_id === pid) || (m.sender_id === pid && m.recipient_id === user?.id)) };
  },
  'GET /notifications': async ({ token }) => {
    await delay(100);
    const user = getUserFromToken(token);
    const notifs = store.notifications.filter(n => n.user_id === user?.id);
    return { data: notifs, unreadCount: notifs.filter(n => !n.is_read).length };
  },
  'PATCH /notifications/:id/read': async ({ urlParts }) => {
    await delay(100);
    if (urlParts[1] === 'all') store.notifications.forEach(n => n.is_read = true);
    else { const n = store.notifications.find(n => n.id === urlParts[1]); if (n) n.is_read = true; }
    return { message: 'Marked as read' };
  },
  'GET /dashboard/volunteer': async ({ token }) => {
    await delay();
    const user = getUserFromToken(token);
    const myApps = store.applications.filter(a => a.volunteer_id === user?.id);
    return { data: { myApplications: myApps, upcomingEvents: store.events.filter(e => e.status === 'active').slice(0, 6), stats: { totalApplications: myApps.length, acceptedCount: myApps.filter(a => a.status === 'accepted').length, pendingCount: myApps.filter(a => a.status === 'pending').length, unreadMessages: store.messages.filter(m => m.recipient_id === user?.id && !m.is_read).length }, recentNotifications: store.notifications.filter(n => n.user_id === user?.id).slice(0, 5) } };
  },
  'GET /dashboard/admin': async () => {
    await delay();
    return { data: { stats: { activeVolunteers: 12, totalEvents: 4, pendingApplications: 5, unreadMessages: 2 }, upcomingEvents: store.events.filter(e => e.status === 'active').map(e => ({ ...e, pending_apps: 3, accepted_apps: e.accepted_count })) } };
  },
};

const matchRoute = (method, path) => {
  const parts = path.split('/').filter(Boolean);
  for (const [pattern, handler] of Object.entries(handlers)) {
    const [pMethod, pPath] = pattern.split(' ');
    if (pMethod !== method) continue;
    const pParts = pPath.split('/').filter(Boolean);
    if (pParts.length !== parts.length) continue;
    if (pParts.every((p, i) => p.startsWith(':') || p === parts[i])) return { handler, urlParts: parts };
  }
  return null;
};

const request = async (method, url, data, config = {}) => {
  const token = localStorage.getItem('vms_token');
  const cleanUrl = url.replace(/^\/api/, '');
  const [path, query] = cleanUrl.split('?');
  const params = query ? Object.fromEntries(new URLSearchParams(query)) : (config?.params || {});
  const match = matchRoute(method.toUpperCase(), path);
  if (!match) { console.warn(`[Mock API] No handler: ${method.toUpperCase()} ${path}`); return { data: {} }; }
  try {
    const result = await match.handler({ url: cleanUrl, urlParts: match.urlParts, data, params, token });
    return { data: result };
  } catch (err) {
    if (err.response) throw err;
    throw { response: { data: { error: err.message }, status: 500 } };
  }
};

const api = {
  get: (url, config) => request('GET', url, null, config),
  post: (url, data, config) => request('POST', url, data, config),
  put: (url, data, config) => request('PUT', url, data, config),
  patch: (url, data, config) => request('PATCH', url, data, config),
  delete: (url, config) => request('DELETE', url, null, config),
  interceptors: { request: { use: () => {} }, response: { use: () => {} } },
};

export default api;

// Super Admin superadmin@vms.com SuperAdmin@123

// Org Admin admin@greenearth.com Password123

// Volunteer volunteer@test.com Password123
