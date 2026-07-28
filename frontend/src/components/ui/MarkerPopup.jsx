/**
 * ============================================================================
 * MARKERPOPUP — Floating card associated with a map pin
 * ============================================================================
 *
 * Purpose:
 *   Compact information card that appears when a user clicks/taps a marker on
 *   the map. Shows a quick summary (title, category, author, thumbnail) and
 *   provides a CTA to open the full MarkerDetailDrawer. Rendered inside
 *   Leaflet's <Popup> component but uses our design system styling.
 *
 * Anatomy:
 *   MarkerPopup
 *   ├── Thumbnail (optional image)
 *   ├── Content
 *   │   ├── Title
 *   │   ├── CategoryBadge
 *   │   ├── Author (optional)
 *   │   └── Date (optional)
 *   └── Actions
 *       └── "View Details" button
 *
 * Design System Compliance:
 *   - Uses --card, --card-foreground, --border for container
 *   - Category badge uses chart/sunset colors for visual data mapping
 *   - Button uses ghost variant (lightweight inside popup)
 *   - WCAG: article role, readable text contrast, touch target for button
 *   - No hardcoded colors — all via CSS variables or sunset palette tokens
 *
 * Props:
 *   marker         — the marker data object
 *   onViewDetails  — callback to open full detail drawer
 *   categoryColors — optional map of category → color for badge
 *
 * Leaflet Integration:
 *   This component is the CONTENT rendered inside react-leaflet's <Popup>.
 *   It does NOT render the <Popup> wrapper itself — that's done in MarkerLayer.
 *   Leaflet manages popup positioning and open/close state.
 *
 * States:
 *   - default (showing marker info)
 *   - no-image (fallback without thumbnail)
 * ============================================================================
 */

import Button from './Button';

/** Default category → sunset color mapping */
const DEFAULT_CATEGORY_COLORS = {
  mural: 'bg-sunset-500',
  graffiti: 'bg-sunset-300',
  sculpture: 'bg-sunset-700',
};

/**
 * @param {object} props
 * @param {object} props.marker — Marker object with title, category, author, date, imagePath
 * @param {(marker: object) => void} [props.onViewDetails]
 * @param {Record<string, string>} [props.categoryColors] — category → Tailwind bg class
 */
export default function MarkerPopup({
  marker,
  onViewDetails,
  categoryColors = DEFAULT_CATEGORY_COLORS,
}) {
  if (!marker) return null;

  const {
    title,
    category,
    author,
    date,
    imagePath,
  } = marker;

  const badgeColor = categoryColors[category] || 'bg-primary';

  return (
    <article
      className="w-56 sm:w-64 font-sans"
      aria-label={`Marker: ${title}`}
    >
      {/* Thumbnail */}
      {imagePath && (
        <div className="relative -mx-[1px] -mt-[1px] overflow-hidden rounded-t-md">
          <img
            src={resolveImageUrl(imagePath)}
            alt={`Artwork: ${title}`}
            className="w-full h-28 object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-3 space-y-1.5">
        {/* Title */}
        <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
          {title}
        </h3>

        {/* Category Badge */}
        {category && (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium capitalize`}
          >
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${badgeColor}`}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{category}</span>
          </span>
        )}

        {/* Author */}
        {author && (
          <p className="text-xs text-muted-foreground truncate">
            By {author}
          </p>
        )}

        {/* Date */}
        {date && (
          <p className="text-xs text-muted-foreground">
            {new Date(date).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Actions */}
      {onViewDetails && (
        <div className="px-3 pb-3">
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={() => onViewDetails(marker)}
            className="text-primary hover:text-primary/80"
          >
            View Details
          </Button>
        </div>
      )}
    </article>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/**
 * Resolves image URL — handles both absolute URLs and relative paths.
 */
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
