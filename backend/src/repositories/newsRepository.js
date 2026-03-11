import { query } from "../utils/db";

export const newsRepository = {
  async getRecentByCountry(countryCode, limit = 20, offset = 0) {
    // Fetches the most recent news articles for the given country
    const querySql = `
        SELECT
        url, feed_name, title, summary, published_at, country_codes
        FROM fct_news
        WHERE $1::text = ANY(country_codes)
        ORDER BY published_at DESC
        LIMIT $2
        OFFSET $3
    `;

    const results = await query(querySql, [
      countryCode.toUpperCase(),
      limit,
      offset,
    ]);
    return results.rows;
  },

  async getByCountryAndDateRange(
    countryCode,
    startDate,
    endDate,
    limit = 20,
    offset = 0
  ) {
    // Fetches news articles for the given country, published within the specified date range
    const querySql = `
        SELECT
        url, feed_name, title, summary, published_at, country_codes
        FROM fct_news
        WHERE $1::text = ANY(country_codes)
        AND published_at >= $2
        AND published_at <= $3
        ORDER BY published_at DESC
        LIMIT $4
        OFFSET $5
    `;

    const results = await query(querySql, [
      countryCode.toUpperCase(),
      startDate,
      endDate,
      limit,
      offset,
    ]);
    return results.rows;
  },
};
