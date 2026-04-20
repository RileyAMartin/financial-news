import { useMemo } from "react";
import PropTypes from "prop-types";
import styles from "./FxMonitor.module.css";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const TARGET_COLORS = {
  USD: "#FFFFFF",
  EUR: "#FFB800",
  GBP: "#00FF00",
  JPY: "#00FFFF",
  CNY: "#FF00FF",
  CHF: "#FFFF00",
  CAD: "#800080",
  AUD: "#008080",
  SGD: "#FFA500",
};

export function FxMonitor({
  baseCurrency,
  targetCurrencies = [],
  data = [],
  loading,
  error,
}) {
  const { summaryGrid, chartData } = useMemo(() => {
    if (!data || data.length === 0) return { summaryGrid: [], chartData: [] };

    // 1. Group data by quote currency to find latest/previous and starting values
    const groupedByQuote = {};
    data.forEach((row) => {
      const q = row.quote_currency_code;
      if (!groupedByQuote[q]) groupedByQuote[q] = [];
      groupedByQuote[q].push(row);
    });

    const summaryGrid = [];
    const startRates = {};

    targetCurrencies.forEach((quote) => {
      const series = groupedByQuote[quote];
      if (!series || series.length < 1) return;

      // Extract latest vs previous for grid
      // Data is assumed to be sorted ASC by period_key from API
      const latest = series[series.length - 1];
      const previous = series.length > 1 ? series[series.length - 2] : latest;

      const rate = latest.fx_rate;
      const prevRate = previous.fx_rate;
      const pctChange = prevRate !== 0 ? ((rate - prevRate) / prevRate) * 100 : 0;

      summaryGrid.push({
        quote_currency_code: quote,
        latestDate: latest.period_key,
        rate: rate,
        pctChange: pctChange,
      });

      // Extract first value for chart rebasing
      startRates[quote] = series[0].fx_rate;
    });

    // 2. Build multi-line chart data (rebased to 100)
    // First, pivot data so each row is a single day with multiple currency values
    const recordsByPeriod = {};
    data.forEach((row) => {
      if (!recordsByPeriod[row.period_key]) {
        recordsByPeriod[row.period_key] = { period_key: row.period_key };
      }
      
      const startRate = startRates[row.quote_currency_code];
      if (startRate) {
        // Rebase to 100 = start value
        const rebasedValue = (row.fx_rate / startRate) * 100;
        recordsByPeriod[row.period_key][row.quote_currency_code] = rebasedValue;
      }
    });

    const chartDataList = Object.values(recordsByPeriod).sort((a, b) =>
      a.period_key.localeCompare(b.period_key)
    );

    return { summaryGrid, chartData: chartDataList };
  }, [data, targetCurrencies]);

  if (loading) {
    return <div className={styles.loading}>LOADING...</div>;
  }

  if (error) {
    return <div className={styles.error}>ERROR: {error}</div>;
  }

  if (!baseCurrency) {
    return <div className={styles.loading}>Awaiting Base Currency...</div>;
  }

  return (
    <div className={styles.fxContainer}>
      <div className={styles.topRow}>
        <div className={styles.gridContainer}>
          <table className={styles.brutalistTable}>
            <thead>
              <tr>
                <th>PAIR ({baseCurrency})</th>
                <th>LAST RATE</th>
                <th>% CHG (D)</th>
              </tr>
            </thead>
            <tbody>
              {summaryGrid.length === 0 && (
                <tr>
                  <td colSpan="3" className={styles.empty}>NO DATA FOUND</td>
                </tr>
              )}
              {summaryGrid.map((row) => (
                <tr key={row.quote_currency_code}>
                  <td className={styles.cellPair}>{row.quote_currency_code}</td>
                  <td className={styles.cellRate}>{row.rate.toFixed(4)}</td>
                  <td
                    className={
                      row.pctChange > 0
                        ? styles.cellPos
                        : row.pctChange < 0
                        ? styles.cellNeg
                        : styles.cellNeutral
                    }
                  >
                    {row.pctChange > 0 ? "▲" : row.pctChange < 0 ? "▼" : "="}{" "}
                    {Math.abs(row.pctChange).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.chartContainer}>
          <div className={styles.chartHeader}>
            RELATIVE PERFORMANCE (REBASED = 100)
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-terminal-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="period_key"
                  stroke="var(--color-terminal-border)"
                  tick={{ fill: "var(--color-terminal-text)", fontSize: 10 }}
                  tickFormatter={(val) => val.split("-").slice(1).join("-")} // MM-DD
                  minTickGap={30}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  stroke="var(--color-terminal-border)"
                  tick={{ fill: "var(--color-terminal-text)", fontSize: 10 }}
                  tickFormatter={(val) => val.toFixed(1)}
                  orientation="right"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-terminal-bg)",
                    border: "1px solid var(--color-terminal-header)",
                    borderRadius: 0,
                    fontFamily: "inherit",
                    fontSize: "0.75rem",
                  }}
                  itemStyle={{ fontFamily: "inherit" }}
                />
                {targetCurrencies.map((quote) => (
                  <Line
                    key={quote}
                    type="stepAfter"
                    dataKey={quote}
                    stroke={TARGET_COLORS[quote] || "var(--color-terminal-header)"}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

FxMonitor.propTypes = {
  baseCurrency: PropTypes.string.isRequired,
  targetCurrencies: PropTypes.arrayOf(PropTypes.string),
  data: PropTypes.arrayOf(
    PropTypes.shape({
      base_currency: PropTypes.string,
      quote_currency: PropTypes.string,
      rate: PropTypes.number,
      pctChange: PropTypes.number,
    })
  ),
  loading: PropTypes.bool,
  error: PropTypes.string,
};