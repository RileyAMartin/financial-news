import { jest } from "@jest/globals";
import { AppError } from "../../utils/appError.js";
import { validatePagination } from "../validatePagination.js";
import { RESPONSE_MESSAGES } from "../../utils/constants.js";

describe("validatePagination middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { query: {} };
    res = {};
    next = jest.fn();
  });

  it("should default to page 1 if no page is provided", () => {
    validatePagination(req, res, next);
    expect(req.query.page).toBe(1);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should throw error if the page cannot be parsed to int", () => {
    req.query.page = "not_a_number";
    expect(() => validatePagination(req, res, next)).toThrow(AppError);
    expect(() => validatePagination(req, res, next)).toThrow(
      RESPONSE_MESSAGES.PAGE_MALFORMED
    );
  });

  it("should throw error if the page is a negative number", () => {
    req.query.page = "-5";
    expect(() => validatePagination(req, res, next)).toThrow(AppError);
  });

  it("should throw error if the page is zero", () => {
    req.query.page = "0";
    expect(() => validatePagination(req, res, next)).toThrow(AppError);
  });

  it("should format and store valid page as an integer", () => {
    req.query.page = "5";
    validatePagination(req, res, next);
    expect(req.query.page).toBe(5);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
