import { useEffect, useState, useRef } from "react";
import { getEconomicsByCountry } from "../api/economicsApi";

export function useEconomicsData(countryCode, startDate, endDate, currency) {
  const requestSequenceRef = useRef(0);
  const [state, setState] = useState({
    data: {},
    loading: false,
    error: "",
  });

  useEffect(() => {
    if (!countryCode || !startDate || !endDate) {
      return undefined;
    }

    const controller = new AbortController();
    requestSequenceRef.current += 1;
    const requestSequence = requestSequenceRef.current;

    async function load() {
      try {
        setState((prev) => ({ ...prev, loading: true, error: "" }));

        const data = await getEconomicsByCountry(
          countryCode,
          startDate,
          endDate,
          currency,
          controller.signal
        );

        if (requestSequence === requestSequenceRef.current) {
          setState({ data, loading: false, error: "" });
        }
      } catch (error) {
        if (requestSequence === requestSequenceRef.current && error.name !== "AbortError") {
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
  }, [countryCode, startDate, endDate, currency]);

  return state;
}
