import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getMarkers } from '../../api/markers';
import useAuthStore from '../../store/authStore';
import MarkerLayer from './MarkerLayer';

// Fix Leaflet default icon paths broken by bundlers (Vite/Webpack)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Default map center (San Luis, Argentina) and zoom
const DEFAULT_CENTER = [-33.3017, -66.3378];
const DEFAULT_ZOOM = 13;

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Inner component that listens to map click events.
 * Only triggers the callback when the user is authenticated.
 */
function MapClickHandler({ onMapClick }) {
  const token = useAuthStore((state) => state.token);

  useMapEvents({
    click(e) {
      if (token && onMapClick) {
        onMapClick(e.latlng);
      }
    },
  });

  return null;
}

/**
 * MapView — Root map component.
 *
 * Props:
 *   onMapClick(latlng) — called with { lat, lng } when an authenticated user clicks the map
 */
export default function MapView({ onMapClick }) {
  const [markers, setMarkers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMarkers() {
      try {
        const response = await getMarkers();
        if (!cancelled) {
          setMarkers(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load markers');
        }
      }
    }

    fetchMarkers();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-full h-full" data-testid="map-container">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
        <MapClickHandler onMapClick={onMapClick} />
        <MarkerLayer markers={markers} />
      </MapContainer>
      {error && (
        <div className="absolute top-4 left-4 bg-red-100 text-red-700 px-4 py-2 rounded shadow" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
