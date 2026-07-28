import { Button } from '../components/ui';

/**
 * ============================================================================
 * NOT FOUND VIEW — 404 Error page
 * ============================================================================
 *
 * Purpose:
 *   Consistent, stylized error screen for invalid routes. Matches the
 *   application's cartographic visual identity with a map-themed illustration
 *   and clear CTA to return to the map.
 *
 * Design:
 *   - Centered content on neutral background
 *   - Map pin icon as visual anchor (theme-colored)
 *   - SunsetDark accent on the "404" numeral
 *   - Clear hierarchy: number → message → action
 *   - Minimal, professional — no clutter
 * ============================================================================
 */

/**
 * @param {object} props
 * @param {() => void} [props.onNavigateHome] — return to map
 */
export default function NotFoundView({ onNavigateHome }) {
  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-4 py-12 bg-background">
      {/* Map pin illustration */}
      <div className="relative mb-8">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
            aria-hidden="true"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
            {/* "X" inside to indicate "not found" */}
            <path d="M10.5 8.5l3 3" className="opacity-60" />
            <path d="M13.5 8.5l-3 3" className="opacity-60" />
          </svg>
        </div>
        {/* Decorative shadow dot */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-2 rounded-full bg-foreground/5"
          aria-hidden="true"
        />
      </div>

      {/* 404 Number */}
      <h1 className="text-7xl sm:text-8xl font-bold text-primary/80 tracking-tighter mb-2">
        404
      </h1>

      {/* Message */}
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Ubicación no encontrada
      </h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs mb-8">
        La página que buscás no existe en nuestro mapa. Puede que haya sido movida o la URL sea incorrecta.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onNavigateHome && (
          <Button
            variant="primary"
            onClick={onNavigateHome}
            leftIcon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            }
          >
            Volver al mapa
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => window.history.back()}
        >
          Volver atrás
        </Button>
      </div>

      {/* Decorative gradient bar at bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 h-1 opacity-40"
        style={{
          background:
            'linear-gradient(to right, #7c1d6f, #b9257a, #dc3977, #e34f6f, #f0746e, #faa476, #fcde9c)',
        }}
        aria-hidden="true"
      />
    </div>
  );
}
