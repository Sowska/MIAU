import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, within, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import MarkerDetail from './MarkerDetail';

/**
 * Property 17: Detail View field completeness
 * **Validates: Requirements 7.1**
 *
 * For any marker document, verify the rendered Detail View contains title,
 * category, description, author, date, and image (when imagePath is non-null).
 */

vi.mock('../../api/markers', () => ({
  getMarker: vi.fn(),
  deleteMarker: vi.fn(),
}));

vi.mock('../../api/contributions', () => ({
  getContributions: vi.fn(),
}));

vi.mock('../../store/authStore', () => ({
  default: vi.fn(),
}));

vi.mock('../contributions/ContributionForm', () => ({
  default: () => <div data-testid="contribution-form-mock" />,
}));

import useAuthStore from '../../store/authStore';

// Arbitrary for marker objects with all combinations of optional fields.
// Uses alphanumeric strings to avoid collisions with other rendered text.
const markerArbitrary = fc.record({
  _id: fc.uuid(),
  title: fc.stringMatching(/^[A-Z][a-z]{3,20} [A-Z][a-z]{3,20}$/),
  category: fc.constantFrom('mural', 'graffiti', 'sculpture'),
  description: fc.option(
    fc.stringMatching(/^[A-Z][a-z]{5,30} [a-z]{5,20} [a-z]{5,20}$/),
    { nil: '' }
  ),
  author: fc.option(
    fc.stringMatching(/^[A-Z][a-z]{2,10} [A-Z][a-z]{2,10}$/),
    { nil: '' }
  ),
  date: fc.option(
    fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map((d) => d.toISOString()),
    { nil: null }
  ),
  imagePath: fc.option(
    fc.constant('https://s3.example.com/images/').chain((base) =>
      fc.uuid().map((id) => `${base}${id}.jpg`)
    ),
    { nil: null }
  ),
  location: fc.constant({ type: 'Point', coordinates: [-3.7035, 40.4168] }),
  owner: fc.record({
    _id: fc.uuid(),
    username: fc.stringMatching(/^user[a-z]{3,8}$/),
  }),
});

describe('Property 17: Detail View field completeness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Visitor mode — simplest case for field completeness testing
    useAuthStore.mockImplementation((selector) => {
      const state = { user: null, token: null };
      return selector(state);
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('title is always rendered for any marker', () => {
    fc.assert(
      fc.property(markerArbitrary, (marker) => {
        const { container, unmount } = render(<MarkerDetail marker={marker} />);
        const article = within(container);

        const heading = article.getByRole('heading', { level: 2 });
        expect(heading).toHaveTextContent(marker.title);

        unmount();
      }),
      { numRuns: 50 }
    );
  });

  it('category is always rendered for any marker', () => {
    fc.assert(
      fc.property(markerArbitrary, (marker) => {
        const { container, unmount } = render(<MarkerDetail marker={marker} />);
        const article = within(container);

        // Category badge with capitalize class
        const badge = article.getByText(marker.category);
        expect(badge).toBeInTheDocument();

        unmount();
      }),
      { numRuns: 50 }
    );
  });

  it('description is rendered when present', () => {
    const markerWithDescription = markerArbitrary.filter((m) => m.description && m.description.length > 0);

    fc.assert(
      fc.property(markerWithDescription, (marker) => {
        const { container, unmount } = render(<MarkerDetail marker={marker} />);
        const article = within(container);

        // Description appears in a <dd> element
        const descriptionEl = article.getByText(marker.description);
        expect(descriptionEl).toBeInTheDocument();
        expect(descriptionEl.tagName).toBe('DD');

        unmount();
      }),
      { numRuns: 50 }
    );
  });

  it('description is not rendered when absent', () => {
    const markerWithoutDescription = markerArbitrary.map((m) => ({ ...m, description: '' }));

    fc.assert(
      fc.property(markerWithoutDescription, (marker) => {
        const { container, unmount } = render(<MarkerDetail marker={marker} />);
        const article = within(container);

        // The "Description" label should not appear
        expect(article.queryByText('Description')).not.toBeInTheDocument();

        unmount();
      }),
      { numRuns: 20 }
    );
  });

  it('author is rendered when present', () => {
    const markerWithAuthor = markerArbitrary.filter((m) => m.author && m.author.length > 0);

    fc.assert(
      fc.property(markerWithAuthor, (marker) => {
        const { container, unmount } = render(<MarkerDetail marker={marker} />);
        const article = within(container);

        const authorEl = article.getByText(marker.author);
        expect(authorEl).toBeInTheDocument();
        expect(authorEl.tagName).toBe('DD');

        unmount();
      }),
      { numRuns: 50 }
    );
  });

  it('author is not rendered when absent', () => {
    const markerWithoutAuthor = markerArbitrary.map((m) => ({ ...m, author: '' }));

    fc.assert(
      fc.property(markerWithoutAuthor, (marker) => {
        const { container, unmount } = render(<MarkerDetail marker={marker} />);
        const article = within(container);

        expect(article.queryByText('Author')).not.toBeInTheDocument();

        unmount();
      }),
      { numRuns: 20 }
    );
  });

  it('date is rendered when present', () => {
    const markerWithDate = markerArbitrary.filter((m) => m.date !== null);

    fc.assert(
      fc.property(markerWithDate, (marker) => {
        const { container, unmount } = render(<MarkerDetail marker={marker} />);
        const article = within(container);

        const expectedDateText = new Date(marker.date).toLocaleDateString();
        const dateEl = article.getByText(expectedDateText);
        expect(dateEl).toBeInTheDocument();
        expect(dateEl.tagName).toBe('DD');

        unmount();
      }),
      { numRuns: 50 }
    );
  });

  it('date is not rendered when absent', () => {
    const markerWithoutDate = markerArbitrary.map((m) => ({ ...m, date: null }));

    fc.assert(
      fc.property(markerWithoutDate, (marker) => {
        const { container, unmount } = render(<MarkerDetail marker={marker} />);
        const article = within(container);

        expect(article.queryByText('Creation date')).not.toBeInTheDocument();

        unmount();
      }),
      { numRuns: 20 }
    );
  });

  it('image is rendered when imagePath is non-null', () => {
    const markerWithImage = markerArbitrary.filter((m) => m.imagePath !== null);

    fc.assert(
      fc.property(markerWithImage, (marker) => {
        const { container, unmount } = render(<MarkerDetail marker={marker} />);
        const article = within(container);

        const img = article.getByRole('img', { name: `Artwork: ${marker.title}` });
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', marker.imagePath);

        unmount();
      }),
      { numRuns: 50 }
    );
  });

  it('image is not rendered when imagePath is null', () => {
    const markerWithoutImage = markerArbitrary.map((m) => ({ ...m, imagePath: null }));

    fc.assert(
      fc.property(markerWithoutImage, (marker) => {
        const { container, unmount } = render(<MarkerDetail marker={marker} />);
        const article = within(container);

        expect(article.queryByRole('img')).not.toBeInTheDocument();

        unmount();
      }),
      { numRuns: 20 }
    );
  });
});
