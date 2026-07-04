import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Approvals from './pages/Approvals';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import Payroll from './pages/Payroll';
import AIAssistant from './pages/AIAssistant';

// Gated Route wrapper for Authenticated users
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRoles?: string[]; requiredPermission?: string }> = ({ 
  children, 
  requiredRoles, 
  requiredPermission 
}) => {
  const { user, loading, hasRole, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return <Navigate to="/" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <Router>
          <Routes>
            {/* Public Access */}
            <Route path="/login" element={<Login />} />

            {/* Authenticated Gated Portal */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/attendance" 
              element={
                <ProtectedRoute>
                  <Attendance />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/leaves" 
              element={
                <ProtectedRoute>
                  <Leaves />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/approvals" 
              element={
                <ProtectedRoute requiredRoles={['MANAGER', 'HR', 'ADMIN']}>
                  <Approvals />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/employees" 
              element={
                <ProtectedRoute requiredPermission="employee:create">
                  <Employees />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/departments" 
              element={
                <ProtectedRoute requiredPermission="department:create">
                  <Departments />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/payroll" 
              element={
                <ProtectedRoute requiredPermission="payroll:run">
                  <Payroll />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/ai-assistant" 
              element={
                <ProtectedRoute>
                  <AIAssistant />
                </ProtectedRoute>
              } 
            />

            {/* Fallback Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </NotificationsProvider>
    </AuthProvider>
  );
};

export default App;
