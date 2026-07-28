# Theme: MIAU SunsetDark

## About

A cartographic-first theme for the MIAU Urban Art Map application. Built on CartoColors "SunsetDark" palette with neutral slate backgrounds that keep the interactive map as the visual focus. Interface controls remain subdued; color is reserved for interactive elements, data visualization, and map markers.

**Base:** Default (New York) structure
**Accent palette:** CartoColors SunsetDark — `#fcde9c` `#faa476` `#f0746e` `#e34f6f` `#dc3977` `#b9257a` `#7c1d6f`
**Base color family:** Slate (cool neutral with slight blue undertone)
**Design intent:** Professional, minimal, cartographic, accessible, mobile-first

## Design Decisions

- **Neutral UI surfaces** — Slate-based backgrounds ensure the map remains the dominant visual element
- **Primary = `#dc3977`** — A vibrant but not overwhelming pink from the SunsetDark midpoint; high contrast on both light and dark backgrounds
- **Destructive = `#e34f6f`** — Drawn from the palette's warm-red range; familiar as an error/danger signal
- **Accent = subtle slate** — Hover/active states use barely-tinted surfaces so floating panels don't compete with the map
- **Chart colors = full SunsetDark ramp** — Direct mapping for marker categories and data visualization layers
- **Sidebar uses deep purple (`#7c1d6f`)** — The darkest palette value anchors navigation without bleeding into map space

## shadCN CSS Variables

### Core Variables

| CSS Variable | Light (oklch) | Light (hex) | Dark (oklch) | Dark (hex) |
|---|---|---|---|---|
| `--background` | `oklch(0.985 0.002 247)` | `#f8fafc` | `oklch(0.129 0.013 256)` | `#0f172a` |
| `--foreground` | `oklch(0.208 0.013 256)` | `#1e293b` | `oklch(0.968 0.003 247)` | `#f1f5f9` |
| `--card` | `oklch(1 0 0)` | `#ffffff` | `oklch(0.179 0.013 256)` | `#1e293b` |
| `--card-foreground` | `oklch(0.208 0.013 256)` | `#1e293b` | `oklch(0.968 0.003 247)` | `#f1f5f9` |
| `--popover` | `oklch(1 0 0)` | `#ffffff` | `oklch(0.208 0.013 256)` | `#1e293b` |
| `--popover-foreground` | `oklch(0.208 0.013 256)` | `#1e293b` | `oklch(0.968 0.003 247)` | `#f1f5f9` |
| `--primary` | `oklch(0.556 0.200 350)` | `#dc3977` | `oklch(0.630 0.205 350)` | `#e85490` |
| `--primary-foreground` | `oklch(0.985 0.002 247)` | `#f8fafc` | `oklch(0.985 0.002 247)` | `#f8fafc` |
| `--secondary` | `oklch(0.968 0.003 247)` | `#f1f5f9` | `oklch(0.257 0.013 256)` | `#334155` |
| `--secondary-foreground` | `oklch(0.208 0.013 256)` | `#1e293b` | `oklch(0.968 0.003 247)` | `#f1f5f9` |
| `--muted` | `oklch(0.968 0.003 247)` | `#f1f5f9` | `oklch(0.257 0.013 256)` | `#334155` |
| `--muted-foreground` | `oklch(0.554 0.013 256)` | `#64748b` | `oklch(0.704 0.010 256)` | `#94a3b8` |
| `--accent` | `oklch(0.951 0.004 247)` | `#e2e8f0` | `oklch(0.371 0.013 256)` | `#475569` |
| `--accent-foreground` | `oklch(0.208 0.013 256)` | `#1e293b` | `oklch(0.968 0.003 247)` | `#f1f5f9` |
| `--destructive` | `oklch(0.586 0.190 15)` | `#e34f6f` | `oklch(0.650 0.185 15)` | `#f0746e` |
| `--destructive-foreground` | `oklch(0.985 0.002 247)` | `#f8fafc` | `oklch(0.985 0.002 247)` | `#f8fafc` |
| `--border` | `oklch(0.916 0.005 247)` | `#e2e8f0` | `oklch(0.257 0.013 256)` | `#334155` |
| `--input` | `oklch(0.916 0.005 247)` | `#e2e8f0` | `oklch(0.371 0.013 256)` | `#475569` |
| `--ring` | `oklch(0.556 0.200 350)` | `#dc3977` | `oklch(0.630 0.205 350)` | `#e85490` |

| CSS Variable | Value |
|---|---|
| `--radius` | `0.5rem` |

### Chart Variables

Mapped directly from the CartoColors SunsetDark 7-class ramp for marker categories and data visualization:

| CSS Variable | Light (oklch) | Light (hex) | Dark (oklch) | Dark (hex) |
|---|---|---|---|---|
| `--chart-1` | `oklch(0.891 0.082 88)` | `#fcde9c` | `oklch(0.891 0.082 88)` | `#fcde9c` |
| `--chart-2` | `oklch(0.786 0.113 52)` | `#faa476` | `oklch(0.786 0.113 52)` | `#faa476` |
| `--chart-3` | `oklch(0.650 0.170 25)` | `#f0746e` | `oklch(0.650 0.170 25)` | `#f0746e` |
| `--chart-4` | `oklch(0.586 0.190 15)` | `#e34f6f` | `oklch(0.586 0.190 15)` | `#e34f6f` |
| `--chart-5` | `oklch(0.556 0.200 350)` | `#dc3977` | `oklch(0.556 0.200 350)` | `#dc3977` |

