import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import toast from 'react-hot-toast';

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const roleRoutes = { volunteer: '/dashboard', org_admin: '/dashboard', super_admin: '/dashboard' };
      navigate(roleRoutes[user.role] || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>🤝 VMS</h1>
          <p>Volunteer Management System</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label>Email Address</label>
            <input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          New volunteer? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 8) return setError('Password must be at least 8 characters');
    setError(''); setLoading(true);
    try {
      await api.post('/auth/register', { email: form.email, password: form.password, inviteToken: inviteToken || undefined });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📧</div>
        <h2>Check your email!</h2>
        {inviteToken ? (
          <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>
            Registration successful! <Link to="/login">Sign in now</Link>
          </p>
        ) : (
          <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>
            We sent a verification link to <strong>{form.email}</strong>. Click it to activate your account.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>🤝 VMS</h1>
          <p>{inviteToken ? 'Complete Admin Registration' : 'Create Volunteer Account'}</p>
        </div>
        {inviteToken && <div className="alert alert-info">You're registering via an organization invite.</div>}
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label>Email Address</label>
            <input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input className="form-control" type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying');

  React.useEffect(() => {
    if (!token) return setStatus('error');
    api.get(`/auth/verify/${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {status === 'verifying' && <><div className="spinner" style={{ margin: '0 auto 16px' }} /><p>Verifying your email...</p></>}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
            <h2>Email Verified!</h2>
            <p style={{ color: 'var(--text-muted)', margin: '12px 0' }}>Your account is active. You can now sign in.</p>
            <Link to="/login" className="btn btn-primary">Go to Login</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❌</div>
            <h2>Verification Failed</h2>
            <p style={{ color: 'var(--text-muted)', margin: '12px 0' }}>This link is invalid or has expired.</p>
            <Link to="/login" className="btn btn-secondary">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
}
