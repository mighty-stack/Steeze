import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/Auth.jsx';
import { Splash } from './ui.jsx';

// Blocks a route until we know whether anyone is logged in, then enforces the given roles.
export function RequireRole({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!roles.includes(user.role)) return <Navigate to={user.role === 'admin' ? '/admin' : '/app'} replace />;
  return <Outlet />;
}

// Keeps a logged-in user off the marketing/auth pages, sending them straight to their home.
export function RedirectIfLoggedIn() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/app'} replace />;
  return <Outlet />;
}
