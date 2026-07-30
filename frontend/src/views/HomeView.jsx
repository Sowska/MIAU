import { useState, useEffect, useRef, useCallback } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import useAuthStore from '../store/authStore';
import useFilterStore from '../store/filterStore';
import useToastStore from '../store/toastStore';
import { getMarkers, createMarker, updateMarker, deleteMarker } from '../api/markers';

import {
  MapContainer,
  SearchBar,
  FilterPanel,
  Legend,
  FloatingActionButton,
  MarkerPopup,
  MarkerDetailDrawer,
  MarkerFormModal,
} from '../components/ui';

import { Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { createMarkerIcon } from '../features/map/createMarkerIcon';
import { applyFilters } from '../features/map/MarkerLayer';

/**
 * ============================================================================
 * HOME VIEW — Primary GIS workspace
 * ============================================================================
 *
 * The map is ALWAYS the main workspace. All interactions happen contextually
 * via floating panels, drawers, and modals — never by navigating away.
 *
 * Layout (Desktop):
 *   ┌─────────────────────────────────────────────────────┐
 *   │ [Navbar — rendered by App.jsx above]                │
 *   ├─────────────────────────────────────────────────────┤
 *   │                                                     │
 *   │  [SearchBar — top center, floating]                 │
 *   │                                                     │
 *   │  [FilterPanel]              [Interactive Map]       │
 *   │  (left float)                                       │
 *   │                                                     │
 *   │  [Legend]                          [FAB — bottom-right] │
 *   │  (bottom-left)                                      │
 *   │                                                     │
 *   │                    [MarkerDetailDrawer — right side] │
 *   └─────────────────────────────────────────────────────┘
 *
 * Layout (Mobile):
 *   ┌──────────────────┐
 *   │ [Navbar]         │
 *   ├──────────────────┤
 *   │                  │
 *   │  [Map — full]    │
 *   │                  │
 *   │  [FAB]           │
 *   │  [Bottom Sheet]  │
 *   └──────────────────┘
 *
 * Contextual interactions:
 *   - Click marker → MarkerPopup → "View Details" → MarkerDetailDrawer
 *   - Click map (auth) → MarkerFormModal (create)
 *   - Edit from drawer → MarkerFormModal (edit)
 *   - Filters → FilterPanel updates store → MarkerLayer reacts
 * ============================================================================
 */

/** Category legend items using SunsetDark palette */
const LEGEND_ITEMS = [
  { color: '#dc3977', label: 'Mural' },
  { color: '#f0746e', label: 'Graffiti' },
  { color: '#7c1d6f', label: 'Sculpture' },
];

const CATEGORIES = ['mural', 'graffiti', 'sculpture'];

/** Zoom level at which individual marker images become visible */
const IMAGE_ZOOM_THRESHOLD = 15;

/** Custom cluster icon generator — styled circle with count */
function createClusterCustomIcon(cluster) {
  const count = cluster.getChildCount();
  let size = 'small';
  let diameter = 36;
  if (count >= 100) {
    size = 'large';
    diameter = 50;
  } else if (count >= 10) {
    size = 'medium';
    diameter = 42;
  }
  return L.divIcon({
    html: `<div class="miau-cluster miau-cluster--${size}"><span>${count}</span></div>`,
    className: 'miau-cluster-wrapper',
    iconSize: L.point(diameter, diameter),
  });
}

export default function HomeView() {
  const mapRef = useRef(null);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  // Filter store
  const categories = useFilterStore((s) => s.categories);
  const author = useFilterStore((s) => s.author);
  const startDate = useFilterStore((s) => s.startDate);
  const endDate = useFilterStore((s) => s.endDate);
  const setFilter = useFilterStore((s) => s.setFilter);
  const clearFilters = useFilterStore((s) => s.clearFilters);

  // Markers data
  const [markers, setMarkers] = useState([]);
  const [loadingMarkers, setLoadingMarkers] = useState(true);
  const [markerError, setMarkerError] = useState('');

  // UI state
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingMarker, setEditingMarker] = useState(null);
  const [clickCoordinates, setClickCoordinates] = useState(null);
  const [filterPanelCollapsed, setFilterPanelCollapsed] = useState(false);
  const [formError, setFormError] = useState('');
  const [tempPin, setTempPin] = useState(null); // { lat, lng } for temporary creation pin
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [markersAnimated, setMarkersAnimated] = useState(false);

  // Zoom level for conditional image rendering
  const [zoomLevel, setZoomLevel] = useState(13);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const longPressTimerRef = useRef(null);

  // ── Tour / Walkthrough ────────────────────────────────────────────────────
  const [runTour, setRunTour] = useState(false);

  const tourSteps = [
    {
      target: '[data-tour="map-area"]',
      content: '¡Bienvenido a MIAU! Este es tu mapa interactivo de arte urbano. Podés explorar murales, graffitis y esculturas por la ciudad.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="search-bar"]',
      content: 'Usá la barra de búsqueda para encontrar obras por título, nombre del artista o categoría.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="filter-panel"]',
      content: 'Filtrá los marcadores por categoría (mural, graffiti, escultura), artista o rango de fechas.',
      placement: 'right',
    },
    {
      target: '[data-tour="legend"]',
      content: 'La leyenda muestra el código de color para cada categoría de arte y cuántos son visibles actualmente.',
      placement: 'top',
    },
    {
      target: '[data-tour="create-marker"]',
      content: 'Tocá aquí o hacé clic en cualquier lugar del mapa para agregar un nuevo marcador. ¡Podés subir una foto y agregar detalles!',
      placement: 'left',
    },
  ];

  function handleTourCallback(data) {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
    }
  }

  // ── Data Fetching ─────────────────────────────────────────────────────────

  const fetchMarkers = useCallback(async () => {
    setLoadingMarkers(true);
    setMarkerError('');
    try {
      const res = await getMarkers();
      setMarkers(res.data);
    } catch (err) {
      setMarkerError(err.message || 'Error al cargar los marcadores');
    } finally {
      setLoadingMarkers(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkers();
  }, [fetchMarkers]);

  // Fly to a specific marker if navigated from profile
  useEffect(() => {
    if (!loadingMarkers && mapRef.current && window.__miauFlyTo) {
      const { lat, lng, markerId } = window.__miauFlyTo;
      delete window.__miauFlyTo;
      // Small delay to ensure map is ready
      setTimeout(() => {
        mapRef.current.flyTo([lat, lng], 16, { duration: 1 });
        // Open the marker's popup after flyTo animation completes
        if (markerId) {
          const target = markers.find((m) => m._id === markerId);
          if (target) {
            setSelectedMarker(target);
            // Find the Leaflet marker layer and open its popup
            setTimeout(() => {
              mapRef.current.eachLayer((layer) => {
                if (layer.getLatLng) {
                  const layerLatLng = layer.getLatLng();
                  if (
                    Math.abs(layerLatLng.lat - lat) < 0.00001 &&
                    Math.abs(layerLatLng.lng - lng) < 0.00001
                  ) {
                    layer.openPopup();
                  }
                }
              });
            }, 1200);
          }
        }
      }, 300);
    }
  }, [loadingMarkers, markers]);

  // Mark initial animation as complete after first load
  useEffect(() => {
    if (!loadingMarkers && markers.length >= 0 && !markersAnimated) {
      const timer = setTimeout(() => setMarkersAnimated(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [loadingMarkers, markersAnimated, markers.length]);

  // ── Filtered markers ──────────────────────────────────────────────────────

  const activeMarkers = markers.filter((m) => !m.deletedAt);
  const visibleMarkers = applyFilters(activeMarkers, {
    categories,
    author,
    startDate,
    endDate,
  });

  // ── Search logic ──────────────────────────────────────────────────────────

  function handleSearchChange(value) {
    setSearchQuery(value);
    if (!value.trim()) {
      setSearchSuggestions([]);
      return;
    }
    const query = value.toLowerCase();
    const results = activeMarkers
      .filter(
        (m) =>
          m.title?.toLowerCase().includes(query) ||
          m.author?.toLowerCase().includes(query) ||
          m.category?.toLowerCase().includes(query)
      )
      .slice(0, 8)
      .map((m) => ({
        id: m._id,
        label: m.title,
        subtitle: m.author ? `Por ${m.author}` : m.category,
        type: 'marker',
        marker: m,
      }));
    setSearchSuggestions(results);
  }

  function handleSearchSelect(suggestion) {
    if (suggestion.marker) {
      const coords = suggestion.marker.location?.coordinates;
      if (coords && mapRef.current) {
        mapRef.current.flyTo([coords[1], coords[0]], 16);
      }
      setSelectedMarker(suggestion.marker);
      setDrawerOpen(true);
    }
    setSearchQuery(suggestion.label);
    setSearchSuggestions([]);
  }

  function handleSearchClear() {
    setSearchQuery('');
    setSearchSuggestions([]);
  }

  // ── Map interactions ──────────────────────────────────────────────────────

  function handleMapClick(latlng) {
    // If a popup is open, close it instead of creating a new marker
    if (selectedMarker) {
      setSelectedMarker(null);
      return;
    }
    // Only open create form for authenticated users
    if (token && user) {
      setTempPin(latlng);
      setClickCoordinates(latlng);
      setEditingMarker(null);
      // Small delay to show bounce animation before opening form
      setTimeout(() => setFormModalOpen(true), 400);
    }
  }

  // Long-press handler for mobile marker creation
  function handleMapMouseDown(latlng) {
    if (!token || !user) return;
    longPressTimerRef.current = setTimeout(() => {
      // Trigger haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(50);
      handleMapClick(latlng);
    }, 500);
  }

  function handleMapMouseUp() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function handleMarkerClick(marker) {
    setSelectedMarker(marker);
    // Smooth flyTo animation to center on the marker
    const coords = marker.location?.coordinates;
    if (coords && mapRef.current) {
      mapRef.current.flyTo([coords[1], coords[0]], Math.max(mapRef.current.getZoom(), 15), {
        duration: 0.8,
      });
    }
  }

  function handleViewDetails(marker) {
    setSelectedMarker(marker);
    setDrawerOpen(true);
  }

  function handleDrawerClose() {
    setDrawerOpen(false);
    // Keep selectedMarker for potential re-open
  }

  // ── CRUD operations ───────────────────────────────────────────────────────

  const addToast = useToastStore((s) => s.addToast);

  async function handleFormSubmit(formData) {
    setFormError('');
    try {
      if (editingMarker) {
        await updateMarker(editingMarker._id, formData);
        addToast('success', 'Marcador actualizado correctamente');
      } else {
        await createMarker(formData);
        addToast('success', 'Marcador creado correctamente');
      }
      await fetchMarkers();
      setFormModalOpen(false);
      setEditingMarker(null);
      setClickCoordinates(null);
      setTempPin(null);
    } catch (err) {
      const message =
        err.response?.data?.error || 'Algo salió mal. Intentá de nuevo.';
      setFormError(message);
      throw err; // Let modal handle the error display
    }
  }

  function handleEditMarker(marker) {
    setEditingMarker(marker);
    setFormModalOpen(true);
    setDrawerOpen(false);
  }

  async function handleDeleteMarker(marker) {
    const confirmed = window.confirm(
      `¿Estás seguro de que querés eliminar "${marker.title}"?`
    );
    if (!confirmed) return;
    try {
      await deleteMarker(marker._id);
      addToast('success', 'Marcador eliminado');
      await fetchMarkers();
      setDrawerOpen(false);
      setSelectedMarker(null);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al eliminar el marcador';
      addToast('error', msg);
      setMarkerError(msg);
    }
  }

  // ── Filter handlers ───────────────────────────────────────────────────────

  function handleCategoryChange(category) {
    const updated = categories.includes(category)
      ? categories.filter((c) => c !== category)
      : [...categories, category];
    setFilter('categories', updated);
  }

  // ── Owner check ───────────────────────────────────────────────────────────

  const isOwner = Boolean(
    user &&
      selectedMarker &&
      ((selectedMarker.owner?._id && selectedMarker.owner._id === user._id) ||
        (typeof selectedMarker.owner === 'string' &&
          selectedMarker.owner === user._id))
  );

  // ── Legend with counts ────────────────────────────────────────────────────

  const legendItems = LEGEND_ITEMS.map((item) => ({
    ...item,
    count: visibleMarkers.filter(
      (m) => m.category === item.label.toLowerCase()
    ).length,
  }));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div data-tour="map-area" className="relative w-full h-[calc(100vh-56px)] overflow-hidden">
      {/* ═══ MAP (always the workspace) ═══ */}
      <MapContainer
        mapRef={mapRef}
        onMapClick={handleMapClick}
        onZoomEnd={(zoom) => setZoomLevel(zoom)}
        className="absolute inset-0"
      >
        {/* Clustered Marker Layer */}
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={60}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          zoomToBoundsOnClick
          animate
        >
          {visibleMarkers.map((marker) => {
            const position = [
              marker.location.coordinates[1],
              marker.location.coordinates[0],
            ];
            // Show image-filled pin only when zoomed in; otherwise simple colored pin
            const showImage = zoomLevel >= IMAGE_ZOOM_THRESHOLD;
            const icon = createMarkerIcon({
              category: marker.category,
              imagePath: showImage ? marker.imagePath : null,
            });
            return (
              <Marker
                key={marker._id}
                position={position}
                icon={icon}
                eventHandlers={{
                  click: () => handleMarkerClick(marker),
                  popupclose: () => setSelectedMarker(null),
                  mouseover: (e) => {
                    const el = e.target.getElement();
                    if (el) el.classList.add('marker-hover');
                  },
                  mouseout: (e) => {
                    const el = e.target.getElement();
                    if (el) el.classList.remove('marker-hover');
                  },
                }}
              >
                <Popup>
                  <MarkerPopup
                    marker={marker}
                    onViewDetails={handleViewDetails}
                  />
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>

        {/* Temporary pin for marker creation (bounce animation) */}
        {tempPin && (
          <Marker
            position={[tempPin.lat, tempPin.lng]}
            icon={L.divIcon({
              html: `<div class="miau-marker" style="--accent-color: #22c55e">
                <div class="miau-marker__pin">
                  <span class="miau-marker__placeholder">+</span>
                </div>
                <div class="miau-marker__shadow"></div>
              </div>`,
              className: 'miau-marker-wrapper',
              iconSize: [40, 50],
              iconAnchor: [20, 50],
              popupAnchor: [0, -46],
            })}
            eventHandlers={{
              add: (e) => {
                const el = e.target.getElement();
                if (el) el.classList.add('marker-bounce');
              },
            }}
          />
        )}
      </MapContainer>

      {/* ═══ FLOATING UI LAYER ═══ */}

      {/* Search Bar — top center */}
      <div data-tour="search-bar" className="absolute top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-full sm:max-w-md z-[400]">
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          onSelect={handleSearchSelect}
          onClear={handleSearchClear}
          suggestions={searchSuggestions}
          placeholder="Buscar obras, artistas..."
        />
      </div>

      {/* Filter Panel — left side (desktop), hidden on mobile by default */}
      <div data-tour="filter-panel" className="hidden sm:block absolute top-20 left-4 z-[400]">
        <FilterPanel
          categories={CATEGORIES}
          selectedCategories={categories}
          author={author}
          startDate={startDate}
          endDate={endDate}
          onCategoryChange={handleCategoryChange}
          onAuthorChange={(val) => setFilter('author', val)}
          onStartDateChange={(val) => setFilter('startDate', val)}
          onEndDateChange={(val) => setFilter('endDate', val)}
          onClearAll={clearFilters}
          collapsed={filterPanelCollapsed}
          onToggleCollapse={() => setFilterPanelCollapsed((p) => !p)}
        />
      </div>

      {/* Legend — bottom left (desktop only, hidden on mobile to avoid overlap) */}
      <div data-tour="legend" className="hidden sm:block absolute bottom-6 left-4 z-[400]">
        <Legend items={legendItems} title="Categorías" />
      </div>

      {/* Floating Action Button — bottom right (create marker) */}
      {token && user && (
        <div data-tour="create-marker" className="absolute bottom-6 right-4 z-[400]">
          <FloatingActionButton
            label="Agregar nuevo marcador"
            variant="primary"
            size="lg"
            onClick={() => {
              // Open form without coordinates — user will search by address
              setClickCoordinates(null);
              setEditingMarker(null);
              setTempPin(null);
              setFormModalOpen(true);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </FloatingActionButton>
        </div>
      )}

      {/* Mobile: Filter FAB — opens bottom sheet */}
      <div className="sm:hidden absolute bottom-24 left-4 z-[400]">
        <FloatingActionButton
          label="Abrir filtros"
          variant="muted"
          size="md"
          onClick={() => setMobileFilterOpen(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </FloatingActionButton>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      {mobileFilterOpen && (
        <>
          <div
            className="sm:hidden fixed inset-0 z-[500] bg-background/50 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setMobileFilterOpen(false)}
            aria-hidden="true"
          />
          <div
            className="sm:hidden fixed bottom-0 left-0 right-0 z-[501] bg-card rounded-t-xl border-t border-border shadow-xl max-h-[70vh] overflow-y-auto animate-slide-up"
            style={{ animation: 'slide-up 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 rounded-full bg-border" aria-hidden="true" />
            </div>
            <div className="px-4 pb-6">
              <FilterPanel
                categories={CATEGORIES}
                selectedCategories={categories}
                author={author}
                startDate={startDate}
                endDate={endDate}
                onCategoryChange={handleCategoryChange}
                onAuthorChange={(val) => setFilter('author', val)}
                onStartDateChange={(val) => setFilter('startDate', val)}
                onEndDateChange={(val) => setFilter('endDate', val)}
                onClearAll={clearFilters}
                collapsed={false}
                className="border-0 shadow-none bg-transparent backdrop-blur-0"
              />
            </div>
          </div>
        </>
      )}

      {/* Error banner */}
      {markerError && (
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 z-[500] bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg shadow-lg text-sm backdrop-blur-sm"
          role="alert"
        >
          {markerError}
          <button
            type="button"
            onClick={() => setMarkerError('')}
            className="ml-3 font-medium underline"
            aria-label="Dismiss error"
          >
            Descartar
          </button>
        </div>
      )}

      {/* ═══ CONTEXTUAL OVERLAYS ═══ */}

      {/* Marker Detail Drawer */}
      <MarkerDetailDrawer
        isOpen={drawerOpen}
        marker={selectedMarker}
        isOwner={isOwner}
        onClose={handleDrawerClose}
        onEdit={handleEditMarker}
        onDelete={handleDeleteMarker}
      />

      {/* Marker Form Modal (Create / Edit) */}
      <MarkerFormModal
        isOpen={formModalOpen}
        marker={editingMarker}
        coordinates={clickCoordinates}
        onSubmit={handleFormSubmit}
        onClose={() => {
          setFormModalOpen(false);
          setEditingMarker(null);
          setClickCoordinates(null);
          setTempPin(null);
          setFormError('');
        }}
        error={formError}
      />

      {/* Guided Tour (react-joyride) — only for authenticated users */}
      {token && user && (
        <Joyride
          steps={tourSteps}
          run={runTour}
          continuous
          showSkipButton
          showProgress
          callback={handleTourCallback}
          styles={{
            options: {
              primaryColor: 'hsl(338, 68%, 54%)',
              zIndex: 10000,
            },
            tooltip: {
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
            },
            buttonNext: {
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              padding: '8px 16px',
            },
            buttonBack: {
              color: 'hsl(215, 16%, 47%)',
              fontSize: '0.875rem',
            },
            buttonSkip: {
              color: 'hsl(215, 16%, 47%)',
              fontSize: '0.875rem',
            },
          }}
          locale={{
            back: 'Atrás',
            close: 'Cerrar',
            last: 'Listo',
            next: 'Siguiente',
            skip: 'Saltar tour',
          }}
        />
      )}

      {/* Help / Tour button — only for authenticated users */}
      {token && user && (
        <div className="absolute bottom-[180px] right-4 sm:bottom-auto sm:top-4 sm:right-4 z-[400]">
          <FloatingActionButton
            label="Iniciar tour guiado"
            variant="muted"
            size="sm"
            onClick={() => setRunTour(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </FloatingActionButton>
        </div>
      )}
    </div>
  );
}
