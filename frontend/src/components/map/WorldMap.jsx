import { useRef, useState, useEffect } from "react";
import { GeoJSON, MapContainer, TileLayer, useMapEvents, useMap } from "react-leaflet";
import { getFeatureIso3, getFeatureName } from "../../utils/geo";
import styles from "./WorldMap.module.css";
import "leaflet/dist/leaflet.css";

const MAP_STYLE = {
  default: {
    color: "#2d3748",
    weight: 0.5,
    fillColor: "#172b42",
    fillOpacity: 0.4,
  },
  hover: {
    color: "#90cdf4",
    weight: 1,
    fillColor: "#2c5282",
    fillOpacity: 0.5,
  },
  selected: {
    color: "#63b3ed",
    weight: 1.5,
    fillColor: "#2a6f97",
    fillOpacity: 0.65,
  },
};


function MapInteractions({ onDragStart, onDragEnd, onZoomStart }) {
  const map = useMapEvents({
    dragstart: () => {
      onDragStart();
      map.getContainer().classList.add(styles.mapDragging);
    },
    dragend: () => {
      onDragEnd();
      setTimeout(() => {
        map.getContainer().classList.remove(styles.mapDragging);
      }, 50);
    },
    zoomstart: () => {
      onZoomStart();
      map.getContainer().classList.add(styles.mapDragging);
    },
    zoomend: () => {
      setTimeout(() => {
        map.getContainer().classList.remove(styles.mapDragging);
      }, 50);
    },
  });
  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

export function WorldMap({ geoJson, selectedCountry, onSelectCountry, countries, loading }) {
  const hoveredLayerRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const availableCountryCodes = countries ? countries.map((c) => c.country_code) : [];

  const clearHover = () => {
    if (hoveredLayerRef.current) {
      const layer = hoveredLayerRef.current;
      // const iso3 = layer.feature.id;
      const iso3 = getFeatureIso3(layer.feature.properties);
      layer.setStyle(iso3 === selectedCountry ? MAP_STYLE.selected : MAP_STYLE.default);
      layer.closeTooltip();
      hoveredLayerRef.current = null;
    }
  };

  const styleFeature = (feature) => {
    // const iso3 = feature.id;
    const iso3 = getFeatureIso3(feature.properties);
    const isAvailable = availableCountryCodes.includes(iso3);

    if (!isAvailable) {
      return { ...MAP_STYLE.default, fillColor: "#2d3748", fillOpacity: 0.1 };
    }
    return iso3 === selectedCountry ? MAP_STYLE.selected : MAP_STYLE.default;
  };

  const onEachFeature = (feature, layer) => {
    // const iso3 = feature.id;
    const iso3 = getFeatureIso3(feature.properties);
    const name = getFeatureName(feature.properties);
    const isAvailable = availableCountryCodes.includes(iso3);

    layer.bindTooltip(
      isAvailable ? `${name} (${iso3})` : `${name} (N/A)`,
      {
        direction: "top",
        sticky: true,
        opacity: 0.96,
        className: styles.countryTooltip,
      }
    );

    layer.on({
      mouseover: (e) => {
        if (!isAvailable) return;
        const layer = e.target;
        // If we moved directly from one country to another without mouseout...
        if (hoveredLayerRef.current && hoveredLayerRef.current !== layer) {
          clearHover();
        }
        
        // Only apply hover style if not selected
        if (iso3 !== selectedCountry) {
          layer.setStyle(MAP_STYLE.hover);
        }
        hoveredLayerRef.current = layer;
      },
      mouseout: (e) => {
        if (!isAvailable) return;
        // Only clear if we are moving out of the current hovered layer
        if (hoveredLayerRef.current === e.target) {
          clearHover();
        }
      },
      click: () => {
        if (isAvailable && iso3 && iso3 !== selectedCountry) {
          onSelectCountry(iso3);
        }
      },
    });
  };

  if (loading || !geoJson) {
    return (
      <div className={`panel ${styles.mapPanel} ${styles.loadingPanel}`}>
        <span className="spinner" aria-hidden="true" />
        <span>Loading world map...</span>
      </div>
    );
  }

  return (
    <section className={`panel ${styles.mapPanel} ${styles.mapLoaded}`}>
      <div className={`${styles.mapContainerWrapper} ${isCollapsed ? styles.collapsed : ""}`}>
        <MapContainer
          center={[20, 0]}
          zoom={2}
          minZoom={2}
          maxZoom={6}
          scrollWheelZoom={true}
          maxBounds={[
            [-90, -180],
            [90, 180],
          ]}
          maxBoundsViscosity={1.0}
          className={styles.worldMap}
          attributionControl={false}
        >
          <MapResizer />
          <MapInteractions
            onDragStart={clearHover}
            onDragEnd={() => {}}
            onZoomStart={clearHover}
          />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            noWrap={true}
            bounds={[
              [-90, -180],
              [90, 180],
            ]}
          />
          <GeoJSON
            key={selectedCountry} // Only re-render when selection changes, NOT on hover
            data={geoJson}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        </MapContainer>
        <button 
          className={styles.collapseButton} 
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand map" : "Collapse map"}
        >
          {isCollapsed ? "↓" : "↑"}
        </button>
      </div>
    </section>
  );
}
