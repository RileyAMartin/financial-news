import { useEffect, useState } from "react";
import { getEconomicsByCountry } from "../api/economicsApi";

export function useEconomicsData(countryCode, startDate, endDate) {
  const [state, setState] = useState({
    data: {},
    loading: true,
    error: "",
  });

  useEffect(() => {
    if (!countryCode || !startDate || !endDate) {
      return undefined;
    }

    const controller = new AbortController();

    async function load() {
      try {
        setState((prev) => ({ ...prev, loading: true, error: "" }));

        const data = await getEconomicsByCountry(
          countryCode,
          startDate,
          endDate,
          controller.signal
        );

        setState({ data, loading: false, error: "" });
      } catch (error) {
        if (error.name !== "AbortError") {
          setState({
            data: {},
            loading: false,
            error: error.message || "Failed to load economics.",
          });
        }
      }
    }

    load();
    return () => controller.abort();
  }, [countryCode, startDate, endDate]);

  return state;
}
