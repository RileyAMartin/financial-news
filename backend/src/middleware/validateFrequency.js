import { AppError } from "../utils/appError.js";
import {
  FREQUENCIES,
  RESPONSE_CODES,
  RESPONSE_MESSAGES,
} from "../utils/constants.js";

export const validateFrequency = (req, res, next) => {
  const { frequency } = req.query;

  if (!frequency) {
    req.query.frequency = FREQUENCIES.QUARTERLY;
    return next();
  }

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

  req.query.frequency = normalized;
  next();
};
