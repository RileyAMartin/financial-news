import { jest } from "@jest/globals";
import { AppError } from "../../utils/appError.js";
import { RESPONSE_CODES, RESPONSE_MESSAGES } from "../../utils/constants.js";

const mockGetCountryByCode = jest.fn();
jest.unstable_mockModule("../../services/dimensionsService.js", () => ({
  dimensionsService: {
    getCountryByCode: mockGetCountryByCode,
  },
}));

const { validateCountryCode } = await import("../validateCountryCode.js");

describe("validateCountryCode middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { params: {} };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should throw if countryCode is missing", async () => {
    await expect(validateCountryCode(req, res, next)).rejects.toThrow(AppError);
  });

  it("should throw if countryCode is not exactly 3 characters", async () => {
    req.params.countryCode = "US";
    await expect(validateCountryCode(req, res, next)).rejects.toThrow(AppError);

    req.params.countryCode = "AMER";
    await expect(validateCountryCode(req, res, next)).rejects.toThrow(AppError);
  });

  it("should throw if country does not exist in the database", async () => {
    req.params.countryCode = "ZZZ";
    mockGetCountryByCode.mockResolvedValue(null);

    await expect(validateCountryCode(req, res, next)).rejects.toMatchObject({
      message: RESPONSE_MESSAGES.COUNTRY_DOESNT_EXIST,
      statusCode: RESPONSE_CODES.NOT_FOUND,
    });
    expect(mockGetCountryByCode).toHaveBeenCalledWith("ZZZ");
  });

  it("should format countryCode safely to uppercase and call next if valid", async () => {
    req.params.countryCode = "usa";
    mockGetCountryByCode.mockResolvedValue({ country_code: "USA" });

    await validateCountryCode(req, res, next);

    expect(req.params.countryCode).toBe("USA");
    expect(next).toHaveBeenCalledTimes(1);
  });
});
