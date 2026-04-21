import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Send, Building2, Users, ClipboardList, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

// ─── Profile Page ─────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', bio: '', skills: [], interests: [] });
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    api.get('/auth/me').then(r => {
      if (r.data.profile) {
        const p = r.data.profile;
        setForm({ firstName: p.first_name, lastName: p.last_name, phone: p.phone || '', bio: p.bio || '', skills: p.skills || [], interests: p.interests || [] });
        setHasProfile(true);
      }
      setLoading(false);
    });
  }, []);

  const addTag = (field, value, setter) => {
    if (!value.trim()) return;
    setForm(f => ({ ...f, [field]: [...(f[field] || []), value.trim()] }));
    setter('');
  };

  const removeTag = (field, idx) => {
    setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (hasProfile) {
        await api.put('/volunteers/profile', form);
      } else {
        await api.post('/volunteers/profile', form);
        setHasProfile(true);
      }
      toast.success('Profile saved!');
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <>
      <h1 className="page-title">My Profile</h1>
      <p className="page-subtitle">Keep your profile updated so organizations know who you are.</p>
      <div className="card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input className="form-control" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input className="form-control" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required />
            </div>
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input className="form-control" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea className="form-control" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell organizations about yourself..." />
          </div>
          <div className="form-group">
            <label>Skills</label>
            <div className="flex-gap" style={{ marginBottom: '6px' }}>
              <input className="form-control" value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder="e.g. First Aid"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag('skills', skillInput, setSkillInput); } }} />
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => addTag('skills', skillInput, setSkillInput)}>Add</button>
            </div>
            <div className="tags-wrap">
              {(form.skills || []).map((s, i) => (
                <span key={i} className="tag">{s} <button type="button" onClick={() => removeTag('skills', i)}>×</button></span>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Interests</label>
            <div className="flex-gap" style={{ marginBottom: '6px' }}>
              <input className="form-control" value={interestInput} onChange={e => setInterestInput(e.target.value)} placeholder="e.g. Environment"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag('interests', interestInput, setInterestInput); } }} />
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => addTag('interests', interestInput, setInterestInput)}>Add</button>
            </div>
            <div className="tags-wrap">
              {(form.interests || []).map((s, i) => (
                <span key={i} className="tag">{s} <button type="button" onClick={() => removeTag('interests', i)}>×</button></span>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
        </form>
      </div>
    </>
  );
}

// ─── My Applications ──────────────────────────────────────────────────────────
export function ApplicationsPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/applications').then(r => { setApplications(r.data.data); setLoading(false); });
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <>
      <h1 className="page-title">My Applications</h1>
      <p className="page-subtitle">Track the status of your volunteer applications.</p>
      {applications.length === 0 ? (
        <div className="empty-state card">
          <p>No applications yet.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/events')}>Browse Events</button>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Event</th><th>Organization</th><th>Event Date</th><th>Applied</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {applications.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500 }}>{a.event_name}</td>
                    <td>{a.organization_name}</td>
                    <td>{a.event_date}</td>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</td>
                    <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                    <td><button className="btn btn-sm btn-secondary" onClick={() => navigate(`/events/${a.event_id}`)}>View Event</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Messaging Page ───────────────────────────────────────────────────────────
export function MessagingPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEnd = useRef(null);

  const loadConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data.data);
    } catch (_) {}
  };

  const loadMessages = async (partnerId) => {
    try {
      const res = await api.get(`/messages/${partnerId}`);
      setMessages(res.data.data);
      setTimeout(() => messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (_) {}
  };

  useEffect(() => { loadConversations(); }, []);

  const openConv = (conv) => {
    setActiveConv(conv);
    loadMessages(conv.partner_id);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeConv) return;
    setSending(true);
    try {
      await api.post('/messages', { recipientId: activeConv.partner_id, content: newMsg });
      setNewMsg('');
      loadMessages(activeConv.partner_id);
      loadConversations();
    } catch (_) { toast.error('Failed to send'); }
    setSending(false);
  };

  return (
    <>
      <h1 className="page-title">Messages</h1>
      <div className="message-layout" style={{ marginTop: '16px' }}>
        <div className="conv-list">
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '0.875rem' }}>Conversations</div>
          {conversations.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}><p>No messages yet.</p></div>
          ) : (
            conversations.map(c => (
              <div key={c.partner_id} className={`conv-item ${activeConv?.partner_id === c.partner_id ? 'active' : ''}`} onClick={() => openConv(c)}>
                <div className="flex-between">
                  <span className="conv-name">{c.partner_name}</span>
                  {+c.unread_count > 0 && <span className="notif-badge" style={{ position: 'static' }}>{c.unread_count}</span>}
                </div>
                <div className="conv-preview">{c.last_message}</div>
              </div>
            ))
          )}
        </div>
        <div className="message-thread">
          {!activeConv ? (
            <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <p>Select a conversation to start messaging.</p>
            </div>
          ) : (
            <>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{activeConv.partner_name}</div>
              <div className="messages-area">
                {messages.map(m => (
                  <div key={m.id} className={`message-bubble ${m.sender_id === user.id ? 'sent' : 'received'}`}>
                    {m.content}
                    <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 4 }}>{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</div>
                  </div>
                ))}
                <div ref={messagesEnd} />
              </div>
              <div className="message-input-area">
                <input className="form-control" value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..."
                  onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }} />
                <button className="btn btn-primary" onClick={sendMessage} disabled={sending}><Send size={16} /></button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Admin: Organizations ─────────────────────────────────────────────────────
