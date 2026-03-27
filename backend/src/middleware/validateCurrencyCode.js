import { dimensionsService } from "../services/dimensionsService.js";
import { AppError } from "../utils/appError.js";
import { RESPONSE_CODES, RESPONSE_MESSAGES } from "../utils/constants.js";

const normalizeAndValidateFormat = (value) => {
  if (typeof value !== "string" || value.length !== 3) {
    throw new AppError(
      RESPONSE_MESSAGES.CURRENCY_MALFORMED,
      RESPONSE_CODES.BAD_REQUEST
    );
  }

  return value.toUpperCase();
};

export const validateOptionalEconomicsCurrencyCode = async (req, res, next) => {
  const rawCurrency = req.query.currencyCode || req.query.targetCurrency || null;
  if (!rawCurrency) {
    req.query.currencyCode = null;
    return next();
  }

  const currencyCode = normalizeAndValidateFormat(rawCurrency);
  const currency = await dimensionsService.getCurrencyByCode(currencyCode);

  if (!currency) {
    throw new AppError(
      RESPONSE_MESSAGES.CURRENCY_DOESNT_EXIST,
      RESPONSE_CODES.BAD_REQUEST
    );
  }

  req.query.currencyCode = currencyCode;
  next();
};

export const validateFxCurrencyCode = async (req, res, next) => {
  const rawCurrencyCode = req.query.currencyCode || req.query.baseCurrencyCode;

  if (!rawCurrencyCode) {
    throw new AppError(
      "currencyCode is required.",
      RESPONSE_CODES.BAD_REQUEST
    );
  }

  const normalizedCurrencyCode = normalizeAndValidateFormat(rawCurrencyCode);
  const currency = await dimensionsService.getCurrencyByCode(
    normalizedCurrencyCode
  );

  if (!currency) {
    throw new AppError(
      RESPONSE_MESSAGES.CURRENCY_DOESNT_EXIST,
      RESPONSE_CODES.BAD_REQUEST
    );
  }

  req.query.currencyCode = normalizedCurrencyCode;

  next();
};
