import { AppError } from "../utils/appError";
import { RESPONSE_CODES, RESPONSE_MESSAGES } from "../constants/constants";

export const validateDateRange = (mandatory = false) => {
  return (req, res, next) => {
    const { startDate, endDate } = req.query;

    // If either startDate or endDate is missing, we consider it valid (no date filtering)
    if (!startDate && !endDate) {
      if (mandatory) {
        throw new AppError(
          RESPONSE_MESSAGES.DATE_RANGE_REQUIRED,
          RESPONSE_CODES.BAD_REQUEST
        );
      }
      return next();
    }

    if (!startDate || !endDate) {
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
