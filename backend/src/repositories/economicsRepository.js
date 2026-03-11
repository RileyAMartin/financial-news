import { query } from "../config/db.js";

export const economicsRepository = {
  // Fetches all requested indicators in a single batch query using `= ANY($2)`.
  async getIndicatorsDataByCountry(
    countryCode,
    indicatorCodes,
    startDate,
    endDate
  ) {
    const querySql = `
        SELECT
            e.country_code,
            e.indicator_code,
            e.period_end_date,
            e.value_usd,
            e.value_local,
            e.value_eur,
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
        LEFT JOIN dim_indicators i ON e.indicator_code = i.indicator_code
        LEFT JOIN dim_sources s ON e.source_code = s.source_code
        WHERE e.country_code = $1
          AND e.indicator_code = ANY($2)
          AND e.period_end_date BETWEEN $3 AND $4
        ORDER BY e.indicator_code, e.period_end_date DESC
    `;
    const { rows } = await query(querySql, [
      countryCode.toUpperCase(),
      indicatorCodes,
      startDate,
      endDate,
    ]);
    return rows;
  },
};
