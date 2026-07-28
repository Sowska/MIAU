import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { applyFilters } from './MarkerLayer';

/**
 * Property 19: Client-side filter correctness
 *
 * For any set of markers and any combination of filter values, verify the output
 * is exactly the intersection of all active filter criteria.
 *
 * **Validates: Requirements 8.2, 8.3, 8.4, 8.5, 8.6**
 */

// --- Generators ---

const CATEGORIES = ['mural', 'graffiti', 'sculpture'];

/** Generate a valid date string in YYYY-MM-DD format within a reasonable range */
const dateStringArb = fc.date({
  min: new Date('2020-01-01'),
  max: new Date('2026-12-31'),
}).map(d => d.toISOString().slice(0, 10));

/** Generate a marker object matching the shape expected by applyFilters */
const markerArb = fc.record({
  _id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.constantFrom(...CATEGORIES),
  author: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
  date: fc.option(dateStringArb, { nil: null }),
  location: fc.constant({ type: 'Point', coordinates: [-66.34, -33.30] }),
  deletedAt: fc.constant(null),
});

/** Generate a markers array of 0-20 items */
const markersArrayArb = fc.array(markerArb, { minLength: 0, maxLength: 20 });

/** Generate a filter configuration */
const filterArb = fc.record({
  categories: fc.subarray(CATEGORIES, { minLength: 0, maxLength: 3 }),
  author: fc.oneof(
    fc.constant(''),
    fc.string({ minLength: 1, maxLength: 10 })
  ),
  startDate: fc.option(dateStringArb, { nil: null }),
  endDate: fc.option(dateStringArb, { nil: null }),
});

// --- Reference implementation for filter intersection ---

function matchesCategory(marker, categories) {
  if (categories.length === 0) return true;
  return categories.includes(marker.category);
}

function matchesAuthor(marker, author) {
  if (!author) return true;
  if (!marker.author) return false;
  return marker.author.toLowerCase().includes(author.toLowerCase());
}

function matchesStartDate(marker, startDate) {
  if (!startDate) return true;
  return new Date(marker.date) >= new Date(startDate);
}

function matchesEndDate(marker, endDate) {
  if (!endDate) return true;
  return new Date(marker.date) <= new Date(endDate);
}

function referenceFilter(markers, filters) {
  return markers.filter(m =>
    matchesCategory(m, filters.categories) &&
    matchesAuthor(m, filters.author) &&
    matchesStartDate(m, filters.startDate) &&
    matchesEndDate(m, filters.endDate)
  );
}

// --- Property Tests ---

describe('Property 19: Client-side filter correctness', () => {
  it('applyFilters output equals intersection of all active filter criteria', () => {
    fc.assert(
      fc.property(markersArrayArb, filterArb, (markers, filters) => {
        const actual = applyFilters(markers, filters);
        const expected = referenceFilter(markers, filters);

        // Same length and same elements (order-preserving)
        expect(actual).toHaveLength(expected.length);
        actual.forEach((marker, i) => {
          expect(marker._id).toBe(expected[i]._id);
        });
      }),
      { numRuns: 200 }
    );
  });

  it('with no filters active, returns all markers (Req 8.3)', () => {
    fc.assert(
      fc.property(markersArrayArb, (markers) => {
        const noFilters = { categories: [], author: '', startDate: null, endDate: null };
        const result = applyFilters(markers, noFilters);
        expect(result).toHaveLength(markers.length);
        result.forEach((m, i) => {
          expect(m._id).toBe(markers[i]._id);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('category filter selects only matching categories (Req 8.6)', () => {
    fc.assert(
      fc.property(
        markersArrayArb,
        fc.subarray(CATEGORIES, { minLength: 1, maxLength: 3 }),
        (markers, selectedCategories) => {
          const filters = { categories: selectedCategories, author: '', startDate: null, endDate: null };
          const result = applyFilters(markers, filters);
          // Every result must have a category in the selected set
          result.forEach(m => {
            expect(selectedCategories).toContain(m.category);
          });
          // Every marker with a matching category must be in the result
          const expectedIds = markers
            .filter(m => selectedCategories.includes(m.category))
            .map(m => m._id);
          expect(result.map(m => m._id)).toEqual(expectedIds);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('author filter is case-insensitive substring match (Req 8.4)', () => {
    fc.assert(
      fc.property(
        markersArrayArb,
        fc.string({ minLength: 1, maxLength: 5 }),
        (markers, authorQuery) => {
          const filters = { categories: [], author: authorQuery, startDate: null, endDate: null };
          const result = applyFilters(markers, filters);
          // Every result must contain the query as case-insensitive substring
          result.forEach(m => {
            expect(m.author?.toLowerCase()).toContain(authorQuery.toLowerCase());
          });
          // Every marker matching the substring must be in the result
          const expectedIds = markers
            .filter(m => m.author && m.author.toLowerCase().includes(authorQuery.toLowerCase()))
            .map(m => m._id);
          expect(result.map(m => m._id)).toEqual(expectedIds);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('date range filter is inclusive on both bounds (Req 8.5)', () => {
    fc.assert(
      fc.property(
        markersArrayArb,
        dateStringArb,
        dateStringArb,
        (markers, date1, date2) => {
          // Ensure startDate <= endDate
          const [startDate, endDate] = date1 <= date2 ? [date1, date2] : [date2, date1];
          const filters = { categories: [], author: '', startDate, endDate };
          const result = applyFilters(markers, filters);
          // Every result must have a date within [startDate, endDate]
          result.forEach(m => {
            const mDate = new Date(m.date);
            expect(mDate >= new Date(startDate)).toBe(true);
            expect(mDate <= new Date(endDate)).toBe(true);
          });
          // Every marker with date in range must be in result
          const expectedIds = markers
            .filter(m => {
              if (!m.date) return false;
              const d = new Date(m.date);
              return d >= new Date(startDate) && d <= new Date(endDate);
            })
            .map(m => m._id);
          expect(result.map(m => m._id)).toEqual(expectedIds);
        }
      ),
      { numRuns: 100 }
    );
  });
});
