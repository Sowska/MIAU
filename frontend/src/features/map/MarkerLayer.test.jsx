import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MarkerLayer, { applyFilters } from './MarkerLayer';

// Mock react-leaflet Marker and Popup
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

// Mock filterStore with controllable state
const mockFilterState = {
  categories: [],
  author: '',
  startDate: null,
  endDate: null,
};

vi.mock('../../store/filterStore', () => ({
  default: (selector) => selector(mockFilterState),
}));

const sampleMarkers = [
  {
    _id: '1',
    title: 'Street Mural',
    category: 'mural',
    author: 'Alice',
    date: '2024-03-15',
    location: { type: 'Point', coordinates: [-66.34, -33.30] },
    deletedAt: null,
  },
  {
    _id: '2',
    title: 'City Graffiti',
    category: 'graffiti',
    author: 'Bob',
    date: '2024-06-01',
    location: { type: 'Point', coordinates: [-66.35, -33.31] },
    deletedAt: null,
  },
  {
    _id: '3',
    title: 'Park Sculpture',
    category: 'sculpture',
    author: 'Charlie',
    date: '2024-01-10',
    location: { type: 'Point', coordinates: [-66.33, -33.29] },
    deletedAt: null,
  },
];

describe('applyFilters', () => {
  it('returns all markers when no filters are active', () => {
    const result = applyFilters(sampleMarkers, {
      categories: [],
      author: '',
      startDate: null,
      endDate: null,
    });
    expect(result).toHaveLength(3);
  });

  it('filters by category', () => {
    const result = applyFilters(sampleMarkers, {
      categories: ['mural'],
      author: '',
      startDate: null,
      endDate: null,
    });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Street Mural');
  });

  it('filters by multiple categories', () => {
    const result = applyFilters(sampleMarkers, {
      categories: ['mural', 'sculpture'],
      author: '',
      startDate: null,
      endDate: null,
    });
    expect(result).toHaveLength(2);
  });

  it('filters by author substring (case-insensitive)', () => {
    const result = applyFilters(sampleMarkers, {
      categories: [],
      author: 'ali',
      startDate: null,
      endDate: null,
    });
    expect(result).toHaveLength(1);
    expect(result[0].author).toBe('Alice');
  });

  it('filters by startDate', () => {
    const result = applyFilters(sampleMarkers, {
      categories: [],
      author: '',
      startDate: '2024-03-01',
      endDate: null,
    });
    expect(result).toHaveLength(2);
    expect(result.map(m => m._id)).toEqual(['1', '2']);
  });

  it('filters by endDate', () => {
    const result = applyFilters(sampleMarkers, {
      categories: [],
      author: '',
      startDate: null,
      endDate: '2024-03-15',
    });
    expect(result).toHaveLength(2);
    expect(result.map(m => m._id)).toEqual(['1', '3']);
  });

  it('filters by date range', () => {
    const result = applyFilters(sampleMarkers, {
      categories: [],
      author: '',
      startDate: '2024-02-01',
      endDate: '2024-04-01',
    });
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe('1');
  });

  it('combines multiple filters simultaneously', () => {
    const result = applyFilters(sampleMarkers, {
      categories: ['mural', 'graffiti'],
      author: 'bob',
      startDate: null,
      endDate: null,
    });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('City Graffiti');
  });

  it('handles markers with no author gracefully', () => {
    const markersWithNoAuthor = [
      { ...sampleMarkers[0], author: null },
      { ...sampleMarkers[1], author: undefined },
    ];
    const result = applyFilters(markersWithNoAuthor, {
      categories: [],
      author: 'test',
      startDate: null,
      endDate: null,
    });
    expect(result).toHaveLength(0);
  });
});

