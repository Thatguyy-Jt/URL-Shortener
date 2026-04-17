import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Landing }   from './pages/Landing';
import { Login }     from './pages/Login';
import { Register }  from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';
import { NotFound }  from './pages/NotFound';
import type { ReactNode } from 'react';

// ── React Query client ────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

// ── Route guards ──────────────────────────────────────────────────────────────

/** Redirects unauthenticated users to /login. Renders nothing during the
 *  initial /auth/me hydration so there's no flash of wrong content. */
function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Redirects already-authenticated users away from login/register. */
function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

// ── Routes ────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/" element={<Landing />} />

      {/* ── Auth (redirect away if already logged in) ── */}
      <Route path="/login"    element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

      {/* ── Protected ── */}
      <Route path="/dashboard" element={
        <PrivateRoute><Dashboard /></PrivateRoute>
      } />
      <Route path="/dashboard/links/:id/analytics" element={
        <PrivateRoute><Analytics /></PrivateRoute>
      } />

      {/* ── 404 ── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
