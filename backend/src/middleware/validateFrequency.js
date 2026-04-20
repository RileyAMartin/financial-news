import { AppError } from "../utils/appError.js";
import {
  FREQUENCIES,
  RESPONSE_CODES,
  RESPONSE_MESSAGES,
} from "../utils/constants.js";

// Frequency must be either quarterly or daily. If not provided, defaults to quarterly.
export const validateFrequency = (req, res, next) => {
  const { frequency } = req.query;

  if (!frequency) {
    req.query.frequency = FREQUENCIES.QUARTERLY;
    return next();
  }

  const normalizedFrequency = frequency.toUpperCase().trim();
  if (
    normalizedFrequency !== FREQUENCIES.QUARTERLY &&
    normalizedFrequency !== FREQUENCIES.DAILY
  ) {
    throw new AppError(
      RESPONSE_MESSAGES.FREQUENCY_MALFORMED,
      RESPONSE_CODES.BAD_REQUEST
    );
  }

  req.query.frequency = normalizedFrequency;
  next();
};
