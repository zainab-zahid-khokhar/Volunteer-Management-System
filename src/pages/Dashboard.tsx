import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Users, ClipboardCheck, ArrowUpRight, Plus, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../api/client';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const endpoint = user?.role === 'volunteer' ? '/dashboard/volunteer' : '/dashboard/admin';
        const res = await api.get(endpoint);
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-32 bg-white rounded-xl" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="h-40 bg-white rounded-xl" />
      <div className="h-40 bg-white rounded-xl" />
      <div className="h-40 bg-white rounded-xl" />
    </div>
  </div>;

  const dashboardStats = user?.role === 'volunteer' ? [
    { label: 'Applications', value: stats?.stats?.totalApplications || 0, icon: ClipboardCheck, color: 'bg-blue-500' },
    { label: 'Accepted', value: stats?.stats?.acceptedCount || 0, icon: ClipboardCheck, color: 'bg-green-500' },
    { label: 'Upcoming Events', value: stats?.stats?.upcomingEventsCount || 0, icon: Calendar, color: 'bg-indigo-500' },
  ] : [
    { label: 'Active Volunteers', value: stats?.stats?.activeVolunteers || 0, icon: Users, color: 'bg-indigo-500' },
    { label: 'Total Events', value: stats?.stats?.totalEvents || 0, icon: Calendar, color: 'bg-blue-500' },
    { label: 'Pending Apps', value: stats?.stats?.pendingApplications || 0, icon: ClipboardCheck, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user?.email.split('@')[0]}</h1>
        <p className="text-slate-500">Here's an overview of your activity today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dashboardStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card group hover:border-primary transition-colors cursor-default"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg ${stat.color} text-white`}>
                <stat.icon size={24} />
              </div>
            </div>
            <h3 className="text-slate-500 font-medium text-sm">{stat.label}</h3>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {user?.role === 'volunteer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Recommended Events</h2>
              <Link to="/events" className="text-sm font-semibold text-primary hover:underline">View all</Link>
            </div>
            <div className="space-y-4">
              {(stats?.upcomingEvents || []).slice(0, 3).map((event: any) => (
                <div key={event.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-all group">
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-slate-100 flex flex-col items-center justify-center border border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase">{new Date(event.event_date).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-xl font-bold text-slate-900">{new Date(event.event_date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{event.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><MapPin size={14} /> {event.location}</span>
                      <span className="flex items-center gap-1"><Users size={14} /> {event.accepted_count}/{event.max_volunteers}</span>
                    </div>
                  </div>
                  <Link to={`/events/${event.id}`} className="self-center p-2 rounded-full hover:bg-primary hover:text-white text-slate-400 transition-all">
                    <ArrowUpRight size={20} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
  
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
              <button className="text-sm font-semibold text-slate-400">Mark all as read</button>
            </div>
            <div className="space-y-6">
              {(stats?.recentNotifications || []).length > 0 ? (
                stats.recentNotifications.map((notif: any) => (
                  <div key={notif.id} className="flex gap-4">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{notif.body}</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{new Date(notif.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-400">No recent activity found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {user?.role !== 'volunteer' && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">Managed Events</h2>
            <Link to="/events" className="text-sm font-semibold text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-4">
             {(stats?.upcomingEvents || []).map((event: any) => (
                <div key={event.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 items-center hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{event.name}</h4>
                    <p className="text-sm text-slate-500">{new Date(event.event_date).toLocaleDateString()}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase">Approved: {event.accepted_count}</span>
                       <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">Pending: {event.pending_count}</span>
                    </div>
                  </div>
                  <Link to={`/events/${event.id}`} className="btn btn-secondary btn-sm flex-shrink-0">Manage</Link>
                </div>
             ))}
             {(!stats?.upcomingEvents || stats?.upcomingEvents.length === 0) && (
               <div className="py-8 text-center text-slate-400">No events found.</div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
