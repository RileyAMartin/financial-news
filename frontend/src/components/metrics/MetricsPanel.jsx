import { MetricCard } from "./MetricCard";
import styles from "./MetricsPanel.module.css";

export function MetricsPanel({
  metrics,
  currency,
  inflationByMetric,
  onToggleInflation,
  loading,
  error,
  startDate,
  endDate,
}) {
  return (
    <section className={`panel ${styles.economicsPanel}`}>
      <div className={styles.panelTitleRow}>
        <h2>Economic Metrics</h2>
        <span>
          {startDate} to {endDate}
        </span>
      </div>

      {loading && !error && (
        <div className="status-card loading-state" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <span>Loading Economic Metrics</span>
        </div>
      )}

      {error && (
        <div className="status-card error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && metrics.length === 0 && (
        <div className="status-card empty-state" role="status" aria-live="polite">
          <span>No metrics available for this filter.</span>
        </div>
      )}

      {!loading && !error && metrics.length > 0 && (
        <div className={styles.metricStack}>
          {metrics.map(([metricKey, metric]) => (
            <MetricCard
              key={metricKey}
              metricKey={metricKey}
              metric={metric}
              currency={currency}
              isInflationAdjusted={Boolean(inflationByMetric[metricKey])}
              onToggleInflation={onToggleInflation}
            />
          ))}
        </div>
      )}
    </section>
  );
}
