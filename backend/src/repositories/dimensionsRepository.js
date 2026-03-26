import { query } from "../config/db.js";

export const dimensionsRepository = {
  async getAllCountries() {
    // Fetches all distinct countries from the database
    const querySql = `
        SELECT DISTINCT country_code, official_name, display_name FROM dim_countries
        `;
    const results = await query(querySql);
    return results.rows;
  },

  async getAllIndicators() {
    // Fetches all distinct economic indicators from the database
    const querySql = `
        SELECT DISTINCT indicator_code, name, description FROM dim_indicators
        `;
    const results = await query(querySql);
    return results.rows;
  },

  async getAllSources() {
    // Fetches all distinct news sources from the database
    const querySql = `
        SELECT DISTINCT source_code, publisher, publisher_short, dataset, dataset_short, url FROM dim_sources
        `;
    const results = await query(querySql);
    return results.rows;
  },
  
  async getAllCurrencies() {
    // Fetches all distinct currencies from the database
    const querySql = `
        SELECT DISTINCT currency_code, currency_name FROM dim_currencies
        `;
    const results = await query(querySql);
    return results.rows;
  },
  
  async getCountryByCode(countryCode) {
    // Fetches a specific country by its code
    const querySql = `
        SELECT country_code, official_name, display_name FROM dim_countries
        WHERE country_code = $1
        `;
    const results = await query(querySql, [countryCode]);
    return results.rows[0];
  },

};
