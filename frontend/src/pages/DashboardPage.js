import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, FileText, CheckCircle, Clock, XCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { format } from 'date-fns';

// ─── Volunteer Dashboard ──────────────────────────────────────────────────────
function VolunteerDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/volunteer').then(r => setData(r.data.data));
  }, []);

  if (!data) return <div className="loading"><div className="spinner" /></div>;

  return (
    <>
      <p className="page-subtitle">Here's what's happening with your volunteering.</p>
      <div className="stat-grid">
        <div className="stat-card"><div className="label">Total Applications</div><div className="value">{data.stats.totalApplications}</div></div>
        <div className="stat-card"><div className="label">Accepted</div><div className="value" style={{ color: 'var(--success)' }}>{data.stats.acceptedCount}</div></div>
        <div className="stat-card"><div className="label">Pending Review</div><div className="value" style={{ color: 'var(--warning)' }}>{data.stats.pendingCount}</div></div>
        <div className="stat-card"><div className="label">Unread Messages</div><div className="value" style={{ color: 'var(--secondary)' }}>{data.stats.unreadMessages}</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <div className="card-header"><h3>My Applications</h3><button className="btn btn-sm btn-secondary" onClick={() => navigate('/applications')}>View All</button></div>
          {data.myApplications.length === 0 ? (
            <div className="empty-state"><FileText /><p>No applications yet. Browse events to get started!</p></div>
          ) : (
            data.myApplications.slice(0, 5).map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{a.event_name}</div>
                  <div className="text-muted">{a.org_name} · {a.event_date}</div>
                </div>
                <span className={`badge badge-${a.status}`}>{a.status}</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header"><h3>Upcoming Events</h3><button className="btn btn-sm btn-secondary" onClick={() => navigate('/events')}>Browse All</button></div>
          {data.upcomingEvents.length === 0 ? (
            <div className="empty-state"><Calendar /><p>No events available right now.</p></div>
          ) : (
            data.upcomingEvents.slice(0, 5).map(e => (
              <div key={e.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate(`/events/${e.id}`)}>
                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{e.name}</div>
                <div className="text-muted">{e.organization_name} · {e.event_date} · {e.accepted_count}/{e.max_volunteers} slots filled</div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ─── Org Admin Dashboard ──────────────────────────────────────────────────────
function AdminDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/admin').then(r => setData(r.data.data));
  }, []);

  if (!data) return <div className="loading"><div className="spinner" /></div>;

  return (
    <>
      <p className="page-subtitle">Manage your organization's volunteer program.</p>
      <div className="stat-grid">
        <div className="stat-card"><div className="label">Active Volunteers</div><div className="value">{data.stats.activeVolunteers}</div></div>
        <div className="stat-card"><div className="label">Total Events</div><div className="value">{data.stats.totalEvents}</div></div>
        <div className="stat-card"><div className="label">Pending Applications</div><div className="value" style={{ color: 'var(--warning)' }}>{data.stats.pendingApplications}</div></div>
        <div className="stat-card"><div className="label">Unread Messages</div><div className="value" style={{ color: 'var(--secondary)' }}>{data.stats.unreadMessages}</div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Upcoming Events</h3>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/events/new')}>+ Create Event</button>
        </div>
        {data.upcomingEvents.length === 0 ? (
          <div className="empty-state"><Calendar /><p>No upcoming events. Create one to get started!</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Event</th><th>Date</th><th>Pending</th><th>Accepted</th><th>Slots</th><th></th></tr></thead>
              <tbody>
                {data.upcomingEvents.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 500 }}>{e.name}</td>
                    <td>{e.event_date}</td>
                    <td><span className="badge badge-pending">{e.pending_apps}</span></td>
                    <td><span className="badge badge-accepted">{e.accepted_apps}</span></td>
                    <td>{e.max_volunteers}</td>
                    <td><button className="btn btn-sm btn-secondary" onClick={() => navigate(`/events/${e.id}`)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Super Admin Dashboard ────────────────────────────────────────────────────
function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setData(r.data.data));
  }, []);

  if (!data) return <div className="loading"><div className="spinner" /></div>;

  return (
    <>
      <p className="page-subtitle">System-wide overview of the VMS platform.</p>
      <div className="stat-grid">
        <div className="stat-card"><div className="label">Organizations</div><div className="value">{data.totalOrganizations}</div></div>
        <div className="stat-card"><div className="label">Volunteers</div><div className="value">{data.totalVolunteers}</div></div>
        <div className="stat-card"><div className="label">Events</div><div className="value">{data.totalEvents}</div></div>
        <div className="stat-card"><div className="label">Applications</div><div className="value">{data.totalApplications}</div></div>
      </div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => navigate('/admin/organizations')}>Manage Organizations</button>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/volunteers')}>View All Volunteers</button>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/audit-logs')}>Audit Logs</button>
      </div>
    </>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const titles = { volunteer: 'My Dashboard', org_admin: 'Organization Dashboard', super_admin: 'Super Admin Dashboard' };

  return (
    <>
      <h1 className="page-title">{titles[user?.role]}</h1>
      {user?.role === 'volunteer' && <VolunteerDashboard />}
      {user?.role === 'org_admin' && <AdminDashboard />}
      {user?.role === 'super_admin' && <SuperAdminDashboard />}
    </>
  );
}
