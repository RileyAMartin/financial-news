import { jest } from "@jest/globals";
import { RESPONSE_CODES, STATUS_MESSAGES } from "../../utils/constants.js";

const mockGetNewsFeed = jest.fn();

jest.unstable_mockModule("../../services/newsService.js", () => ({
  newsService: {
    getNewsFeed: mockGetNewsFeed,
  },
}));

const { newsController } = await import("../newsController.js");

describe("newsController", () => {
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

  it("should extract parameters and call newsService correctly", async () => {
    req.params.countryCode = "USA";
    req.query = {
      startDate: "2020-01-01",
      endDate: "2020-12-31",
      page: 2,
    };

    const mockNewsFeed = {
      metadata: { page: 2 },
      articles: [{ id: 1, title: "News" }],
    };
    mockGetNewsFeed.mockResolvedValue(mockNewsFeed);

    await newsController.getCountryNewsFeed(req, res);

    expect(mockGetNewsFeed).toHaveBeenCalledWith("USA", {
      startDate: "2020-01-01",
      endDate: "2020-12-31",
      page: 2,
    });

    expect(res.status).toHaveBeenCalledWith(RESPONSE_CODES.OK);
    expect(res.json).toHaveBeenCalledWith({
      status: STATUS_MESSAGES.SUCCESS,
      metadata: mockNewsFeed.metadata,
      data: mockNewsFeed.articles,
    });
  });
});
