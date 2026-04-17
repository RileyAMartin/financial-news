import { it, jest } from "@jest/globals";
import {
  IMF_INDICATOR_CODES,
  IMF_INDICATOR_SERIES_KEYS,
} from "../../utils/constants.js";

const mockGetEconomicsDataByCountry = jest.fn();
const mockGetEconomicsDateBounds = jest.fn();
const mockGetQuarterlyFxRates = jest.fn();
const mockGetDailyFxRates = jest.fn();

jest.unstable_mockModule("../../repositories/economicsRepository.js", () => ({
  economicsRepository: {
    getEconomicsDataByCountry: mockGetEconomicsDataByCountry,
    getEconomicsDateBounds: mockGetEconomicsDateBounds,
    getQuarterlyFxRates: mockGetQuarterlyFxRates,
    getDailyFxRates: mockGetDailyFxRates,
  },
}));

const createMockRow = (overrides = {}) => ({
  country_code: "USA",
  currency_code: "USD",
  indicator_code: "B1GQ", // GDP
  source_code: "IMF_QNEA",
  period_key: "2020-Q1",
  date_day: "2020-01-01",
  frequency: "Q",
  value_local: 1000,
  is_inflation_adjusted: true,
  indicator_name: "Gross Domestic Product",
  indicator_description: "Indicator Description",
  source_code: "Source Code",
  publisher: "Publisher",
  publisher_short: "Publisher Short",
  dataset: "Dataset",
  dataset_short: "Dataset Short",
  source_url: "Source URL",
  ...overrides,
});

const createMockFxRateRow = (overrides = {}) => ({
  base_currency_code: "USD",
  quote_currency_code: "EUR",
  frequency: "Q",
  period_key: "2020-Q1",
  fx_rate: 0.5,
  source_code: "Source Code",
  ...overrides,
});

const { economicsService } = await import("../economicsService.js");

