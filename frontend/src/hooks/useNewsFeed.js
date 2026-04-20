import { useCallback, useEffect, useState } from "react";
import { getNewsByCountry } from "../api/newsApi";

export function useNewsFeed(countryCode, startDate, endDate) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPage(1);
    setItems([]);
    setHasMore(true);
  }, [countryCode, startDate, endDate]);

  useEffect(() => {
    if (!countryCode || !startDate || !endDate) {
      return undefined;
    }

    if (!hasMore && page > 1) {
      return undefined;
    }

    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError("");

        const payload = await getNewsByCountry(
          countryCode,
          startDate,
          endDate,
          page,
          controller.signal
        );

        const nextArticles = payload.data || [];
        setHasMore(Boolean(payload.metadata?.has_more || payload.metadata?.hasMore));

        setItems((prev) => (page === 1 ? nextArticles : [...prev, ...nextArticles]));
      } catch (error) {
        if (error.name !== "AbortError") {
          setError(error.message || "Failed to load news feed.");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [countryCode, startDate, endDate, page, hasMore]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) {
      return;
    }
    setPage((prev) => prev + 1);
  }, [loading, hasMore]);

  return {
    items,
    hasMore,
    loading,
    error,
    loadMore,
  };
}
