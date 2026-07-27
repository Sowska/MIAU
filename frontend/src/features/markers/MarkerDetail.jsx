import { useState, useEffect } from 'react';
import { getMarker, deleteMarker } from '../../api/markers';
import { getContributions } from '../../api/contributions';
import useAuthStore from '../../store/authStore';
import ContributionForm from '../contributions/ContributionForm';

/**
 * Resolves the full image URL for a marker.
 * If imagePath is already an absolute URL (S3), return it as-is.
 * Otherwise, prepend the API base URL without the /api suffix.
 */
function resolveImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  // Remove trailing /api if present to get the server root
  const serverRoot = baseUrl.replace(/\/api\/?$/, '');
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${serverRoot}${path}`;
}

/**
 * MarkerDetail — displays full marker information, contributions, and owner actions.
 *
 * Props:
 *   markerId   — the ID of the marker to display (fetched if marker prop not provided)
 *   marker     — optional pre-loaded marker object (avoids extra fetch)
 *   onClose    — callback to return to the map
 *   onEdit     — callback to open the edit form for this marker
 */
export default function MarkerDetail({ markerId, marker: initialMarker, onClose, onEdit }) {
  const [marker, setMarker] = useState(initialMarker || null);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(!initialMarker);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const id = markerId || initialMarker?._id;

  const isOwner = Boolean(
    user && marker && (
      (marker.owner?._id && marker.owner._id === user._id) ||
      (typeof marker.owner === 'string' && marker.owner === user._id)
    )
  );

  // Fetch marker data if not provided as prop
  useEffect(() => {
    if (initialMarker) {
      setMarker(initialMarker);
      setLoading(false);
      return;
    }
    if (!id) {
      setError('No marker specified.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    getMarker(id)
      .then((res) => {
        if (!cancelled) setMarker(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          const message = err.response?.data?.error || 'Unable to load marker. Please try again.';
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id, initialMarker]);

  // Fetch contributions when user is the owner
  useEffect(() => {
    if (!marker || !isOwner || !token) return;

    let cancelled = false;

    getContributions(marker._id)
      .then((res) => {
        if (!cancelled) {
          const sorted = [...(res.data || [])].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
          setContributions(sorted);
        }
      })
      .catch(() => {
        // Silently ignore contribution fetch errors
        if (!cancelled) setContributions([]);
      });

    return () => { cancelled = true; };
  }, [marker, isOwner, token]);

  const handleDelete = async () => {
    if (!marker) return;
    const confirmed = window.confirm('Are you sure you want to delete this marker?');
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteMarker(marker._id);
      if (onClose) onClose();
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to delete marker. Please try again.';
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-lg space-y-4 p-4" role="status" aria-label="Loading marker details">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-3/4 rounded bg-gray-200" />
          <div className="h-48 w-full rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
          <div className="h-4 w-2/3 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !marker) {
    return (
      <div className="w-full max-w-lg space-y-4 p-4" role="alert">
        <p className="text-sm text-red-600">{error}</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Back to map
          </button>
        )}
      </div>
    );
  }

  // Empty state (no marker data and no error)
  if (!marker) {
    return (
      <div className="w-full max-w-lg space-y-4 p-4">
        <p className="text-sm text-gray-500">No marker data available.</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Back to map
          </button>
        )}
      </div>
    );
  }

  const imageUrl = resolveImageUrl(marker.imagePath);
  const coordinates = marker.location?.coordinates;
  const lat = coordinates?.[1];
  const lng = coordinates?.[0];

  return (
    <article className="w-full max-w-lg space-y-4 p-4" aria-label={`Marker detail: ${marker.title}`}>
      {/* Header with title and back button */}
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-2xl font-bold text-gray-800">{marker.title}</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to map"
            className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            ✕
          </button>
        )}
      </div>

      {/* Artwork image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={`Artwork: ${marker.title}`}
          className="w-full min-h-[300px] rounded-md object-cover"
        />
      )}

      {/* Category badge */}
      <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 capitalize">
        {marker.category}
      </span>

      {/* Marker details */}
      <dl className="space-y-2 text-sm text-gray-700">
        {marker.author && (
          <div>
            <dt className="font-medium text-gray-500">Author</dt>
            <dd>{marker.author}</dd>
          </div>
        )}
        {marker.date && (
          <div>
            <dt className="font-medium text-gray-500">Creation date</dt>
            <dd>{new Date(marker.date).toLocaleDateString()}</dd>
          </div>
        )}
        {marker.description && (
          <div>
            <dt className="font-medium text-gray-500">Description</dt>
            <dd className="whitespace-pre-line">{marker.description}</dd>
          </div>
        )}
      </dl>

      {/* Location information */}
      {coordinates && (
        <div className="text-sm text-gray-600">
          <h3 className="font-medium text-gray-500">Location</h3>
          <p>Lat: {lat?.toFixed(5)}, Lng: {lng?.toFixed(5)}</p>
        </div>
      )}

      {/* Timestamps */}
      <div className="space-y-1 text-xs text-gray-400">
        {marker.createdAt && (
          <p>Created: {new Date(marker.createdAt).toLocaleString()}</p>
        )}
        {marker.updatedAt && marker.updatedAt !== marker.createdAt && (
          <p>Last updated: {new Date(marker.updatedAt).toLocaleString()}</p>
        )}
      </div>

      {/* Error message (inline) */}
      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      {/* Owner actions */}
      {isOwner && (
        <div className="flex gap-3 pt-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(marker)}
              aria-label="Edit marker"
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete marker"
            className="w-full rounded-md bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )}

      {/* Contributions section — visible only to owner */}
      {isOwner && (
        <section aria-label="Contributions" className="space-y-3 border-t border-gray-200 pt-4">
          <h3 className="text-lg font-semibold text-gray-800">Contributions</h3>
          {contributions.length === 0 ? (
            <p className="text-sm text-gray-500">No contributions yet.</p>
          ) : (
            <ul className="space-y-2">
              {contributions.map((c) => (
                <li key={c._id} className="rounded-md border border-gray-200 p-3">
                  <p className="text-sm text-gray-700 whitespace-pre-line">{c.note}</p>
                  <time className="mt-1 block text-xs text-gray-400" dateTime={c.createdAt}>
                    {new Date(c.createdAt).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Contribution form — visible to non-owners and visitors */}
      {!isOwner && (
        <section aria-label="Submit a contribution" className="border-t border-gray-200 pt-4">
          <ContributionForm markerId={marker._id} />
        </section>
      )}
    </article>
  );
}
