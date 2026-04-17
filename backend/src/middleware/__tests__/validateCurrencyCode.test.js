import { jest } from "@jest/globals";
import { AppError } from "../../utils/appError.js";
import { RESPONSE_CODES, RESPONSE_MESSAGES } from "../../utils/constants.js";

const mockGetCurrencyByCode = jest.fn();
jest.unstable_mockModule("../../services/dimensionsService.js", () => ({
  dimensionsService: {
    getCurrencyByCode: mockGetCurrencyByCode,
  },
}));

const { validateRequiredCurrencyCode, validateOptionalTargetCurrencyCode } =
  await import("../validateCurrencyCode.js");

describe("validateCurrencyCode middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { query: {} };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("validateRequiredCurrencyCode", () => {
    it("should throw error if currencyCode is missing", async () => {
      await expect(
        validateRequiredCurrencyCode(req, res, next)
      ).rejects.toMatchObject({
        message: RESPONSE_MESSAGES.CURRENCY_REQUIRED,
        statusCode: RESPONSE_CODES.BAD_REQUEST,
      });
    });

    it("should throw if currency code is not 3 characters", async () => {
      req.query.currencyCode = "EURO";
      await expect(
        validateRequiredCurrencyCode(req, res, next)
      ).rejects.toThrow(AppError);
    });

    it("should throw if currency code does not exist in db", async () => {
      req.query.currencyCode = "ZZZ";
      mockGetCurrencyByCode.mockResolvedValue(null);

      await expect(
        validateRequiredCurrencyCode(req, res, next)
      ).rejects.toThrow(AppError);
    });

    it("should normalize currencyCode and call next()", async () => {
      req.query.currencyCode = "eur";
      mockGetCurrencyByCode.mockResolvedValue({ currency_code: "EUR" });

      await validateRequiredCurrencyCode(req, res, next);
      expect(req.query.currencyCode).toBe("EUR");
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe("validateOptionalTargetCurrencyCode", () => {
    it("should set targetCurrencyCode to null and call next if missing", async () => {
      await validateOptionalTargetCurrencyCode(req, res, next);
      expect(req.query.targetCurrencyCode).toBeNull();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should throw if targetCurrencyCode is provided but invalid format", async () => {
      req.query.targetCurrencyCode = "EU"; // 2 characters
      await expect(
        validateOptionalTargetCurrencyCode(req, res, next)
      ).rejects.toThrow(AppError);
    });

    it("should throw if targetCurrencyCode is provided but does not exist in db", async () => {
      req.query.targetCurrencyCode = "ZZZ";
      mockGetCurrencyByCode.mockResolvedValue(null);

      await expect(
        validateOptionalTargetCurrencyCode(req, res, next)
      ).rejects.toThrow(AppError);
      expect(mockGetCurrencyByCode).toHaveBeenCalledWith("ZZZ");
    });

    it("should normalize targetCurrencyCode and call next() if valid", async () => {
      req.query.targetCurrencyCode = "eur";
      mockGetCurrencyByCode.mockResolvedValue({ currency_code: "EUR" });

      await validateOptionalTargetCurrencyCode(req, res, next);
      expect(req.query.targetCurrencyCode).toBe("EUR");
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
