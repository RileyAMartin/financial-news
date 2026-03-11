import { dimensionsService } from "../services/dimensionsService";
import { AppError } from "../utils/appError";
import { RESPONSE_CODES, RESPONSE_MESSAGES } from "../constants/constants";

export const validateCountryCode = async (req, res, next) => {
  // Verifies that countryCode exists in request and is a 3-letter code
  const { countryCode } = req.params;

  // Country code must be a string of length 3
  if (
    !countryCode ||
    typeof countryCode !== "string" ||
    countryCode.length !== 3
  ) {
    throw new AppError(
      RESPONSE_MESSAGES.COUNTRY_MALFORMED,
      RESPONSE_CODES.BAD_REQUEST
    );
  }

  // Verify that country code exists in the database
  const country = await dimensionsService.getCountryByCode(
    countryCode.toUpperCase()
  );
  if (!country) {
    throw new AppError(
      RESPONSE_MESSAGES.COUNTRY_DOESNT_EXIST,
      RESPONSE_CODES.NOT_FOUND
    );
  }

  req.params.countryCode = countryCode.toUpperCase();

  next();
};
