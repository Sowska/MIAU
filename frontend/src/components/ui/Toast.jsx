import { useEffect, useState, useRef } from 'react';
import useToastStore from '../../store/toastStore';

/**
 * ============================================================================
 * TOAST — Non-blocking notification system
 * ============================================================================
 *
 * Renders toast cards at:
 *   - Desktop: bottom-right corner
 *   - Mobile: top-center
 *
 * Each toast auto-dismisses with an animated progress bar (3000ms default).
 * Supports: success, error, info, warning types.
 * ============================================================================
 */

const TOAST_ICONS = {
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

const TOAST_STYLES = {
  success: 'border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950/50 dark:text-green-200',
  error: 'border-red-500/30 bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200',
  warning: 'border-yellow-500/30 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-200',
  info: 'border-blue-500/30 bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200',
};

const PROGRESS_STYLES = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

/**
 * ToastContainer — renders all active toasts. Place once in App.jsx.
 */
export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed z-[9999] pointer-events-none
        top-4 left-1/2 -translate-x-1/2
        sm:top-auto sm:bottom-6 sm:right-6 sm:left-auto sm:translate-x-0
        flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-auto sm:max-w-sm"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

/**
 * Single toast card with enter/exit animation and progress bar.
 */
function ToastCard({ toast }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const removeToast = useToastStore((s) => s.removeToast);
  const progressRef = useRef(null);

  // Enter animation
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Exit animation before removal
  useEffect(() => {
    if (toast.duration > 0) {
      const exitTimer = setTimeout(() => {
        setExiting(true);
      }, toast.duration - 200);
      return () => clearTimeout(exitTimer);
    }
  }, [toast.duration]);

  function handleDismiss() {
    setExiting(true);
    setTimeout(() => removeToast(toast.id), 200);
  }

  const typeStyle = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
  const progressStyle = PROGRESS_STYLES[toast.type] || PROGRESS_STYLES.info;
  const icon = TOAST_ICONS[toast.type] || TOAST_ICONS.info;

  return (
    <div
      role="alert"
      className={[
        'pointer-events-auto relative overflow-hidden',
        'rounded-lg border shadow-lg backdrop-blur-sm',
        'transition-all duration-200',
        typeStyle,
        visible && !exiting
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-2 scale-95',
      ].join(' ')}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Icon */}
        <span className="shrink-0 mt-0.5">{icon}</span>

        {/* Message */}
        <p className="text-sm font-medium flex-1 pr-2">{toast.message}</p>

        {/* Dismiss */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          className="shrink-0 p-1 rounded-sm opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5">
          <div
            ref={progressRef}
            className={`h-full ${progressStyle} opacity-60`}
            style={{
              animation: `toast-progress ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}
