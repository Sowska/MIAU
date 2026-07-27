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
