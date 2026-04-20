import { jest } from "@jest/globals";
import { AppError } from "../../utils/appError.js";
import {
  FREQUENCIES,
  RESPONSE_CODES,
  RESPONSE_MESSAGES,
} from "../../utils/constants.js";
import { validateFrequency } from "../validateFrequency.js";

describe("validateFrequency middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { query: {} };
    res = {};
    next = jest.fn();
  });

  it("should default to QUARTERLY if no frequency provided", () => {
    validateFrequency(req, res, next);
    expect(req.query.frequency).toBe(FREQUENCIES.QUARTERLY);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should throw error if an invalid frequency string is passed", () => {
    req.query.frequency = "YEARLY";
    expect(() => validateFrequency(req, res, next)).toThrow(AppError);
    expect(() => validateFrequency(req, res, next)).toThrow(
      RESPONSE_MESSAGES.FREQUENCY_MALFORMED
    );
  });

  it("should format frequency strings properly", () => {
    req.query.frequency = " q  ";
    validateFrequency(req, res, next);
    expect(req.query.frequency).toBe(FREQUENCIES.QUARTERLY);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should handle valid string values correctly", () => {
    req.query.frequency = FREQUENCIES.DAILY;
    validateFrequency(req, res, next);
    expect(req.query.frequency).toBe(FREQUENCIES.DAILY);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
