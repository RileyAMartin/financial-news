import { useMemo } from "react";
import { MetricCard } from "./MetricCard";
import styles from "./MetricsPanel.module.css";
import { getMetricsDisplayRange } from "../../utils/dateRange";
import { StatusBanner } from "../layout/StatusBanner";

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
  const displayRange = useMemo(() => getMetricsDisplayRange(metrics), [metrics]);

  return (
    <section className={`panel ${styles.economicsPanel}`}>
      <div className={styles.panelTitleRow}>
        <h2>Economic Metrics</h2>
        <span>{displayRange}</span>
      </div>

      {loading && !error && (
        <StatusBanner type="loading" message="Loading Economic Metrics" isCard />
      )}

      {error && (
        <StatusBanner type="error" message={error} isCard />
      )}

      {!loading && !error && metrics.length === 0 && (
        <StatusBanner type="empty" message="No metrics available for this filter." isCard />
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
