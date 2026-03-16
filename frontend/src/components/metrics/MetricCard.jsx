import { Info } from "lucide-react";
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatCompactNumber,
  formatCurrencyValue,
  formatQuarter,
  getCurrencyField,
} from "../../utils/formatters";
import styles from "./MetricCard.module.css";

export function MetricCard({
  metricKey,
  metric,
  currency,
  isInflationAdjusted,
  onToggleInflation,
}) {
  const currencyField = getCurrencyField(currency);

  const hasNominal = useMemo(() => metric.data.some((point) => !point.isInflationAdjusted), [metric]);
  const hasReal = useMemo(() => metric.data.some((point) => point.isInflationAdjusted), [metric]);

  const effectiveIsInflationAdjusted = useMemo(() => {
    if (!hasReal) return false;
    if (!hasNominal) return true;
    return isInflationAdjusted;
  }, [hasReal, hasNominal, isInflationAdjusted]);

  const chartData = useMemo(() => {
    const filteredSeries = metric.data
      .filter((point) => point.isInflationAdjusted === effectiveIsInflationAdjusted)
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return filteredSeries.map((point) => ({
      date: point.date,
      value: point[currencyField],
    }));
  }, [metric, currencyField, isInflationAdjusted]);

  return (
    <article className={styles.metricCard}>
      <header className={styles.metricCardHeader}>
        <div className={styles.metricTitleWrap}>
          <h3 className="metric-title">{metric.metadata.name}</h3>
          <div className={styles.tooltipWrapper}>
            <Info 
              size={14} 
              className={styles.infoIcon} 
              strokeWidth={2.5}
            />
            <div className={styles.tooltipBubble} role="tooltip">
              {metric.metadata.description}
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`${styles.switch} ${(!hasReal || !hasNominal) ? styles.disabledSwitch : ""}`}
          onClick={() => (hasReal && hasNominal) && onToggleInflation(metricKey)}
          disabled={!hasReal || !hasNominal}
        >
          <span className={`${styles.switchLabel} ${!effectiveIsInflationAdjusted ? styles.active : ""} ${!hasNominal ? styles.disabledLabel : ""}`.trim()}>
            Nominal
          </span>
          <span className={`${styles.switchLabel} ${effectiveIsInflationAdjusted ? styles.active : ""} ${!hasReal ? styles.disabledLabel : ""}`.trim()}>
            Real
          </span>
        </button>
      </header>

      <p className={styles.metricMeta}>
        {metric.source.publisherShort} • {metric.source.datasetShort} ({currency})
      </p>

      {chartData.length === 0 ? (
        <p className={styles.cardEmpty}>No data points in this range.</p>
      ) : (
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 18, right: 18, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2d3d" vertical={false} />
              
              <XAxis 
                dataKey="date" 
                tick={{ fill: "#6b8bad", fontSize: 10 }} 
                tickMargin={12}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatQuarter} 
                minTickGap={30}
              />
              
              <YAxis
                width={50}
                tick={{ fill: "#6b8bad", fontSize: 10 }}
                tickMargin={8}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCompactNumber}
              />
              
              <Tooltip
                formatter={(value) => [formatCurrencyValue(value, currency), "Value"]}
                labelFormatter={(label) => formatQuarter(label)}
                contentStyle={{
                  background: "rgba(11, 21, 33, 0.95)",
                  border: "1px solid #2d4f74",
                  borderRadius: "6px",
                  color: "#deedff",
                  padding: "8px 12px",
                  fontSize: "0.82rem",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
                }}
                itemStyle={{ paddingBottom: 0, color: "#90cdf4" }}
                labelStyle={{ color: "#6b8bad", marginBottom: "4px", fontSize: "0.76rem" }}
                cursor={{ stroke: "#355a80", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              
              <Line
                type="monotone"
                dataKey="value"
                stroke="#63b3ed"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "#63b3ed", stroke: "#0f1928", strokeWidth: 2 }}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}
