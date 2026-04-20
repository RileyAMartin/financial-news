import { useState, useEffect } from "react";
import { fetchJson } from "../api/client";

export function useFxData(baseCurrencyCode, targetCurrencies = [], startDate, endDate, frequency = "D") {
  const [data, setData] = useState({ metadata: null, data: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const targetsKey = targetCurrencies.join(",");

  useEffect(() => {
    if (!baseCurrencyCode || !targetsKey) {
      setData({ metadata: null, data: [] });
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    async function fetchFxData() {
      setLoading(true);
      setError(null);
      
      try {
        const queryParams = new URLSearchParams({
          currencyCode: baseCurrencyCode,
          targetCurrencies: targetsKey,
          frequency,
        });

        if (startDate) queryParams.append("startDate", startDate);
        if (endDate) queryParams.append("endDate", endDate);

        const json = await fetchJson(`/fx?${queryParams.toString()}`, {
          signal: controller.signal
        });

        if (isMounted) {
          setData({
            metadata: json.metadata || null,
            data: json.data || [],
          });
        }
      } catch (err) {
        if (err.name !== "AbortError" && isMounted) {
          setError(err.message);
          setData({ metadata: null, data: [] });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchFxData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [baseCurrencyCode, targetsKey, startDate, endDate, frequency]);

  return { ...data, loading, error };
}