export { CURRENCIES, TIME_PERIODS } from "../utils/constants";

export const initialDashboardState = {
  selectedCountry: "",
  currency: "LOCAL",
  timePeriod: "5Y",
  inflationByMetric: {},
};

export function dashboardReducer(state, action) {
  switch (action.type) {
    case "setCountry":
      return { ...state, selectedCountry: action.payload };
    case "setCurrency":
      return { ...state, currency: action.payload };
    case "setTimePeriod":
      return { ...state, timePeriod: action.payload };
    case "toggleInflation":
      return {
        ...state,
        inflationByMetric: {
          ...state.inflationByMetric,
          [action.payload]: !state.inflationByMetric[action.payload],
        },
      };
    case "primeInflationKeys": {
      const next = { ...state.inflationByMetric };
      for (const key of action.payload) {
        if (typeof next[key] !== "boolean") {
          next[key] = false;
        }
      }
      return { ...state, inflationByMetric: next };
    }
    default:
      return state;
  }
}
