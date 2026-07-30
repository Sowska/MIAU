import { useState, useEffect } from 'react';
import { GridLoader } from 'react-spinners';
import useAuthStore from '../store/authStore';
import { getMyMarkers } from '../api/markers';
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
 * PROFILE VIEW — User profile + owned markers
 * ============================================================================
 *
 * Purpose:
 *   Displays current user information, account actions (logout), and a list
 *   of all markers created by the user. Marker cards show a thumbnail, title,
 *   category, and date. Clicking a card navigates to the map centered on that
 *   marker.
 * ============================================================================
 */

/** Category color dots */
const CATEGORY_COLORS = {
  mural: '#dc3977',
  graffiti: '#f0746e',
  sculpture: '#7c1d6f',
};

/**
 * @param {object} props
 * @param {() => void} [props.onNavigateHome] — return to map
 * @param {() => void} [props.onLogout] — explicit logout action
 */
export default function ProfileView({ onNavigateHome, onLogout }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // My markers state
  const [markers, setMarkers] = useState([]);
  const [loadingMarkers, setLoadingMarkers] = useState(true);
  const [markersError, setMarkersError] = useState('');

  // Fetch user's markers on mount
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingMarkers(true);
    getMyMarkers()
      .then((res) => {
        if (!cancelled) setMarkers(res.data);
      })
      .catch((err) => {
        if (!cancelled) setMarkersError(err.response?.data?.error || 'Error al cargar marcadores');
      })
      .finally(() => {
        if (!cancelled) setLoadingMarkers(false);
      });
    return () => { cancelled = true; };
  }, [user]);

  function handleLogout() {
    logout();
    if (onLogout) onLogout();
  }

  /** Navigate to the map and fly to a specific marker */
  function handleMarkerCardClick(marker) {
    const coords = marker.location?.coordinates;
    if (coords) {
      // Store target coords so HomeView can pick them up
      window.__miauFlyTo = { lat: coords[1], lng: coords[0], markerId: marker._id };
    }
    window.location.hash = '/';
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
              Iniciá sesión para acceder a tu perfil y gestionar tus marcadores.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                fullWidth
                onClick={() => { window.location.hash = '/auth'; }}
              >
                Iniciar sesión / Registrarse
              </Button>
              {onNavigateHome && (
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={onNavigateHome}
                  className="text-muted-foreground"
                >
                  ← Volver al mapa
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
    <div className="min-h-[calc(100vh-56px)] px-4 py-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* ── User Info Card ─────────────────────────────────────────────── */}
        <Card className="w-full max-w-sm mx-auto">
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
              {user.username || 'Usuario'}
            </CardTitle>
            <CardDescription>
              {user.email}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <dl className="space-y-3 text-sm">
              {user.username && (
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <dt className="text-muted-foreground">Nombre de usuario</dt>
                  <dd className="font-medium text-foreground">{user.username}</dd>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-border">
                <dt className="text-muted-foreground">Correo electrónico</dt>
                <dd className="font-medium text-foreground truncate max-w-[180px]">
                  {user.email}
                </dd>
              </div>
              {user.createdAt && (
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <dt className="text-muted-foreground">Miembro desde</dt>
                  <dd className="font-medium text-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <dt className="text-muted-foreground">Rol</dt>
                <dd className="font-medium text-foreground capitalize">
                  {user.role || 'Contribuidor'}
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
              Cerrar sesión
            </Button>
            {onNavigateHome && (
              <Button
                variant="ghost"
                fullWidth
                onClick={onNavigateHome}
                className="text-muted-foreground"
              >
                ← Volver al mapa
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* ── My Markers Section ─────────────────────────────────────────── */}
        <section aria-label="Mis marcadores">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Mis marcadores
            {!loadingMarkers && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({markers.length})
              </span>
            )}
          </h2>

          {loadingMarkers && (
            <div className="flex justify-center py-12">
              <GridLoader color="hsl(338, 68%, 54%)" size={10} />
            </div>
          )}

          {markersError && (
            <p className="text-sm text-destructive text-center py-4">{markersError}</p>
          )}

          {!loadingMarkers && !markersError && markers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Aún no creaste ningún marcador.</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-primary"
                onClick={onNavigateHome}
              >
                Ir al mapa para crear uno
              </Button>
            </div>
          )}

          {!loadingMarkers && markers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {markers.map((marker) => (
                <MarkerCard
                  key={marker._id}
                  marker={marker}
                  onClick={() => handleMarkerCardClick(marker)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ─── Internal Components ────────────────────────────────────────────────── */

/** Compact marker card with thumbnail, title, category badge, and date */
function MarkerCard({ marker, onClick }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(resolveImageUrl(marker.imagePath));
  const accentColor = CATEGORY_COLORS[marker.category] || '#6b7280';

  // Reset img loaded state if marker changes
  const resolvedUrl = resolveImageUrl(marker.imagePath);
  if (resolvedUrl !== imgSrc) {
    setImgSrc(resolvedUrl);
    setImgLoaded(false);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left w-full rounded-lg border border-border bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`Ver "${marker.title}" en el mapa`}
    >
      {/* Thumbnail */}
      <div className="relative h-32 sm:h-36 bg-muted overflow-hidden">
        {marker.imagePath ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <GridLoader color="hsl(338, 68%, 54%)" size={8} />
              </div>
            )}
            <img
              src={imgSrc}
              alt={`Artwork: ${marker.title}`}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${imgLoaded ? '' : 'hidden'}`}
              onLoad={() => setImgLoaded(true)}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {marker.title}
        </h3>
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: accentColor }}
            aria-hidden="true"
          />
          <span className="text-xs text-muted-foreground capitalize">{marker.category}</span>
        </div>
        {marker.date && (
          <p className="text-xs text-muted-foreground">
            {new Date(marker.date).toLocaleDateString()}
          </p>
        )}
      </div>
    </button>
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

function resolveImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const serverRoot = baseUrl.replace(/\/api\/?$/, '');
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${serverRoot}${path}`;
}
