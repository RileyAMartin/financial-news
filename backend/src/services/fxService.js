import { fxRepository } from "../repositories/fxRepository.js";
import { FREQUENCIES } from "../utils/constants.js";

const toNumeric = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const fxService = {
  async getFxSeries(currencyCode, options = {}) {
    const { frequency = FREQUENCIES.QUARTERLY, startDate, endDate, targetCurrencies } = options;

    const baseCurrencyCode = currencyCode;
    const quoteCurrencies = (targetCurrencies || ["USD"]).map((c) => c.toUpperCase());
    
    // We need rates for the base currency and all target currencies to calculate cross rates.
    // They are all stored as X to USD (where X is the base_currency_code and USD is the quote_currency_code)
    const currenciesToFetch = Array.from(new Set([baseCurrencyCode, ...quoteCurrencies])).filter((c) => c !== "USD");

    const bounds =
      startDate && endDate
        ? { min_date: startDate, max_date: endDate }
        : await fxRepository.getDateBounds(
            currenciesToFetch,
            frequency
          );

    if (!bounds?.min_date || !bounds?.max_date) {
      return {
        metadata: {
          base_currency_code: baseCurrencyCode,
          quote_currencies: quoteCurrencies,
          frequency,
          start_date: startDate || null,
          end_date: endDate || null,
          units: {
            fx_rate: `[Quotes] per ${baseCurrencyCode}`,
          },
        },
        data: [],
      };
    }

    const resolvedStartDate = startDate || bounds.min_date;
    const resolvedEndDate = endDate || bounds.max_date;

    const rows =
      frequency === FREQUENCIES.DAILY
        ? await fxRepository.getDailyRates(
            currenciesToFetch,
            resolvedStartDate,
            resolvedEndDate
          )
        : await fxRepository.getQuarterlyRates(
            currenciesToFetch,
            resolvedStartDate,
            resolvedEndDate
          );

    // Group rates by period_key to compute cross rates
    const ratesByPeriod = {};
    for (const row of rows) {
      if (!ratesByPeriod[row.period_key]) {
        ratesByPeriod[row.period_key] = { rates: { USD: 1.0 }, source_code: row.source_code };
      }
      ratesByPeriod[row.period_key].rates[row.base_currency_code] = toNumeric(row.fx_rate);
      
      // Override source code if it's the base currency to show the right source
      if (row.base_currency_code === baseCurrencyCode) {
        ratesByPeriod[row.period_key].source_code = row.source_code;
      }
    }

    const calculatedData = [];
    for (const [period, data] of Object.entries(ratesByPeriod)) {
      const baseToUsdRate = data.rates[baseCurrencyCode];
      
      // If we don't have the origin rate for this period, skip it
      if (baseToUsdRate === undefined || baseToUsdRate === null) continue;

      for (const target of quoteCurrencies) {
        const targetToUsdRate = data.rates[target];
        
        if (targetToUsdRate !== undefined && targetToUsdRate !== null && targetToUsdRate !== 0) {
          // If base is CAD (CAD->USD=0.75) and target is GBP (GBP->USD=1.30)
          // 1 CAD = 0.75 USD -> 1 CAD = (0.75 / 1.30) GBP
          const crossRate = baseToUsdRate / targetToUsdRate;
          calculatedData.push({
            period_key: period,
            quote_currency_code: target,
            fx_rate: crossRate,
            source_code: data.source_code,
          });
        }
      }
    }

    return {
      metadata: {
        base_currency_code: baseCurrencyCode,
        quote_currencies: quoteCurrencies,
        frequency,
        start_date: resolvedStartDate,
        end_date: resolvedEndDate,
        units: {
          fx_rate: `[Quotes] per ${baseCurrencyCode}`,
        },
      },
      data: calculatedData.sort((a, b) => a.period_key.localeCompare(b.period_key)),
    };
  },
};
