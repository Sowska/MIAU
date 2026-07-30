import { useState, useEffect, useCallback } from 'react';
import useAuthStore from './store/authStore';
import useToastStore from './store/toastStore';
import { Navbar, ToastContainer } from './components/ui';

import HomeView from './views/HomeView';
import AuthView from './views/AuthView';
import ProfileView from './views/ProfileView';
import NotFoundView from './views/NotFoundView';

/** App icon URL (hosted on S3 — not stored locally) */
const APP_ICON_URL = 'https://miau-art-assets-073868306855-us-east-2-an.s3.us-east-2.amazonaws.com/markers/miau-icon.png';

/**
 * ============================================================================
 * APP — Root application component with simple hash-based routing
 * ============================================================================
 *
 * Routes (4 views only, no additional pages):
 *   #/        → HomeView (map workspace)
 *   #/auth    → AuthView (login/register)
 *   #/profile → ProfileView (user info)
 *   *         → NotFoundView (404)
 *
 * The Navbar is persistent across all views. The map is ONLY in HomeView.
 * Navigation uses hash-based routing (no external dependency needed).
 * ============================================================================
 */

const ROUTES = ['/', '/auth', '/profile'];

function getRouteFromHash() {
  const hash = window.location.hash.replace('#', '') || '/';
  return hash;
}

export default function App() {
  const [route, setRoute] = useState(getRouteFromHash);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  // Listen to hash changes
  useEffect(() => {
    function handleHashChange() {
      setRoute(getRouteFromHash());
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Navigation helper
  const navigate = useCallback((path) => {
    window.location.hash = path;
  }, []);

  // Navbar config
  const navLinks = [
    { label: 'Ver Mapa', href: '#/', active: route === '/', onClick: () => navigate('/') },
    ...(token && user
      ? [{ label: 'Mi Perfil', href: '#/profile', active: route === '/profile', onClick: () => navigate('/profile') }]
      : []),
  ];

  function handleLogin() {
    navigate('/auth');
  }

  function handleLogout() {
    logout();
    useToastStore.getState().addToast('success', 'Sesión cerrada correctamente');
    navigate('/');
  }

  function handleAuthSuccess() {
    navigate('/');
  }

  function handleNavigateHome() {
    navigate('/');
  }

  // ── Route resolution ──────────────────────────────────────────────────────

  function renderView() {
    switch (route) {
      case '/':
        return <HomeView />;
      case '/auth':
        // If already authenticated, redirect to home
        if (token && user) {
          navigate('/');
          return <HomeView />;
        }
        return (
          <AuthView
            onSuccess={handleAuthSuccess}
            onNavigateHome={handleNavigateHome}
          />
        );
      case '/profile':
        return (
          <ProfileView
            onNavigateHome={handleNavigateHome}
            onLogout={handleLogout}
          />
        );
      default:
        // 404 for any unmatched route
        return <NotFoundView onNavigateHome={handleNavigateHome} />;
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Persistent Navbar */}
      <Navbar
        brand={
          <a href="#/" className="flex items-center gap-2">
            <img src={APP_ICON_URL} alt="MIAU" className="h-8 w-auto" />
            <span className="text-lg font-bold text-foreground tracking-tight">MIAU</span>
          </a>
        }
        links={navLinks}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* View content — below navbar (h-14 = 56px) */}
      <main className="pt-14">
        {renderView()}
      </main>

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
