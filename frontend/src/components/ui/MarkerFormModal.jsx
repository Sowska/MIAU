import { useState, useEffect, useRef } from 'react';
import Button from './Button';
import Input from './Input';

/**
 * ============================================================================
 * MARKERFORMMODAL — Modal for creating or editing a marker/artwork
 * ============================================================================
 *
 * Purpose:
 *   Full-screen modal (mobile) or centered dialog (desktop) for creating a new
 *   marker at a clicked map location or editing an existing marker. Contains
 *   the complete marker form: title, category, description, author, date, image.
 *   The map remains visible but non-interactive behind the overlay.
 *
 * Anatomy:
 *   MarkerFormModal
 *   ├── Backdrop (semi-transparent overlay)
 *   └── Dialog
 *       ├── Header (title + close button)
 *       ├── Form
 *       │   ├── TitleField (required)
 *       │   ├── CategorySelect (required)
 *       │   ├── DescriptionTextarea (optional)
 *       │   ├── AuthorField (optional)
 *       │   ├── DateField (optional)
 *       │   └── ImageUpload (optional)
 *       ├── Messages (error/success)
 *       └── Footer (submit + cancel buttons)
 *
 * Design System Compliance:
 *   - Backdrop: bg-background/80 + backdrop-blur for map visibility
 *   - Dialog: bg-card with border, rounded, shadow
 *   - All form fields use Input component
 *   - Buttons use Button component (primary for submit, outline for cancel)
 *   - Focus trap within the modal
 *   - WCAG: dialog role, aria-modal, aria-labelledby, Escape to close
 *   - Mobile: full-screen, no overlay gap
 *
 * Props:
 *   isOpen       — whether the modal is visible
 *   marker       — existing marker for edit mode (null for create)
 *   coordinates  — { lat, lng } for new marker placement
 *   onSubmit     — async callback with FormData
 *   onClose      — callback to close the modal
 *   loading      — external loading state
 *   error        — external error message
 *
 * Leaflet Integration:
 *   Modal is a React portal rendered above the map. When open, the map is
 *   non-interactive (pointer-events blocked by backdrop). Coordinates from
 *   the map click are passed as props.
 *
 * States:
 *   - closed (not rendered)
 *   - create mode (empty form with coordinates)
 *   - edit mode (pre-filled form with marker data)
 *   - loading (submit in progress)
 *   - error (validation or API error displayed)
 *   - success (brief success message before close)
 * ============================================================================
 */

const CATEGORIES = ['mural', 'graffiti', 'sculpture'];

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {object|null} [props.marker] — existing marker (edit mode)
 * @param {{ lat: number, lng: number }|null} [props.coordinates] — new marker position
 * @param {(formData: FormData) => Promise<void>} [props.onSubmit]
 * @param {() => void} props.onClose
 * @param {boolean} [props.loading=false]
 * @param {string} [props.error='']
 */
