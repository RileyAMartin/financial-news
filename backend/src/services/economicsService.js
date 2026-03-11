import { economicsRepository } from "../repositories/economicsRepository";

export const economicsService = {
  async getCountryDashboard(countryCode, startDate, endDate) {
    const codeMap = {
      B1GQ: "gdp",
      P7: "exports",
      P6: "imports",
      B11: "exportBalance",
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
