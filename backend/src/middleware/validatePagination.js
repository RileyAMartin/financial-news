import { AppError } from "../utils/appError";
import { RESPONSE_CODES, RESPONSE_MESSAGES } from "../constants/constants";

export const validatePagination = (req, res, next) => {
  const { page } = req.query;

  if (!page) {
    req.query.page = 1;
    return next();
  }

  const parsedPage = parseInt(page);

  if (isNaN(parsedPage) || parsedPage < 1) {
    throw new AppError(
      RESPONSE_MESSAGES.PAGE_MALFORMED,
      RESPONSE_CODES.BAD_REQUEST
    );
  }

  next();
};