### Sidebar Variables

| CSS Variable | Light (oklch) | Light (hex) | Dark (oklch) | Dark (hex) |
|---|---|---|---|---|
| `--sidebar` | `oklch(0.985 0.002 247)` | `#f8fafc` | `oklch(0.179 0.013 256)` | `#1e293b` |
| `--sidebar-foreground` | `oklch(0.208 0.013 256)` | `#1e293b` | `oklch(0.968 0.003 247)` | `#f1f5f9` |
| `--sidebar-primary` | `oklch(0.420 0.200 320)` | `#7c1d6f` | `oklch(0.556 0.200 350)` | `#dc3977` |
| `--sidebar-primary-foreground` | `oklch(0.985 0.002 247)` | `#f8fafc` | `oklch(0.985 0.002 247)` | `#f8fafc` |
| `--sidebar-accent` | `oklch(0.951 0.004 247)` | `#e2e8f0` | `oklch(0.257 0.013 256)` | `#334155` |
| `--sidebar-accent-foreground` | `oklch(0.208 0.013 256)` | `#1e293b` | `oklch(0.968 0.003 247)` | `#f1f5f9` |
| `--sidebar-border` | `oklch(0.916 0.005 247)` | `#e2e8f0` | `oklch(0.257 0.013 256)` | `#334155` |
| `--sidebar-ring` | `oklch(0.556 0.200 350)` | `#dc3977` | `oklch(0.630 0.205 350)` | `#e85490` |

### Typography Variables

| CSS Variable | Value |
|---|---|
| `--font-sans` | `Inter, system-ui, -apple-system, sans-serif` |
| `--font-mono` | `JetBrains Mono, ui-monospace, monospace` |

---

## Tailwind Mapping

In Tailwind v3, CSS variables are registered via `tailwind.config.js` `theme.extend.colors`:

| Tailwind Utility Pattern | CSS Variable | Example |
|---|---|---|
| `bg-{name}` | `var(--{name})` | `bg-primary` → `var(--primary)` |
| `text-{name}-foreground` | `var(--{name}-foreground)` | `text-primary-foreground` |
| `border-{name}` | `var(--{name})` | `border-border` → `var(--border)` |
| `ring-{name}` | `var(--{name})` | `ring-ring` → `var(--ring)` |

## Global Styles

### Body

- Background: `var(--background)` — `#f8fafc` (light), `#0f172a` (dark)
- Text color: `var(--foreground)` — `#1e293b` (light), `#f1f5f9` (dark)
- Font family: `var(--font-sans)` — `Inter, system-ui, -apple-system, sans-serif`

### Surfaces

- Card: `#ffffff` (light), `#1e293b` (dark) — floating panels, drawers, modals
- Popover: `#ffffff` (light), `#1e293b` (dark) — marker popups, tooltips
- Muted surfaces: `#f1f5f9` (light), `#334155` (dark) — filter panels, legends
- Sidebar/Nav: `#f8fafc` (light), `#1e293b` (dark)

### Map Context

- All floating UI uses `backdrop-blur` + subtle transparency to maintain map visibility
- Card surfaces over the map: `bg-card/95 backdrop-blur-sm`
- Navigation bar: `bg-background/90 backdrop-blur-md`
- Touch targets minimum 44px for mobile-first interaction

## Usage Notes

This theme is purpose-built for a GIS/cartographic application. Key differences from a standard dashboard theme:

1. **Neutral dominance** — UI chrome is intentionally desaturated so the map's visual information remains primary
2. **Color budget** — The SunsetDark palette is the application's only chromatic identity; avoid introducing additional saturated colors
3. **Floating UI** — Panels over the map should use transparency + blur rather than opaque backgrounds
4. **Chart colors are marker colors** — The chart palette doubles as the marker category palette on the map
5. **Ring = Primary** — Focus ring uses the brand color for visible keyboard navigation over the map

Variable hierarchy:
1. CSS Variables in `:root` / `.dark` — theming layer
2. Tailwind utilities via `tailwind.config.js` — mapped from CSS variables
3. Component classes — reference utilities, never hardcoded values

---

## Theme UI Rules

Rules specific to the MIAU SunsetDark theme:

1. **Map supremacy** — No interface element should use a background color more saturated than `--muted`. Only interactive elements (buttons, links, active tabs) use `--primary`.
2. **Floating panels** — Any panel overlaying the map MUST use `backdrop-blur` with 90–95% opacity maximum.
3. **Touch targets** — All interactive elements must be minimum 44×44px on mobile viewports.
4. **Color-as-data** — The SunsetDark palette (`--chart-1` through `--chart-5`) is reserved for data visualization (markers, legends, category badges). Do not use chart colors for UI decoration.
5. **Dark mode = cartographic dark basemap** — Dark mode pairs with dark map tiles. The UI recedes further to let the map glow.

---

## CartoColors SunsetDark Reference

Full 7-class palette for extended use (markers, legends, gradients):

| Step | Hex | Usage |
|---|---|---|
| 1 | `#fcde9c` | Lightest — low density / least recent |
| 2 | `#faa476` | Light-warm |
| 3 | `#f0746e` | Mid-warm — also `--destructive` light |
| 4 | `#e34f6f` | Mid — also `--destructive` dark reference |
| 5 | `#dc3977` | Mid-saturated — `--primary` |
| 6 | `#b9257a` | Deep magenta |
| 7 | `#7c1d6f` | Darkest — sidebar accent, map concentration |
