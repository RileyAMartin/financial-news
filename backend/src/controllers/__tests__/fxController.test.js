import { jest } from "@jest/globals";
import { RESPONSE_CODES, STATUS_MESSAGES } from "../../utils/constants.js";

const mockGetFxSeries = jest.fn();

jest.unstable_mockModule("../../services/fxService.js", () => ({
  fxService: {
    getFxSeries: mockGetFxSeries,
  },
}));

const { fxController } = await import("../fxController.js");

describe("fxController", () => {
  let req, res;

  beforeEach(() => {
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("should extract query parameters and call fxService correctly", async () => {
    req.query = {
      currencyCode: "JPY",
      startDate: "2020-01-01",
      endDate: "2020-12-31",
      frequency: "Q",
    };

    const mockFxData = {
      metadata: { base: "JPY" },
      data: [{ rate: 1.1 }],
    };
    mockGetFxSeries.mockResolvedValue(mockFxData);

    await fxController.getFxSeries(req, res);

    expect(mockGetFxSeries).toHaveBeenCalledWith("JPY", {
      startDate: "2020-01-01",
      endDate: "2020-12-31",
      frequency: "Q",
    });

    expect(res.status).toHaveBeenCalledWith(RESPONSE_CODES.OK);
    expect(res.json).toHaveBeenCalledWith({
      status: STATUS_MESSAGES.SUCCESS,
      metadata: mockFxData.metadata,
      data: mockFxData.data,
    });
  });
});
