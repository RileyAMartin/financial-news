import { useState } from "react";
import PropTypes from "prop-types";
import { MetricCard } from "./MetricCard";
import styles from "./MetricsPanel.module.css";

export function MetricsPanel({
  metrics,
  currency,
  loading,
  error,
}) {
  const [inflationByMetric, setInflationByMetric] = useState({});
  const [prevMetrics, setPrevMetrics] = useState(metrics);

  if (metrics !== prevMetrics) {
    setPrevMetrics(metrics);
    const next = { ...inflationByMetric };
    for (const [key] of metrics) {
      if (typeof next[key] !== "boolean") {
        next[key] = false;
      }
    }
    setInflationByMetric(next);
  }

  const onToggleInflation = (metricKey) => {
    setInflationByMetric((prev) => ({
      ...prev,
      [metricKey]: !prev[metricKey],
    }));
  };

  return (
    <section className={styles.economicsPanel}>
      {loading && !error && (
        <div style={{ color: "var(--color-terminal-header)", padding: "1rem" }}>LOADING ECONOMIC METRICS...</div>
      )}

      {error && (
        <div style={{ color: "var(--color-terminal-neg)", padding: "1rem" }}>ERROR: {error}</div>
      )}

      {!loading && !error && metrics.length === 0 && (
        <div style={{ color: "var(--color-terminal-header)", padding: "1rem" }}>NO METRICS AVAILABLE.</div>
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

MetricsPanel.propTypes = {
  metrics: PropTypes.arrayOf(PropTypes.array).isRequired,
  currency: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.string,
};
