import { useEffect, useRef } from 'react';
import Button from './Button';

/**
 * ============================================================================
 * MARKERDETAILDRAWER — Sliding side panel with artwork details
 * ============================================================================
 *
 * Purpose:
 *   Full-detail view for a selected marker. Slides in from the right (desktop)
 *   or from the bottom (mobile) without navigating away from the map. The map
 *   remains visible and interactive alongside the drawer.
 *
 * Anatomy:
 *   MarkerDetailDrawer
 *   ├── Overlay (mobile only — semi-transparent backdrop)
 *   └── Panel
 *       ├── Header (title + close button)
 *       ├── Image (full-width hero)
 *       ├── Metadata
 *       │   ├── CategoryBadge
 *       │   ├── Author
 *       │   ├── Date
 *       │   └── Location coordinates
 *       ├── Description
 *       ├── Actions (Edit / Delete — owner only)
 *       └── Contributions section (optional)
 *
 * Design System Compliance:
 *   - Panel: bg-card, border-l (desktop) or border-t (mobile), shadow
 *   - Header sticky within the panel for scroll context
 *   - Category badge uses sunset palette colors
 *   - All text via --foreground / --muted-foreground / --card-foreground
 *   - Buttons use Button atom variants
 *   - Focus trap NOT applied (map stays interactive)
 *   - WCAG: complementary landmark, aria-label, close via Escape
 *   - Transition: slide-in from right with transform
 *
 * Props:
 *   isOpen        — visibility state
 *   marker        — marker data object
 *   isOwner       — whether current user owns this marker
 *   onClose       — close callback
 *   onEdit        — edit callback (owner)
 *   onDelete      — delete callback (owner)
 *   loading       — loading state (skeleton)
 *   children      — optional slot for contributions or extra content
 *
 * Leaflet Integration:
 *   The drawer sits BESIDE the map on desktop (the map width shrinks or the
 *   drawer overlays it partially). On mobile it slides up as a bottom sheet.
 *   The map remains interactive — no pointer-events blocking.
 *   Closing the drawer does NOT affect map state or selected marker.
 *
 * States:
 *   - closed (off-screen, not rendered or translated away)
 *   - open (visible with content)
 *   - loading (skeleton placeholder)
 *   - empty (no marker data)
 *
 * Responsive:
 *   - Desktop: right-side panel, 400px wide, full viewport height minus navbar
 *   - Mobile: bottom sheet, 75vh max height, draggable handle
 * ============================================================================
 */

/** Default category → sunset color mapping */
const CATEGORY_COLORS = {
  mural: 'bg-sunset-500',
  graffiti: 'bg-sunset-300',
  sculpture: 'bg-sunset-700',
};

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {object|null} [props.marker]
 * @param {boolean} [props.isOwner=false]
 * @param {() => void} props.onClose
 * @param {(marker: object) => void} [props.onEdit]
 * @param {(marker: object) => void} [props.onDelete]
 * @param {boolean} [props.loading=false]
 * @param {React.ReactNode} [props.children] — slot for contributions
 * @param {string} [props.className]
 */
export default function MarkerDetailDrawer({
  isOpen,
  marker = null,
  isOwner = false,
  onClose,
  onEdit,
  onDelete,
  loading = false,
  children,
  className = '',
}) {
  const panelRef = useRef(null);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus the panel when opened (for screen readers)
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="sm:hidden fixed inset-0 z-[400] bg-background/60 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="complementary"
        aria-label={marker ? `Details: ${marker.title}` : 'Marker details'}
        className={[
          'fixed z-[401] overflow-y-auto',
          'bg-card text-card-foreground',
          'transition-transform duration-300 ease-out',
          'outline-none',
          // Desktop: right panel
          'sm:top-14 sm:right-0 sm:bottom-0 sm:w-[400px] sm:border-l sm:border-border sm:shadow-lg',
          isOpen ? 'sm:translate-x-0' : 'sm:translate-x-full',
          // Mobile: bottom sheet
          'top-auto bottom-0 left-0 right-0 sm:left-auto',
          'max-h-[75vh] sm:max-h-none',
          'rounded-t-xl sm:rounded-none',
          'border-t border-border sm:border-t-0',
          'shadow-xl sm:shadow-lg',
          isOpen ? 'translate-y-0' : 'translate-y-full sm:translate-y-0',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center py-2">
          <div className="w-10 h-1 rounded-full bg-border" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b border-border bg-card">
          <h2 className="text-base font-semibold text-foreground truncate pr-2">
            {loading ? 'Loading...' : marker?.title || 'Marker Details'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="p-2 -mr-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <DrawerSkeleton />
        ) : marker ? (
          <div className="divide-y divide-border">
            {/* Image */}
            {marker.imagePath && (
              <div className="relative">
                <img
                  src={resolveImageUrl(marker.imagePath)}
                  alt={`Artwork: ${marker.title}`}
                  className="w-full h-52 sm:h-64 object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Metadata */}
            <div className="p-5 space-y-3">
              {/* Category badge */}
              {marker.category && (
                <span className="inline-flex items-center gap-2 text-sm font-medium capitalize">
                  <span
                    className={`inline-block h-3 w-3 rounded-full ${CATEGORY_COLORS[marker.category] || 'bg-primary'}`}
                    aria-hidden="true"
                  />
                  {marker.category}
                </span>
              )}

              {/* Details list */}
              <dl className="space-y-2 text-sm">
                {marker.author && (
                  <div className="flex gap-2">
                    <dt className="font-medium text-muted-foreground shrink-0">Author</dt>
                    <dd className="text-foreground">{marker.author}</dd>
                  </div>
                )}
                {marker.date && (
                  <div className="flex gap-2">
                    <dt className="font-medium text-muted-foreground shrink-0">Date</dt>
                    <dd className="text-foreground">
                      {new Date(marker.date).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {marker.location?.coordinates && (
                  <div className="flex gap-2">
                    <dt className="font-medium text-muted-foreground shrink-0">Location</dt>
                    <dd className="text-foreground tabular-nums">
                      {marker.location.coordinates[1]?.toFixed(5)},{' '}
                      {marker.location.coordinates[0]?.toFixed(5)}
                    </dd>
                  </div>
                )}
              </dl>

              {/* Description */}
              {marker.description && (
                <div className="pt-2">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                    Description
                  </h3>
                  <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                    {marker.description}
                  </p>
                </div>
              )}
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="p-5 flex gap-3">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => onEdit(marker)}
                  >
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    fullWidth
                    onClick={() => onDelete(marker)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}

            {/* Contributions / Children slot */}
            {children && (
              <div className="p-5">
                {children}
              </div>
            )}

            {/* Timestamps */}
            {(marker.createdAt || marker.updatedAt) && (
              <div className="px-5 py-3 space-y-0.5 text-xs text-muted-foreground">
                {marker.createdAt && (
                  <p>Created {new Date(marker.createdAt).toLocaleString()}</p>
                )}
                {marker.updatedAt && marker.updatedAt !== marker.createdAt && (
                  <p>Updated {new Date(marker.updatedAt).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 text-center text-sm text-muted-foreground">
            <p>No marker selected</p>
          </div>
        )}
      </aside>
    </>
  );
}

/* ─── Internal Components ────────────────────────────────────────────────── */

function DrawerSkeleton() {
  return (
    <div className="animate-pulse p-5 space-y-4" role="status" aria-label="Loading details">
      <div className="h-52 w-full rounded-md bg-muted" />
      <div className="h-5 w-24 rounded bg-muted" />
      <div className="space-y-2">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </div>
      <div className="h-20 w-full rounded bg-muted" />
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

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