describe('MarkerLayer component', () => {
  beforeEach(() => {
    mockFilterState.categories = [];
    mockFilterState.author = '';
    mockFilterState.startDate = null;
    mockFilterState.endDate = null;
  });

  it('renders a Marker for each visible marker', () => {
    render(<MarkerLayer markers={sampleMarkers} />);
    const pins = screen.getAllByTestId('marker');
    expect(pins).toHaveLength(3);
  });

  it('converts GeoJSON [lng, lat] to Leaflet [lat, lng] position', () => {
    render(<MarkerLayer markers={[sampleMarkers[0]]} />);
    const pin = screen.getByTestId('marker');
    // coordinates are [-66.34, -33.30] -> position should be [-33.30, -66.34]
    expect(pin.dataset.position).toBe(JSON.stringify([-33.30, -66.34]));
  });

  it('excludes markers with non-null deletedAt (defense-in-depth)', () => {
    const markersWithDeleted = [
      ...sampleMarkers,
      {
        _id: '4',
        title: 'Deleted Art',
        category: 'mural',
        author: 'Dave',
        date: '2024-05-01',
        location: { type: 'Point', coordinates: [-66.36, -33.32] },
        deletedAt: '2024-07-01T00:00:00.000Z',
      },
    ];
    render(<MarkerLayer markers={markersWithDeleted} />);
    const pins = screen.getAllByTestId('marker');
    expect(pins).toHaveLength(3);
  });

  it('applies filter store filters to narrow visible markers', () => {
    mockFilterState.categories = ['sculpture'];
    render(<MarkerLayer markers={sampleMarkers} />);
    const pins = screen.getAllByTestId('marker');
    expect(pins).toHaveLength(1);
  });

  it('renders popup with marker title and category', () => {
    render(<MarkerLayer markers={[sampleMarkers[0]]} />);
    expect(screen.getByText('Street Mural')).toBeInTheDocument();
    expect(screen.getByText('mural')).toBeInTheDocument();
  });

  it('calls onMarkerClick when a marker is clicked', () => {
    const onMarkerClick = vi.fn();
    render(<MarkerLayer markers={[sampleMarkers[0]]} onMarkerClick={onMarkerClick} />);
    const pin = screen.getByTestId('marker');
    pin.click();
    expect(onMarkerClick).toHaveBeenCalledWith(sampleMarkers[0]);
  });

  it('renders nothing when markers array is empty', () => {
    const { container } = render(<MarkerLayer markers={[]} />);
    expect(container.querySelectorAll('[data-testid="marker"]')).toHaveLength(0);
  });

  it('renders nothing when all markers are filtered out', () => {
    mockFilterState.categories = ['nonexistent'];
    const { container } = render(<MarkerLayer markers={sampleMarkers} />);
    expect(container.querySelectorAll('[data-testid="marker"]')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Property 15: Client-side deleted marker exclusion
// **Validates: Requirements 5.7**
//
// For any markers array containing entries with non-null `deletedAt`,
// verify none are rendered as pins.
// ---------------------------------------------------------------------------

/**
 * Generates a random set of marker arrays where each array contains a mix of
 * active markers (deletedAt: null) and soft-deleted markers (deletedAt: non-null).
 * Uses varied deletedAt values: ISO strings, Date objects, truthy strings, etc.
 */
function generateMarkerSets() {
  const categories = ['mural', 'graffiti', 'sculpture'];
  let idCounter = 100;

  function makeMarker({ deletedAt = null } = {}) {
    const id = String(idCounter++);
    return {
      _id: id,
      title: `Art ${id}`,
      category: categories[idCounter % categories.length],
      author: `Author${id}`,
      date: '2024-05-01',
      location: { type: 'Point', coordinates: [-(66 + Math.random()), -(33 + Math.random())] },
      deletedAt,
    };
  }

  // Various non-null deletedAt values the API might return
  const deletedAtVariants = [
    '2024-07-01T00:00:00.000Z',
    '2023-01-15T12:30:00Z',
    '2024-12-31T23:59:59.999Z',
    new Date('2024-06-01').toISOString(),
    new Date().toISOString(),
    '2020-01-01',
    '1970-01-01T00:00:00.000Z',
  ];

  const testCases = [];

  // Case 1: All markers are deleted
  testCases.push({
    label: 'all markers deleted',
    markers: deletedAtVariants.map(d => makeMarker({ deletedAt: d })),
    expectedActive: 0,
  });

  // Case 2: Mix of active and deleted (various ratios)
  testCases.push({
    label: '3 active, 4 deleted',
    markers: [
      makeMarker(),
      makeMarker(),
      makeMarker(),
      makeMarker({ deletedAt: deletedAtVariants[0] }),
      makeMarker({ deletedAt: deletedAtVariants[1] }),
      makeMarker({ deletedAt: deletedAtVariants[2] }),
      makeMarker({ deletedAt: deletedAtVariants[3] }),
    ],
    expectedActive: 3,
  });

  testCases.push({
    label: '1 active, 5 deleted',
    markers: [
      makeMarker(),
      makeMarker({ deletedAt: deletedAtVariants[0] }),
      makeMarker({ deletedAt: deletedAtVariants[1] }),
      makeMarker({ deletedAt: deletedAtVariants[2] }),
      makeMarker({ deletedAt: deletedAtVariants[3] }),
      makeMarker({ deletedAt: deletedAtVariants[4] }),
    ],
    expectedActive: 1,
  });

  testCases.push({
    label: '5 active, 1 deleted',
    markers: [
      makeMarker(),
      makeMarker(),
      makeMarker(),
      makeMarker(),
      makeMarker(),
      makeMarker({ deletedAt: deletedAtVariants[5] }),
    ],
    expectedActive: 5,
  });

  // Case 3: No markers deleted (all active) — property should still hold trivially
  testCases.push({
    label: 'all markers active (none deleted)',
    markers: [makeMarker(), makeMarker(), makeMarker()],
    expectedActive: 3,
  });

  // Case 4: Empty array
  testCases.push({
    label: 'empty markers array',
    markers: [],
    expectedActive: 0,
  });

  // Case 5: Single deleted marker
  testCases.push({
    label: 'single deleted marker',
    markers: [makeMarker({ deletedAt: deletedAtVariants[6] })],
    expectedActive: 0,
  });

  // Case 6: Large array with random distribution
  const largeSet = [];
  let expectedActiveCount = 0;
  for (let i = 0; i < 50; i++) {
    const isDeleted = i % 3 === 0; // every 3rd marker is deleted
    if (isDeleted) {
      largeSet.push(makeMarker({ deletedAt: deletedAtVariants[i % deletedAtVariants.length] }));
    } else {
      largeSet.push(makeMarker());
      expectedActiveCount++;
    }
  }
  testCases.push({
    label: 'large array (50 markers, every 3rd deleted)',
    markers: largeSet,
    expectedActive: expectedActiveCount,
  });

  return testCases;
}

describe('Property 15: Client-side deleted marker exclusion', () => {
  const testCases = generateMarkerSets();

  beforeEach(() => {
    mockFilterState.categories = [];
    mockFilterState.author = '';
    mockFilterState.startDate = null;
    mockFilterState.endDate = null;
  });

  it.each(testCases)(
    'no deleted markers rendered as pins — $label',
    ({ markers, expectedActive }) => {
      const { container } = render(<MarkerLayer markers={markers} />);
      const renderedPins = container.querySelectorAll('[data-testid="marker"]');

      // Core property: rendered pin count equals active (non-deleted) count
      expect(renderedPins).toHaveLength(expectedActive);

      // Stronger assertion: none of the rendered markers have a non-null deletedAt
      const deletedMarkerIds = markers
        .filter(m => m.deletedAt)
        .map(m => m._id);

      // Verify none of the rendered pin titles correspond to deleted markers
      for (const pin of renderedPins) {
        const pinText = pin.textContent;
        for (const deletedId of deletedMarkerIds) {
          const deletedMarker = markers.find(m => m._id === deletedId);
          expect(pinText).not.toContain(deletedMarker.title);
        }
      }
    }
  );
});
