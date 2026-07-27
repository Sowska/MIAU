import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MapView from './MapView';

// Mock react-leaflet components
vi.mock('react-leaflet', () => {
  const MapContainer = ({ children, ...props }) => (
    <div data-testid="leaflet-map" data-center={JSON.stringify(props.center)} data-zoom={props.zoom}>
      {children}
    </div>
  );
  const TileLayer = (props) => (
    <div data-testid="tile-layer" data-url={props.url} data-attribution={props.attribution} />
  );
  const useMapEvents = (handlers) => {
    // Store click handler on window for testing
    if (handlers.click) {
      window.__mapClickHandler = handlers.click;
    }
    return null;
  };
  const Marker = ({ children }) => <div data-testid="marker">{children}</div>;
  const Popup = ({ children }) => <div data-testid="popup">{children}</div>;
  return { MapContainer, TileLayer, useMapEvents, Marker, Popup };
});

// Mock leaflet
vi.mock('leaflet', () => ({
  default: {
    Icon: {
      Default: {
        prototype: { _getIconUrl: '' },
        mergeOptions: vi.fn(),
      },
    },
  },
}));

// Mock leaflet CSS import
vi.mock('leaflet/dist/leaflet.css', () => ({}));

// Mock leaflet icon images
vi.mock('leaflet/dist/images/marker-icon-2x.png', () => ({ default: 'marker-icon-2x.png' }));
vi.mock('leaflet/dist/images/marker-icon.png', () => ({ default: 'marker-icon.png' }));
vi.mock('leaflet/dist/images/marker-shadow.png', () => ({ default: 'marker-shadow.png' }));

// Mock getMarkers API
vi.mock('../../api/markers', () => ({
  getMarkers: vi.fn(),
}));

// Mock auth store
const mockToken = { current: null };
vi.mock('../../store/authStore', () => ({
  default: (selector) => selector({ token: mockToken.current }),
}));

// Mock filter store (used by MarkerLayer)
vi.mock('../../store/filterStore', () => ({
  default: (selector) => selector({ categories: [], author: '', startDate: null, endDate: null }),
}));

import { getMarkers } from '../../api/markers';

describe('MapView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken.current = null;
    getMarkers.mockResolvedValue({ data: [] });
  });

  it('renders a MapContainer with correct default center and zoom', () => {
    render(<MapView />);
    const map = screen.getByTestId('leaflet-map');
    expect(map).toBeInTheDocument();
    expect(map.dataset.center).toBe(JSON.stringify([-33.3017, -66.3378]));
    expect(map.dataset.zoom).toBe('13');
  });

  it('renders an OSM TileLayer with correct URL and attribution', () => {
    render(<MapView />);
    const tile = screen.getByTestId('tile-layer');
    expect(tile).toBeInTheDocument();
    expect(tile.dataset.url).toBe('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(tile.dataset.attribution).toContain('OpenStreetMap');
  });

  it('fetches markers on mount', async () => {
    const mockMarkers = [
      { _id: '1', title: 'Mural A', category: 'mural', location: { type: 'Point', coordinates: [-3.7, 40.4] } },
    ];
    getMarkers.mockResolvedValue({ data: mockMarkers });

    render(<MapView />);

    await waitFor(() => {
      expect(getMarkers).toHaveBeenCalledTimes(1);
    });
  });

  it('displays an error message when marker fetch fails', async () => {
    getMarkers.mockRejectedValue(new Error('Network error'));

    render(<MapView />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error');
    });
  });

  it('calls onMapClick with latlng when authenticated user clicks map', () => {
    mockToken.current = 'valid-jwt-token';
    const onMapClick = vi.fn();

    render(<MapView onMapClick={onMapClick} />);

    // Simulate map click via the stored handler
    const fakeEvent = { latlng: { lat: 40.42, lng: -3.71 } };
    window.__mapClickHandler(fakeEvent);

    expect(onMapClick).toHaveBeenCalledWith({ lat: 40.42, lng: -3.71 });
  });

  it('does NOT call onMapClick when user is not authenticated', () => {
    mockToken.current = null;
    const onMapClick = vi.fn();

    render(<MapView onMapClick={onMapClick} />);

    const fakeEvent = { latlng: { lat: 40.42, lng: -3.71 } };
    window.__mapClickHandler(fakeEvent);

    expect(onMapClick).not.toHaveBeenCalled();
  });

  it('renders without onMapClick prop (no error)', () => {
    mockToken.current = 'valid-jwt-token';

    render(<MapView />);

    // Should not throw when clicking without onMapClick
    const fakeEvent = { latlng: { lat: 40.42, lng: -3.71 } };
    expect(() => window.__mapClickHandler(fakeEvent)).not.toThrow();
  });
});
