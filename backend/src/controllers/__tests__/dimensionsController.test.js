import { jest } from "@jest/globals";
import { RESPONSE_CODES, STATUS_MESSAGES } from "../../utils/constants.js";

const mockGetAllCountries = jest.fn();
const mockGetAllIndicators = jest.fn();
const mockGetAllSources = jest.fn();
const mockGetAllCurrencies = jest.fn();

jest.unstable_mockModule("../../services/dimensionsService.js", () => ({
  dimensionsService: {
    getAllCountries: mockGetAllCountries,
    getAllIndicators: mockGetAllIndicators,
    getAllSources: mockGetAllSources,
    getAllCurrencies: mockGetAllCurrencies,
  },
}));

const { dimensionsController } = await import("../dimensionsController.js");

describe("dimensionsController", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("should get all countries and return 200 status", async () => {
    const mockCountries = [{ country_code: "USA" }];
    mockGetAllCountries.mockResolvedValue(mockCountries);

    await dimensionsController.getCountries(req, res);

    expect(mockGetAllCountries).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(RESPONSE_CODES.OK);
    expect(res.json).toHaveBeenCalledWith({
      status: STATUS_MESSAGES.SUCCESS,
      data: mockCountries,
    });
  });

  it("should get all indicators and return 200 status", async () => {
    const mockIndicators = [{ indicator_code: "GDP" }];
    mockGetAllIndicators.mockResolvedValue(mockIndicators);

    await dimensionsController.getIndicators(req, res);

    expect(mockGetAllIndicators).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(RESPONSE_CODES.OK);
    expect(res.json).toHaveBeenCalledWith({
      status: STATUS_MESSAGES.SUCCESS,
      data: mockIndicators,
    });
  });

  it("should get all sources and return 200 status", async () => {
    const mockSources = [{ source_code: "IMF" }];
    mockGetAllSources.mockResolvedValue(mockSources);

    await dimensionsController.getSources(req, res);

    expect(mockGetAllSources).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(RESPONSE_CODES.OK);
    expect(res.json).toHaveBeenCalledWith({
      status: STATUS_MESSAGES.SUCCESS,
      data: mockSources,
    });
  });

  it("should get all currencies and return 200 status", async () => {
    const mockCurrencies = [{ currency_code: "USD" }];
    mockGetAllCurrencies.mockResolvedValue(mockCurrencies);

    await dimensionsController.getCurrencies(req, res);

    expect(mockGetAllCurrencies).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(RESPONSE_CODES.OK);
    expect(res.json).toHaveBeenCalledWith({
      status: STATUS_MESSAGES.SUCCESS,
      data: mockCurrencies,
    });
  });
});
