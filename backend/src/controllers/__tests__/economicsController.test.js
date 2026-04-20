import { jest } from "@jest/globals";
import { RESPONSE_CODES, STATUS_MESSAGES } from "../../utils/constants.js";

const mockGetCountryDashboard = jest.fn();

jest.unstable_mockModule("../../services/economicsService.js", () => ({
  economicsService: {
    getCountryDashboard: mockGetCountryDashboard,
  },
}));

const { economicsController } = await import("../economicsController.js");

describe("economicsController", () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("should format request parameters and call economicsService correctly", async () => {
    req.params.countryCode = "USA";
    req.query = {
      startDate: "2020-01-01",
      endDate: "2020-12-31",
      targetCurrencyCode: "EUR",
      frequency: "Q",
    };

    const mockDashboardData = {
      metadata: { some_meta: true },
      series: [{ data: 1 }],
    };
    mockGetCountryDashboard.mockResolvedValue(mockDashboardData);

    await economicsController.getCountryDashboard(req, res);

    expect(mockGetCountryDashboard).toHaveBeenCalledWith("USA", {
      startDate: "2020-01-01",
      endDate: "2020-12-31",
      targetCurrencyCode: "EUR",
      frequency: "Q",
    });

    expect(res.status).toHaveBeenCalledWith(RESPONSE_CODES.OK);
    expect(res.json).toHaveBeenCalledWith({
      status: STATUS_MESSAGES.SUCCESS,
      metadata: mockDashboardData.metadata,
      data: mockDashboardData.series,
    });
  });
});
