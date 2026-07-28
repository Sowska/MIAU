import { forwardRef } from 'react';

/**
 * ============================================================================
 * INPUT — Text entry field
 * ============================================================================
 *
 * Purpose:
 *   Primary text input for forms across the GIS interface. Used in search bars,
 *   filter fields, marker forms, and authentication forms.
 *
 * Anatomy:
 *   [Label (external)] → [Left Icon (optional)] [Native Input] [Right Icon/Action]
 *   └── Error message (external, linked via aria-describedby)
 *
 * Design System Compliance:
 *   - All colors via CSS variables
 *   - Light/dark mode: border, background, placeholder all resolve from tokens
 *   - WCAG 2.2 AA: visible focus ring, sufficient contrast, associated label
 *   - Focus ring uses --ring (brand color for map context visibility)
 *
 * Variants:
 *   - default:  Standard bordered input
 *   - ghost:    No border, minimal — for inline editing or search
 *   - error:    Red border/ring state for validation errors
 *
 * Sizes:
 *   - sm: h-8  text-xs  (compact filter inputs)
 *   - md: h-10 text-sm  (default form fields)
 *   - lg: h-12 text-base (search bar, prominent fields)
 *
 * States:
 *   - default, hover, focus, disabled, error, readonly
 *
 * Leaflet Integration:
 *   Used inside floating panels (SearchBar, FilterPanel) that overlay the map.
 *   Must not interfere with Leaflet's keyboard/event handling when not focused.
 * ============================================================================
 */

const variantStyles = {
  default:
    'border border-input bg-background text-foreground placeholder:text-muted-foreground',
  ghost:
    'border-transparent bg-transparent text-foreground placeholder:text-muted-foreground hover:bg-accent/50',
  error:
    'border-destructive bg-background text-foreground placeholder:text-muted-foreground ring-1 ring-destructive',
};

const sizeStyles = {
  sm: 'h-8 px-2.5 text-xs rounded-sm',
  md: 'h-10 px-3 text-sm rounded-md',
  lg: 'h-12 px-4 text-base rounded-lg',
};

/**
 * @param {object} props
 * @param {'default'|'ghost'|'error'} [props.variant='default']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.fullWidth=true]
 * @param {React.ReactNode} [props.leftIcon] — icon rendered inside the input container
 * @param {React.ReactNode} [props.rightElement] — action/icon on the right side
 * @param {boolean} [props.error=false] — shorthand to apply error variant
 * @param {string} [props.className]
 */
const Input = forwardRef(function Input(
  {
    variant = 'default',
    size = 'md',
    fullWidth = true,
    leftIcon,
    rightElement,
    error = false,
    className = '',
    ...props
  },
  ref
) {
  const resolvedVariant = error ? 'error' : variant;

  const baseClasses = [
    'peer transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
    // Mobile touch target
    'min-h-[44px] sm:min-h-0',
  ].join(' ');

  const variantClasses = variantStyles[resolvedVariant] || variantStyles.default;
  const sizeClasses = sizeStyles[size] || sizeStyles.md;
  const widthClass = fullWidth ? 'w-full' : '';

  // If icons are used, wrap in a container
  if (leftIcon || rightElement) {
    return (
      <div className={`relative ${fullWidth ? 'w-full' : 'inline-flex'} ${className}`}>
        {leftIcon && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={[
            baseClasses,
            variantClasses,
            sizeClasses,
            widthClass,
            leftIcon ? 'pl-9' : '',
            rightElement ? 'pr-9' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {rightElement && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightElement}
          </span>
        )}
      </div>
    );
  }

  return (
    <input
      ref={ref}
      className={[baseClasses, variantClasses, sizeClasses, widthClass, className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
});

export default Input;
