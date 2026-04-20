import { it, jest } from "@jest/globals";
import { FREQUENCIES } from "../../utils/constants.js";

const mockGetDateBounds = jest.fn();
const mockGetDailyRates = jest.fn();
const mockGetQuarterlyRates = jest.fn();

jest.unstable_mockModule("../../repositories/fxRepository.js", () => ({
  fxRepository: {
    getDateBounds: mockGetDateBounds,
    getDailyRates: mockGetDailyRates,
    getQuarterlyRates: mockGetQuarterlyRates,
  },
}));

const { fxService } = await import("../fxService.js");

describe("fxService.getFxSeries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle empty bounds correctly when no data or bounds are provided", async () => {
    mockGetDateBounds.mockResolvedValue({ min_date: null, max_date: null });
    const result = await fxService.getFxSeries("EUR", {
      frequency: FREQUENCIES.QUARTERLY,
    });

    expect(mockGetDateBounds).toHaveBeenCalledWith(["EUR"], "Q");
    expect(result.data).toEqual([]);
    expect(result.metadata.base_currency_code).toBe("EUR");
    expect(result.metadata.quote_currencies).toEqual(["USD"]);
  });

  it("should use provided dates instead of bounds", async () => {
    mockGetQuarterlyRates.mockResolvedValue([
      { period_key: "2020-Q1", base_currency_code: "EUR", fx_rate: 1.2, source_code: "SRC" },
    ]);

    const result = await fxService.getFxSeries("EUR", {
      frequency: FREQUENCIES.QUARTERLY,
      startDate: "2020-01-01",
      endDate: "2020-12-31",
    });

    expect(mockGetDateBounds).not.toHaveBeenCalled();
    expect(mockGetQuarterlyRates).toHaveBeenCalledWith(
      ["EUR"],
      "2020-01-01",
      "2020-12-31"
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0].fx_rate).toBe(1.2);
    expect(result.data[0].quote_currency_code).toBe("USD");
  });

  it("should fetch daily rates if frequency is daily", async () => {
    mockGetDateBounds.mockResolvedValue({
      min_date: "2020-01-01",
      max_date: "2020-12-31",
    });
    mockGetDailyRates.mockResolvedValue([
      { period_key: "2020-01-01", base_currency_code: "JPY", fx_rate: 0.007, source_code: "SRC" },
    ]);

    const result = await fxService.getFxSeries("JPY", {
      frequency: FREQUENCIES.DAILY,
    });

    expect(mockGetDailyRates).toHaveBeenCalledWith(
      ["JPY"],
      "2020-01-01",
      "2020-12-31"
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0].fx_rate).toBe(0.007);
    expect(result.data[0].quote_currency_code).toBe("USD");
  });

  it("should correctly compute cross rates between non-USD pairs", async () => {
    mockGetDateBounds.mockResolvedValue({
      min_date: "2020-01-01",
      max_date: "2020-12-31",
    });
    mockGetDailyRates.mockResolvedValue([
      { period_key: "2020-01-01", base_currency_code: "AUD", fx_rate: 0.75, source_code: "SRC1" },
      { period_key: "2020-01-01", base_currency_code: "GBP", fx_rate: 1.30, source_code: "SRC2" },
    ]);

    const result = await fxService.getFxSeries("AUD", {
      targetCurrencies: ["GBP", "USD"],
      frequency: FREQUENCIES.DAILY,
    });

    expect(mockGetDailyRates).toHaveBeenCalledWith(
      expect.arrayContaining(["AUD", "GBP"]),
      "2020-01-01",
      "2020-12-31"
    );
    expect(result.data).toHaveLength(2); // One for USD, one for GBP
    
    const gbpResult = result.data.find(d => d.quote_currency_code === "GBP");
    expect(gbpResult.fx_rate).toBeCloseTo(0.75 / 1.30); // Base USD rate / Target USD rate
    
    const usdResult = result.data.find(d => d.quote_currency_code === "USD");
    expect(usdResult.fx_rate).toBe(0.75); // Target is USD, so just base rate (0.75 / 1.0)
  });
});
