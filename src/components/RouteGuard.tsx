import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface RouteGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

const RouteGuard = ({ children, allowedRoles }: RouteGuardProps) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  // Wait for AuthContext to finish loading before making a redirect decision
  if (loading) return null;

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If allowedRoles is specified, check if user has the required role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect based on user's role
    switch (user.role) {
      case 'student':
        return <Navigate to="/student/dashboard" replace />;
      case 'teacher':
        return <Navigate to="/teacher/dashboard" replace />;
      case 'hod':
        return <Navigate to="/hod/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }
  
  // User is authenticated and has the required role, render the children
  return <>{children}</>;
};

export default RouteGuard;
