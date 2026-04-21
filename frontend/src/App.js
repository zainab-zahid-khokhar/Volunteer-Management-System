import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import { LoginPage, RegisterPage, VerifyEmailPage } from './pages/AuthPages';
import DashboardPage from './pages/DashboardPage';
import { EventsListPage, EventDetailPage, EventFormPage } from './pages/EventsPages';
import {
  ProfilePage, ApplicationsPage, MessagingPage,
  AdminOrgsPage, AdminVolunteersPage, AuditLogsPage, VolunteersPage
} from './pages/OtherPages';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Shared */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />

      {/* Volunteer */}
      <Route path="/events" element={<ProtectedRoute><EventsListPage /></ProtectedRoute>} />
      <Route path="/events/new" element={<ProtectedRoute roles={['org_admin', 'super_admin']}><EventFormPage /></ProtectedRoute>} />
      <Route path="/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
      <Route path="/events/:id/edit" element={<ProtectedRoute roles={['org_admin', 'super_admin']}><EventFormPage /></ProtectedRoute>} />
      <Route path="/applications" element={<ProtectedRoute roles={['volunteer']}><ApplicationsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute roles={['volunteer']}><ProfilePage /></ProtectedRoute>} />

      {/* Org Admin */}
      <Route path="/volunteers" element={<ProtectedRoute roles={['org_admin']}><VolunteersPage /></ProtectedRoute>} />

      {/* Super Admin */}
      <Route path="/admin/organizations" element={<ProtectedRoute roles={['super_admin']}><AdminOrgsPage /></ProtectedRoute>} />
      <Route path="/admin/volunteers" element={<ProtectedRoute roles={['super_admin']}><AdminVolunteersPage /></ProtectedRoute>} />
      <Route path="/admin/audit-logs" element={<ProtectedRoute roles={['super_admin']}><AuditLogsPage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
