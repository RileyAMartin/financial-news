import { dimensionsService } from "../services/dimensionsService.js";
import { AppError } from "../utils/appError.js";
import { RESPONSE_CODES, RESPONSE_MESSAGES } from "../utils/constants.js";

const createCurrencyValidationMiddleware = (queryParamName, isRequired) => {
  return async (req, res, next) => {
    const currencyCode = req.query[queryParamName] || null;

    if (isRequired) {
      if (!currencyCode) {
        throw new AppError(
          RESPONSE_MESSAGES.CURRENCY_REQUIRED,
          RESPONSE_CODES.BAD_REQUEST
        );
      }
    } else {
      if (!currencyCode) {
        req.query[queryParamName] = null;
        return next();
      }
    }

    if (typeof currencyCode !== "string" || currencyCode.length !== 3) {
      throw new AppError(
        RESPONSE_MESSAGES.CURRENCY_MALFORMED,
        RESPONSE_CODES.BAD_REQUEST
      );
    }
    const normalizedCurrencyCode = currencyCode.toUpperCase();

    const currency = await dimensionsService.getCurrencyByCode(
      normalizedCurrencyCode
    );

    if (!currency) {
      throw new AppError(
        RESPONSE_MESSAGES.CURRENCY_DOESNT_EXIST,
        RESPONSE_CODES.BAD_REQUEST
      );
    }

    req.query[queryParamName] = normalizedCurrencyCode;

    next();
  };
};

export const validateRequiredCurrencyCode = createCurrencyValidationMiddleware(
  "currencyCode",
  true
);
export const validateOptionalTargetCurrencyCode =
  createCurrencyValidationMiddleware("targetCurrencyCode", false);
