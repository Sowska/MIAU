/**
 * ============================================================================
 * CARD — Information container
 * ============================================================================
 *
 * Purpose:
 *   Container for grouped information. In the GIS context, used for marker
 *   popups, detail panels, filter containers, and floating UI elements that
 *   overlay the map.
 *
 * Anatomy:
 *   Card
 *   ├── CardHeader (optional)
 *   │   ├── CardTitle
 *   │   └── CardDescription
 *   ├── CardContent
 *   └── CardFooter (optional)
 *
 * Design System Compliance:
 *   - All colors via CSS variables (--card, --card-foreground, --border)
 *   - Light/dark mode via variable resolution
 *   - When floating over the map: uses backdrop-blur + 95% opacity
 *   - No decorative use — cards contain user interactions or critical info
 *
 * Variants:
 *   - default:  Solid background with border (forms, detail panels)
 *   - floating: Semi-transparent with backdrop blur (over map)
 *   - ghost:    No border/shadow, content grouping only
 *
 * Map Integration:
 *   Floating variant designed for panels overlaying the map. Uses
 *   bg-card/95 + backdrop-blur-sm so the map remains partially visible.
 *   Must stop event propagation to prevent map interactions through the card.
 * ============================================================================
 */

const cardVariants = {
  default: 'bg-card text-card-foreground border border-border shadow-sm',
  floating: 'bg-card/95 text-card-foreground border border-border shadow-lg backdrop-blur-sm',
  ghost: 'bg-transparent text-card-foreground',
};

/**
 * @param {object} props
 * @param {'default'|'floating'|'ghost'} [props.variant='default']
 * @param {boolean} [props.stopPropagation=false] — prevent map click-through
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export function Card({
  variant = 'default',
  stopPropagation = false,
  className = '',
  children,
  ...props
}) {
  const variantClasses = cardVariants[variant] || cardVariants.default;

  const handleEvent = stopPropagation
    ? (e) => {
        e.stopPropagation();
      }
    : undefined;

  return (
    <div
      className={`rounded-lg ${variantClasses} ${className}`}
      onClick={handleEvent}
      onDoubleClick={handleEvent}
      onMouseDown={handleEvent}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardHeader — top section with title and optional description.
 */
export function CardHeader({ className = '', children, ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 p-4 pb-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * CardTitle — heading element inside CardHeader.
 * @param {'h2'|'h3'|'h4'} [props.as='h3']
 */
export function CardTitle({ as: Component = 'h3', className = '', children, ...props }) {
  return (
    <Component
      className={`text-lg font-semibold leading-tight text-card-foreground ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * CardDescription — supporting text below the title.
 */
export function CardDescription({ className = '', children, ...props }) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`} {...props}>
      {children}
    </p>
  );
}

/**
 * CardContent — main body of the card.
 */
export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * CardFooter — bottom section, typically for actions.
 */
export function CardFooter({ className = '', children, ...props }) {
  return (
    <div className={`flex items-center gap-2 p-4 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Card;
