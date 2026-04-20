import { useState } from "react";
import PropTypes from "prop-types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./DashboardHeader.module.css";

// The top command bar for global dashboard configurations like country, currency, and date limits
export function DashboardHeader({
  selectedCountry,
  countries,
  selectedCountryDetails,
  targetCurrency,
  currencies = [],
  dateRange,
  onCountryChange,
  onDateRangeChange,
  onCurrencyChange,
}) {
  // Convert YYYY-MM-DD string to Date object safely
  const parseDateString = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      // month is 0-indexed in JS
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return null;
  };

  const formatDateString = (dateObj) => {
    if (!dateObj) return "";
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const [localStartDate, setLocalStartDate] = useState(parseDateString(dateRange.startDate));
  const [localEndDate, setLocalEndDate] = useState(parseDateString(dateRange.endDate));
  const [prevDateRange, setPrevDateRange] = useState(dateRange);

  if (dateRange.startDate !== prevDateRange.startDate || dateRange.endDate !== prevDateRange.endDate) {
    setPrevDateRange(dateRange);
    setLocalStartDate(parseDateString(dateRange.startDate));
    setLocalEndDate(parseDateString(dateRange.endDate));
  }

  const handleCalendarClose = () => {
    const startStr = formatDateString(localStartDate);
    const endStr = formatDateString(localEndDate);
    
    if (startStr !== dateRange.startDate || endStr !== dateRange.endDate) {
      if (startStr.length >= 10 && endStr.length >= 10) {
        onDateRangeChange({ startDate: startStr, endDate: endStr });
      }
    }
  };

  return (
    <section className={styles.dashboardHeader}>
      <div className={styles.headerLeft}>
        <h1>
          {selectedCountryDetails?.display_name || "Loading Country..."}
          {selectedCountryDetails && (
            <span className={styles.countryCodeBadge}>{selectedCountry}</span>
          )}
        </h1>
      </div>

      <div className={styles.headerRight}>
        <div className={styles.datePickerGroup}>
          <label className={styles.controlGroup}>
            <span>Start Date</span>
            <DatePicker
              selected={localStartDate}
              onChange={(date) => setLocalStartDate(date)}
              onCalendarClose={handleCalendarClose}
              onBlur={handleCalendarClose}
              dateFormat="yyyy-MM-dd"
              className={styles.customDatePicker}
              calendarClassName={styles.brutalistCalendar}
              portalId="root-portal"
              showYearDropdown
              dropdownMode="select"
            />
          </label>
          <label className={styles.controlGroup}>
            <span>End Date</span>
            <DatePicker
              selected={localEndDate}
              onChange={(date) => setLocalEndDate(date)}
              onCalendarClose={handleCalendarClose}
              onBlur={handleCalendarClose}
              dateFormat="yyyy-MM-dd"
              className={styles.customDatePicker}
              calendarClassName={styles.brutalistCalendar}
              portalId="root-portal"
              showYearDropdown
              dropdownMode="select"
            />
          </label>
        </div>

        <label className={styles.controlGroup}>
          <span>Currency</span>
          <select
            value={targetCurrency}
            onChange={(event) => onCurrencyChange(event.target.value)}
          >
            {currencies.length === 0 && (
              <option value="" disabled>
                Loading currencies...
              </option>
            )}
            {currencies.map((currency) => (
              <option key={currency.currency_code} value={currency.currency_code}>
                {currency.currency_name || currency.currency_code} ({currency.currency_code})
              </option>
            ))}
          </select>
        </label>

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

DashboardHeader.propTypes = {
  selectedCountry: PropTypes.string,
  countries: PropTypes.arrayOf(
    PropTypes.shape({
      country_code: PropTypes.string.isRequired,
      display_name: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedCountryDetails: PropTypes.object,
  targetCurrency: PropTypes.string,
  currencies: PropTypes.arrayOf(
    PropTypes.shape({
      currency_code: PropTypes.string.isRequired,
      currency_name: PropTypes.string,
    })
  ),
  dateRange: PropTypes.shape({
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }).isRequired,
  onCountryChange: PropTypes.func.isRequired,
  onDateRangeChange: PropTypes.func.isRequired,
  onCurrencyChange: PropTypes.func.isRequired,
};
