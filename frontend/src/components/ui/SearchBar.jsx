import { useState, useRef, useEffect, useCallback } from 'react';
import Input from './Input';

/**
 * ============================================================================
 * SEARCHBAR — Search with autocomplete and geocoding support
 * ============================================================================
 *
 * Purpose:
 *   Primary search interface for the map. Supports text search for markers
 *   (by title, author, category) and geocoding (address → coordinates).
 *   Floats over the map and shows autocomplete suggestions as the user types.
 *
 * Anatomy:
 *   SearchBar
 *   ├── Input (with search icon left, clear button right)
 *   └── SuggestionList (dropdown, conditionally rendered)
 *       └── SuggestionItem[] (repeating)
 *           ├── Icon (type indicator: marker, location, category)
 *           ├── Primary text
 *           └── Secondary text (subtitle/address)
 *
 * Design System Compliance:
 *   - Floating card aesthetic (backdrop-blur, shadow, border)
 *   - All colors via CSS variables
 *   - Focus management: arrow keys navigate suggestions, Escape closes
 *   - WCAG: combobox pattern with aria-expanded, aria-activedescendant
 *   - Mobile: full-width, touch targets ≥44px for suggestions
 *
 * Props:
 *   placeholder   — input placeholder text
 *   suggestions   — array of { id, label, subtitle?, type? }
 *   onSearch      — callback when user submits search (Enter or selection)
 *   onChange      — callback on input value change (for fetching suggestions)
 *   onSelect      — callback when a suggestion is selected
 *   onClear       — callback when search is cleared
 *   loading       — shows loading indicator in dropdown
 *   value         — controlled input value
 *   className     — additional container classes
 *
 * Leaflet Integration:
 *   Positioned absolutely over the map. Stops event propagation.
 *   onSelect typically triggers map.flyTo() for geocoding results.
 *
 * States:
 *   - idle (input empty, no suggestions)
 *   - typing (input has value, suggestions loading/visible)
 *   - loading (fetching suggestions)
 *   - open (suggestions visible)
 *   - empty (no results found)
 * ============================================================================
 */

/**
 * @param {object} props
 * @param {string} [props.placeholder='Search markers or places...']
 * @param {{ id: string, label: string, subtitle?: string, type?: string }[]} [props.suggestions]
 * @param {(query: string) => void} [props.onSearch]
 * @param {(value: string) => void} [props.onChange]
 * @param {(suggestion: object) => void} [props.onSelect]
 * @param {() => void} [props.onClear]
 * @param {boolean} [props.loading=false]
 * @param {string} [props.value]
 * @param {string} [props.className]
 */
export default function SearchBar({
  placeholder = 'Search markers or places...',
  suggestions = [],
  onSearch,
  onChange,
  onSelect,
  onClear,
  loading = false,
  value: controlledValue,
  className = '',
}) {
  const [internalValue, setInternalValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const containerRef = useRef(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const hasSuggestions = suggestions.length > 0;
  const showDropdown = isOpen && (hasSuggestions || loading || value.length > 0);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = useCallback(
    (e) => {
      const val = e.target.value;
      if (controlledValue === undefined) {
        setInternalValue(val);
      }
      setIsOpen(true);
      setActiveIndex(-1);
      if (onChange) onChange(val);
    },
    [controlledValue, onChange]
  );

  function handleClear() {
    if (controlledValue === undefined) {
      setInternalValue('');
    }
    setIsOpen(false);
    setActiveIndex(-1);
    if (onClear) onClear();
    inputRef.current?.focus();
  }

  function handleSelect(suggestion) {
    if (controlledValue === undefined) {
      setInternalValue(suggestion.label);
    }
    setIsOpen(false);
    setActiveIndex(-1);
    if (onSelect) onSelect(suggestion);
  }

  function handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          handleSelect(suggestions[activeIndex]);
        } else if (onSearch) {
          onSearch(value);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex];
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  const listboxId = 'searchbar-suggestions';

  return (
    <div
      ref={containerRef}
      className={[
        'relative w-full',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Search Input */}
      <Input
        ref={inputRef}
        type="search"
        size="lg"
        variant="default"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length > 0 && setIsOpen(true)}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-activedescendant={
          activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
        }
        aria-autocomplete="list"
        aria-label="Search markers or places"
        leftIcon={
          <SearchIcon />
        }
        rightElement={
          value.length > 0 ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="p-1 rounded-sm hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ClearIcon />
            </button>
          ) : null
        }
        className="shadow-sm"
      />

      {/* Suggestions Dropdown */}
      {showDropdown && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-border bg-card/95 backdrop-blur-sm shadow-lg"
        >
          {loading && (
            <li className="px-3 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Searching...
            </li>
          )}

          {!loading && hasSuggestions &&
            suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                id={`suggestion-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => handleSelect(suggestion)}
                className={[
                  'px-3 py-2.5 cursor-pointer flex items-center gap-3 text-sm transition-colors',
                  'min-h-[44px]',
                  index === activeIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'text-card-foreground hover:bg-accent/50',
                ].join(' ')}
              >
                <span className="shrink-0 text-muted-foreground" aria-hidden="true">
                  <SuggestionTypeIcon type={suggestion.type} />
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="truncate font-medium">{suggestion.label}</span>
                  {suggestion.subtitle && (
                    <span className="truncate text-xs text-muted-foreground">
                      {suggestion.subtitle}
                    </span>
                  )}
                </span>
              </li>
            ))}

          {!loading && !hasSuggestions && value.length > 0 && (
            <li className="px-3 py-3 text-sm text-muted-foreground text-center">
              No results found
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/* ─── Internal Icons ─────────────────────────────────────────────────────── */

function SearchIcon() {
  return (
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
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ClearIcon() {
  return (
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
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function SuggestionTypeIcon({ type }) {
  switch (type) {
    case 'marker':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case 'location':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2v4" /><path d="M12 18v4" /><path d="M2 12h4" /><path d="M18 12h4" />
        </svg>
      );
    case 'category':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
        </svg>
      );
    default:
      return <SearchIcon />;
  }
}
