import { useState } from 'react';
import { postContribution } from '../../api/contributions';

/**
 * ContributionForm — allows non-owner authenticated users to submit a note
 * as a contribution suggestion to a marker owner.
 *
 * Props:
 *   markerId — the ID of the marker to submit the contribution for
 */
export default function ContributionForm({ markerId }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!note.trim()) {
      setError('Note is required');
      return;
    }

    setLoading(true);
    try {
      await postContribution(markerId, { note: note.trim() });
      setSuccessMessage('Contribution submitted successfully');
      setNote('');
    } catch (err) {
      const message =
        err.response?.data?.error || 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
      <h3 className="text-lg font-semibold text-gray-800">Submit a Contribution</h3>

      <div>
        <label htmlFor="contribution-note" className="block text-sm font-medium text-gray-700">
          Note
        </label>
        <textarea
          id="contribution-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          aria-invalid={!!error && error === 'Note is required'}
          aria-describedby={error === 'Note is required' ? 'contribution-note-error' : undefined}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {error === 'Note is required' && (
          <p id="contribution-note-error" className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      {error && error !== 'Note is required' && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {successMessage && (
        <p className="text-sm text-green-600" role="status">
          {successMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Contribution'}
      </button>
    </form>
  );
}
