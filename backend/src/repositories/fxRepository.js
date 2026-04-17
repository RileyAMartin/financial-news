import { query } from "../config/db.js";

export const fxRepository = {
  async getQuarterlyRates(
    baseCurrencyCode,
    quoteCurrencyCode,
    startDate,
    endDate
  ) {
    const hasDateRange = Boolean(startDate && endDate);
    const querySql = `
        SELECT
            d.year_quarter AS period_key,
            fx.period_average_rate AS fx_rate,
            fx.source_code
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
      baseCurrencyCode,
      quoteCurrencyCode,
      hasDateRange,
      startDate,
      endDate,
    ]);

    return rows;
  },

  async getDailyRates(baseCurrencyCode, quoteCurrencyCode, startDate, endDate) {
    const hasDateRange = Boolean(startDate && endDate);
    const querySql = `
        SELECT
            CAST(fx.date_day AS TEXT) AS period_key,
            fx.close_price AS fx_rate,
            fx.source_code
        FROM fct_fx fx
        WHERE fx.base_currency_code = $1
          AND fx.quote_currency_code = $2
          AND ($3::boolean = false OR fx.date_day BETWEEN $4::date AND $5::date)
        ORDER BY fx.date_day ASC
    `;

    const { rows } = await query(querySql, [
      baseCurrencyCode,
      quoteCurrencyCode,
      hasDateRange,
      startDate,
      endDate,
    ]);

    return rows;
  },

  async getDateBounds(baseCurrencyCode, quoteCurrencyCode, frequency) {
    if (frequency === "D") {
      const querySql = `
          SELECT
              CAST(MIN(date_day) AS TEXT) AS min_date,
              CAST(MAX(date_day) AS TEXT) AS max_date
          FROM fct_fx
          WHERE base_currency_code = $1
            AND quote_currency_code = $2
      `;

      const { rows } = await query(querySql, [
        baseCurrencyCode,
        quoteCurrencyCode,
      ]);
      return rows[0] || null;
    }

    const querySql = `
        SELECT
            CAST(MIN(d.date_day) AS TEXT) AS min_date,
            CAST(MAX(d.date_day) AS TEXT) AS max_date
        FROM fct_fx_quarterly fx
        INNER JOIN dim_date d
            ON d.date_year = fx.date_year
           AND d.date_quarter = fx.date_quarter
           AND d.is_quarter_end = true
        WHERE fx.base_currency_code = $1
          AND fx.quote_currency_code = $2
    `;

    const { rows } = await query(querySql, [
      baseCurrencyCode,
      quoteCurrencyCode,
    ]);
    return rows[0] || null;
  },
};
