import { useState } from 'react';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import { loginUser, registerUser } from '../api/auth';
import {
  Button,
  Input,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui';

/**
 * AUTH VIEW — Unified Login / Register (Modal overlay)
 *
 * Desktop: Floating centered modal with backdrop blur, scale-in animation.
 * Mobile: Bottom sheet sliding up from the bottom.
 */
export default function AuthView({ onSuccess, onNavigateHome }) {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const login = useAuthStore((s) => s.login);
  const addToast = useToastStore((s) => s.addToast);

  function switchMode() {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError('');
    setFieldErrors({});
  }

  function validate() {
    const errors = {};
    if (!email.trim()) errors.email = 'El correo es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Formato de correo inválido';

    if (mode === 'register' && !username.trim()) {
      errors.username = 'El nombre de usuario es obligatorio';
    }

    if (!password) errors.password = 'La contraseña es obligatoria';
    else if (password.length < 6) errors.password = 'Mínimo 6 caracteres';

    if (mode === 'register') {
      if (!confirmPassword) errors.confirmPassword = 'Confirmá tu contraseña';
      else if (password !== confirmPassword)
        errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const validationErrors = validate();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await loginUser({ email, password });
      } else {
        res = await registerUser({ email, username, password });
      }

      const { token, user } = res.data;
      login(token, user);
      addToast('success', mode === 'login' ? '¡Bienvenido de nuevo!' : 'Cuenta creada correctamente');

      if (onSuccess) onSuccess();
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (mode === 'login'
          ? 'Credenciales inválidas. Intentá de nuevo.'
          : 'Registro fallido. Intentá de nuevo.');
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-md"
        onClick={onNavigateHome}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div
        className="relative z-10 w-full max-h-[90vh] overflow-y-auto rounded-t-xl self-end sm:self-center sm:max-w-sm sm:rounded-lg sm:max-h-[85vh]"
        style={{ animation: 'slide-up 300ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-card border border-border shadow-xl rounded-t-xl sm:rounded-lg">
          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center py-2">
            <div className="w-10 h-1 rounded-full bg-border" aria-hidden="true" />
          </div>

          {/* Brand */}
          <div className="pt-6 sm:pt-8 pb-2 text-center">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">MIAU</h1>
            <p className="text-sm text-muted-foreground mt-1">Mapa de Arte Urbano</p>
          </div>

          {/* Form content */}
          <div className="px-6 pb-2">
            <CardHeader className="text-center px-0">
              <CardTitle as="h2">
                {mode === 'login' ? '¡Bienvenido de nuevo!' : 'Crear cuenta'}
              </CardTitle>
              <CardDescription>
                {mode === 'login'
                  ? 'Iniciá sesión para contribuir al mapa de arte urbano'
                  : 'Unite a la comunidad y empezá a mapear arte'}
              </CardDescription>
            </CardHeader>

            {/* Tab Toggle */}
            <div className="flex rounded-md border border-border p-1 mb-6 bg-muted/50">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setFieldErrors({}); }}
                className={[
                  'flex-1 py-2 text-sm font-medium rounded-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  mode === 'login'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
                aria-pressed={mode === 'login'}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setFieldErrors({}); }}
                className={[
                  'flex-1 py-2 text-sm font-medium rounded-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  mode === 'register'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
                aria-pressed={mode === 'register'}
              >
                Registrarse
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <FormField label="Correo electrónico" htmlFor="auth-email" error={fieldErrors.email}>
                <Input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  error={!!fieldErrors.email}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'auth-email-error' : undefined}
                />
              </FormField>

              {mode === 'register' && (
                <FormField label="Nombre de usuario" htmlFor="auth-username" error={fieldErrors.username}>
                  <Input
                    id="auth-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Elegí un nombre de usuario"
                    autoComplete="username"
                    error={!!fieldErrors.username}
                    aria-invalid={!!fieldErrors.username}
                    aria-describedby={fieldErrors.username ? 'auth-username-error' : undefined}
                  />
                </FormField>
              )}

              <FormField label="Contraseña" htmlFor="auth-password" error={fieldErrors.password}>
                <Input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  error={!!fieldErrors.password}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'auth-password-error' : undefined}
                />
              </FormField>

              {mode === 'register' && (
                <FormField label="Confirmar contraseña" htmlFor="auth-confirm-password" error={fieldErrors.confirmPassword}>
                  <Input
                    id="auth-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    error={!!fieldErrors.confirmPassword}
                    aria-invalid={!!fieldErrors.confirmPassword}
                    aria-describedby={fieldErrors.confirmPassword ? 'auth-confirm-password-error' : undefined}
                  />
                </FormField>
              )}

              {error && (
                <p className="text-sm text-destructive text-center" role="alert">{error}</p>
              )}

              <Button type="submit" variant="primary" fullWidth loading={loading} disabled={loading}>
                {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </Button>
            </form>

            {/* Switch mode */}
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground">
                {mode === 'login' ? '¿No tenés una cuenta?' : '¿Ya tenés una cuenta?'}{' '}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-primary font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  {mode === 'login' ? 'Registrarse' : 'Iniciar sesión'}
                </button>
              </p>
            </div>
          </div>

          {/* Back to map */}
          {onNavigateHome && (
            <div className="px-6 pb-6 text-center border-t border-border pt-4">
              <button
                type="button"
                onClick={onNavigateHome}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-2 py-1"
              >
                ← Volver al mapa
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormField({ label, htmlFor, error, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
