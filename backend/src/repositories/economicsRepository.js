import { query } from "../config/db.js";

export const economicsRepository = {
  async getEconomicsDataByCountry(
    countryCode,
    indicatorCodes,
    startDate,
    endDate,
    frequency = "Q"
  ) {
    const hasDateRange = Boolean(startDate && endDate);
    const querySql = `
        SELECT
            e.country_code,
            e.currency_code,
            e.indicator_code,
            CASE 
              WHEN e.frequency = 'Q' THEN d.year_quarter 
              ELSE CAST(e.date_day AS TEXT) 
            END AS period_key,
            CAST(e.date_day AS TEXT) AS date_day,
            e.frequency,
            e.value_local,
            e.is_inflation_adjusted,
            i.name AS indicator_name,
            i.description AS indicator_description,
            s.source_code,
            s.publisher,
            s.publisher_short,
            s.dataset,
            s.dataset_short,
            s.url AS source_url
        FROM fct_economics e
        INNER JOIN dim_date d ON e.date_day = d.date_day
        LEFT JOIN dim_indicators i ON e.indicator_code = i.indicator_code
        LEFT JOIN dim_sources s ON e.source_code = s.source_code
        WHERE e.country_code = $1
          AND e.indicator_code = ANY($2)
          AND ($3::boolean = false OR e.date_day BETWEEN $4::date AND $5::date)
          AND e.frequency = $6
        ORDER BY e.indicator_code, e.date_day ASC
    `;
    const { rows } = await query(querySql, [
      countryCode.toUpperCase(),
      indicatorCodes,
      hasDateRange,
      startDate,
      endDate,
      frequency,
    ]);
    return rows;
  },

  async getEconomicsDateBounds(countryCode, indicatorCodes, frequency = "Q") {
    const querySql = `
        SELECT
            CAST(MIN(e.date_day) AS TEXT) AS min_date,
            CAST(MAX(e.date_day) AS TEXT) AS max_date
        FROM fct_economics e
        WHERE e.country_code = $1
          AND e.indicator_code = ANY($2)
          AND e.frequency = $3
    `;

    const { rows } = await query(querySql, [
      countryCode.toUpperCase(),
      indicatorCodes,
      frequency,
    ]);

    return rows[0] || null;
  },

  async getCountryCurrencyMapping(countryCode) {
    const querySql = `
        SELECT 
            c.country_code,
            curr.currency_code,
            curr.currency_name
        FROM dim_countries c
        JOIN dim_currencies curr ON c.currency_code = curr.currency_code
        WHERE c.country_code = $1
    `;
    const { rows } = await query(querySql, [countryCode.toUpperCase()]);
    return rows[0] || null;
  },

  async getQuarterlyFxRates(baseCurrencyCode, quoteCurrencyCode, startDate, endDate) {
    const hasDateRange = Boolean(startDate && endDate);
    const querySql = `
        SELECT
            d.year_quarter AS period_key,
            fx.period_average_rate AS fx_rate
        FROM fct_fx_quarterly fx
        INNER JOIN dim_date d
            ON d.date_year = fx.date_year
           AND d.date_quarter = fx.date_quarter
           AND d.is_quarter_end = true
        WHERE fx.base_currency_code = $1
          AND fx.quote_currency_code = $2
          AND ($3::boolean = false OR d.date_day BETWEEN $4::date AND $5::date)
        ORDER BY d.date_day ASC
    `;

    const { rows } = await query(querySql, [
      baseCurrencyCode.toUpperCase(),
      quoteCurrencyCode.toUpperCase(),
      hasDateRange,
      startDate,
      endDate,
    ]);

    return rows;
  },

  async getDailyFxRates(baseCurrencyCode, quoteCurrencyCode, startDate, endDate) {
    const hasDateRange = Boolean(startDate && endDate);
    const querySql = `
        SELECT
            CAST(d.date_day AS TEXT) AS period_key,
            fx.close_price AS fx_rate
        FROM fct_fx fx
        INNER JOIN dim_date d ON fx.date_day = d.date_day
        WHERE fx.base_currency_code = $1
          AND fx.quote_currency_code = $2
          AND ($3::boolean = false OR d.date_day BETWEEN $4::date AND $5::date)
        ORDER BY d.date_day ASC
    `;

    const { rows } = await query(querySql, [
      baseCurrencyCode.toUpperCase(),
      quoteCurrencyCode.toUpperCase(),
      hasDateRange,
      startDate,
      endDate,
    ]);

    return rows;
  },

};