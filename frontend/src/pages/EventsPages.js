import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Edit2, Trash2, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';

// ─── Events List ──────────────────────────────────────────────────────────────
export function EventsListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await api.get('/events', { params });
      setEvents(res.data.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, status]);

  return (
    <>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">{user?.role === 'volunteer' ? 'Browse Events' : 'Manage Events'}</h1>
          <p className="page-subtitle">Discover volunteer opportunities</p>
        </div>
        {user?.role !== 'volunteer' && (
          <button className="btn btn-primary" onClick={() => navigate('/events/new')}>+ Create Event</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <Search size={16} />
          <input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {user?.role !== 'volunteer' && (
          <select className="form-control" style={{ width: '160px' }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        )}
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div> : (
        events.length === 0 ? (
          <div className="empty-state card"><Calendar size={48} /><p>No events found.</p></div>
        ) : (
          <div className="event-grid">
            {events.map(event => (
              <div key={event.id} className="event-card" onClick={() => navigate(`/events/${event.id}`)}>
                <div className="flex-between" style={{ marginBottom: '8px' }}>
                  <span className="event-name">{event.name}</span>
                  <span className={`badge badge-${event.status}`}>{event.status}</span>
                </div>
                <div className="event-meta"><Calendar size={12} /> {event.event_date}</div>
                <div className="event-meta"><Clock size={12} /> {event.start_time} – {event.end_time}</div>
                {event.location && <div className="event-meta"><MapPin size={12} /> {event.location}</div>}
                {event.description && <p className="event-desc">{event.description}</p>}
                <div className="event-footer">
                  <span className="text-muted"><Users size={12} style={{ display: 'inline', marginRight: 4 }} />{event.accepted_count}/{event.max_volunteers} filled</span>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>{event.organization_name}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </>
  );
}

// ─── Event Detail ─────────────────────────────────────────────────────────────
export function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [applyText, setApplyText] = useState('');
  const [applying, setApplying] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data.data);
      if (user?.role !== 'volunteer') {
        const appRes = await api.get(`/events/${id}/applications`);
        setApplications(appRes.data.data);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { loadEvent(); }, [id]);

  const handleApply = async () => {
    if (!applyText.trim()) return toast.error('Please write your application');
    setApplying(true);
    try {
      await api.post('/applications', { eventId: id, applicationText: applyText });
      toast.success('Application submitted!');
      setShowApplyForm(false);
      loadEvent();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit');
    } finally {
      setApplying(false);
    }
  };

  const handleDecision = async (appId, status) => {
    try {
      await api.patch(`/applications/${appId}/status`, { status });
      toast.success(`Application ${status}`);
      loadEvent();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Cancel this event? All applications will be closed.')) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success('Event cancelled');
      navigate('/events');
    } catch (_) { toast.error('Failed to cancel'); }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!event) return <div>Event not found.</div>;

  const isAdmin = user?.role !== 'volunteer';
  const alreadyApplied = event.user_application;

  return (
    <>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/events')}>← Back</button>
        {isAdmin && (
          <div className="flex-gap">
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/events/${id}/edit`)}><Edit2 size={14} /> Edit</button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}><Trash2 size={14} /> Cancel Event</button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{event.name}</h1>
              <span className={`badge badge-${event.status}`}>{event.status}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <div className="flex-gap text-muted"><Calendar size={16} /> {event.event_date}</div>
              <div className="flex-gap text-muted"><Clock size={16} /> {event.start_time} – {event.end_time}</div>
              {event.location && <div className="flex-gap text-muted"><MapPin size={16} /> {event.location}</div>}
              <div className="flex-gap text-muted"><Users size={16} /> {event.accepted_count}/{event.max_volunteers} volunteer slots filled</div>
            </div>
            {event.description && <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{event.description}</p>}
          </div>

          {/* Applications (admin view) */}
          {isAdmin && (
            <div className="card">
              <div className="card-header"><h3>Applications ({applications.length})</h3></div>
              {applications.length === 0 ? (
                <div className="empty-state"><p>No applications yet.</p></div>
              ) : (
                applications.map(app => (
                  <div key={app.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                    <div className="flex-between" style={{ marginBottom: '8px' }}>
                      <div>
                        <strong>{app.first_name} {app.last_name}</strong>
                        <span className="text-muted" style={{ marginLeft: 8 }}>{app.volunteer_email}</span>
                        {app.skills?.length > 0 && (
                          <div className="tags-wrap" style={{ marginTop: 6 }}>
                            {app.skills.map(s => <span key={s} className="tag">{s}</span>)}
                          </div>
                        )}
                      </div>
                      <span className={`badge badge-${app.status}`}>{app.status}</span>
                    </div>

                    {app.ai_summary && (
                      <div className="ai-summary">
                        <div className="ai-label">🤖 AI Summary</div>
                        <p>{app.ai_summary}</p>
                      </div>
                    )}

                    <details style={{ marginTop: '8px' }}>
                      <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }}>View full application</summary>
                      <p style={{ marginTop: '8px', fontSize: '0.875rem', background: 'var(--bg)', padding: '10px', borderRadius: 'var(--radius)' }}>{app.application_text}</p>
                    </details>

                    {app.status === 'pending' && (
                      <div className="flex-gap" style={{ marginTop: '12px' }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleDecision(app.id, 'accepted')}>✓ Accept</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDecision(app.id, 'rejected')}>✗ Reject</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Apply (volunteer view) */}
          {user?.role === 'volunteer' && event.status === 'active' && (
            <div className="card">
              {alreadyApplied ? (
                <div className="alert alert-info">
                  You have already applied. Status: <strong>{alreadyApplied.status}</strong>
                </div>
              ) : showApplyForm ? (
                <>
                  <h3 style={{ marginBottom: '12px' }}>Submit Application</h3>
                  <div className="form-group">
                    <label>Why do you want to volunteer for this event?</label>
                    <textarea className="form-control" rows={5} value={applyText} onChange={e => setApplyText(e.target.value)} placeholder="Tell us about yourself, your skills, and why you'd be a great volunteer..." />
                  </div>
                  <div className="flex-gap">
                    <button className="btn btn-primary" onClick={handleApply} disabled={applying}>{applying ? 'Submitting...' : 'Submit Application'}</button>
                    <button className="btn btn-secondary" onClick={() => setShowApplyForm(false)}>Cancel</button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p className="text-muted" style={{ marginBottom: '16px' }}>Interested in volunteering?</p>
                  <button className="btn btn-primary" onClick={() => setShowApplyForm(true)}>Apply Now</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="card">
            <h3 style={{ marginBottom: '12px' }}>Organizer</h3>
            <p style={{ fontWeight: 500 }}>{event.organization_name}</p>
            {event.created_by_email && <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: 4 }}>Posted by {event.created_by_email}</p>}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Event Form (Create / Edit) ───────────────────────────────────────────────
export function EventFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState({ name: '', description: '', location: '', eventDate: '', startTime: '', endTime: '', maxVolunteers: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      api.get(`/events/${id}`).then(r => {
        const e = r.data.data;
        setForm({ name: e.name, description: e.description || '', location: e.location || '', eventDate: e.event_date, startTime: e.start_time, endTime: e.end_time, maxVolunteers: e.max_volunteers });
      });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/events/${id}`, form);
        toast.success('Event updated');
      } else {
        await api.post('/events', form);
        toast.success('Event created');
      }
      navigate('/events');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/events')} style={{ marginBottom: '20px' }}>← Back</button>
      <div className="card" style={{ maxWidth: 600 }}>
        <h2 style={{ marginBottom: '20px' }}>{isEdit ? 'Edit Event' : 'Create New Event'}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Event Name *</label>
            <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input className="form-control" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input className="form-control" type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Max Volunteers *</label>
              <input className="form-control" type="number" min={1} value={form.maxVolunteers} onChange={e => setForm(f => ({ ...f, maxVolunteers: +e.target.value }))} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Time *</label>
              <input className="form-control" type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>End Time *</label>
              <input className="form-control" type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
            </div>
          </div>
          <div className="flex-gap">
            <button className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/events')}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
}