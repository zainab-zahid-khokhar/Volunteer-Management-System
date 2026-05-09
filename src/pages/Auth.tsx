import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Handshake, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        await register(email, password);
        toast.success('Account created! Welcome to VMS Pro.');
        navigate('/onboarding');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Pane - Marketing */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-slate-900 text-white relative overflow-hidden">
        <div className="z-10">
          <div className="flex items-center gap-3 text-primary font-bold text-3xl mb-12">
            <Handshake size={40} />
            <span className="text-white">VMS Pro</span>
          </div>
          
          <h1 className="text-6xl font-bold leading-tight tracking-tight">
            Empowering <br />
            <span className="text-primary-light">Change Creators</span> <br />
            Everywhere.
          </h1>
          <p className="mt-8 text-xl text-slate-400 max-w-lg leading-relaxed">
            Connect with meaningful causes, manage your volunteering journey, and make an impact that matters. Joined by 10,000+ volunteers.
          </p>
        </div>

        <div className="z-10 grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <h4 className="text-4xl font-bold">2.4k+</h4>
            <p className="text-slate-400 uppercase tracking-widest text-xs font-bold font-mono">Active Events</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-4xl font-bold">120+</h4>
            <p className="text-slate-400 uppercase tracking-widest text-xs font-bold font-mono">Organizations</p>
          </div>
        </div>

        {/* Abstract shapes */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Right Pane - Form */}
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-white">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-10 text-center lg:text-left">
            <motion.h2 
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold text-slate-900"
            >
              {isLogin ? 'Welcome Back' : 'Join VMS Pro'}
            </motion.h2>
            <p className="text-slate-500 mt-2">
              {isLogin 
                ? 'Don\'t have an account? ' 
                : 'Already have an account? '}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-semibold hover:underline"
              >
                {isLogin ? 'Create one now' : 'Sign in instead'}
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    className="input-field pl-10" 
                    placeholder="name@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="label mb-0">Password</label>
                  {isLogin && <Link to="#" className="text-xs font-semibold text-primary hover:underline">Forgot password?</Link>}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    className="input-field pl-10" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {!isLogin && (
              <div className="flex gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <CheckCircle2 className="text-primary flex-shrink-0" size={18} />
                <p className="text-xs text-slate-500 leading-relaxed">
                  By joining, you agree to our <span className="font-semibold text-slate-700">Terms of Service</span> and <span className="font-semibold text-slate-700">Privacy Policy</span>.
                </p>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary w-full h-12 text-lg shadow-lg shadow-primary/20"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Get Started'}</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {isLogin && (
            <div className="mt-8">
              <div className="relative flex items-center gap-4 py-4">
                <div className="h-px bg-slate-100 flex-1" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Or continue with</span>
                <div className="h-px bg-slate-100 flex-1" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <button className="btn btn-secondary py-3 flex items-center justify-center">
                   Google
                </button>
                <button className="btn btn-secondary py-3 flex items-center justify-center">
                   GitHub
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
