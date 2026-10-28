import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/Auth.jsx';
import { Button, Splash } from './ui.jsx';

function AuthCheckError({ error, onRetry }) {
  return (
    <main className="db-error" role="alert">
      <h1>Unable to verify your session</h1>
      <p>{error.message || 'Check your connection and try again.'}</p>
      <Button className="blue sm" onClick={onRetry}>Try again</Button>
    </main>
  );
}

// Blocks a route until we know whether anyone is logged in, then enforces the given roles.
export function RequireRole({ roles }) {
  const { user, loading, authError, refresh } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (authError) return <AuthCheckError error={authError} onRetry={refresh} />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!roles.includes(user.role)) return <Navigate to={user.role === 'admin' ? '/admin' : '/app'} replace />;
  return <Outlet />;
}

// Keeps a logged-in user off the marketing/auth pages, sending them straight to their home.
export function RedirectIfLoggedIn() {
  const { user, loading, authError, refresh } = useAuth();
  if (loading) return <Splash />;
  if (authError) return <AuthCheckError error={authError} onRetry={refresh} />;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/app'} replace />;
  return <Outlet />;
}
