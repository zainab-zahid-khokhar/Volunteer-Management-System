import React, { useState, useEffect } from 'react';
import { ClipboardCheck, MapPin, Calendar, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function Applications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await api.get('/applications');
        setApplications(res.data.data);
      } catch (err) {
        console.error('Failed to fetch applications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 w-full bg-white rounded-xl" />
      <div className="h-32 w-full bg-white rounded-xl" />
      <div className="h-32 w-full bg-white rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Applications</h1>
        <p className="text-slate-500">Track the status of your volunteer requests.</p>
      </div>

      {applications.length === 0 ? (
        <div className="card text-center py-20 animate-fade-in">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
            <ClipboardCheck size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No applications yet</h3>
          <p className="text-sm text-slate-500 mt-1">Start your journey by browsing available events.</p>
          <Link to="/events" className="btn btn-primary mt-6 inline-flex">
            <span>Find Events</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {applications.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card group hover:border-primary/50 transition-all flex flex-col md:flex-row md:items-center gap-6"
            >
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">{app.event_name}</h3>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(app.event_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin size={14} className="text-slate-400" />
                        {app.location}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`badge px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      app.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {app.status === 'accepted' ? 'Approved' : app.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                    {app.status === 'accepted' && (
                       <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                          ACTIVE
                       </span>
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">My Motivation</p>
                  <p className="text-sm text-slate-600 italic leading-relaxed">"{app.application_text}"</p>
                  {app.ai_summary && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-1">
                        <ClipboardCheck size={10} /> AI Summary
                      </p>
                      <p className="text-[11px] text-slate-500">{app.ai_summary}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex md:flex-col gap-2">
                <Link to={`/events/${app.event_id}`} className="btn btn-secondary btn-sm flex-1 md:flex-none">
                  Event Details
                </Link>
                {app.status === 'accepted' && (
                  <button className="btn btn-primary btn-sm flex-1 md:flex-none">
                    Check In
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
