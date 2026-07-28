import Button from './Button';

/**
 * ============================================================================
 * NAVBAR — Application's top navigation bar
 * ============================================================================
 *
 * Purpose:
 *   Persistent top navigation bar that provides brand identity, primary
 *   navigation, and user actions. In a GIS context, it must remain compact
 *   and neutral so the map retains visual dominance. Uses backdrop-blur to
 *   float over the map when in full-screen map mode.
 *
 * Anatomy:
 *   Navbar
 *   ├── Brand (logo/app name — left)
 *   ├── NavLinks (center or left-aligned, desktop only)
 *   ├── Actions (right — auth buttons, user avatar, dark mode toggle)
 *   └── MobileMenu (hamburger → slide-down or sheet, mobile only)
 *
 * Design System Compliance:
 *   - bg-background/90 + backdrop-blur-md (floats over map)
 *   - Border-bottom with --border
 *   - Text uses --foreground, links use --muted-foreground → --foreground on hover
 *   - Active link uses --primary
 *   - Height: h-14 (56px) — compact for map context
 *   - z-index above map tiles, below modals (z-50)
 *   - WCAG: <nav> landmark, aria-label, keyboard-navigable links
 *   - Mobile: hamburger with accessible expanded state
 *
 * Props:
 *   brand           — app name or logo element
 *   links           — array of { label, href, active? } for navigation
 *   user            — current user object (null if not authenticated)
 *   onLogin         — callback for login action
 *   onLogout        — callback for logout action
 *   onNavigate      — callback for link navigation
 *   rightContent    — custom content for the right section
 *   className       — additional classes
 *
 * Leaflet Integration:
 *   Positioned fixed at the top of the viewport. The map's height calculation
 *   must account for the navbar height (h-14 = 56px). The navbar does NOT
 *   interact with Leaflet — it's purely a layout component above the map.
 *
 * States:
 *   - authenticated (shows user info + logout)
 *   - unauthenticated (shows login/register buttons)
 *   - mobile menu open/closed
 *
 * Responsive:
 *   - Desktop: full horizontal layout with visible links
 *   - Mobile: brand + hamburger, links in expandable menu
 * ============================================================================
 */

import { useState } from 'react';

/**
 * @param {object} props
 * @param {React.ReactNode} [props.brand]
 * @param {{ label: string, href?: string, active?: boolean, onClick?: () => void }[]} [props.links=[]]
 * @param {object|null} [props.user=null]
 * @param {() => void} [props.onLogin]
 * @param {() => void} [props.onLogout]
 * @param {(link: object) => void} [props.onNavigate]
 * @param {React.ReactNode} [props.rightContent]
 * @param {string} [props.className]
 */
export default function Navbar({
  brand,
  links = [],
  user = null,
  onLogin,
  onLogout,
  onNavigate,
  rightContent,
  className = '',
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav
      className={[
        'fixed top-0 left-0 right-0 z-50',
        'h-14 bg-background/90 backdrop-blur-md',
        'border-b border-border',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Navegación principal"
    >
      <div className="h-full px-4 flex items-center justify-between max-w-screen-2xl mx-auto">
        {/* Left: Brand */}
        <div className="flex items-center gap-6">
          {/* Brand / Logo */}
          <div className="flex items-center gap-2 shrink-0">
            {brand || (
              <span className="text-lg font-bold text-foreground tracking-tight">
                MIAU
              </span>
            )}
          </div>

          {/* Desktop Links */}
          <ul className="hidden md:flex items-center gap-1" role="list">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href || '#'}
                  onClick={(e) => {
                    if (link.onClick || onNavigate) {
                      e.preventDefault();
                      if (link.onClick) link.onClick();
                      else if (onNavigate) onNavigate(link);
                    }
                  }}
                  className={[
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    link.active
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                  ].join(' ')}
                  aria-current={link.active ? 'page' : undefined}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Custom right content */}
          {rightContent}

          {/* Auth Actions (desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                  {user.username || user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  Cerrar sesión
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={onLogin}>
                  Iniciar sesión
                </Button>
                <Button variant="primary" size="sm" onClick={onLogin}>
                  Registrarse
                </Button>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden absolute top-14 left-0 right-0 bg-card/95 backdrop-blur-md border-b border-border shadow-lg"
        >
          <div className="px-4 py-3 space-y-1">
            {/* Mobile Links */}
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href || '#'}
                onClick={(e) => {
                  if (link.onClick || onNavigate) {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    if (link.onClick) link.onClick();
                    else if (onNavigate) onNavigate(link);
                  }
                }}
                className={[
                  'block px-3 py-2.5 rounded-md text-sm font-medium transition-colors min-h-[44px] flex items-center',
                  link.active
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground hover:bg-accent',
                ].join(' ')}
                aria-current={link.active ? 'page' : undefined}
              >
                {link.label}
              </a>
            ))}

            {/* Mobile Auth */}
            <div className="border-t border-border pt-3 mt-2 space-y-2">
              {user ? (
                <>
                  <p className="text-sm text-muted-foreground px-3">
                    {user.username || user.email}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onLogout) onLogout();
                    }}
                  >
                    Cerrar sesión
                  </Button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onLogin) onLogin();
                    }}
                  >
                    Iniciar sesión
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onLogin) onLogin();
                    }}
                  >
                    Registrarse
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─── Internal Icons ─────────────────────────────────────────────────────── */

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
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
