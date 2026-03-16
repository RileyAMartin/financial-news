import { fetchJson } from "./client";

export async function getNewsByCountry(
  countryCode,
  startDate,
  endDate,
  page,
  signal
) {
  const params = new URLSearchParams({
    startDate,
    endDate,
    page: String(page),
  });

  const json = await fetchJson(`/api/news/${countryCode}?${params.toString()}`, {
    signal,
  });

  return (
    json.data || {
      metadata: { hasMore: false },
      articles: [],
    }
  );
}
