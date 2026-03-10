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
    }

}

