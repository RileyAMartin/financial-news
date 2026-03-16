import { useCallback, useEffect, useRef, useState } from "react";
import { getNewsByCountry } from "../api/newsApi";

export function useNewsFeed(countryCode, startDate, endDate) {
  const lastLoadedKeyRef = useRef("");
  const activeFilterKeyRef = useRef("");
  const requestSequenceRef = useRef(0);
  const [filterVersion, setFilterVersion] = useState(0);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!countryCode || !startDate || !endDate) {
      return undefined;
    }

    const filterKey = `${countryCode}|${startDate}|${endDate}`;
    if (activeFilterKeyRef.current !== filterKey) {
      activeFilterKeyRef.current = filterKey;
      lastLoadedKeyRef.current = "";
      requestSequenceRef.current += 1;
      setPage(1);
      setItems([]);
      setHasMore(true);
      setError("");
      setLoading(true);
      setFilterVersion((prev) => prev + 1);
      return undefined;
    }

    if (page > 1 && !hasMore) {
      return undefined;
    }

    const requestKey = `${countryCode}|${startDate}|${endDate}|${page}`;
    if (lastLoadedKeyRef.current === requestKey) {
      return undefined;
    }

    lastLoadedKeyRef.current = requestKey;
    requestSequenceRef.current += 1;
    const requestSequence = requestSequenceRef.current;

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

        if (requestSequence !== requestSequenceRef.current) {
          return;
        }

        const nextArticles = payload.articles || [];
        setHasMore(Boolean(payload.metadata?.hasMore));

        setItems((prev) => (page === 1 ? nextArticles : [...prev, ...nextArticles]));
      } catch (error) {
        if (requestSequence !== requestSequenceRef.current) {
          return;
        }

        if (error.name !== "AbortError") {
          setError(error.message || "Failed to load news feed.");
        }
      } finally {
        if (requestSequence === requestSequenceRef.current) {
          setLoading(false);
        }
      }
    }

    load();
    return () => controller.abort();
  }, [countryCode, startDate, endDate, page, hasMore, filterVersion]);

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
