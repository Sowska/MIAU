import { useRef, useCallback } from 'react';
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

/**
 * ============================================================================
 * MAPCONTAINER — Main Leaflet map initialization and layer host
 * ============================================================================
 *
 * Purpose:
 *   Root geographic component that initializes the Leaflet map instance and
 *   provides the container for all map layers, markers, and geographic
 *   interactions. This is the PRIMARY workspace of the application — all
 *   other UI floats above it.
 *
 * Anatomy:
 *   MapContainer
 *   ├── TileLayer (OpenStreetMap or custom basemap)
 *   ├── MapEventHandler (click, zoom, move listeners)
 *   └── Children (MarkerLayer, custom layers, overlays)
 *       ├── MarkerLayer (rendered by parent via children)
 *       ├── GeoJSON layers (future)
 *       └── Custom controls (future)
 *
 * Design System Compliance:
 *   - Map fills the available viewport (below navbar, beside/under drawer)
 *   - No hardcoded colors on the map container itself
 *   - Loading/error states use theme tokens
 *   - Map background matches --background for flash-free loading
 *   - Attribution styled to be unobtrusive
 *
 * Props:
 *   center        — initial center [lat, lng] (default: San Luis, Argentina)
 *   zoom          — initial zoom level (default: 13)
 *   tileUrl       — tile server URL template
 *   tileAttribution — attribution HTML string
 *   onMapClick    — callback when map surface is clicked (receives { lat, lng })
 *   onMoveEnd     — callback when map stops moving (receives bounds, center, zoom)
 *   onZoomEnd     — callback when zoom changes
 *   mapRef        — React ref to get the Leaflet map instance
 *   className     — additional container classes
 *   children      — MarkerLayer, custom layers, etc.
 *
 * Leaflet Integration:
 *   This IS the Leaflet integration point. It wraps react-leaflet's
 *   MapContainer, configures defaults, fixes icon paths, and provides
 *   a clean event interface to the rest of the React app.
 *
 *   Map state is synchronized with React via:
 *   - onMapClick → parent handles marker creation
 *   - onMoveEnd → parent can fetch markers in viewport
 *   - mapRef → imperative access for flyTo, setView, etc.
 *
 * States:
 *   - loading (map tiles loading — handled by Leaflet internally)
 *   - ready (map fully interactive)
 *   - error (tile load failure — shows error banner)
 *
 * Responsive:
 *   - Full viewport width and height (minus navbar)
 *   - Uses CSS calc or flex to account for navbar height (h-14 = 56px)
 *   - On mobile: map is always full viewport below navbar
 *   - Drawer/panels overlay the map, they don't shrink it
 *
 * Performance:
 *   - TileLayer uses standard OSM CDN with retina support
 *   - preferCanvas option for large marker sets (>500)
 *   - Map instance is created once and reused (react-leaflet handles this)
 * ============================================================================
 */

// Default configuration
const DEFAULT_CENTER = [-33.3017, -66.3378]; // San Luis, Argentina
const DEFAULT_ZOOM = 13;
const DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * @param {object} props
 * @param {[number, number]} [props.center] — [lat, lng]
 * @param {number} [props.zoom=13]
 * @param {string} [props.tileUrl]
 * @param {string} [props.tileAttribution]
 * @param {(latlng: { lat: number, lng: number }) => void} [props.onMapClick]
 * @param {(data: { bounds: object, center: [number,number], zoom: number }) => void} [props.onMoveEnd]
 * @param {(zoom: number) => void} [props.onZoomEnd]
 * @param {React.MutableRefObject} [props.mapRef]
 * @param {boolean} [props.preferCanvas=false] — use Canvas renderer for large datasets
 * @param {string} [props.className]
 * @param {React.ReactNode} [props.children]
 */
export default function MapContainer({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  tileUrl = DEFAULT_TILE_URL,
  tileAttribution = DEFAULT_ATTRIBUTION,
  onMapClick,
  onMoveEnd,
  onZoomEnd,
  mapRef,
  preferCanvas = false,
  className = '',
  children,
}) {
  const internalRef = useRef(null);

  // Expose map instance to parent via ref callback
  const handleMapRef = useCallback(
    (mapInstance) => {
      internalRef.current = mapInstance;
      if (mapRef) {
        mapRef.current = mapInstance;
      }
    },
    [mapRef]
  );

  return (
    <div
      className={[
        'relative w-full h-full',
        // Ensure map background matches theme for flash-free load
        'bg-background',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="map-container"
    >
      <LeafletMapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full z-0"
        style={{ height: '100%', width: '100%' }}
        preferCanvas={preferCanvas}
        ref={handleMapRef}
        zoomControl={true}
        attributionControl={true}
      >
        {/* Base tile layer */}
        <TileLayer
          url={tileUrl}
          attribution={tileAttribution}
          maxZoom={19}
        />

        {/* Map event bridge */}
        <MapEventBridge
          onMapClick={onMapClick}
          onMoveEnd={onMoveEnd}
          onZoomEnd={onZoomEnd}
        />

        {/* Children: MarkerLayer, custom layers, overlays */}
        {children}
      </LeafletMapContainer>
    </div>
  );
}

/**
 * MapEventBridge — Internal component that bridges Leaflet events to React callbacks.
 * Uses react-leaflet's useMapEvents hook. Renders nothing.
 */
function MapEventBridge({ onMapClick, onMoveEnd, onZoomEnd }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    },
    moveend(e) {
      if (onMoveEnd) {
        const map = e.target;
        const bounds = map.getBounds();
        const center = map.getCenter();
        const zoom = map.getZoom();
        onMoveEnd({
          bounds: {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
          },
          center: [center.lat, center.lng],
          zoom,
        });
      }
    },
    zoomend(e) {
      if (onZoomEnd) {
        onZoomEnd(e.target.getZoom());
      }
    },
  });

  return null;
}

/**
 * Convenience: export default center/zoom for use in parent components.
 */
export { DEFAULT_CENTER, DEFAULT_ZOOM };
