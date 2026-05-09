import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Shield, Edit2, Save, X, Key, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    skills: user?.skills || '',
    password: '',
    confirmPassword: ''
  });

  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullName || '',
        phone: user.phone || '',
        bio: user.bio || '',
        skills: user.skills || '',
      }));
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);
    try {
      const res = await api.patch('/auth/profile', formData);
      await refreshUser(res.data);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {user?.needsPasswordReset && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-4 items-start animate-pulse">
          <Key className="text-amber-600 flex-shrink-0" size={24} />
          <div>
            <h4 className="text-amber-900 font-bold">Security Action Required</h4>
            <p className="text-amber-700 text-sm mt-0.5">Please update your password to continue using all features of VMS Pro.</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
          <p className="text-slate-500">Manage your persona and contact information.</p>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)} 
          className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
        >
          {isEditing ? <X size={18} /> : <Edit2 size={18} />}
          <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="card text-center !p-10">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary font-bold text-4xl mx-auto mb-6">
              {user?.email[0].toUpperCase()}
            </div>
            <h3 className="text-xl font-bold text-slate-900">{user?.fullName || user?.email.split('@')[0]}</h3>
            <p className="text-slate-500 text-sm mt-1 mb-6 capitalize">{user?.role.replace('_', ' ')}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {user?.role === 'volunteer' ? (
                user?.skills?.split(',').map(skill => (
                  <span key={skill} className="badge bg-indigo-50 text-indigo-700">{skill.trim()}</span>
                )) || <span className="text-slate-400 text-xs">No skills listed</span>
              ) : (
                <span className="badge bg-primary/10 text-primary border border-primary/20">Verified Account</span>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="card">
            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-6">
                {user?.role === 'volunteer' && (
                  <>
                    <div className="space-y-4">
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <User size={20} className="text-primary" />
                        Personal Information
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="label">Full Name</label>
                          <input 
                            className="input-field" 
                            value={formData.fullName}
                            onChange={e => setFormData({...formData, fullName: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="label">Phone Number</label>
                          <input 
                            className="input-field" 
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="label">Skills (comma separated)</label>
                        <input 
                          className="input-field" 
                          value={formData.skills}
                          onChange={e => setFormData({...formData, skills: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles size={20} className="text-primary" />
                        Biography
                      </h2>
                      <textarea 
                        className="input-field h-24 resize-none" 
                        value={formData.bio}
                        onChange={e => setFormData({...formData, bio: e.target.value})}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Key size={20} className="text-primary" />
                    Security & Password
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="label">New Password</label>
                      <input 
                        type="password"
                        className="input-field" 
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="label">Confirm Password</label>
                      <input 
                        type="password"
                        className="input-field" 
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <button type="submit" className="btn btn-primary px-8" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-900">Account Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {user?.role === 'volunteer' && (
                      <>
                        <div className="space-y-1.5">
                          <label className="label">Full Name</label>
                          <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            {user?.fullName || 'Not set'}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="label">Phone Number</label>
                          <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            {user?.phone || 'Not set'}
                          </p>
                        </div>
                      </>
                    )}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="label">Email Address</label>
                      <p className="text-sm font-medium text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                        {user?.email}
                        <Shield size={16} className="text-green-500" />
                      </p>
                    </div>
                  </div>
                </div>

                {user?.role === 'volunteer' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-900">Biography</h2>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                      "{user?.bio || 'No biography provided yet. Edit your profile to tell us about yourself.'}"
                    </p>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Shield size={18} />
                    <span>Member of VMS Pro</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono italic">
                    User ID: {user?.id.substring(0, 8)}...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
