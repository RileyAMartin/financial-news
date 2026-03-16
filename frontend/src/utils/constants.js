export const CURRENCIES = ["LOCAL", "EUR", "USD"];

export const TIME_PERIODS = [
  { value: "1Y", label: "1Y", years: 1 },
  { value: "3Y", label: "3Y", years: 3 },
  { value: "5Y", label: "5Y", years: 5 },
  { value: "10Y", label: "10Y", years: 10 },
  { value: "ALL", label: "All", years: null },
];

export const UI_CONSTANTS = {
  NEWS: {
    MAX_SUMMARY_LENGTH: 180,
    INTERSECTION_ROOT_MARGIN: "180px 0px",
    FALLBACK_SUMMARY: "No summary available",
    FALLBACK_SOURCE: "Unknown source",
  },
  MAP: {
    FALLBACK_COUNTRY_CODE: "USA",
  },
  METRICS: {
    FALLBACK_DATE: "1990-01-01",
  }
};
