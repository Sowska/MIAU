import L from 'leaflet';

/**
 * Category → accent color mapping.
 * These match the SunsetDark palette already used in the legend.
 */
const CATEGORY_COLORS = {
  mural: '#dc3977',
  graffiti: '#f0746e',
  sculpture: '#7c1d6f',
};

const DEFAULT_COLOR = '#6b7280'; // gray-500 fallback

/**
 * Resolves an image path to a full URL.
 * Handles both absolute URLs (S3) and relative paths (local uploads).
 */
function resolveImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const serverRoot = baseUrl.replace(/\/api\/?$/, '');
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${serverRoot}${path}`;
}

/**
 * Creates a custom Leaflet DivIcon that displays:
 * - A pin/teardrop shape with the category accent color as border
 * - The marker's art image clipped inside the pin (or a "?" if no image)
 * - A drop shadow beneath the marker
 *
 * @param {object} options
 * @param {string} options.category - 'mural' | 'graffiti' | 'sculpture'
 * @param {string|null} options.imagePath - URL or relative path to the art image
 * @returns {L.DivIcon}
 */
export function createMarkerIcon({ category, imagePath }) {
  const accentColor = CATEGORY_COLORS[category] || DEFAULT_COLOR;
  const imageUrl = resolveImageUrl(imagePath);

  // Inner content: image or question mark
  const innerContent = imageUrl
    ? `<img src="${imageUrl}" alt="" class="miau-marker__image" />`
    : `<span class="miau-marker__placeholder">?</span>`;

  const html = `
    <div class="miau-marker" style="--accent-color: ${accentColor}">
      <div class="miau-marker__pin">
        ${innerContent}
      </div>
      <div class="miau-marker__shadow"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'miau-marker-wrapper',
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -46],
  });
}

export { CATEGORY_COLORS };
