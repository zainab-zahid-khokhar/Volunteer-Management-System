import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import api from '../../api/client';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
      setUnread(res.data.unreadCount);
    } catch (_) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await api.patch('/notifications/all/read');
    fetchNotifications();
  };

  return (
    <div className="notif-bell-wrap" ref={panelRef}>
      <button className="btn-icon" onClick={() => setOpen(o => !o)}>
        <Bell size={20} />
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.875rem' }}>Notifications</strong>
            {unread > 0 && <button className="btn btn-sm btn-secondary" onClick={markAllRead}>Mark all read</button>}
          </div>
          {notifications.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>No notifications</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
                <div className="notif-title">{n.title}</div>
                {n.body && <div className="notif-body">{n.body}</div>}
                <div className="notif-time">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
