import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Phone, BookOpen, SwatchBook, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    bio: '',
    skills: ''
  });

  if (user?.onboardingCompleted) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/onboarding', formData);
      await refreshUser(res.data);
      toast.success('Profile created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-primary/20">
            <User size={40} />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Complete Your Profile</h1>
          <p className="text-slate-500 mt-3 text-lg">Help us match you with the perfect volunteer opportunities.</p>
        </div>

        <div className="card shadow-2xl border-none p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="label flex items-center gap-2">
                  <User size={16} className="text-primary" />
                  Full Name
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="label flex items-center gap-2">
                  <Phone size={16} className="text-primary" />
                  Phone Number
                </label>
                <input 
                  type="tel" 
                  className="input-field" 
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="label flex items-center gap-2">
                <SwatchBook size={16} className="text-primary" />
                Skills (separated by commas)
              </label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Teaching, First Aid, Event Planning..."
                value={formData.skills}
                onChange={e => setFormData({...formData, skills: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="label flex items-center gap-2">
                <BookOpen size={16} className="text-primary" />
                Short Bio
              </label>
              <textarea 
                className="input-field min-h-[120px] resize-none" 
                placeholder="Tell us about yourself and why you want to volunteer..."
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
                required
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                className="btn btn-primary w-full h-14 text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                disabled={loading}
              >
                {loading ? 'Saving...' : (
                  <>
                    <span>Finish Setups</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-4">
            <Sparkles className="text-primary flex-shrink-0" size={24} />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Pro Tip</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Volunteers with complete profiles are 3x more likely to be accepted for competitive events!
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
