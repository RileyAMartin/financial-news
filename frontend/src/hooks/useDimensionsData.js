import { useEffect, useState } from "react";
import { getCountries, getIndicators, getSources, getCurrencies, getGeoMap } from "../api/dimensionsApi";

export function useDimensionsData() {
  const [data, setData] = useState({
    countries: [],
    indicators: [],
    sources: [],
    currencies: [],
    geoJson: null,
    loading: true,
    error: "",
  });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setData((prev) => ({ ...prev, loading: true, error: "" }));

        const [countries, indicators, sources, currencies, geoJson] = await Promise.all([
          getCountries(controller.signal),
          getIndicators(controller.signal),
          getSources(controller.signal),
          getCurrencies(controller.signal),
          getGeoMap(controller.signal),
        ]);

        const sortedCountries = countries
          .slice()
          .sort((a, b) => a.display_name.localeCompare(b.display_name));

        const sortedCurrencies = currencies
          .slice()
          .sort((a, b) => a.currency_code.localeCompare(b.currency_code));

        setData({
          countries: sortedCountries,
          indicators,
          sources,
          currencies: sortedCurrencies,
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
