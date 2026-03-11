import { economicsRepository } from "../repositories/economicsRepository.js";
import { IMF_INDICATOR_CODES } from "../utils/constants.js";

export const economicsService = {
  async getCountryDashboard(countryCode, startDate, endDate) {
    // Maps each IMF SDMX code to the user-facing JSON key in the response
    const codeMap = {
      [IMF_INDICATOR_CODES.GDP]: "gdp",
      [IMF_INDICATOR_CODES.EXPORTS]: "exports",
      [IMF_INDICATOR_CODES.IMPORTS]: "imports",
      [IMF_INDICATOR_CODES.EXPORT_BALANCE]: "exportBalance",
    };

    const rows = await economicsRepository.getIndicatorsDataByCountry(
      countryCode,
      Object.keys(codeMap),
      startDate,
      endDate
    );

    const result = {};

    for (const row of rows) {
      const key = codeMap[row.indicator_code];

      if (!result[key]) {
        result[key] = {
          metadata: {
            indicatorCode: row.indicator_code,
            name: row.indicator_name,
            description: row.indicator_description,
          },
          source: {
            sourceCode: row.source_code,
            publisher: row.publisher,
            publisherShort: row.publisher_short,
            dataset: row.dataset,
            datasetShort: row.dataset_short,
            url: row.source_url,
          },
          data: [],
        };
      }

      result[key].data.push({
        date: row.period_end_date,
        valueLocal: row.value_local,
        valueUsd: row.value_usd,
        valueEur: row.value_eur,
        isInflationAdjusted: row.is_inflation_adjusted,
      });
    }

    return result;
  },
};
