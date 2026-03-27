import { AppError } from "../utils/appError.js";
import { RESPONSE_CODES, RESPONSE_MESSAGES } from "../utils/constants.js";

// Enforces strict ISO 8601 YYYY-MM-DD format to prevent ambiguous or auto-corrected dates
const ISO_DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const validateDateRange = () => {
  return (req, res, next) => {
    const { startDate, endDate } = req.query;

    // If either startDate or endDate is missing, we consider it valid (no date filtering)
    if (!startDate && !endDate) {
      return next();
    }

    // If only one of the two dates is provided, the range is incomplete
    if (!startDate || !endDate) {
      throw new AppError(
        RESPONSE_MESSAGES.DATE_RANGE_REQUIRED,
        RESPONSE_CODES.BAD_REQUEST
      );
    }

    if (!ISO_DATE_REGEX.test(startDate) || !ISO_DATE_REGEX.test(endDate)) {
      throw new AppError(
        RESPONSE_MESSAGES.DATE_RANGE_MALFORMED,
        RESPONSE_CODES.BAD_REQUEST
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError(
        RESPONSE_MESSAGES.DATE_RANGE_MALFORMED,
        RESPONSE_CODES.BAD_REQUEST
      );
    }

    if (start > end) {
      throw new AppError(
        RESPONSE_MESSAGES.DATE_RANGE_INVALID,
        RESPONSE_CODES.BAD_REQUEST
      );
    }

    next();
  };
};
