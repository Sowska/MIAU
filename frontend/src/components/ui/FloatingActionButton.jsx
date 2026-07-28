import { forwardRef } from 'react';

/**
 * ============================================================================
 * FLOATING ACTION BUTTON (FAB) — Quick map action trigger
 * ============================================================================
 *
 * Purpose:
 *   Floating circular button anchored to the map viewport for primary quick
 *   actions (e.g., "Add Marker"). Remains visible regardless of scroll or
 *   panel state. Positioned absolutely over the map container.
 *
 * Anatomy:
 *   ┌─────────────┐
 *   │  [  Icon  ] │  ← Circular button with icon
 *   │             │
 *   │  [Tooltip]  │  ← Optional tooltip on hover/focus (aria-label always)
 *   └─────────────┘
 *
 * Design System Compliance:
 *   - Uses --primary / --primary-foreground for brand presence
 *   - Shadow for elevation over map tiles
 *   - Focus-visible ring with --ring for keyboard navigation over map
 *   - Min 48px touch target (FABs are mobile-primary)
 *   - z-index positions above map tiles but below modals
 *
 * Variants:
 *   - primary:   Brand color FAB (default, main CTA)
 *   - secondary: Subtle FAB for supporting actions
 *   - muted:     Minimal FAB for utility actions (locate, layers)
 *
 * Sizes:
 *   - sm: 40px (compact secondary actions)
 *   - md: 48px (default)
 *   - lg: 56px (prominent primary action)
 *
 * Leaflet Integration:
 *   Positioned with CSS fixed/absolute over the map container.
 *   Must stop event propagation so clicks don't trigger map events.
 *   Typical placement: bottom-right (mobile), bottom-right (desktop).
 *
 * States:
 *   - default, hover (scale up slightly), active (scale down), focus-visible, disabled
 * ============================================================================
 */

const fabVariants = {
  primary:
    'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:bg-primary/80',
  secondary:
    'bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/80 active:bg-secondary/70',
  muted:
    'bg-card/95 text-foreground shadow-md backdrop-blur-sm border border-border hover:bg-accent active:bg-accent/80',
};

const fabSizes = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-14 w-14',
};

const iconSizes = {
  sm: '[&>svg]:h-4 [&>svg]:w-4',
  md: '[&>svg]:h-5 [&>svg]:w-5',
  lg: '[&>svg]:h-6 [&>svg]:w-6',
};

/**
 * @param {object} props
 * @param {'primary'|'secondary'|'muted'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {string} props.label — Required accessible label (aria-label)
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children — Icon element
 */
const FloatingActionButton = forwardRef(function FloatingActionButton(
  {
    variant = 'primary',
    size = 'md',
    label,
    disabled = false,
    className = '',
    children,
    ...props
  },
  ref
) {
  const baseClasses = [
    'inline-flex items-center justify-center rounded-full',
    'transition-all duration-150 ease-out',
    'hover:scale-105 active:scale-95',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none cursor-pointer',
  ].join(' ');

  const variantClasses = fabVariants[variant] || fabVariants.primary;
  const sizeClasses = fabSizes[size] || fabSizes.md;
  const iconClass = iconSizes[size] || iconSizes.md;

  return (
    <button
      ref={ref}
      type="button"
      className={[baseClasses, variantClasses, sizeClasses, iconClass, className]
        .filter(Boolean)
        .join(' ')}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (props.onClick) props.onClick(e);
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </button>
  );
});

export default FloatingActionButton;
