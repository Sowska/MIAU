import { Marker, Popup } from 'react-leaflet';
import useFilterStore from '../../store/filterStore';

/**
 * Applies client-side filters to the markers array.
 * Exported separately so it can be unit-tested independently.
 */
export function applyFilters(markers, { categories, author, startDate, endDate }) {
  return markers.filter(m => {
    if (categories.length > 0 && !categories.includes(m.category)) return false;
    if (author && !m.author?.toLowerCase().includes(author.toLowerCase())) return false;
    if (startDate && new Date(m.date) < new Date(startDate)) return false;
    if (endDate   && new Date(m.date) > new Date(endDate))   return false;
    return true;
  });
}

/**
 * MarkerLayer — renders filtered markers as Leaflet pins on the map.
 *
 * Props:
 *   markers       — full array of marker objects from the API
 *   onMarkerClick — optional callback when a marker is clicked (receives the marker object)
 */
export default function MarkerLayer({ markers = [], onMarkerClick }) {
  const categories = useFilterStore((state) => state.categories);
  const author = useFilterStore((state) => state.author);
  const startDate = useFilterStore((state) => state.startDate);
  const endDate = useFilterStore((state) => state.endDate);

  // Defense-in-depth: exclude soft-deleted markers on the client side
  const activeMarkers = markers.filter(m => !m.deletedAt);

  // Apply user-selected filters
  const visibleMarkers = applyFilters(activeMarkers, { categories, author, startDate, endDate });

  return (
    <>
      {visibleMarkers.map((marker) => {
        // GeoJSON coordinates are [lng, lat]; Leaflet expects [lat, lng]
        const position = [
          marker.location.coordinates[1],
          marker.location.coordinates[0],
        ];

        return (
          <Marker
            key={marker._id}
            position={position}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) {
                  onMarkerClick(marker);
                }
              },
            }}
          >
            <Popup>
              <div className="text-sm">
                <h3 className="font-semibold text-base">{marker.title}</h3>
                <p className="text-gray-600 capitalize">{marker.category}</p>
                {marker.author && <p className="text-gray-500">By: {marker.author}</p>}
                {marker.date && (
                  <p className="text-gray-500">
                    {new Date(marker.date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
