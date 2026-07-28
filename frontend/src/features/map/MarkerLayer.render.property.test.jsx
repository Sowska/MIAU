import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import MarkerLayer from './MarkerLayer';

/**
 * Property 16: Map load renders all non-deleted markers
 *
 * For any set of non-deleted markers returned by the API, verify each
 * appears as a clickable pin after initial load.
 *
 * **Validates: Requirements 6.2**
 */

// Mock react-leaflet Marker and Popup — same pattern as MarkerLayer.test.jsx
vi.mock('react-leaflet', () => {
  const Marker = ({ children, position, eventHandlers }) => (
    <div
      data-testid="marker"
      data-position={JSON.stringify(position)}
      onClick={eventHandlers?.click}
    >
      {children}
    </div>
  );
  const Popup = ({ children }) => <div data-testid="popup">{children}</div>;
  return { Marker, Popup };
});

// Mock filterStore with no active filters (simulating initial load state)
vi.mock('../../store/filterStore', () => ({
  default: (selector) =>
    selector({
      categories: [],
      author: '',
      startDate: null,
      endDate: null,
    }),
}));

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const CATEGORIES = ['mural', 'graffiti', 'sculpture'];

/** Generate a valid GeoJSON Point location with coordinates in valid ranges */
const locationArb = fc.record({
  type: fc.constant('Point'),
  coordinates: fc.tuple(
    fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
    fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true })
  ),
});

/** Generate a non-deleted marker object matching the API response shape */
const markerArb = fc.record({
  _id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.constantFrom(...CATEGORIES),
  author: fc.oneof(
    fc.string({ minLength: 1, maxLength: 30 }),
    fc.constant(''),
    fc.constant(null)
  ),
  date: fc.oneof(
    fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') }).map(d => d.toISOString()),
    fc.constant(null)
  ),
  location: locationArb,
  deletedAt: fc.constant(null), // All markers are non-deleted
});

/** Generate an array of 1-30 non-deleted markers */
const markersArrayArb = fc.array(markerArb, { minLength: 1, maxLength: 30 });

// ---------------------------------------------------------------------------
// Property 16: Map load renders all non-deleted markers
// **Validates: Requirements 6.2**
// ---------------------------------------------------------------------------
describe('Property 16: Map load renders all non-deleted markers', () => {
  it('every non-deleted marker in the set is rendered as a pin', () => {
    fc.assert(
      fc.property(markersArrayArb, (markers) => {
        const { unmount } = render(
          <MarkerLayer markers={markers} onMarkerClick={() => {}} />
        );

        const renderedPins = screen.getAllByTestId('marker');
        expect(renderedPins).toHaveLength(markers.length);

        unmount();
      }),
      { numRuns: 50 }
    );
  });

  it('each rendered pin is clickable (onMarkerClick fires with the correct marker)', () => {
    fc.assert(
      fc.property(markersArrayArb, (markers) => {
        const onMarkerClick = vi.fn();

        const { unmount } = render(
          <MarkerLayer markers={markers} onMarkerClick={onMarkerClick} />
        );

        const renderedPins = screen.getAllByTestId('marker');

        // Click each pin and verify the callback fires with the correct marker
        for (let i = 0; i < renderedPins.length; i++) {
          onMarkerClick.mockClear();
          renderedPins[i].click();
          expect(onMarkerClick).toHaveBeenCalledTimes(1);
          expect(onMarkerClick).toHaveBeenCalledWith(markers[i]);
        }

        unmount();
      }),
      { numRuns: 30 }
    );
  });

  it('marker positions are correctly converted from GeoJSON [lng,lat] to Leaflet [lat,lng]', () => {
    fc.assert(
      fc.property(markersArrayArb, (markers) => {
        const { unmount } = render(
          <MarkerLayer markers={markers} onMarkerClick={() => {}} />
        );

        const renderedPins = screen.getAllByTestId('marker');

        for (let i = 0; i < renderedPins.length; i++) {
          const expectedLat = markers[i].location.coordinates[1];
          const expectedLng = markers[i].location.coordinates[0];
          const actualPosition = JSON.parse(renderedPins[i].dataset.position);

          // The position array must be [lat, lng] (swapped from GeoJSON [lng, lat])
          expect(actualPosition).toHaveLength(2);
          expect(actualPosition[0]).toBeCloseTo(expectedLat, 10);
          expect(actualPosition[1]).toBeCloseTo(expectedLng, 10);
        }

        unmount();
      }),
      { numRuns: 50 }
    );
  });
});
