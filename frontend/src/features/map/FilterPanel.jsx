import useFilterStore from '../../store/filterStore';

const CATEGORIES = ['mural', 'graffiti', 'sculpture'];

/**
 * FilterPanel — controls for filtering map markers by category, author, and date range.
 * Dispatches changes to filterStore; MarkerLayer reacts automatically via Zustand.
 */
export default function FilterPanel() {
  const categories = useFilterStore((state) => state.categories);
  const author = useFilterStore((state) => state.author);
  const startDate = useFilterStore((state) => state.startDate);
  const endDate = useFilterStore((state) => state.endDate);
  const setFilter = useFilterStore((state) => state.setFilter);
  const clearFilters = useFilterStore((state) => state.clearFilters);

  function handleCategoryChange(category) {
    const updated = categories.includes(category)
      ? categories.filter((c) => c !== category)
      : [...categories, category];
    setFilter('categories', updated);
  }

  function handleAuthorChange(e) {
    setFilter('author', e.target.value);
  }

  function handleStartDateChange(e) {
    setFilter('startDate', e.target.value || null);
  }

  function handleEndDateChange(e) {
    setFilter('endDate', e.target.value || null);
  }

  return (
    <aside
      className="bg-white rounded-lg shadow p-4 space-y-4"
      aria-label="Filter markers"
    >
      <h2 className="text-lg font-semibold">Filters</h2>

      {/* Category checkboxes */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-1">
          Category
        </legend>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name={`filter-category-${cat}`}
                checked={categories.includes(cat)}
                onChange={() => handleCategoryChange(cat)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm capitalize">{cat}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Author search */}
      <div>
        <label
          htmlFor="filter-author"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Author
        </label>
        <input
          id="filter-author"
          type="text"
          value={author}
          onChange={handleAuthorChange}
          placeholder="Search by author..."
          className="w-full rounded border-gray-300 shadow-sm text-sm px-3 py-2 border focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Date range */}
      <div className="space-y-2">
        <div>
          <label
            htmlFor="filter-start-date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start date
          </label>
          <input
            id="filter-start-date"
            type="date"
            value={startDate || ''}
            onChange={handleStartDateChange}
            className="w-full rounded border-gray-300 shadow-sm text-sm px-3 py-2 border focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label
            htmlFor="filter-end-date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            End date
          </label>
          <input
            id="filter-end-date"
            type="date"
            value={endDate || ''}
            onChange={handleEndDateChange}
            className="w-full rounded border-gray-300 shadow-sm text-sm px-3 py-2 border focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Clear filters */}
      <button
        type="button"
        onClick={clearFilters}
        className="w-full text-sm text-indigo-600 hover:text-indigo-800 font-medium py-2 border border-indigo-200 rounded hover:bg-indigo-50 transition-colors"
      >
        Clear Filters
      </button>
    </aside>
  );
}
