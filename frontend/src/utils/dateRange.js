import { TIME_PERIODS } from "../state/dashboardState";

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function getDateRange(periodValue) {
  const now = new Date();
  const period = TIME_PERIODS.find((item) => item.value === periodValue);

  if (!period || period.years === null) {
    return { startDate: "1990-01-01", endDate: toIsoDate(now) };
  }

  const start = new Date(now);
  start.setFullYear(start.getFullYear() - period.years);
  return { startDate: toIsoDate(start), endDate: toIsoDate(now) };
}
