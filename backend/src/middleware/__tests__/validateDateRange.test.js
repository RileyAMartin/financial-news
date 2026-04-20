import { jest } from "@jest/globals";
import { AppError } from "../../utils/appError.js";
import { RESPONSE_CODES, RESPONSE_MESSAGES } from "../../utils/constants.js";
import { validateDateRange } from "../validateDateRange.js";

describe("validateDateRange middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { query: {} };
    res = {};
    next = jest.fn();
  });

  it("should call next() directly if both startDate and endDate are omitted", () => {
    validateDateRange(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should throw error if only startDate is provided", () => {
    req.query.startDate = "2020-01-01";
    expect(() => validateDateRange(req, res, next)).toThrow(AppError);
    expect(() => validateDateRange(req, res, next)).toThrow(
      RESPONSE_MESSAGES.DATE_RANGE_REQUIRED
    );
  });

  it("should throw error if only endDate is provided", () => {
    req.query.endDate = "2020-01-01";
    expect(() => validateDateRange(req, res, next)).toThrow(AppError);
  });

  it("should throw error if exact format is not YYYY-MM-DD", () => {
    req.query = { startDate: "2020/01/01", endDate: "2020-12-31" }; // Wrong separator
    expect(() => validateDateRange(req, res, next)).toThrow(AppError);

    req.query = { startDate: "2020-01-01", endDate: "12-31-2020" }; // Wrong format order
    expect(() => validateDateRange(req, res, next)).toThrow(AppError);
  });

  it("should throw error for an invalid chronological date", () => {
    req.query = { startDate: "2020-13-10", endDate: "2020-03-10" }; // Invalid month
    expect(() => validateDateRange(req, res, next)).toThrow(AppError);
  });

  it("should throw error if startDate is later than endDate", () => {
    req.query = { startDate: "2021-01-01", endDate: "2020-12-31" };
    expect(() => validateDateRange(req, res, next)).toThrow(AppError);
    expect(() => validateDateRange(req, res, next)).toThrow(
      RESPONSE_MESSAGES.DATE_RANGE_INVALID
    );
  });

  it("should call next() if both dates are valid and properly ordered", () => {
    req.query = { startDate: "2020-01-01", endDate: "2020-12-31" };
    validateDateRange(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
