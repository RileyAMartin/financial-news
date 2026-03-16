import { CURRENCIES, TIME_PERIODS } from "../../state/dashboardState";
import styles from "./DashboardHeader.module.css";

export function DashboardHeader({
  selectedCountry,
  countries,
  selectedCountryDetails,
  timePeriod,
  currency,
  indicatorCount,
  sourceCount,
  onCountryChange,
  onTimePeriodChange,
  onCurrencyChange,
}) {
  return (
    <section className={`panel ${styles.dashboardHeader}`}>
      <div className={styles.headerLeft}>
        <h1>{selectedCountryDetails?.display_name || "Loading Country..."}</h1>
        <div className={styles.countryBadges}>
          <span className={styles.countryTag}>{selectedCountry || "---"}</span>
          <span className={styles.dataChip}>{indicatorCount} indicators</span>
          <span className={styles.dataChip}>{sourceCount} sources</span>
        </div>
      </div>

      <div className={styles.headerRight}>
        <label className={styles.controlGroup}>
          <span>Time Period</span>
          <select
            value={timePeriod}
            onChange={(event) => onTimePeriodChange(event.target.value)}
          >
            {TIME_PERIODS.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.controlGroup}>
          <span>Currency</span>
          <div className={styles.currencyToggle}>
            {CURRENCIES.map((currencyCode) => (
              <button
                key={currencyCode}
                type="button"
                className={currencyCode === currency ? styles.active : ""}
                onClick={() => onCurrencyChange(currencyCode)}
              >
                {currencyCode}
              </button>
            ))}
          </div>
        </div>

        <label className={styles.controlGroup}>
          <span>Country</span>
          <select
            value={selectedCountry}
            onChange={(event) => onCountryChange(event.target.value)}
          >
            {countries.length === 0 && (
              <option value="" disabled>
                Loading countries...
              </option>
            )}
            {countries.map((country) => (
              <option key={country.country_code} value={country.country_code}>
                {country.display_name} ({country.country_code})
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
