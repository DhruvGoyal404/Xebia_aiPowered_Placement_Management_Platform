import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const dashboardPath = (user) =>
  user?.role === 'admin' ? '/admin' : '/student';

export const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, token } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole)
    return <Navigate to={dashboardPath(user)} replace />;
  return children;
};

export const GuestRoute = ({ children }) => {
  const { user, token } = useAuth();
  if (token && user) return <Navigate to={dashboardPath(user)} replace />;
  return children;
};