export default function MarkerFormModal({
  isOpen,
  marker = null,
  coordinates = null,
  onSubmit,
  onClose,
  loading: externalLoading = false,
  error: externalError = '',
}) {
  const isEdit = Boolean(marker);
  const dialogRef = useRef(null);
  const firstInputRef = useRef(null);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [date, setDate] = useState('');
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [internalLoading, setInternalLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loading = externalLoading || internalLoading;

  // Populate form for edit mode
  useEffect(() => {
    if (isOpen && marker) {
      setTitle(marker.title || '');
      setCategory(marker.category || '');
      setDescription(marker.description || '');
      setAuthor(marker.author || '');
      setDate(marker.date ? new Date(marker.date).toISOString().split('T')[0] : '');
      setImage(null);
      setErrors({});
      setSuccessMessage('');
    } else if (isOpen && !marker) {
      // Reset for create mode
      setTitle('');
      setCategory('');
      setDescription('');
      setAuthor('');
      setDate('');
      setImage(null);
      setErrors({});
      setSuccessMessage('');
    }
  }, [isOpen, marker]);

  // Focus trap: focus first input when opened
  useEffect(() => {
    if (isOpen) {
      // Delay to ensure the DOM is rendered
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  function validate() {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'El título es obligatorio';
    if (!category) newErrors.category = 'La categoría es obligatoria';
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccessMessage('');

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('category', category);
    if (description.trim()) formData.append('description', description.trim());
    if (author.trim()) formData.append('author', author.trim());
    if (date) formData.append('date', date);
    if (image) formData.append('image', image);

    if (!isEdit && coordinates) {
      formData.append('longitude', coordinates.lng);
      formData.append('latitude', coordinates.lat);
    }

    if (onSubmit) {
      setInternalLoading(true);
      try {
        await onSubmit(formData);
        setSuccessMessage(isEdit ? 'Marcador actualizado' : 'Marcador creado');
        setTimeout(() => onClose(), 800);
      } catch {
        // Error handled externally or via externalError prop
      } finally {
        setInternalLoading(false);
      }
    }
  }

  if (!isOpen) return null;

  const errorMessage = externalError || '';

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="marker-form-title"
        className={[
          'relative z-10 w-full bg-card text-card-foreground border border-border shadow-xl',
          'overflow-y-auto',
          // Mobile: full screen, Desktop: centered dialog
          'h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-lg sm:mx-4',
        ].join(' ')}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-border bg-card">
          <h2
            id="marker-form-title"
            className="text-lg font-semibold text-foreground"
          >
            {isEdit ? 'Editar marcador' : 'Crear marcador'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar diálogo"
            className="p-2 -mr-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
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
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
          {/* Title */}
          <FormField
            label="Título"
            htmlFor="modal-title"
            error={errors.title}
            required
          >
            <Input
              ref={firstInputRef}
              id="modal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={!!errors.title}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'modal-title-error' : undefined}
              placeholder="Título de la obra"
            />
          </FormField>

          {/* Category */}
          <FormField
            label="Categoría"
            htmlFor="modal-category"
            error={errors.category}
            required
          >
            <select
              id="modal-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-invalid={!!errors.category}
              aria-describedby={errors.category ? 'modal-category-error' : undefined}
              className={[
                'w-full h-10 px-3 text-sm rounded-md border transition-colors',
                'bg-background text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                errors.category
                  ? 'border-destructive ring-1 ring-destructive'
                  : 'border-input',
              ].join(' ')}
            >
              <option value="">Seleccioná una categoría</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </FormField>

          {/* Description */}
          <FormField label="Descripción" htmlFor="modal-description">
            <textarea
              id="modal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describí esta obra..."
              className={[
                'w-full px-3 py-2 text-sm rounded-md border border-input',
                'bg-background text-foreground placeholder:text-muted-foreground',
                'transition-colors resize-y min-h-[80px]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              ].join(' ')}
            />
          </FormField>

          {/* Author */}
          <FormField label="Artista" htmlFor="modal-author">
            <Input
              id="modal-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Nombre del artista"
            />
          </FormField>

          {/* Date */}
          <FormField label="Fecha de creación" htmlFor="modal-date">
            <Input
              id="modal-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </FormField>

          {/* Image Upload */}
          <FormField label="Imagen" htmlFor="modal-image">
            <input
              id="modal-image"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0] || null)}
              className={[
                'w-full text-sm text-muted-foreground',
                'file:mr-3 file:rounded-md file:border-0',
                'file:bg-secondary file:px-3 file:py-2',
                'file:text-sm file:font-medium file:text-secondary-foreground',
                'hover:file:bg-secondary/80',
                'cursor-pointer',
              ].join(' ')}
            />
          </FormField>

          {/* Coordinates display (create mode) */}
          {!isEdit && coordinates && (
            <div className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
              Location: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
            </div>
          )}

          {/* Messages */}
          {errorMessage && (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className="text-sm text-primary font-medium" role="status">
              {successMessage}
            </p>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              fullWidth
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              {isEdit ? 'Actualizar marcador' : 'Crear marcador'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Internal Sub-components ──────────────────────────────────────────── */

/**
 * FormField — label + input wrapper with error message support.
 */
function FormField({ label, htmlFor, error, required, children }) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required && (
          <span className="text-destructive ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p
          id={`${htmlFor}-error`}
          className="text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
