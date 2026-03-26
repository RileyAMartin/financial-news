export const RESPONSE_CODES = {
  INTERNAL_SERVER_ERROR: 500,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  OK: 200,
};

export const RESPONSE_MESSAGES = {
  COUNTRY_MALFORMED: "Country code must be a 3-letter string.",
  COUNTRY_DOESNT_EXIST: "The requested country could not be found.",
  CURRENCY_MALFORMED: "Currency code must be a 3-letter string.",
  CURRENCY_DOESNT_EXIST: "The requested currency could not be found.",
  DATE_RANGE_REQUIRED: "Start date and end date are required.",
  DATE_RANGE_MALFORMED: "Start date and end date must be in YYYY-MM-DD format.",
  DATE_RANGE_INVALID: "Invalid date range.",
  PAGE_MALFORMED: "Page must be a positive integer.",
  GENERIC_ERROR: "An error occurred. Please try again.",
  NOT_FOUND: "The requested resource could not be found.",
};

export const STATUS_MESSAGES = {
  SUCCESS: "success",
  FAIL: "fail",
};

// IMF SDMX indicator codes used in the economics dashboard
export const IMF_INDICATOR_CODES = {
  GDP: "B1GQ",
  EXPORTS: "P7",
  IMPORTS: "P6",
  EXPORT_BALANCE: "B11",
};

export const NEWS_PAGE_SIZE = 20;
