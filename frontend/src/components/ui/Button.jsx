import { forwardRef } from 'react';

/**
 * ============================================================================
 * BUTTON — Primary interactive element
 * ============================================================================
 *
 * Purpose:
 *   Triggers actions across the GIS interface. Used for form submissions,
 *   navigation, map interactions, and contextual actions within panels.
 *
 * Anatomy:
 *   [Icon (optional)] [Label] [Icon (optional)]
 *   └── Rendered as <button> or <a> depending on `as` prop
 *
 * Design System Compliance:
 *   - All colors via CSS variables (no hardcoded values)
 *   - Light/dark mode support via variable resolution
 *   - WCAG 2.2 AA: min 44px touch target on mobile, visible focus ring
 *   - Focus-visible ring uses --ring (brand color over map)
 *
 * Variants:
 *   - primary:     Solid background, high-contrast actions (CTA, submit)
 *   - secondary:   Subtle background, supporting actions
 *   - destructive: Red/danger actions (delete marker)
 *   - outline:     Border only, neutral actions
 *   - ghost:       No background, inline actions (toolbar, navigation)
 *   - link:        Text-only, underlined on hover
 *
 * Sizes:
 *   - sm:  h-8  px-3  text-xs   (compact toolbar buttons)
 *   - md:  h-10 px-4  text-sm   (default)
 *   - lg:  h-12 px-6  text-base (prominent CTAs)
 *   - icon: h-10 w-10           (icon-only, square)
 *
 * States:
 *   - default, hover, active, focus-visible, disabled, loading
 * ============================================================================
 */

const variants = {
  primary:
    'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/80',
  secondary:
    'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:bg-secondary/70',
  destructive:
    'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/80',
  outline:
    'border border-input bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground',
  ghost:
    'text-foreground hover:bg-accent hover:text-accent-foreground',
  link:
    'text-primary underline-offset-4 hover:underline',
};

const sizes = {
  sm: 'h-8 px-3 text-xs rounded-sm gap-1.5',
  md: 'h-10 px-4 text-sm rounded-md gap-2',
  lg: 'h-12 px-6 text-base rounded-lg gap-2.5',
  icon: 'h-10 w-10 rounded-md',
};

/**
 * @param {object} props
 * @param {'primary'|'secondary'|'destructive'|'outline'|'ghost'|'link'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'|'icon'} [props.size='md']
 * @param {boolean} [props.loading=false]
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.fullWidth=false]
 * @param {React.ReactNode} [props.leftIcon]
 * @param {React.ReactNode} [props.rightIcon]
 * @param {'button'|'a'} [props.as='button']
 * @param {React.ReactNode} props.children
 */
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    as: Component = 'button',
    className = '',
    children,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  const baseClasses = [
    'inline-flex items-center justify-center font-medium',
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none',
    // Mobile touch target
    'min-h-[44px] sm:min-h-0',
  ].join(' ');

  const variantClasses = variants[variant] || variants.primary;
  const sizeClasses = sizes[size] || sizes.md;
  const widthClass = fullWidth ? 'w-full' : '';

  const combinedClasses = [
    baseClasses,
    variantClasses,
    sizeClasses,
    widthClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component
      ref={ref}
      className={combinedClasses}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
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
      )}
      {!loading && leftIcon && (
        <span className="shrink-0" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      {size !== 'icon' && <span>{children}</span>}
      {size === 'icon' && children}
      {!loading && rightIcon && (
        <span className="shrink-0" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </Component>
  );
});

export default Button;
