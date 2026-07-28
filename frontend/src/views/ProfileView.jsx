import useAuthStore from '../store/authStore';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui';

/**
 * ============================================================================
 * PROFILE VIEW — Basic user profile (optional)
 * ============================================================================
 *
 * Purpose:
 *   Displays current user information and provides account actions (logout).
 *   Minimal structure that doesn't break the GIS experience — the user can
 *   quickly return to the map.
 *
 * Layout:
 *   Centered card with user info, similar to AuthView in positioning.
 *   Neutral background, no competing visuals.
 *
 * Design:
 *   - Uses Card atom with default variant
 *   - Avatar placeholder using user initials
 *   - Account details as a definition list
 *   - Logout + Back to map actions
 * ============================================================================
 */

/**
 * @param {object} props
 * @param {() => void} [props.onNavigateHome] — return to map
 * @param {() => void} [props.onLogout] — explicit logout action
 */
export default function ProfileView({ onNavigateHome, onLogout }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
    if (onLogout) onLogout();
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 bg-background">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-8 space-y-4">
            <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden="true">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-muted-foreground">
              Sign in to access your profile and manage your markers.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                fullWidth
                onClick={() => { window.location.hash = '/auth'; }}
              >
                Log in / Register
              </Button>
              {onNavigateHome && (
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={onNavigateHome}
                  className="text-muted-foreground"
                >
                  ← Back to map
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = getInitials(user.username || user.email);

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-4 py-8 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          {/* Avatar placeholder */}
          <div
            className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mb-3"
            aria-hidden="true"
          >
            <span className="text-xl font-bold text-primary">
              {initials}
            </span>
          </div>
          <CardTitle as="h2">
            {user.username || 'User'}
          </CardTitle>
          <CardDescription>
            {user.email}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <dl className="space-y-3 text-sm">
            {user.username && (
              <div className="flex justify-between items-center py-2 border-b border-border">
                <dt className="text-muted-foreground">Username</dt>
                <dd className="font-medium text-foreground">{user.username}</dd>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-border">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium text-foreground truncate max-w-[180px]">
                {user.email}
              </dd>
            </div>
            {user.createdAt && (
              <div className="flex justify-between items-center py-2 border-b border-border">
                <dt className="text-muted-foreground">Member since</dt>
                <dd className="font-medium text-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </dd>
              </div>
            )}
            <div className="flex justify-between items-center py-2">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-medium text-foreground capitalize">
                {user.role || 'Contributor'}
              </dd>
            </div>
          </dl>
        </CardContent>

        <CardFooter className="flex-col gap-3">
          <Button
            variant="destructive"
            fullWidth
            onClick={handleLogout}
          >
            Log out
          </Button>
          {onNavigateHome && (
            <Button
              variant="ghost"
              fullWidth
              onClick={onNavigateHome}
              className="text-muted-foreground"
            >
              ← Back to map
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/[\s@]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