describe("economicsService.getCountryDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TODO: if provided, it should use startDate and endDate instead of fetching bounds
  it("should use provided date bounds instead of fetching if startDate and endDate are given", async () => {
    const startDate = "2020-01-01";
    const endDate = "2020-12-31";
    mockGetEconomicsDataByCountry.mockResolvedValue([]);
    const result = await economicsService.getCountryDashboard("USA", {
      startDate,
      endDate,
      frequency: "Q",
    });
    expect(mockGetEconomicsDateBounds).not.toHaveBeenCalled();
    expect(mockGetEconomicsDataByCountry).toHaveBeenCalledWith(
      "USA",
      expect.any(Array),
      startDate,
      endDate,
      "Q"
    );
  });

  it("should return an empty response if date bounds are null", async () => {
    mockGetEconomicsDateBounds.mockResolvedValue({
      min_date: null,
      max_date: null,
    });
    const result = await economicsService.getCountryDashboard("USA", {
      frequency: "Q",
    });

    expect(mockGetEconomicsDateBounds).toHaveBeenCalledWith(
      "USA",
      expect.any(Array),
      "Q"
    );

    expect(result.series).toEqual([]);
    expect(result.metadata.country_code).toBe("USA");
    expect(result.metadata.frequency).toBe("Q");
  });

  it("should fetch data when date bounds exist", async () => {
    mockGetEconomicsDateBounds.mockResolvedValue({
      min_date: "2020-01-01",
      max_date: "2020-12-31",
    });
    mockGetEconomicsDataByCountry.mockResolvedValue([]);
    const result = await economicsService.getCountryDashboard("USA", {
      frequency: "Q",
    });

    expect(mockGetEconomicsDataByCountry).toHaveBeenCalledWith(
      "USA",
      expect.any(Array),
      "2020-01-01",
      "2020-12-31",
      "Q"
    );

    expect(result.series).toEqual([]);
    expect(result.metadata.country_code).toBe("USA");
    expect(result.metadata.start_date).toBe("2020-01-01");
    expect(result.metadata.end_date).toBe("2020-12-31");
    expect(result.metadata.frequency).toBe("Q");
  });

  // TODO: it should group database rows by indicator code series keys
  it("should group data by indicator code series keys", async () => {
    const gdpCode = IMF_INDICATOR_CODES["GDP"];
    const exportsCode = IMF_INDICATOR_CODES["EXPORTS"];
    const importsCode = IMF_INDICATOR_CODES["IMPORTS"];

    const mockData = [
      createMockRow({ indicator_code: gdpCode }),
      createMockRow({ indicator_code: gdpCode }),
      createMockRow({ indicator_code: exportsCode }),
      createMockRow({ indicator_code: importsCode }),
    ];
    mockGetEconomicsDataByCountry.mockResolvedValue(mockData);

    const result = await economicsService.getCountryDashboard("USA", {
      startDate: "2020-01-01",
      endDate: "2020-12-31",
      frequency: "Q",
    });
    expect(result.series).toHaveLength(3);

    const seriesKeys = result.series.map((s) => s.key);
    expect(seriesKeys).toContain(IMF_INDICATOR_SERIES_KEYS[gdpCode]);
    expect(seriesKeys).toContain(IMF_INDICATOR_SERIES_KEYS[exportsCode]);
    expect(seriesKeys).toContain(IMF_INDICATOR_SERIES_KEYS[importsCode]);
    expect(
      result.series.find((s) => s.key === IMF_INDICATOR_SERIES_KEYS[gdpCode])
        .points
    ).toHaveLength(2);
    expect(
      result.series.find(
        (s) => s.key === IMF_INDICATOR_SERIES_KEYS[exportsCode]
      ).points
    ).toHaveLength(1);
    expect(
      result.series.find(
        (s) => s.key === IMF_INDICATOR_SERIES_KEYS[importsCode]
      ).points
    ).toHaveLength(1);
  });

  it("should ignore rows with unknown indicator codes", async () => {
    const unknownCode = "UNKNOWN_CODE";
    const mockData = [
      createMockRow({ indicator_code: unknownCode }),
      createMockRow({ indicator_code: IMF_INDICATOR_CODES["GDP"] }),
    ];
    mockGetEconomicsDataByCountry.mockResolvedValue(mockData);

    const result = await economicsService.getCountryDashboard("USA", {
      startDate: "2020-01-01",
      endDate: "2020-12-31",
      frequency: "Q",
    });
    expect(result.series).toHaveLength(1);
  });

  it("should skip FX rate fetching if targetCurrencyCode not provided", async () => {
    const mockData = [createMockRow()];
    mockGetEconomicsDataByCountry.mockResolvedValue(mockData);

    const result = await economicsService.getCountryDashboard("USA", {
      startDate: "2020-01-01",
      endDate: "2020-12-31",
      frequency: "Q",
    });
    expect(mockGetQuarterlyFxRates).not.toHaveBeenCalled();
  });

  it("should fetch FX rates if targetCurrencyCode is provided", async () => {
    const mockData = [createMockRow()];
    mockGetEconomicsDataByCountry.mockResolvedValue(mockData);
    mockGetQuarterlyFxRates.mockResolvedValue([]);

    const result = await economicsService.getCountryDashboard("USA", {
      startDate: "2020-01-01",
      endDate: "2020-12-31",
      frequency: "Q",
      targetCurrencyCode: "EUR",
    });
    expect(mockGetQuarterlyFxRates).toHaveBeenCalledTimes(2); // First for USD and then for EUR
    expect(mockGetQuarterlyFxRates).toHaveBeenCalledWith(
      "USD",
      "USD",
      "2020-01-01",
      "2020-12-31"
    );
    expect(mockGetQuarterlyFxRates).toHaveBeenCalledWith(
      "EUR",
      "USD",
      "2020-01-01",
      "2020-12-31"
    );
  });

  it("should fetch daily FX rates if frequency is D", async () => {
    const mockData = [createMockRow({ frequency: "D" })];
    mockGetEconomicsDataByCountry.mockResolvedValue(mockData);
    mockGetDailyFxRates.mockResolvedValue([]);
    const result = await economicsService.getCountryDashboard("USA", {
      startDate: "2020-01-01",
      endDate: "2020-12-31",
      frequency: "D",
      targetCurrencyCode: "EUR",
    });
    expect(mockGetDailyFxRates).toHaveBeenCalledTimes(2);
    expect(mockGetDailyFxRates).toHaveBeenCalledWith(
      "USD",
      "USD",
      "2020-01-01",
      "2020-12-31"
    );
    expect(mockGetDailyFxRates).toHaveBeenCalledWith(
      "EUR",
      "USD",
      "2020-01-01",
      "2020-12-31"
    );
  });

  it("should only fetch local-to-USD rates if target currency is USD", async () => {
    const mockData = [createMockRow()];
    mockGetEconomicsDataByCountry.mockResolvedValue(mockData);
    mockGetQuarterlyFxRates.mockResolvedValue([]);

    const result = await economicsService.getCountryDashboard("USA", {
      startDate: "2020-01-01",
      endDate: "2020-12-31",
      frequency: "Q",
      targetCurrencyCode: "USD",
    });
    expect(mockGetQuarterlyFxRates).toHaveBeenCalledTimes(1);
    expect(mockGetQuarterlyFxRates).toHaveBeenCalledWith(
      "USD",
      "USD",
      "2020-01-01",
      "2020-12-31"
    );
  });

  it("should correctly calculate rates for non-USD target currencies", async () => {
    const mockData = [createMockRow({ value_local: 100 })];
    mockGetEconomicsDataByCountry.mockResolvedValue(mockData);
    mockGetQuarterlyFxRates
      .mockResolvedValueOnce([createMockFxRateRow({ fx_rate: 1.0 })])
      .mockResolvedValueOnce([createMockFxRateRow({ fx_rate: 0.5 })]);

    const result = await economicsService.getCountryDashboard("USA", {
      startDate: "2020-01-01",
      endDate: "2020-12-31",
      frequency: "Q",
      targetCurrencyCode: "EUR",
    });
    expect(result.series).toHaveLength(1);

    const series = result.series[0];
    expect(series.points).toHaveLength(1);

    const point = series.points[0];
    expect(point.value_local).toBe(100);
    expect(point.value_converted).toBe(200);
  });
  it("should return null for value_converted if FX rate is missing for a period", async () => {
    const mockData = [createMockRow({ value_local: 100 })];
    mockGetEconomicsDataByCountry.mockResolvedValue(mockData);
    mockGetQuarterlyFxRates.mockResolvedValue([]);

    const result = await economicsService.getCountryDashboard("USA", {
      startDate: "2020-01-01",
      endDate: "2020-12-31",
      frequency: "Q",
      targetCurrencyCode: "EUR",
    });
    expect(result.series).toHaveLength(1);

    const series = result.series[0];
    expect(series.points).toHaveLength(1);

    const point = series.points[0];
    expect(point.value_local).toBe(100);
    expect(point.value_converted).toBeNull();
  });
});
