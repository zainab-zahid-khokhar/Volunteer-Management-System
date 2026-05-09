import React, { useState, useEffect } from 'react';
import { Plus, Building2, Mail, Shield, CheckCircle2, XCircle, AlertTriangle, Key, Copy, X } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function Organizations() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [lastCreated, setLastCreated] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchOrgs = async () => {
    try {
      const res = await api.get('/organizations');
      setOrgs(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/organizations', { name, admin_email: adminEmail });
      toast.success('Organization added successfully!');
      setLastCreated(res.data.data);
      setShowAdd(false);
      setName('');
      setAdminEmail('');
      fetchOrgs();
    } catch (err) {
      toast.error('Failed to add organization');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/organizations/${id}`);
      toast.success('Organization and its data deleted');
      setDeletingId(null);
      fetchOrgs();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Organizations</h1>
          <p className="text-slate-500">Manage verified organizations and their administrators.</p>
        </div>
        {!showAdd && (
          <button 
            onClick={() => setShowAdd(true)}
            className="btn btn-primary"
          >
            <Plus size={20} />
            <span>Add Organization</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {lastCreated && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
          >
            <button onClick={() => setLastCreated(null)} className="absolute right-4 top-4 p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <X size={18} />
            </button>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-200 uppercase tracking-widest text-[10px] font-bold">
                  <Key size={12} />
                  Login Password Created
                </div>
                <h3 className="text-lg font-bold">Admin Credentials</h3>
                <p className="text-indigo-100/80 text-xs max-w-md leading-relaxed">
                  Provide this temporary password to <strong>{lastCreated.admin_email}</strong>. It will be required to change on first login.
                </p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm flex items-center gap-4">
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-indigo-200 uppercase mb-1">Temporary Password</p>
                  <code className="text-xl font-mono font-bold tracking-wider text-white">{lastCreated.temporaryPassword}</code>
                </div>
                <button 
                  onClick={() => copyToClipboard(lastCreated.temporaryPassword)}
                  className="bg-white/10 p-2.5 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center"
                  title="Copy password"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card bg-slate-900 text-white border-none p-8"
          >
            <h3 className="text-xl font-bold mb-6">Onboard New Organization</h3>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Organization Name</label>
                <input 
                  className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 ring-primary text-white"
                  placeholder="e.g. Green Earth Foundation"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Admin Email</label>
                <input 
                  type="email"
                  className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 ring-primary text-white"
                  placeholder="admin@org.com"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="btn btn-secondary !bg-transparent !text-white border-white/20">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Organization</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="h-64 bg-white rounded-xl animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orgs.map((org) => (
            <div key={org.id} className="card flex items-center justify-between group hover:border-primary transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  <Building2 size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">{org.name}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                      <Mail size={14} className="text-slate-400" /> 
                      {org.admin_email}
                    </span>
                    <span className="hidden sm:flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      <Shield size={12} /> 
                      Admin
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden md:block">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                  <p className="text-xs font-bold text-green-600 flex items-center justify-end gap-1 mt-1 font-mono italic">
                    <CheckCircle2 size={12} />
                    Verified
                  </p>
                </div>
                <button 
                  onClick={() => setDeletingId(org.id)}
                  className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <XCircle size={22} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm"
              onClick={() => setDeletingId(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl z-[70] p-8 shadow-2xl"
            >
              <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center text-red-600 mb-6 mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 text-center mb-2">Are you sure?</h3>
              <p className="text-slate-500 text-center mb-8 leading-relaxed">
                This action is <span className="font-bold text-red-600">not reversible</span>. Deleting this organization will remove all its members, events, and data permanently.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeletingId(null)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(deletingId)}
                  className="btn bg-red-600 text-white hover:bg-red-700 flex-1 h-12"
                >
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
