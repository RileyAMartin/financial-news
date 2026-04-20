import { economicsRepository } from "../repositories/economicsRepository.js";
import { FREQUENCIES, IMF_INDICATOR_SERIES_KEYS } from "../utils/constants.js";

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

  if (!rows || rows.length === 0) {
    return map;
  }

  for (const row of rows) {
    map.set(row.period_key, toNumeric(row.fx_rate));
  }
  return map;
};

const buildDashboardMetadata = (
  countryCode,
  frequency,
  startDate,
  endDate,
  localCurrencyCode,
  targetCurrencyCode
) => {
  return {
    country_code: countryCode,
    frequency,
    start_date: startDate,
    end_date: endDate,
    units: {
      value_local: "local_currency",
      ...(targetCurrencyCode ? { value_converted: targetCurrencyCode } : {}),
    },
    currency: {
      local_currency_code: localCurrencyCode,
      ...(targetCurrencyCode
        ? { target_currency_code: targetCurrencyCode }
        : {}),
    },
  };
};

const buildEmptyDashboardResponse = (metadata) => {
  return {
    metadata,
    series: [],
  };
};

const getFxRateMaps = async (
  frequency,
  localCurrencyCode,
  targetCurrencyCode,
  startDate,
  endDate
) => {
  if (!localCurrencyCode || !targetCurrencyCode) {
    return {
      localToUsdRateMap: new Map(),
      targetToUsdRateMap: new Map(),
    };
  }

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

  return {
    localToUsdRateMap: buildFxRateMap(localToUsdRates),
    targetToUsdRateMap: buildFxRateMap(targetToUsdRates),
  };
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
  const groupedSeries = new Map();

  for (const row of rows) {
    const seriesKey = indicatorCodeMap[row.indicator_code];
    if (!seriesKey) continue;
    const valueLocal = toNumeric(row.value_local);

    // Init series if not exists
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

    // Convert local to target currency via USD
    let valueConverted = null;
    if (targetCurrencyCode && valueLocal !== null) {
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
      ...(targetCurrencyCode ? { value_converted: valueConverted } : {}),
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
  async getCountryDashboard(countryCode, options = {}) {
    // Normalize query params
    const {
      startDate,
      endDate,
      frequency,
      targetCurrencyCode = null,
    } = options;
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
      return buildEmptyDashboardResponse(
        buildDashboardMetadata(
          countryCode,
          frequency,
          startDate || null,
          endDate || null,
          null,
          targetCurrencyCode
        )
      );
    }

    const resolvedStartDate = startDate || bounds.min_date;
    const resolvedEndDate = endDate || bounds.max_date;

    // Fetch facts and currency metadata
    const localEconomicData =
      await economicsRepository.getEconomicsDataByCountry(
        countryCode,
        Object.keys(indicatorCodeMap),
        resolvedStartDate,
        resolvedEndDate,
        frequency
      );

    if (localEconomicData.length === 0) {
      return buildEmptyDashboardResponse(
        buildDashboardMetadata(
          countryCode,
          frequency,
          resolvedStartDate,
          resolvedEndDate,
          null,
          targetCurrencyCode
        )
      );
    }

    const localCurrencyCode = localEconomicData[0].currency_code;

    // Handle currency conversion if needed
    const { localToUsdRateMap, targetToUsdRateMap } = await getFxRateMaps(
      frequency,
      localCurrencyCode,
      targetCurrencyCode,
      resolvedStartDate,
      resolvedEndDate
    );

    const formatted = formatEconomicsSeries(
      localEconomicData,
      indicatorCodeMap,
      localCurrencyCode,
      targetCurrencyCode,
      localToUsdRateMap,
      targetToUsdRateMap
    );

    return {
      metadata: buildDashboardMetadata(
        countryCode,
        frequency,
        resolvedStartDate,
        resolvedEndDate,
        localCurrencyCode,
        targetCurrencyCode
      ),
      series: formatted.series,
    };
  },
};
