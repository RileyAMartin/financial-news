import styles from "./App.module.css";
import { DashboardHeader } from "./components/layout/DashboardHeader";
import { WorldMap } from "./components/map/WorldMap";
import { MetricsPanel } from "./components/metrics/MetricsPanel";
import { NewsFeed } from "./components/news/NewsFeed";
import { FxMonitor } from "./components/fx/FxMonitor";
import { useDashboardController } from "./hooks/useDashboardController";

export default function App() {
  const { state, actions, data } = useDashboardController();

  return (
    <div className={styles.dashboardShell}>
      <div className={styles.commandBar}>
        <DashboardHeader
          selectedCountry={state.selectedCountry}
          countries={state.countries}
          selectedCountryDetails={state.selectedCountryDetails}
          targetCurrency={state.targetCurrency}
          currencies={state.currencies}
          dateRange={state.dateRange}
          onCountryChange={actions.handleCountryChange}
          onDateRangeChange={actions.setDateRange}
          onCurrencyChange={actions.setTargetCurrency}
        />
      </div>

      <div className={styles.panesContainer}>
        {/* Column 1: Map and News */}
        <div className={styles.colLeft}>
          <div className={`${styles.pane} ${styles.mapPane}`}>
            <div className={styles.paneHeader}>Geo Selection</div>
            <div className={styles.paneContent} style={{ padding: 0 }}>
              <WorldMap
                geoJson={state.geoJson}
                selectedCountry={state.selectedCountry}
                countries={state.countries}
                loading={data.dimensions.loading}
                onSelectCountry={actions.handleCountryChange}
              />
            </div>
          </div>

          <div className={`${styles.pane} ${styles.newsPane}`}>
            <div className={styles.paneHeader}>News Feed</div>
            <div className={styles.paneContent} style={{ padding: 0 }}>
              <NewsFeed
                items={data.news.items}
                hasMore={data.news.hasMore}
                loading={data.news.loading}
                error={data.news.error}
                onLoadMore={data.news.loadMore}
              />
            </div>
          </div>
        </div>

        {/* Column 2: Economics and FX */}
        <div className={styles.colRight}>
          <div className={`${styles.pane} ${styles.economicsPane}`}>
            <div className={styles.paneHeader}>Economics</div>
            <div className={styles.paneContent} style={{ padding: 0 }}>
              <MetricsPanel
                metrics={state.metricEntries}
                currency={state.targetCurrency}
                loading={data.economics.loading}
                error={data.economics.error}
                startDate={state.dateRange.startDate}
                endDate={state.dateRange.endDate}
              />
            </div>
          </div>

          <div className={`${styles.pane} ${styles.fxPane}`}>
            <div className={styles.paneHeader}>
              {state.selectedCountryDetails ? `FX Monitor (${state.baseCurrency} Cross Rates)` : "FX Monitor"}
            </div>
            <div className={styles.paneContent} style={{ padding: 0 }}>
              <FxMonitor
                baseCurrency={state.baseCurrency}
                targetCurrencies={state.targetCurrencies}
                data={data.fx.data}
                loading={data.fx.loading}
                error={data.fx.error}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}