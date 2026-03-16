import { useEffect, useMemo, useReducer } from "react";
import { DashboardHeader } from "./components/layout/DashboardHeader";
import { TopNav } from "./components/layout/TopNav";
import { WorldMap } from "./components/map/WorldMap";
import { MetricsPanel } from "./components/metrics/MetricsPanel";
import { NewsFeed } from "./components/news/NewsFeed";
import { useDimensionsData } from "./hooks/useDimensionsData";
import { useEconomicsData } from "./hooks/useEconomicsData";
import { useNewsFeed } from "./hooks/useNewsFeed";
import {
  dashboardReducer,
  initialDashboardState,
} from "./state/dashboardState";
import { getDateRange } from "./utils/dateRange";

export default function App() {
  const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState);

  const {
    countries,
    indicators,
    sources,
    geoJson,
    loading: dimensionsLoading,
    error: dimensionsError,
  } = useDimensionsData();

  const dateRange = useMemo(
    () => getDateRange(state.timePeriod),
    [state.timePeriod]
  );

  const {
    data: economics,
    loading: economicsLoading,
    error: economicsError,
  } = useEconomicsData(
    state.selectedCountry,
    dateRange.startDate,
    dateRange.endDate
  );

  const {
    items: newsItems,
    hasMore: newsHasMore,
    loading: newsLoading,
    error: newsError,
    loadMore: loadMoreNews,
  } = useNewsFeed(state.selectedCountry, dateRange.startDate, dateRange.endDate);

  useEffect(() => {
    if (countries.length === 0 || state.selectedCountry) {
      return;
    }

    const preferred =
      countries.find((country) => country.country_code === "USA") || countries[0];

    dispatch({ type: "setCountry", payload: preferred.country_code });
  }, [countries, state.selectedCountry]);

  useEffect(() => {
    dispatch({ type: "primeInflationKeys", payload: Object.keys(economics) });
  }, [economics]);

  const selectedCountryDetails = useMemo(
    () =>
      countries.find((country) => country.country_code === state.selectedCountry) ||
      null,
    [countries, state.selectedCountry]
  );

  const metricEntries = useMemo(() => Object.entries(economics), [economics]);

  const statusError = dimensionsError || economicsError || newsError;

  return (
    <div className="dashboard-shell">
      <TopNav />

      <main className="dashboard-main">
        <DashboardHeader
          selectedCountry={state.selectedCountry}
          countries={countries}
          selectedCountryDetails={selectedCountryDetails}
          timePeriod={state.timePeriod}
          currency={state.currency}
          indicatorCount={indicators.length}
          sourceCount={sources.length}
          onCountryChange={(code) => dispatch({ type: "setCountry", payload: code })}
          onTimePeriodChange={(period) =>
            dispatch({ type: "setTimePeriod", payload: period })
          }
          onCurrencyChange={(currency) =>
            dispatch({ type: "setCurrency", payload: currency })
          }
        />

        <WorldMap
          geoJson={geoJson}
          selectedCountry={state.selectedCountry}
          onSelectCountry={(code) => dispatch({ type: "setCountry", payload: code })}
        />

        <section className="split-panels">
          <MetricsPanel
            metrics={metricEntries}
            currency={state.currency}
            inflationByMetric={state.inflationByMetric}
            onToggleInflation={(metricKey) =>
              dispatch({ type: "toggleInflation", payload: metricKey })
            }
            loading={economicsLoading}
            error={economicsError}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
          />

          <div className="news-wrapper">
            <NewsFeed
              items={newsItems}
              hasMore={newsHasMore}
              loading={newsLoading}
              error={newsError}
              onLoadMore={loadMoreNews}
            />
          </div>
        </section>

        {(dimensionsLoading || statusError) && (
          <div className={`status-banner ${statusError ? "error" : ""}`} role="status">
            {dimensionsLoading && <span className="spinner" aria-hidden="true" />}
            <span>{dimensionsLoading ? "Initializing dashboard..." : statusError}</span>
          </div>
        )}
      </main>
    </div>
  );
}