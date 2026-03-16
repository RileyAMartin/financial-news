import { fetchJson } from "./client";

export async function getCountries(signal) {
  const json = await fetchJson("/api/dimensions/countries", { signal });
  return json.data || [];
}

export async function getIndicators(signal) {
  const json = await fetchJson("/api/dimensions/indicators", { signal });
  return json.data || [];
}

export async function getSources(signal) {
  const json = await fetchJson("/api/dimensions/sources", { signal });
  return json.data || [];
}
