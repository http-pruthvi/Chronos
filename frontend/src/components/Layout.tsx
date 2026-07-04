import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  FileText, 
  Users, 
  Briefcase, 
  DollarSign, 
  MessageSquareCode, 
  Bell, 
  LogOut, 
  ChevronRight,
  CheckSquare
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, hasRole, hasPermission } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, visible: true },
    { name: 'Attendance', path: '/attendance', icon: CalendarCheck, visible: true },
    { name: 'Leave Requests', path: '/leaves', icon: FileText, visible: true },
    { name: 'Approvals', path: '/approvals', icon: CheckSquare, visible: hasRole(['MANAGER', 'HR', 'ADMIN']) },
    { name: 'Employees', path: '/employees', icon: Users, visible: hasPermission('employee:create') },
    { name: 'Departments', path: '/departments', icon: Briefcase, visible: hasPermission('department:create') },
    { name: 'Payroll & Runs', path: '/payroll', icon: DollarSign, visible: hasPermission('payroll:run') },
    { name: 'AI HR Assistant', path: '/ai-assistant', icon: MessageSquareCode, visible: true },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                C
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
                Chronos HRMS
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {menuItems
              .filter((item) => item.visible)
              .map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600/20 to-blue-600/10 text-indigo-300 border-l-2 border-indigo-500 shadow-md shadow-indigo-500/5'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
                  </Link>
                );
              })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-indigo-400 shadow-inner">
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-slate-200 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800/80 text-indigo-400 border border-indigo-500/20 font-medium">
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-800 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-700 hover:border-rose-900/30 text-sm font-medium transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/30 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8">
          <h2 className="text-lg font-bold text-slate-200">
            {menuItems.find((item) => item.path === location.pathname)?.name || 'Chronos Dashboard'}
          </h2>

          {/* Notifications & System Bar */}
          <div className="flex items-center gap-4 relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all duration-200 cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 border border-slate-900 text-white font-bold text-[10px] flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Card */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-850 rounded-xl shadow-2xl shadow-black/80 z-40 overflow-hidden">
                <div className="px-4 py-3 bg-slate-850/50 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-200">In-App Alerts</span>
                  {unreadCount > 0 && (
                    <span className="text-xs text-indigo-400 font-medium">
                      {unreadCount} Unread
                    </span>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/50">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No notifications available
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (!item.isRead) markAsRead(item.id);
                        }}
                        className={`p-4 hover:bg-slate-800/40 transition-colors duration-150 cursor-pointer ${
                          !item.isRead ? 'bg-indigo-950/5' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-xs font-semibold ${!item.isRead ? 'text-indigo-300' : 'text-slate-300'}`}>
                            {item.title}
                          </span>
                          {!item.isRead && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {item.body}
                        </p>
                        <span className="text-[9px] text-slate-550 block mt-2">
                          {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
