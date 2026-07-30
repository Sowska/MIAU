import { useState } from 'react';
import Button from './Button';
import Input from './Input';

/**
 * ============================================================================
 * FILTERPANEL — Side/bottom panel for filtering map markers
 * ============================================================================
 *
 * Purpose:
 *   Provides controls for filtering urban art markers on the map by category,
 *   author, date range, and other criteria. On desktop, floats as a side panel.
 *   On mobile, collapses into a bottom sheet / expandable strip.
 *
 * Anatomy:
 *   FilterPanel
 *   ├── FilterHeader (title + collapse toggle + clear all)
 *   ├── FilterSection[] (repeating groups)
 *   │   ├── SectionLabel
 *   │   └── FilterControl (checkbox group, input, date picker, etc.)
 *   └── FilterFooter (apply/clear actions on mobile)
 *
 * Design System Compliance:
 *   - Floating card aesthetic with backdrop-blur over map
 *   - All colors via CSS variables
 *   - Checkbox/radio use --primary for checked state
 *   - Input fields use the Input component (theme tokens)
 *   - Buttons use Button component variants
 *   - WCAG: fieldset/legend for checkbox groups, label associations
 *   - Collapsible sections for mobile space efficiency
 *
 * Props:
 *   categories         — available category options
 *   selectedCategories — currently selected categories
 *   author             — current author filter value
 *   startDate          — current start date
 *   endDate            — current end date
 *   onCategoryChange   — callback for category toggle
 *   onAuthorChange     — callback for author input change
 *   onStartDateChange  — callback for start date change
 *   onEndDateChange    — callback for end date change
 *   onClearAll         — callback to reset all filters
 *   collapsed          — controlled collapsed state
 *   onToggleCollapse   — callback when panel collapse toggles
 *   className          — additional container classes
 *
 * Leaflet Integration:
 *   Positioned absolutely over the map. Stops event propagation.
 *   Filter changes update Zustand store → MarkerLayer reacts automatically.
 *   Panel does NOT directly interact with Leaflet — it's purely a React overlay.
 *
 * States:
 *   - expanded (all filter sections visible)
 *   - collapsed (mobile: header only visible)
 *   - active (filters applied — badge count shown)
 *   - empty (no filters active)
 *
 * Responsive:
 *   - Desktop: vertical side panel, always expanded
 *   - Mobile: collapsible, expands from bottom or top strip
 * ============================================================================
 */

/**
 * @param {object} props
 * @param {string[]} [props.categories=['mural','graffiti','sculpture']]
 * @param {string[]} [props.selectedCategories=[]]
 * @param {string} [props.author='']
 * @param {string|null} [props.startDate=null]
 * @param {string|null} [props.endDate=null]
 * @param {(category: string) => void} [props.onCategoryChange]
 * @param {(value: string) => void} [props.onAuthorChange]
 * @param {(value: string|null) => void} [props.onStartDateChange]
 * @param {(value: string|null) => void} [props.onEndDateChange]
 * @param {() => void} [props.onClearAll]
 * @param {boolean} [props.collapsed]
 * @param {() => void} [props.onToggleCollapse]
 * @param {string} [props.className]
 */
export default function FilterPanel({
  categories = ['mural', 'graffiti', 'sculpture'],
  selectedCategories = [],
  author = '',
  startDate = null,
  endDate = null,
  onCategoryChange,
  onAuthorChange,
  onStartDateChange,
  onEndDateChange,
  onClearAll,
  collapsed: controlledCollapsed,
  onToggleCollapse,
  className = '',
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed =
    controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const activeFilterCount =
    selectedCategories.length +
    (author ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  function handleToggle() {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  }

  return (
    <aside
      className={[
        'bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg',
        'text-card-foreground',
        'transition-all duration-200 ease-out',
        'w-full sm:w-72',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Filtrar marcadores"
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Filtros</h2>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Limpiar todos los filtros"
            >
              Limpiar
            </button>
          )}
          <button
            type="button"
            onClick={handleToggle}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expandir filtros' : 'Colapsar filtros'}
            className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
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
              className={`transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Sections */}
      {!isCollapsed && (
        <div className="p-4 space-y-5">
          {/* Category Checkboxes */}
          <FilterSection label="Categoría">
            <div className="space-y-2">
              {categories.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-2.5 cursor-pointer group min-h-[36px]"
                >
                  <input
                    type="checkbox"
                    name={`filter-category-${cat}`}
                    checked={selectedCategories.includes(cat)}
                    onChange={() => onCategoryChange && onCategoryChange(cat)}
                    className="h-4 w-4 rounded border-input text-primary bg-background focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors"
                  />
                  <span className="text-sm capitalize text-foreground group-hover:text-primary transition-colors">
                    {cat}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Author Search */}
          <FilterSection label="Artista">
            <Input
              id="filter-author"
              type="text"
              size="sm"
              placeholder="Buscar por artista..."
              value={author}
              onChange={(e) => onAuthorChange && onAuthorChange(e.target.value)}
              aria-label="Filtrar por nombre de artista"
            />
          </FilterSection>

          {/* Date Range */}
          <FilterSection label="Rango de fechas">
            <div className="space-y-2">
              <div>
                <label
                  htmlFor="filter-start"
                  className="block text-xs text-muted-foreground mb-1"
                >
                  Desde
                </label>
                <Input
                  id="filter-start"
                  type="date"
                  size="sm"
                  value={startDate || ''}
                  onChange={(e) =>
                    onStartDateChange && onStartDateChange(e.target.value || null)
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="filter-end"
                  className="block text-xs text-muted-foreground mb-1"
                >
                  Hasta
                </label>
                <Input
                  id="filter-end"
                  type="date"
                  size="sm"
                  value={endDate || ''}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) =>
                    onEndDateChange && onEndDateChange(e.target.value || null)
                  }
                />
              </div>
            </div>
          </FilterSection>

          {/* Mobile: explicit clear button */}
          <div className="sm:hidden pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={onClearAll}
              disabled={activeFilterCount === 0}
            >
              Limpiar todos los filtros
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}

/* ─── Internal Sub-components ──────────────────────────────────────────── */

/**
 * FilterSection — labeled group within the filter panel.
 */
function FilterSection({ label, children }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </legend>
      {children}
    </fieldset>
  );
}
