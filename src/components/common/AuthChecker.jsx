import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function AuthChecker({ children, requireAuth = true }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  console.log('AuthChecker - Current state:', { isAuthenticated, loading, pathname: location.pathname });

  // Show loading spinner while checking authentication
  if (loading) {
    console.log('AuthChecker - Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required and user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    console.log('AuthChecker - Redirecting to login (not authenticated)');
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && location.pathname.startsWith('/auth/')) {
    console.log('AuthChecker - Redirecting to Dashboard (authenticated user on auth page)');
    return <Navigate to="/Dashboard" replace />;
  }

  console.log('AuthChecker - Rendering children');
  return children;
}