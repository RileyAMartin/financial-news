import { TIME_PERIODS, UI_CONSTANTS } from "../utils/constants";

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function getDateRange(periodValue) {
  const now = new Date();
  const period = TIME_PERIODS.find((item) => item.value === periodValue);

  if (!period || period.years === null) {
    return { startDate: UI_CONSTANTS.METRICS.FALLBACK_DATE, endDate: toIsoDate(now) };
  }

  const start = new Date(now);
  start.setFullYear(start.getFullYear() - period.years);
  return { startDate: toIsoDate(start), endDate: toIsoDate(now) };
}

export function getMetricsDisplayRange(metrics) {
  if (!metrics || metrics.length === 0) {
    return "All";
  }

  let earliest = null;
  let latest = null;
  metrics.forEach(([_, metric]) => {
    if (!metric?.data) return;
    metric.data.forEach((point) => {
      if (!point.date) return;
      const dateStr = point.date.substring(0, 10);
      if (!earliest || dateStr < earliest) {
        earliest = dateStr;
      }
      if (!latest || dateStr > latest) {
        latest = dateStr;
      }
    });
  });

  return earliest ? `${earliest} to ${latest}` : "All";
}
