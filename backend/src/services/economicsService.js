import { economicsRepository } from "../repositories/economicsRepository.js";
import { AppError } from "../utils/appError.js";
import {
  IMF_INDICATOR_CODES,
  RESPONSE_CODES,
  RESPONSE_MESSAGES,
} from "../utils/constants.js";

const FREQUENCIES = {
  QUARTERLY: "Q",
  DAILY: "D",
};

const normalizeCurrencyCode = (currencyCode) => {
  if (!currencyCode) {
    return null;
  }

  if (typeof currencyCode !== "string" || currencyCode.length !== 3) {
    throw new AppError(
      RESPONSE_MESSAGES.CURRENCY_MALFORMED,
      RESPONSE_CODES.BAD_REQUEST
    );
  }

  return currencyCode.toUpperCase();
};

const toNumeric = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildFxRateMap = (rows, frequency) => {
  const map = new Map();
  for (const row of rows) {
    const periodKey =
      frequency === FREQUENCIES.QUARTERLY ? row.year_quarter : row.period_label;
    map.set(periodKey, toNumeric(row.close_price));
  }
  return map;
};

export const economicsService = {
  async getCountryDashboard(countryCode, startDate, endDate, options = {}) {
    // Normalize optional request params up front so the rest of the flow is deterministic.
    const requestedFrequency = (options.frequency || FREQUENCIES.QUARTERLY)
      .toUpperCase()
      .trim();
    const frequency =
      requestedFrequency === FREQUENCIES.DAILY
        ? FREQUENCIES.DAILY
        : FREQUENCIES.QUARTERLY;

    const targetCurrencyCode = normalizeCurrencyCode(options.currencyCode);

    const codeMap = {
      [IMF_INDICATOR_CODES.GDP]: "gdp",
      [IMF_INDICATOR_CODES.EXPORTS]: "exports",
      [IMF_INDICATOR_CODES.IMPORTS]: "imports",
      [IMF_INDICATOR_CODES.EXPORT_BALANCE]: "exportBalance",
    };

    // Fetch economics rows and local-currency metadata independently.
    const [rows, countryCurrency] = await Promise.all([
      economicsRepository.getEconomicsDataByCountry(
        countryCode,
        Object.keys(codeMap),
        startDate,
        endDate,
        frequency
      ),
      economicsRepository.getCountryCurrencyMapping(countryCode),
    ]);

    const localCurrencyCode = countryCurrency?.currency_code;
    if (!localCurrencyCode) {
      throw new AppError(
        RESPONSE_MESSAGES.COUNTRY_DOESNT_EXIST,
        RESPONSE_CODES.NOT_FOUND
      );
    }

    if (targetCurrencyCode) {
      const targetCurrency = await economicsRepository.getCurrencyByCode(
        targetCurrencyCode
      );
      if (!targetCurrency) {
        throw new AppError(
          RESPONSE_MESSAGES.CURRENCY_DOESNT_EXIST,
          RESPONSE_CODES.BAD_REQUEST
        );
      }
    }

    let localToUsdRateMap = null;
    let targetToUsdRateMap = null;

    if (targetCurrencyCode) {
      // FX is fetched at the same grain as economics so period keys line up.
      let localToUsdRates;
      let targetToUsdRates;

      if (frequency === FREQUENCIES.DAILY) {
        [localToUsdRates, targetToUsdRates] = await Promise.all([
          economicsRepository.getDailyFxRates(
            localCurrencyCode,
            "USD",
            startDate,
            endDate
          ),
          targetCurrencyCode === "USD"
            ? Promise.resolve([])
            : economicsRepository.getDailyFxRates(
                targetCurrencyCode,
                "USD",
                startDate,
                endDate
              ),
        ]);
      } else {
        [localToUsdRates, targetToUsdRates] = await Promise.all([
          economicsRepository.getQuarterlyFxRates(
            localCurrencyCode,
            "USD",
            startDate,
            endDate
          ),
          targetCurrencyCode === "USD"
            ? Promise.resolve([])
            : economicsRepository.getQuarterlyFxRates(
                targetCurrencyCode,
                "USD",
                startDate,
                endDate
              ),
        ]);
      }

      localToUsdRateMap = buildFxRateMap(localToUsdRates, frequency);
      targetToUsdRateMap = buildFxRateMap(targetToUsdRates, frequency);
    }

    const result = {};

    for (const row of rows) {
      const key = codeMap[row.indicator_code];
      const periodLabel =
        frequency === FREQUENCIES.QUARTERLY ? row.year_quarter : row.date_day;
      const valueLocal = toNumeric(row.value_local);

      let valueUsd = null;
      let valueConverted = null;

      // Conversion path is local -> USD -> target currency.
      if (targetCurrencyCode && valueLocal !== null) {
        const localToUsdRate = localToUsdRateMap?.get(periodLabel);
        if (localToUsdRate !== null && localToUsdRate !== undefined) {
          valueUsd = valueLocal * localToUsdRate;

          if (targetCurrencyCode === "USD") {
            valueConverted = valueUsd;
          } else {
            const targetToUsdRate = targetToUsdRateMap?.get(periodLabel);
            if (
              targetToUsdRate !== null &&
              targetToUsdRate !== undefined &&
              targetToUsdRate !== 0
            ) {
              valueConverted = valueUsd / targetToUsdRate;
            }
          }
        }
      }

      if (!result[key]) {
        result[key] = {
          metadata: {
            indicatorCode: row.indicator_code,
            name: row.indicator_name,
            description: row.indicator_description,
            frequency,
          },
          source: {
            sourceCode: row.source_code,
            publisher: row.publisher,
            publisherShort: row.publisher_short,
            dataset: row.dataset,
            datasetShort: row.dataset_short,
            url: row.source_url,
          },
          currency: {
            localCurrencyCode,
            targetCurrencyCode: targetCurrencyCode || null,
          },
          data: {},
        };
      }

      result[key].data[periodLabel] = {
        date: row.date_day,
        yearQuarter: row.year_quarter,
        valueLocal,
        valueUsd,
        valueConverted,
        isInflationAdjusted: row.is_inflation_adjusted,
      };
    }

    return result;
  },
};
