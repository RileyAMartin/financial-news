import { Info } from "lucide-react";
import PropTypes from "prop-types";
import { useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
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
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);

  const currencyField = getCurrencyField(currency);

  const hasNominal = useMemo(() => metric.points && metric.points.some((point) => !point.is_inflation_adjusted), [metric]);
  const hasReal = useMemo(() => metric.points && metric.points.some((point) => point.is_inflation_adjusted), [metric]);

  const effectiveIsInflationAdjusted = useMemo(() => {
    if (!hasReal) return false;
    if (!hasNominal) return true;
    return isInflationAdjusted;
  }, [hasReal, hasNominal, isInflationAdjusted]);

  const chartData = useMemo(() => {
    if (!metric || !metric.points) return [];
    const filteredSeries = metric.points
      .filter((point) => point.is_inflation_adjusted === effectiveIsInflationAdjusted)
      .slice()
      .sort((a, b) => new Date(a.date_day) - new Date(b.date_day));

    return filteredSeries.map((point) => ({
      period_key: point.period_key,
      value: point[currencyField] ?? point.value_local,
    }));
  }, [metric, currencyField, effectiveIsInflationAdjusted]);

  const handleMouseEnter = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <article className={styles.metricCard}>
      <header className={styles.metricCardHeader}>
        <div className={styles.metricTitleWrap}>
          <h3 className="metric-title">{metric.indicator_name}</h3>
          <div 
            className={styles.tooltipWrapper}
            ref={iconRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Info 
              size={14} 
              className={styles.infoIcon} 
              strokeWidth={2.5}
            />
            {showTooltip && createPortal(
              <div 
                className={styles.tooltipBubble} 
                role="tooltip"
                style={{ top: tooltipPos.top, left: tooltipPos.left }}
              >
                {metric.indicator_description}
              </div>,
              document.body
            )}
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
        {metric.source.publisher_short} • {metric.source.dataset_short} ({currency})
      </p>

      {chartData.length === 0 ? (
        <p className={styles.cardEmpty}>No data points in this range.</p>
      ) : (
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 18, right: 18, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-terminal-border)" vertical={false} />
              
              <XAxis 
                dataKey="period_key" 
                tick={{ fill: "var(--color-terminal-header)", fontSize: 10, fontFamily: "inherit" }} 
                tickMargin={12}
                axisLine={false}
                tickLine={false}
                minTickGap={30}
              />
              
              <YAxis
                width={50}
                tick={{ fill: "var(--color-terminal-header)", fontSize: 10, fontFamily: "inherit" }}
                tickMargin={8}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCompactNumber}
              />
              
              <Tooltip
                formatter={(value) => [formatCurrencyValue(value, currency), "Value"]}
                contentStyle={{
                  background: "var(--color-terminal-bg)",
                  border: "1px solid var(--color-terminal-header)",
                  borderRadius: "0",
                  color: "var(--color-terminal-text)",
                  padding: "4px 8px",
                  fontSize: "0.82rem",
                  boxShadow: "none",
                  fontFamily: "inherit"
                }}
                itemStyle={{ paddingBottom: 0, color: "var(--color-terminal-text)", fontFamily: "inherit" }}
                labelStyle={{ color: "var(--color-terminal-header)", marginBottom: "4px", fontSize: "0.76rem", fontFamily: "inherit" }}
                cursor={{ stroke: "var(--color-terminal-pos)", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              
              <Line
                type="stepAfter"
                dataKey="value"
                stroke="var(--color-terminal-pos)"
                strokeWidth={1}
                dot={false}
                activeDot={{ r: 4, fill: "var(--color-terminal-bg)", stroke: "var(--color-terminal-pos)", strokeWidth: 1 }}
                animationDuration={0}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}

MetricCard.propTypes = {
  metric: PropTypes.shape({
    data: PropTypes.array,
    key: PropTypes.string,
    indicator_name: PropTypes.string,
    units: PropTypes.string,
    frequency: PropTypes.string,
    source_name: PropTypes.string,
  }).isRequired,
  currency: PropTypes.string,
  isInflationToggled: PropTypes.bool,
  onToggleInflation: PropTypes.func.isRequired,
};
