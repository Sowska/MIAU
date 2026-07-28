/**
 * ============================================================================
 * LEGEND — Map reference and color key
 * ============================================================================
 *
 * Purpose:
 *   Displays a visual key mapping colors/icons to marker categories on the map.
 *   Helps users decode what each color or symbol represents. Typically floats
 *   in the bottom-left corner of the map viewport.
 *
 * Anatomy:
 *   Legend
 *   ├── LegendHeader (optional title)
 *   └── LegendItem[] (repeating)
 *       ├── ColorSwatch (circle or square)
 *       ├── Label (category name)
 *       └── Count (optional marker count)
 *
 * Design System Compliance:
 *   - Container uses floating card variant (backdrop-blur over map)
 *   - Swatch colors use the sunset-* palette (CartoColors SunsetDark)
 *   - Text uses --card-foreground / --muted-foreground
 *   - Collapsible on mobile to save screen real estate
 *   - WCAG: color is never the sole information carrier — labels always present
 *
 * Props:
 *   items[]  — array of { color, label, count? } objects
 *   title    — optional legend heading
 *   collapsible — whether to allow collapse on mobile
 *   collapsed — controlled collapsed state
 *   onToggle — callback when collapse state changes
 *
 * Leaflet Integration:
 *   Positioned absolutely over the map via CSS. Stops event propagation.
 *   Does not interact with Leaflet's control system — it's a React overlay.
 *
 * States:
 *   - expanded (default on desktop)
 *   - collapsed (minimized to icon on mobile)
 *   - empty (no items — renders nothing)
 * ============================================================================
 */

import { useState } from 'react';

/**
 * @param {object} props
 * @param {{ color: string, label: string, count?: number }[]} props.items
 * @param {string} [props.title='Legend']
 * @param {boolean} [props.collapsible=true]
 * @param {boolean} [props.collapsed] — controlled mode
 * @param {(collapsed: boolean) => void} [props.onToggle]
 * @param {string} [props.className]
 */
export default function Legend({
  items = [],
  title = 'Leyenda',
  collapsible = true,
  collapsed: controlledCollapsed,
  onToggle,
  className = '',
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  function handleToggle() {
    const next = !isCollapsed;
    if (onToggle) {
      onToggle(next);
    } else {
      setInternalCollapsed(next);
    }
  }

  // Don't render if no items
  if (!items || items.length === 0) return null;

  return (
    <div
      className={[
        'bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-md',
        'text-card-foreground',
        'transition-all duration-200 ease-out',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="region"
      aria-label={title}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {collapsible && (
          <button
            type="button"
            onClick={handleToggle}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? `Expandir ${title}` : `Colapsar ${title}`}
            className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}
      </div>

      {/* Items */}
      {!isCollapsed && (
        <ul className="px-3 pb-3 space-y-1.5" role="list">
          {items.map((item, index) => (
            <LegendItem key={`${item.label}-${index}`} {...item} />
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * LegendItem — Single legend entry with color swatch and label.
 * @param {object} props
 * @param {string} props.color — Tailwind class OR hex value for the swatch
 * @param {string} props.label — Human-readable category name
 * @param {number} [props.count] — Optional marker count
 */
export function LegendItem({ color, label, count }) {
  // Determine if color is a Tailwind class (starts with bg-) or a raw value
  const isTailwindClass = color.startsWith('bg-');

  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={[
          'inline-block h-3 w-3 rounded-full shrink-0 border border-border/50',
          isTailwindClass ? color : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={!isTailwindClass ? { backgroundColor: color } : undefined}
        aria-hidden="true"
      />
      <span className="text-card-foreground truncate">{label}</span>
      {count !== undefined && (
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {count}
        </span>
      )}
    </li>
  );
}
