import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Calendar, MapPin, Users, Plus, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export default function Events() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', location: '', event_date: '', start_time: '', end_time: '', max_volunteers: 10 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [orgs, setOrgs] = useState<any[]>([]);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events', { params: { search, status: selectedStatus } });
      setEvents(res.data.data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgs = async () => {
    if (user?.role === 'super_admin') {
      try {
        const res = await api.get('/organizations');
        setOrgs(res.data.data);
      } catch (err) {
        console.error('Failed to fetch organizations');
      }
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchOrgs();
  }, [search, selectedStatus]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/events', form);
      toast.success('Event created successfully!');
      setShowAdd(false);
      fetchEvents();
    } catch (err) {
      toast.error('Failed to create event');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Volunteer Opportunities</h1>
          <p className="text-slate-500">Discover and join events that match your skills.</p>
        </div>
        {user?.role !== 'volunteer' && (
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="btn btn-primary"
          >
            {showAdd ? <X size={20} /> : <Plus size={20} />}
            <span>{showAdd ? 'Close' : 'Create Event'}</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card bg-slate-900 text-white border-none overflow-hidden"
          >
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user?.role === 'super_admin' && (
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assign Organization</label>
                    <select 
                      className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 ring-primary text-white"
                      value={(form as any).organization_id || ''}
                      onChange={e => setForm({...form, organization_id: e.target.value} as any)}
                      required
                    >
                      <option value="">Select Organization</option>
                      {orgs.map((org: any) => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Event Name</label>
                  <input 
                    className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 ring-primary text-white"
                    placeholder="Annual Beach Cleanup"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Location</label>
                  <input 
                    className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 ring-primary text-white"
                    placeholder="Clifton Beach, Karachi"
                    value={form.location}
                    onChange={e => setForm({...form, location: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</label>
                  <input 
                    type="date"
                    className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 ring-primary text-white"
                    value={form.event_date}
                    onChange={e => setForm({...form, event_date: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Start Time</label>
                    <input 
                      type="time"
                      className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 ring-primary text-white"
                      value={form.start_time}
                      onChange={e => setForm({...form, start_time: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">End Time</label>
                    <input 
                      type="time"
                      className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 ring-primary text-white"
                      value={form.end_time}
                      onChange={e => setForm({...form, end_time: e.target.value})}
                    />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</label>
                  <textarea 
                    className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 ring-primary text-white h-24 resize-none"
                    placeholder="Describe the event and what volunteers will be doing..."
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" className="btn btn-primary px-8">Publish Event</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, location, or organization..." 
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select 
            className="input-field pl-10 appearance-none bg-white"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Events</option>
            <option value="closed">Closed Events</option>
            {user?.role === 'volunteer' && (
              <>
                <option value="pending">Applied (Pending)</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="not_applied">Not Applied</option>
              </>
            )}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: any, i: number) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card group hover:border-primary transition-all cursor-pointer flex flex-col"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  {user?.role === 'volunteer' && event.user_app_status ? (
                    <span className={`badge capitalize ${
                      event.user_app_status === 'accepted' ? 'bg-indigo-600 text-white shadow-sm' : 
                      event.user_app_status === 'rejected' ? 'bg-red-50 text-red-700' : 
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {event.user_app_status === 'pending' ? 'Applied' : event.user_app_status}
                    </span>
                  ) : (
                    <span className={`badge ${event.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {event.status}
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-slate-400">#{event.organization_name}</span>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors">{event.name}</h3>
              
              <div className="space-y-2 mb-6 flex-1">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar size={16} className="text-slate-400" />
                  <span>{new Date(event.event_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={16} className="text-slate-400" />
                  <span className="truncate">{event.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users size={16} className="text-slate-400" />
                  <span>{event.accepted_count} / {event.max_volunteers} volunteers</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {user?.role !== 'volunteer' ? (
                    <div className="flex gap-2">
                       <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase tracking-tighter">Approved: {event.accepted_count}</span>
                       <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-tighter">Pending: {event.pending_count}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Applied {event.application_count || 0} times</p>
                  )}
                </div>
                <div className="text-primary font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  <span>Details</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
