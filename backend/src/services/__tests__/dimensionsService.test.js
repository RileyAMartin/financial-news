import { it, jest } from "@jest/globals";

const mockGetAllCountries = jest.fn();
const mockGetAllIndicators = jest.fn();
const mockGetAllSources = jest.fn();
const mockGetAllCurrencies = jest.fn();
const mockGetCurrencyByCode = jest.fn();
const mockGetCountryByCode = jest.fn();
const mockGetCountryCurrencyMapping = jest.fn();

jest.unstable_mockModule("../../repositories/dimensionsRepository.js", () => ({
  dimensionsRepository: {
    getAllCountries: mockGetAllCountries,
    getAllIndicators: mockGetAllIndicators,
    getAllSources: mockGetAllSources,
    getAllCurrencies: mockGetAllCurrencies,
    getCurrencyByCode: mockGetCurrencyByCode,
    getCountryByCode: mockGetCountryByCode,
    getCountryCurrencyMapping: mockGetCountryCurrencyMapping,
  },
}));

const { dimensionsService } = await import("../dimensionsService.js");

describe("dimensionsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call and return getAllCountries from repository", async () => {
    mockGetAllCountries.mockResolvedValue([{ country_code: "USA" }]);
    const result = await dimensionsService.getAllCountries();
    expect(mockGetAllCountries).toHaveBeenCalled();
    expect(result).toEqual([{ country_code: "USA" }]);
  });

  it("should call and return getAllIndicators from repository", async () => {
    mockGetAllIndicators.mockResolvedValue([{ indicator_code: "GDP" }]);
    const result = await dimensionsService.getAllIndicators();
    expect(mockGetAllIndicators).toHaveBeenCalled();
    expect(result).toEqual([{ indicator_code: "GDP" }]);
  });

  it("should call and return getAllSources from repository", async () => {
    mockGetAllSources.mockResolvedValue([{ source_code: "IMF" }]);
    const result = await dimensionsService.getAllSources();
    expect(mockGetAllSources).toHaveBeenCalled();
    expect(result).toEqual([{ source_code: "IMF" }]);
  });

  it("should call and return getAllCurrencies from repository", async () => {
    mockGetAllCurrencies.mockResolvedValue([{ currency_code: "USD" }]);
    const result = await dimensionsService.getAllCurrencies();
    expect(mockGetAllCurrencies).toHaveBeenCalled();
    expect(result).toEqual([{ currency_code: "USD" }]);
  });

  it("should call and return getCurrencyByCode from repository", async () => {
    mockGetCurrencyByCode.mockResolvedValue({ currency_code: "USD" });
    const result = await dimensionsService.getCurrencyByCode("USD");
    expect(mockGetCurrencyByCode).toHaveBeenCalledWith("USD");
    expect(result).toEqual({ currency_code: "USD" });
  });

  it("should call and return getCountryByCode from repository", async () => {
    mockGetCountryByCode.mockResolvedValue({ country_code: "USA" });
    const result = await dimensionsService.getCountryByCode("USA");
    expect(mockGetCountryByCode).toHaveBeenCalledWith("USA");
    expect(result).toEqual({ country_code: "USA" });
  });

  it("should call and return getCountryCurrencyMapping from repository", async () => {
    mockGetCountryCurrencyMapping.mockResolvedValue([
      { country_code: "USA", currency_code: "USD" },
    ]);
    const result = await dimensionsService.getCountryCurrencyMapping("USA");
    expect(mockGetCountryCurrencyMapping).toHaveBeenCalledWith("USA");
    expect(result).toEqual([{ country_code: "USA", currency_code: "USD" }]);
  });
});