export function AdminOrgsPage() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', adminEmails: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await api.get('/admin/organizations');
    setOrgs(res.data.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const emails = form.adminEmails.split(',').map(e => e.trim()).filter(Boolean);
      await api.post('/admin/organizations', { name: form.name, description: form.description, adminEmails: emails });
      toast.success('Organization created and invites sent!');
      setShowModal(false);
      setForm({ name: '', description: '', adminEmails: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleOrg = async (org) => {
    await api.patch(`/admin/organizations/${org.id}`);
    toast.success(`Organization ${org.is_active ? 'deactivated' : 'activated'}`);
    load();
  };

  const filtered = orgs.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Organizations</h1>
          <p className="page-subtitle">Onboard and manage organizations on VMS.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Onboard Organization</button>
      </div>

      <div className="search-bar" style={{ marginBottom: '20px' }}>
        <Search size={16} />
        <input placeholder="Search organizations..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div> : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Admins</th><th>Events</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(org => (
                  <tr key={org.id}>
                    <td style={{ fontWeight: 500 }}>{org.name}</td>
                    <td>{org.admin_count}</td>
                    <td>{org.event_count}</td>
                    <td><span className={`badge badge-${org.is_active ? 'active' : 'cancelled'}`}>{org.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>{new Date(org.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => toggleOrg(org)}>
                        {org.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        {org.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Onboard New Organization</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Organization Name *</label>
                  <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Admin Emails (comma-separated)</label>
                  <input className="form-control" value={form.adminEmails} onChange={e => setForm(f => ({ ...f, adminEmails: e.target.value }))} placeholder="admin@org.com, admin2@org.com" />
                  <span className="form-error" style={{ color: 'var(--text-muted)' }}>Invite emails will be sent to these addresses</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create & Send Invites'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Admin: All Volunteers ────────────────────────────────────────────────────
export function AdminVolunteersPage() {
  const navigate = useNavigate();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/volunteers', { params: { search, page, limit: 20 } });
      setVolunteers(res.data.data);
      setPagination(res.data.pagination);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  return (
    <>
      <h1 className="page-title">All Volunteers</h1>
      <p className="page-subtitle">System-wide view of all registered volunteers.</p>

      <div className="search-bar" style={{ marginBottom: '20px' }}>
        <Search size={16} />
        <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div> : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Organization</th><th>Skills</th><th>Applications</th><th>Joined</th></tr></thead>
              <tbody>
                {volunteers.map(v => (
                  <tr key={v.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/volunteers/${v.id}`)}>
                    <td style={{ fontWeight: 500 }}>{v.first_name} {v.last_name}</td>
                    <td>{v.email}</td>
                    <td>{v.organization_name || <span className="text-muted">—</span>}</td>
                    <td>
                      <div className="tags-wrap">
                        {(v.skills || []).slice(0, 3).map(s => <span key={s} className="tag">{s}</span>)}
                      </div>
                    </td>
                    <td>{v.application_count}</td>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>{new Date(v.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span className="text-muted">Showing {volunteers.length} of {pagination.total}</span>
            {pagination.page > 1 && <button className="btn btn-sm btn-secondary" onClick={() => load(pagination.page - 1)}>← Prev</button>}
            {volunteers.length === pagination.limit && <button className="btn btn-sm btn-secondary" onClick={() => load(pagination.page + 1)}>Next →</button>}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Admin: Audit Logs ────────────────────────────────────────────────────────
export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', from: '', to: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/audit-logs', { params: filters });
      setLogs(res.data.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters]);

  const actionColors = {
    org_onboard: 'accepted', org_deactivate: 'rejected', org_reactivate: 'accepted',
    invite_generated: 'pending', view_all_volunteers: 'closed', view_volunteer_profile: 'closed',
  };

  return (
    <>
      <h1 className="page-title">Audit Logs</h1>
      <p className="page-subtitle">Record of all privileged actions performed on the platform.</p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select className="form-control" style={{ width: '200px' }} value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}>
          <option value="">All Actions</option>
          <option value="org_onboard">Org Onboard</option>
          <option value="org_deactivate">Org Deactivate</option>
          <option value="invite_generated">Invite Generated</option>
          <option value="view_all_volunteers">View All Volunteers</option>
        </select>
        <input className="form-control" type="date" style={{ width: '160px' }} value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} placeholder="From" />
        <input className="form-control" type="date" style={{ width: '160px' }} value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} placeholder="To" />
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div> : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Resource</th><th>Details</th></tr></thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                    <td>{log.user_email}</td>
                    <td><span className={`badge badge-${actionColors[log.action] || 'pending'}`}>{log.action}</span></td>
                    <td>{log.resource_type}{log.resource_id ? ` (${log.resource_id.substring(0, 8)}…)` : ''}</td>
                    <td className="text-muted" style={{ fontSize: '0.75rem' }}>{JSON.stringify(log.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Volunteers page for Org Admin ────────────────────────────────────────────
export function VolunteersPage() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/volunteers', { params: { search } }).then(r => {
      setVolunteers(r.data.data); setLoading(false);
    }).catch(() => setLoading(false));
  }, [search]);

  return (
    <>
      <h1 className="page-title">Volunteers</h1>
      <p className="page-subtitle">Volunteers who have applied to your organization's events.</p>
      <div className="search-bar" style={{ marginBottom: '20px' }}>
        <Search size={16} />
        <input placeholder="Search volunteers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {loading ? <div className="loading"><div className="spinner" /></div> : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Skills</th></tr></thead>
              <tbody>
                {volunteers.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 500 }}>{v.first_name} {v.last_name}</td>
                    <td>{v.email}</td>
                    <td>{v.phone || '—'}</td>
                    <td><div className="tags-wrap">{(v.skills || []).slice(0, 3).map(s => <span key={s} className="tag">{s}</span>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
