export const RESPONSE_CODES = {
  INTERNAL_SERVER_ERROR: 500,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  OK: 200,
};

export const RESPONSE_MESSAGES = {
  COUNTRY_MALFORMED: "countryCode must be a 3-letter string.",
  COUNTRY_DOESNT_EXIST: "The requested countryCode could not be found.",
  CURRENCY_REQUIRED: "currencyCode is required.",
  CURRENCY_MALFORMED: "currencyCode must be a 3-letter string.",
  CURRENCY_DOESNT_EXIST: "The requested currencyCode could not be found.",
  DATE_RANGE_REQUIRED: "startDate and endDate are required.",
  DATE_RANGE_MALFORMED: "startDate and endDate must be in YYYY-MM-DD format.",
  DATE_RANGE_INVALID: "Invalid date range.",
  FREQUENCY_MALFORMED: "frequency must be one of: Q or D.",
  PAGE_MALFORMED: "page must be a positive integer.",
  GENERIC_ERROR: "An error occurred. Please try again.",
  INTERNAL_SERVER_ERROR: "An internal server error occurred.",
  NOT_FOUND: "The requested resource could not be found.",
};

export const STATUS_MESSAGES = {
  SUCCESS: "success",
  FAIL: "fail",
};

export const FREQUENCIES = {
  QUARTERLY: "Q",
  DAILY: "D",
};

// IMF SDMX indicator codes used in the economics dashboard
export const IMF_INDICATOR_CODES = {
  GDP: "B1GQ",
  EXPORTS: "P7",
  IMPORTS: "P6",
  EXPORT_BALANCE: "B11",
};

export const IMF_INDICATOR_SERIES_KEYS = {
  [IMF_INDICATOR_CODES.GDP]: "gdp",
  [IMF_INDICATOR_CODES.EXPORTS]: "exports",
  [IMF_INDICATOR_CODES.IMPORTS]: "imports",
  [IMF_INDICATOR_CODES.EXPORT_BALANCE]: "export_balance",
};

export const NEWS_PAGE_SIZE = 20;
