import { fetchJson } from "./client";

export async function getCountries(signal) {
  const json = await fetchJson("/dimensions/countries", { signal });
  return json.data || [];
}

export async function getIndicators(signal) {
  const json = await fetchJson("/dimensions/indicators", { signal });
  return json.data || [];
}

export async function getSources(signal) {
  const json = await fetchJson("/dimensions/sources", { signal });
  return json.data || [];
}

export async function getCurrencies(signal) {
  const json = await fetchJson("/dimensions/currencies", { signal });
  return json.data || [];
}

export async function getGeoMap(signal) {
  // Directly returns the decompressed GeoJSON artifact
  return await fetchJson("/dimensions/map", { signal });
}
