import { fetchJson } from "./client";

export async function getEconomicsByCountry(countryCode, startDate, endDate, signal) {
  const params = new URLSearchParams({ startDate, endDate });
  const json = await fetchJson(
    `/api/economics/${countryCode}?${params.toString()}`,
    { signal }
  );
  return json.data || {};
}
