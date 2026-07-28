import { useState } from 'react';
import { postContribution } from '../../api/contributions';
import useToastStore from '../../store/toastStore';
import { Button, Input } from '../../components/ui';

/**
 * ContributionForm — allows non-owner authenticated users to submit a note
 * as a contribution suggestion to a marker owner.
 *
 * Features smooth accordion slide-down animation for the form area.
 *
 * Props:
 *   markerId — the ID of the marker to submit the contribution for
 */
export default function ContributionForm({ markerId }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!note.trim()) {
      setError('Note is required');
      return;
    }

    setLoading(true);
    try {
      await postContribution(markerId, { note: note.trim() });
      addToast('success', 'Contribution submitted');
      setNote('');
      setExpanded(false);
    } catch (err) {
      const message =
        err.response?.data?.error || 'Something went wrong. Please try again.';
      setError(message);
      addToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Suggest a Contribution</h3>
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-2 py-1"
          aria-expanded={expanded}
        >
          {expanded ? 'Cancel' : 'Add Note'}
        </button>
      </div>

      {/* Accordion form — smooth slide-down */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: expanded ? '300px' : '0px',
          opacity: expanded ? 1 : 0,
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-3 pt-1" noValidate>
          <div>
            <label htmlFor="contribution-note" className="sr-only">
              Contribution note
            </label>
            <textarea
              id="contribution-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Share information, corrections, or suggestions..."
              aria-invalid={!!error}
              aria-describedby={error ? 'contribution-note-error' : undefined}
              className={[
                'w-full px-3 py-2 text-sm rounded-md border',
                'bg-background text-foreground placeholder:text-muted-foreground',
                'transition-colors resize-y min-h-[80px]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                error ? 'border-destructive' : 'border-input',
              ].join(' ')}
            />
            {error && (
              <p id="contribution-note-error" className="mt-1 text-xs text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            Submit Contribution
          </Button>
        </form>
      </div>
    </div>
  );
}
