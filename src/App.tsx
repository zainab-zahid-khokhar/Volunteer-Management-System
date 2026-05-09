import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Applications from './pages/Applications';
import Profile from './pages/Profile';
import Organizations from './pages/Organizations';
import Volunteers from './pages/Volunteers';
import Onboarding from './pages/Onboarding';

function ProtectedRoute({ children, reqRole, noLayout }: { children: React.ReactNode, reqRole?: string[], noLayout?: boolean }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>;

  if (!user) return <Navigate to="/auth" replace />;

  if (user.role === 'volunteer' && !user.onboardingCompleted && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (user.needsPasswordReset && window.location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />;
  }
  
  if (reqRole && !reqRole.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If already onboarded, don't let them go back to onboarding
  if (user.onboardingCompleted && window.location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  if (noLayout) return <>{children}</>;

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/onboarding" element={<ProtectedRoute noLayout><Onboarding /></ProtectedRoute>} />
          
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          
          <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/events/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
          
          <Route path="/volunteers" element={<ProtectedRoute reqRole={['org_admin', 'super_admin']}><Volunteers /></ProtectedRoute>} />
          <Route path="/organizations" element={<ProtectedRoute reqRole={['super_admin']}><Organizations /></ProtectedRoute>} />
          
          <Route path="/applications" element={<ProtectedRoute reqRole={['volunteer']}><Applications /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="bottom-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}
