import { economicsRepository } from "../repositories/economicsRepository.js";
import { dimensionsService } from "./dimensionsService.js";
import { AppError } from "../utils/appError.js";
import {
  FREQUENCIES,
  IMF_INDICATOR_SERIES_KEYS,
  RESPONSE_CODES,
  RESPONSE_MESSAGES,
} from "../utils/constants.js";

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

const normalizeFrequency = (frequency) => {
  if (!frequency) {
    return FREQUENCIES.QUARTERLY;
  }

  // Normalize frequency
  const normalized = frequency.toUpperCase().trim();
  if (
    normalized !== FREQUENCIES.QUARTERLY &&
    normalized !== FREQUENCIES.DAILY
  ) {
    throw new AppError(
      RESPONSE_MESSAGES.FREQUENCY_MALFORMED,
      RESPONSE_CODES.BAD_REQUEST
    );
  }

  return normalized;
};

const toNumeric = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildFxRateMap = (rows) => {
  // Build period-keyed FX map
  const map = new Map();
  for (const row of rows) {
    map.set(row.period_key, toNumeric(row.fx_rate));
  }
  return map;
};

const formatEconomicsSeries = (
  rows,
  indicatorCodeMap,
  localCurrencyCode,
  targetCurrencyCode,
  localToUsdRateMap,
  targetToUsdRateMap
) => {
  // Group rows by indicator
  const shouldConvert = Boolean(targetCurrencyCode);
  const groupedSeries = new Map();

  for (const row of rows) {
    const seriesKey = indicatorCodeMap[row.indicator_code];
    const valueLocal = toNumeric(row.value_local);

    if (!groupedSeries.has(seriesKey)) {
      groupedSeries.set(seriesKey, {
        indicator_code: row.indicator_code,
        indicator_name: row.indicator_name,
        indicator_description: row.indicator_description,
        source: {
          source_code: row.source_code,
          publisher: row.publisher,
          publisher_short: row.publisher_short,
          dataset: row.dataset,
          dataset_short: row.dataset_short,
          url: row.source_url,
        },
        points: [],
      });
    }

    let valueConverted = null;
    if (shouldConvert && valueLocal !== null) {
      // Convert local to target currency via usd
      const localToUsdRate = toNumeric(localToUsdRateMap?.get(row.period_key));
      if (Number.isFinite(localToUsdRate)) {
        const valueUsd = valueLocal * localToUsdRate;

        if (targetCurrencyCode === "USD") {
          valueConverted = valueUsd;
        } else {
          const targetToUsdRate = toNumeric(
            targetToUsdRateMap?.get(row.period_key)
          );
          if (Number.isFinite(targetToUsdRate) && targetToUsdRate !== 0) {
            valueConverted = valueUsd / targetToUsdRate;
          }
        }
      }
    }

    groupedSeries.get(seriesKey).points.push({
      period_key: row.period_key,
      date_day: row.date_day,
      value_local: valueLocal,
      is_inflation_adjusted: row.is_inflation_adjusted,
      ...(shouldConvert ? { value_converted: valueConverted } : {}),
    });
  }

  return {
    local_currency_code: localCurrencyCode,
    target_currency_code: targetCurrencyCode,
    series: Array.from(groupedSeries.entries()).map(([key, value]) => ({
      key,
      ...value,
    })),
  };
};

export const economicsService = {
  async getCountryDashboard(countryCode, startDate, endDate, options = {}) {
    // Normalize query params
    const frequency = normalizeFrequency(options.frequency);
    const targetCurrencyCode = normalizeCurrencyCode(options.currencyCode);

    const indicatorCodeMap = IMF_INDICATOR_SERIES_KEYS;

    const bounds =
      startDate && endDate
        ? { min_date: startDate, max_date: endDate }
        : await economicsRepository.getEconomicsDateBounds(
            countryCode,
            Object.keys(indicatorCodeMap),
            frequency
          );

    // Handle empty range
    if (!bounds?.min_date || !bounds?.max_date) {
      const shouldConvert = Boolean(targetCurrencyCode);
      return {
        metadata: {
          country_code: countryCode,
          frequency,
          start_date: startDate || null,
          end_date: endDate || null,
          units: {
            value_local: "local_currency",
            ...(shouldConvert
              ? { value_converted: targetCurrencyCode }
              : {}),
          },
          currency: {
            local_currency_code: null,
            ...(shouldConvert
              ? { target_currency_code: targetCurrencyCode }
              : {}),
          },
        },
        series: [],
      };
    }

    const resolvedStartDate = startDate || bounds.min_date;
    const resolvedEndDate = endDate || bounds.max_date;

    // Fetch facts and currency metadata
    const [rows, countryCurrency] = await Promise.all([
      economicsRepository.getEconomicsDataByCountry(
        countryCode,
        Object.keys(indicatorCodeMap),
        resolvedStartDate,
        resolvedEndDate,
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
      const targetCurrency = await dimensionsService.getCurrencyByCode(
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
      let localToUsdRates;
      let targetToUsdRates;

      if (frequency === FREQUENCIES.DAILY) {
        [localToUsdRates, targetToUsdRates] = await Promise.all([
          economicsRepository.getDailyFxRates(
            localCurrencyCode,
            "USD",
            resolvedStartDate,
            resolvedEndDate
          ),
          targetCurrencyCode === "USD"
            ? Promise.resolve([])
            : economicsRepository.getDailyFxRates(
                targetCurrencyCode,
                "USD",
                resolvedStartDate,
                resolvedEndDate
              ),
        ]);
      } else {
        [localToUsdRates, targetToUsdRates] = await Promise.all([
          economicsRepository.getQuarterlyFxRates(
            localCurrencyCode,
            "USD",
            resolvedStartDate,
            resolvedEndDate
          ),
          targetCurrencyCode === "USD"
            ? Promise.resolve([])
            : economicsRepository.getQuarterlyFxRates(
                targetCurrencyCode,
                "USD",
                resolvedStartDate,
                resolvedEndDate
              ),
        ]);
      }

      localToUsdRateMap = buildFxRateMap(localToUsdRates);
      targetToUsdRateMap = buildFxRateMap(targetToUsdRates);
    }

    const formatted = formatEconomicsSeries(
      rows,
      indicatorCodeMap,
      localCurrencyCode,
      targetCurrencyCode,
      localToUsdRateMap,
      targetToUsdRateMap
    );

    const shouldConvert = Boolean(formatted.target_currency_code);

    return {
      metadata: {
        country_code: countryCode,
        frequency,
        start_date: resolvedStartDate,
        end_date: resolvedEndDate,
        units: {
          value_local: "local_currency",
          ...(shouldConvert
            ? { value_converted: formatted.target_currency_code }
            : {}),
        },
        currency: {
          local_currency_code: formatted.local_currency_code,
          ...(shouldConvert
            ? { target_currency_code: formatted.target_currency_code }
            : {}),
        },
      },
      series: formatted.series,
    };
  },
};
