import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Users, FileText, MessageSquare,
  Bell, Settings, LogOut, Building2, ClipboardList, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';

const navByRole = {
  volunteer: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Browse Events', icon: Calendar, path: '/events' },
    { label: 'My Applications', icon: FileText, path: '/applications' },
    { label: 'Messages', icon: MessageSquare, path: '/messages' },
    { label: 'My Profile', icon: Settings, path: '/profile' },
  ],
  org_admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Events', icon: Calendar, path: '/events' },
    { label: 'Volunteers', icon: Users, path: '/volunteers' },
    { label: 'Messages', icon: MessageSquare, path: '/messages' },
  ],
  super_admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Organizations', icon: Building2, path: '/admin/organizations' },
    { label: 'All Volunteers', icon: Users, path: '/admin/volunteers' },
    { label: 'Audit Logs', icon: ClipboardList, path: '/admin/audit-logs' },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = navByRole[user?.role] || [];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>🤝 VMS</h1>
          <p>Volunteer Management</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong>{user?.email}</strong><br />
            <span className={`badge badge-${user?.role}`}>{user?.role?.replace('_', ' ')}</span>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={logout}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="page-header">
          <h2>{navItems.find(n => location.pathname.startsWith(n.path))?.label || 'VMS'}</h2>
          <div className="flex-gap">
            <NotificationBell />
          </div>
        </header>
        <div className="page-body">{children}</div>
      </main>
    </div>
  );
}
