import React, { useState, useEffect } from 'react';
import { Search, Filter, Mail, Calendar, UserCheck, UserX, Sparkles, User, ArrowRight, X, ExternalLink } from 'lucide-react';
import api from '../api/client';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export default function Volunteers() {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  const [volunteerDetail, setVolunteerDetail] = useState<any>(null);

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/volunteers');
      setVolunteers(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load volunteers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteerDetail = async (id: string) => {
    try {
      const res = await api.get(`/volunteers/${id}`);
      setVolunteerDetail(res.data.data);
    } catch (err) {
      toast.error('Failed to load volunteer details');
    }
  };

  const filteredVolunteers = volunteers.filter(v => 
    v.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Volunteer Network</h1>
        <p className="text-slate-500">Directory of all registered volunteers and their engagement history.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search volunteers by email..." 
            className="input-field pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVolunteers.map((vol, i) => (
            <motion.div
              key={vol.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card group hover:border-primary transition-all cursor-pointer flex flex-col"
              onClick={() => {
                setSelectedVolunteer(vol);
                fetchVolunteerDetail(vol.id);
              }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold border border-indigo-100 shadow-sm transition-transform group-hover:scale-105">
                  {vol.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
                    {vol.full_name || vol.email.split('@')[0]}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">{vol.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Applications</p>
                  <p className="text-lg font-bold text-slate-900 leading-none">{vol.application_count}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Accepted</p>
                  <p className="text-lg font-bold text-green-600 leading-none">{vol.accepted_count}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-xs font-bold text-primary uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                <span>View Full Profile</span>
                <ArrowRight size={14} />
              </div>
            </motion.div>
          ))}
          {filteredVolunteers.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-2">
              <p className="text-slate-400 font-medium">No volunteers found matching your search.</p>
              <button onClick={() => setSearch('')} className="text-primary font-bold text-sm hover:underline">Clear search</button>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
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
                    <p className="font-bold text-slate-900">{new Date(selectedVolunteer.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="card !bg-slate-50 !border-none text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Participation</p>
                    <p className="font-bold text-slate-900">{selectedVolunteer.application_count} Events</p>
                  </div>
                  <div className="card !bg-slate-50 !border-none text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Success Rate</p>
                    <p className="font-bold text-green-600">
                      {selectedVolunteer.application_count > 0 
                        ? Math.round((selectedVolunteer.accepted_count / selectedVolunteer.application_count) * 100) 
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
                      {volunteerDetail.history.length === 0 && (
                        <p className="text-center py-8 text-slate-400 text-sm">No historical data available.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
