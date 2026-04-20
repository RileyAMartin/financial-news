import { fetchJson } from "./client";

export async function getEconomicsByCountry(countryCode, startDate, endDate, currency, signal) {
  const params = new URLSearchParams({ startDate, endDate });
  
  if (currency) {
    params.append("targetCurrencyCode", currency);
  }

  const json = await fetchJson(
    `/economics/${countryCode}?${params.toString()}`,
    { signal }
  );
  return json;
}
