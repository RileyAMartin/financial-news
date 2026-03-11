import { AppError } from "../utils/appError.js";
import { RESPONSE_CODES, RESPONSE_MESSAGES } from "../utils/constants.js";

export const validatePagination = (req, res, next) => {
  const { page } = req.query;

  if (!page) {
    req.query.page = 1;
    return next();
  }

  const parsedPage = parseInt(page, 10);

  if (isNaN(parsedPage) || parsedPage < 1) {
    throw new AppError(
      RESPONSE_MESSAGES.PAGE_MALFORMED,
      RESPONSE_CODES.BAD_REQUEST
    );
  }

  req.query.page = parsedPage;
  next();
};
