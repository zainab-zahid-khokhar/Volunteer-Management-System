import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, Users, FileText, 
  MessageSquare, UserCircle, LogOut, Bell, Menu, X, Handshake
} from 'lucide-react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface NavItem {
  label: string;
  icon: any;
  path: string;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Events', icon: Calendar, path: '/events' },
  { label: 'My Applications', icon: FileText, path: '/applications', roles: ['volunteer'] },
  { label: 'Volunteers', icon: Users, path: '/volunteers', roles: ['org_admin', 'super_admin'] },
  { label: 'Organizations', icon: Handshake, path: '/organizations', roles: ['super_admin'] },
  { label: 'Profile', icon: UserCircle, path: '/profile', roles: ['volunteer'] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const filteredNav = navItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2 text-primary font-bold text-xl">
          <Handshake size={28} />
          <span>VMS Pro</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={logout} className="p-2 text-red-500" title="Logout">
            <LogOut size={20} />
          </button>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || true) && (
          <motion.aside 
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            className={`
              fixed md:sticky top-0 left-0 bottom-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col h-screen
              ${isSidebarOpen ? 'flex' : 'hidden md:flex'}
            `}
          >
            <div className="flex-1 overflow-y-auto p-8 pb-4">
              <div className="flex items-center gap-3 text-primary font-bold text-2xl mb-8">
                <Handshake size={32} />
                <span>VMS Pro</span>
              </div>
              
              <nav className="space-y-1">
                {filteredNav.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                        ${isActive 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                      `}
                    >
                      <item.icon size={20} className={isActive ? 'text-primary' : 'text-slate-400'} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-8 border-t border-slate-100 flex flex-col gap-4 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
                  {user?.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-slate-900">{user?.fullName || user?.email.split('@')[0]}</p>
                  <p className="text-xs text-slate-500 capitalize">{user?.role.replace('_', ' ')}</p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="btn btn-secondary w-full justify-start gap-3 border-none shadow-none hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <header className="hidden md:flex bg-white h-16 border-b border-slate-200 items-center justify-between px-8 sticky top-0 z-30">
          <h2 className="font-semibold text-slate-800">
            {filteredNav.find(n => location.pathname.startsWith(n.path))?.label || 'Overview'}
          </h2>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} />
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <span className="text-sm text-slate-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
        </header>
        
        <div className="p-4 md:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
