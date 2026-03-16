export function getFeatureIso3(properties = {}) {
  return (
    properties["ISO3166-1-Alpha-3"] ||
    properties.ISO_A3 ||
    properties.iso_a3 ||
    properties.ADM0_A3 ||
    ""
  );
}

export function getFeatureName(properties = {}) {
  return properties.name || properties.ADMIN || properties.admin || "Unknown";
}
