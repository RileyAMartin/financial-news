import { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { GeoJSON, MapContainer, TileLayer, useMapEvents, useMap } from "react-leaflet";
import styles from "./WorldMap.module.css";
import { UI_CONSTANTS } from "../../utils/constants";
import "leaflet/dist/leaflet.css";

const MAP_STYLE = {
  default: {
    color: "#3f3f46",
    weight: 0.8,
    fillColor: "#000000",
    fillOpacity: 1,
  },
  hover: {
    color: "#FFB800",
    weight: 1,
    fillColor: "#18181b",
    fillOpacity: 1,
  },
  selected: {
    color: "#FFB800",
    weight: 1.5,
    fillColor: "#18181b",
    fillOpacity: 1,
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

  const availableCountryCodes = countries ? countries.map((c) => c.country_code) : [];

  const clearHover = () => {
    if (hoveredLayerRef.current) {
      const layer = hoveredLayerRef.current;
      const iso3 = layer.feature.properties["ISO3166-1-Alpha-3"];
      layer.setStyle(iso3 === selectedCountry ? MAP_STYLE.selected : MAP_STYLE.default);
      layer.closeTooltip();
      hoveredLayerRef.current = null;
    }
  };

  const styleFeature = (feature) => {
    const iso3 = feature.properties["ISO3166-1-Alpha-3"];
    const isAvailable = availableCountryCodes.includes(iso3);

    if (!isAvailable) {
      return { ...MAP_STYLE.default, fillColor: "#2d3748", fillOpacity: 0.1 };
    }
    return iso3 === selectedCountry ? MAP_STYLE.selected : MAP_STYLE.default;
  };

  const onEachFeature = (feature, layer) => {
    const iso3 = feature.properties["ISO3166-1-Alpha-3"];
    const name = feature.properties.name || "Unknown";
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
        if (hoveredLayerRef.current && hoveredLayerRef.current !== layer) {
          clearHover();
        }
        
        if (iso3 !== selectedCountry) {
          layer.setStyle(MAP_STYLE.hover);
        }
        hoveredLayerRef.current = layer;
      },
      mouseout: (e) => {
        if (!isAvailable) return;
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
      <div className={`${styles.mapPanel} ${styles.loadingPanel}`}>
        <span className="spinner" aria-hidden="true" />
        <span>LOADING WORLD MAP...</span>
      </div>
    );
  }

  return (
    <section className={`${styles.mapPanel} ${styles.mapLoaded}`}>
      <div className={styles.mapContainerWrapper}>
        <MapContainer
          center={UI_CONSTANTS.MAP.DEFAULT_CENTER}
          zoom={UI_CONSTANTS.MAP.DEFAULT_ZOOM}
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
            key={selectedCountry}
            data={geoJson}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        </MapContainer>

      </div>
    </section>
  );
}

MapInteractions.propTypes = {
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
  onZoomStart: PropTypes.func,
};

WorldMap.propTypes = {
  geoJson: PropTypes.object,
  selectedCountry: PropTypes.string,
  countries: PropTypes.arrayOf(
    PropTypes.shape({
      country_code: PropTypes.string.isRequired,
    })
  ).isRequired,
  loading: PropTypes.bool,
  onSelectCountry: PropTypes.func.isRequired,
};
