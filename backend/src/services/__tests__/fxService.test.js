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

    expect(mockGetDateBounds).toHaveBeenCalledWith("EUR", "USD", "Q");
    expect(result.data).toEqual([]);
    expect(result.metadata.base_currency_code).toBe("EUR");
    expect(result.metadata.quote_currency_code).toBe("USD");
  });

  it("should use provided dates instead of bounds", async () => {
    mockGetQuarterlyRates.mockResolvedValue([
      { period_key: "2020-Q1", fx_rate: 1.2, source_code: "SRC" },
    ]);

    const result = await fxService.getFxSeries("EUR", {
      frequency: FREQUENCIES.QUARTERLY,
      startDate: "2020-01-01",
      endDate: "2020-12-31",
    });

    expect(mockGetDateBounds).not.toHaveBeenCalled();
    expect(mockGetQuarterlyRates).toHaveBeenCalledWith(
      "EUR",
      "USD",
      "2020-01-01",
      "2020-12-31"
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0].fx_rate).toBe(1.2);
  });

  it("should fetch daily rates if frequency is daily", async () => {
    mockGetDateBounds.mockResolvedValue({
      min_date: "2020-01-01",
      max_date: "2020-12-31",
    });
    mockGetDailyRates.mockResolvedValue([
      { period_key: "2020-01-01", fx_rate: 1.1, source_code: "SRC" },
    ]);

    const result = await fxService.getFxSeries("JPY", {
      frequency: FREQUENCIES.DAILY,
    });

    expect(mockGetDailyRates).toHaveBeenCalledWith(
      "JPY",
      "USD",
      "2020-01-01",
      "2020-12-31"
    );
    expect(result.data).toHaveLength(1);
  });
});
