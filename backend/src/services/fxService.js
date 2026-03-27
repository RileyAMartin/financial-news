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
  async getFxSeries(options) {
    const {
      currencyCode,
      frequency = FREQUENCIES.QUARTERLY,
      startDate,
      endDate,
    } = options;

    const baseCurrencyCode = currencyCode;
    const quoteCurrencyCode = "USD";

    const bounds =
      startDate && endDate
        ? { min_date: startDate, max_date: endDate }
        : await fxRepository.getDateBounds(
            baseCurrencyCode,
            quoteCurrencyCode,
            frequency
          );

    if (!bounds?.min_date || !bounds?.max_date) {
      return {
        metadata: {
          base_currency_code: baseCurrencyCode,
          quote_currency_code: quoteCurrencyCode,
          frequency,
          start_date: startDate || null,
          end_date: endDate || null,
          units: {
            fx_rate: `${quoteCurrencyCode} per ${baseCurrencyCode}`,
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
            baseCurrencyCode,
            quoteCurrencyCode,
            resolvedStartDate,
            resolvedEndDate
          )
        : await fxRepository.getQuarterlyRates(
            baseCurrencyCode,
            quoteCurrencyCode,
            resolvedStartDate,
            resolvedEndDate
          );

    return {
      metadata: {
        base_currency_code: baseCurrencyCode,
        quote_currency_code: quoteCurrencyCode,
        frequency,
        start_date: resolvedStartDate,
        end_date: resolvedEndDate,
        units: {
          fx_rate: `${quoteCurrencyCode} per ${baseCurrencyCode}`,
        },
      },
      data: rows.map((row) => ({
        period_key: row.period_key,
        fx_rate: toNumeric(row.fx_rate),
        source_code: row.source_code,
      })),
    };
  },
};
