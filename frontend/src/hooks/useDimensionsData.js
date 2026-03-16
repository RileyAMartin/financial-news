import { useEffect, useState } from "react";
import { getCountries, getIndicators, getSources } from "../api/dimensionsApi";
import { fetchJson } from "../api/client";

export function useDimensionsData() {
  const [data, setData] = useState({
    countries: [],
    indicators: [],
    sources: [],
    geoJson: null,
    loading: true,
    error: "",
  });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setData((prev) => ({ ...prev, loading: true, error: "" }));

        const [countries, indicators, sources, geoJson] = await Promise.all([
          getCountries(controller.signal),
          getIndicators(controller.signal),
          getSources(controller.signal),
          fetchJson("/world-countries.geojson", { signal: controller.signal }),
        ]);

        const sortedCountries = countries
          .slice()
          .sort((a, b) => a.display_name.localeCompare(b.display_name));

        setData({
          countries: sortedCountries,
          indicators,
          sources,
          geoJson,
          loading: false,
          error: "",
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          setData((prev) => ({
            ...prev,
            loading: false,
            error: error.message || "Failed to load dimensions.",
          }));
        }
      }
    }

    load();
    return () => controller.abort();
  }, []);

  return data;
}
