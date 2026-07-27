import { useState } from 'react';
import { createMarker, updateMarker } from '../../api/markers';

const CATEGORIES = ['mural', 'graffiti', 'sculpture'];

export default function MarkerForm({ marker, coordinates, onSuccess, onCancel }) {
  const isEdit = Boolean(marker);

  const [title, setTitle] = useState(marker?.title || '');
  const [category, setCategory] = useState(marker?.category || '');
  const [description, setDescription] = useState(marker?.description || '');
  const [author, setAuthor] = useState(marker?.author || '');
  const [date, setDate] = useState(
    marker?.date ? new Date(marker.date).toISOString().split('T')[0] : ''
  );
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!category) newErrors.category = 'Category is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
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

      if (isEdit) {
        await updateMarker(marker._id, formData);
        setSuccessMessage('Marker updated successfully');
      } else {
        await createMarker(formData);
        setSuccessMessage('Marker created successfully');
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      const message =
        err.response?.data?.error || 'Something went wrong. Please try again.';
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4" noValidate>
      <h2 className="text-2xl font-bold text-gray-800">
        {isEdit ? 'Edit Marker' : 'Create Marker'}
      </h2>

      <div>
        <label htmlFor="marker-title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          id="marker-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'marker-title-error' : undefined}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {errors.title && (
          <p id="marker-title-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.title}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="marker-category" className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          id="marker-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-invalid={!!errors.category}
          aria-describedby={errors.category ? 'marker-category-error' : undefined}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        {errors.category && (
          <p id="marker-category-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.category}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="marker-description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="marker-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="marker-author" className="block text-sm font-medium text-gray-700">
          Author
        </label>
        <input
          id="marker-author"
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="marker-date" className="block text-sm font-medium text-gray-700">
          Creation Date
        </label>
        <input
          id="marker-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="marker-image" className="block text-sm font-medium text-gray-700">
          Image
        </label>
        <input
          id="marker-image"
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0] || null)}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
        />
      </div>

      {apiError && (
        <p className="text-sm text-red-600" role="alert">
          {apiError}
        </p>
      )}

      {successMessage && (
        <p className="text-sm text-green-600" role="status">
          {successMessage}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading
            ? isEdit ? 'Updating...' : 'Creating...'
            : isEdit ? 'Update Marker' : 'Create Marker'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
