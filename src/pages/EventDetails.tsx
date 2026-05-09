import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Send, Sparkles, User, X, Mail, ExternalLink, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { summarizeApplication } from '../services/aiService';
import toast from 'react-hot-toast';

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [appText, setAppText] = useState('');
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  const [volunteerDetail, setVolunteerDetail] = useState<any>(null);
  const [viewingApp, setViewingApp] = useState<any>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const [eventRes, appsRes] = await Promise.all([
          api.get(`/events/${id}`),
          user?.role !== 'volunteer' ? api.get(`/applications`, { params: { event_id: id } }) : Promise.resolve({ data: { data: [] } })
        ]);
        setEvent(eventRes.data.data);
        setApplications(appsRes.data.data);
      } catch (err) {
        console.error('Failed to fetch event:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, user]);

  const fetchVolunteerDetail = async (volunteerId: string) => {
    try {
      const res = await api.get(`/volunteers/${volunteerId}`);
      setVolunteerDetail(res.data.data);
    } catch (err) {
      toast.error('Failed to load volunteer details');
    }
  };

  const handleOpenProfile = async (volunteerId: string, email: string) => {
    setSelectedVolunteer({ id: volunteerId, email });
    fetchVolunteerDetail(volunteerId);
  };

  const handleStatusUpdate = async (appId: string, status: string) => {
    try {
      await api.patch(`/applications/${appId}`, { status });
      toast.success(`Application ${status}`);
      // Refresh
      const res = await api.get('/applications', { params: { event_id: id } });
      setApplications(res.data.data);
      // Refresh event count
      const evRes = await api.get(`/events/${id}`);
      setEvent(evRes.data.data);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplying(true);
    try {
      // AI Summarization on frontend (Gemini Skill requirement)
      const aiSummary = await summarizeApplication(appText);
      await api.post('/applications', { eventId: id, applicationText: appText, aiSummary });
      toast.success('Application submitted successfully!');
      setAppText('');
      // Refresh
      const res = await api.get(`/events/${id}`);
      setEvent(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit');
    } finally {
      setApplying(false);
    }
  };

  const generateSummary = async (appId: string, text: string) => {
    setSummaries(prev => ({ ...prev, [appId]: 'Generating...' }));
    const summary = await summarizeApplication(text);
    setSummaries(prev => ({ ...prev, [appId]: summary }));
  };

  if (loading) return <div className="space-y-8 animate-pulse">
    <div className="h-10 w-32 bg-slate-200 rounded-lg" />
    <div className="h-64 bg-white rounded-xl" />
  </div>;

  const isVolunteer = user?.role === 'volunteer';
  const isAdmin = !isVolunteer;

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const approvedVolunteers = applications.filter(app => app.status === 'accepted');

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <button onClick={() => navigate(-1)} className="btn btn-secondary !border-none !shadow-none hover:bg-slate-100 mb-2">
        <ArrowLeft size={18} />
        <span>Back to Events</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="card !p-8">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-4xl font-bold text-slate-900 leading-tight">{event.name}</h1>
              <div className="flex flex-col items-end gap-2">
                <span className={`badge px-4 py-1.5 text-sm ${event.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {event.status}
                </span>
                {isVolunteer && event.user_application && (
                  <span className={`badge px-4 py-1.5 text-sm capitalize ${
                    event.user_application.status === 'accepted' ? 'bg-indigo-600 text-white shadow-sm' : 
                    event.user_application.status === 'rejected' ? 'bg-red-50 text-red-700' : 
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {event.user_application.status === 'pending' ? 'Applied' : event.user_application.status}
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-slate-100 mb-8">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                <p className="text-sm font-semibold text-slate-900">{new Date(event.event_date).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</p>
                <p className="text-sm font-semibold text-slate-900">{event.start_time} - {event.end_time}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</p>
                <p className="text-sm font-semibold text-slate-900 truncate">{event.location}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Slots</p>
                <p className="text-sm font-semibold text-slate-900">{event.accepted_count} / {event.max_volunteers}</p>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Description</h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>

          {isAdmin && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  Pending Applications
                  <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{pendingApplications.length}</span>
                </h2>
                {pendingApplications.length === 0 ? (
                  <div className="card py-8 text-center bg-slate-50/50">
                    <p className="text-slate-400 text-sm">No pending applications.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApplications.map((app) => (
                      <div key={app.id} className="card">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                {app.volunteer_email[0].toUpperCase()}
                             </div>
                             <div>
                              <h4 className="font-bold text-slate-900 truncate">{app.volunteer_email}</h4>
                              <p className="text-xs text-slate-500 uppercase tracking-wider font-mono mt-0.5">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                             </div>
                          </div>
                          <button 
                            onClick={() => handleOpenProfile(app.volunteer_id, app.volunteer_email)}
                            className="btn btn-secondary btn-sm gap-2"
                          >
                            <User size={14} />
                            View Profile
                          </button>
                        </div>
                        
                        <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 truncate">
                          "{app.application_text}"
                        </p>

                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                             <button 
                              onClick={() => generateSummary(app.id, app.application_text)}
                              className="text-xs font-bold text-primary flex items-center gap-1.5 hover:underline"
                             >
                              <Sparkles size={14} />
                              Generate AI Summary
                             </button>
                          </div>
                          {summaries[app.id] && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-900"
                            >
                              <p className="leading-relaxed">{summaries[app.id]}</p>
                            </motion.div>
                          )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-3">
                          <button 
                            onClick={() => handleStatusUpdate(app.id, 'accepted')}
                            className="btn btn-primary btn-sm flex-1"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(app.id, 'rejected')}
                            className="btn btn-secondary btn-sm flex-1"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  Approved Volunteers
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{approvedVolunteers.length}</span>
                </h2>
                {approvedVolunteers.length === 0 ? (
                  <div className="card py-8 text-center bg-slate-50/50">
                    <p className="text-slate-400 text-sm">No approved volunteers yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {approvedVolunteers.map((app) => (
                      <div key={app.id} className="card group hover:border-primary transition-all">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold">
                            {app.volunteer_email[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 truncate">{app.volunteer_email}</h4>
                            <p className="text-[10px] font-bold text-green-600 uppercase">Status: Approved</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => setViewingApp(app)}
                             className="btn btn-secondary btn-sm flex-1"
                           >
                              App Details
                           </button>
                           <button 
                             onClick={() => handleOpenProfile(app.volunteer_id, app.volunteer_email)}
                             className="btn btn-primary btn-sm flex-1"
                           >
                              Profile
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Organizer</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                {event.organization_name[0]}
              </div>
              <div>
                <p className="font-bold text-slate-900">{event.organization_name}</p>
                <p className="text-xs text-slate-500">Verified Organization</p>
              </div>
            </div>
          </div>

          {isVolunteer && (
            <div className="card bg-slate-900 text-white border-none shadow-xl shadow-slate-200">
              <h3 className="text-lg font-bold mb-4">Interest Form</h3>
              {event.user_application ? (
                <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                  <p className="text-sm font-medium mb-1">Application Status</p>
                  <p className="text-xl font-bold capitalize text-primary-light">
                    {event.user_application.status === 'pending' ? 'Applied' : event.user_application.status}
                  </p>
                  <p className="text-xs text-slate-400 mt-2 italic truncate">"{event.user_application.application_text}"</p>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Why join us?</label>
                    <textarea 
                      className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 ring-primary text-white h-32 resize-none"
                      placeholder="Briefly explain your motivation and relevant skills..."
                      value={appText}
                      onChange={(e) => setAppText(e.target.value)}
                      required
                    />
                  </div>
                  <button 
                    disabled={applying}
                    className="btn btn-primary w-full h-12 gap-2 shadow-lg shadow-primary/20"
                  >
                    {applying ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>
                      <Send size={18} />
                      <span>Submit Application</span>
                    </>}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Volunteer Profile Modal */}
      <AnimatePresence>
        {selectedVolunteer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm"
              onClick={() => setSelectedVolunteer(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-3xl z-[70] shadow-2xl overflow-hidden"
            >
              <div className="relative p-8">
                <button 
                  onClick={() => setSelectedVolunteer(null)}
                  className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X size={24} />
                </button>

                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold shadow-inner">
                    {selectedVolunteer.email[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">{selectedVolunteer.full_name || selectedVolunteer.email.split('@')[0]}</h2>
                    <div className="flex items-center gap-2 text-slate-500 mt-1">
                      <Mail size={16} />
                      <span>{selectedVolunteer.email}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="card !bg-slate-50 !border-none text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Joined On</p>
                    <p className="font-bold text-slate-900">{volunteerDetail ? new Date(volunteerDetail.created_at).toLocaleDateString() : '...'}</p>
                  </div>
                  <div className="card !bg-slate-50 !border-none text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Participation</p>
                    <p className="font-bold text-slate-900">{volunteerDetail ? volunteerDetail.history.length : '...'} Events</p>
                  </div>
                  <div className="card !bg-slate-50 !border-none text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Success Rate</p>
                    <p className="font-bold text-green-600">
                      {volunteerDetail && volunteerDetail.history.length > 0 
                        ? Math.round((volunteerDetail.history.filter((h: any) => h.status === 'accepted').length / volunteerDetail.history.length) * 100) 
                        : 0}%
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {volunteerDetail?.skills && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {volunteerDetail.skills.split(',').map((skill: string) => (
                          <span key={skill} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {volunteerDetail?.bio && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bio</p>
                      <p className="text-sm text-slate-600 italic">"{volunteerDetail.bio}"</p>
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 pt-4">
                    <Calendar size={20} className="text-primary" />
                    Application History
                  </h3>

                  {!volunteerDetail ? (
                    <div className="space-y-3">
                      {[1,2].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}
                    </div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                      {volunteerDetail.history.map((h: any) => (
                        <div key={h.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-primary/20 transition-colors group">
                          <div>
                            <p className="font-bold text-slate-900">{h.event_name}</p>
                            <p className="text-xs text-slate-500">{h.organization_name} • {new Date(h.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`badge capitalize ${
                            h.status === 'accepted' ? 'bg-green-50 text-green-700' : 
                            h.status === 'rejected' ? 'bg-red-50 text-red-700' : 
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {h.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Application Details Modal */}
        {viewingApp && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm"
              onClick={() => setViewingApp(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl z-[70] shadow-2xl overflow-hidden"
            >
               <div className="p-8">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Application Details</h2>
                    <button onClick={() => setViewingApp(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                 </div>
                 <div className="space-y-6">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Volunteer</p>
                      <p className="font-bold text-slate-900">{viewingApp.volunteer_email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Motivation</p>
                      <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl italic">"{viewingApp.application_text}"</p>
                    </div>
                    {viewingApp.ai_summary && (
                      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                           <Sparkles size={14}/> AI Insight
                        </p>
                        <p className="text-sm text-indigo-900 leading-relaxed">{viewingApp.ai_summary}</p>
                      </div>
                    )}
                 </div>
                 <button onClick={() => setViewingApp(null)} className="btn btn-primary w-full mt-8">Close</button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
