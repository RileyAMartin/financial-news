import { it, jest } from "@jest/globals";
import { NEWS_PAGE_SIZE } from "../../utils/constants.js";

const mockGetByCountryAndDateRange = jest.fn();
const mockGetRecentByCountry = jest.fn();

jest.unstable_mockModule("../../repositories/newsRepository.js", () => ({
  newsRepository: {
    getByCountryAndDateRange: mockGetByCountryAndDateRange,
    getRecentByCountry: mockGetRecentByCountry,
  },
}));

const { newsService } = await import("../newsService.js");

describe("newsService.getNewsFeed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch recent news if no date range is provided", async () => {
    mockGetRecentByCountry.mockResolvedValue([{ id: 1 }]);

    const result = await newsService.getNewsFeed("usa", { page: 1 });

    expect(mockGetRecentByCountry).toHaveBeenCalledWith(
      "usa",
      NEWS_PAGE_SIZE + 1,
      0
    );
    expect(result.articles).toHaveLength(1);
    expect(result.metadata.has_more).toBe(false);
  });

  it("should fetch news by date range if provided", async () => {
    mockGetByCountryAndDateRange.mockResolvedValue([{ id: 1 }]);

    const result = await newsService.getNewsFeed("usa", {
      startDate: "2020-01-01",
      endDate: "2020-12-31",
      page: 1,
    });

    expect(mockGetByCountryAndDateRange).toHaveBeenCalledWith(
      "usa",
      "2020-01-01",
      "2020-12-31",
      NEWS_PAGE_SIZE + 1,
      0
    );
    expect(result.articles).toHaveLength(1);
  });

  it("should correctly handle pagination offsets", async () => {
    mockGetRecentByCountry.mockResolvedValue([{ id: 1 }]);

    const result = await newsService.getNewsFeed("usa", { page: 3 });

    expect(mockGetRecentByCountry).toHaveBeenCalledWith(
      "usa",
      NEWS_PAGE_SIZE + 1,
      NEWS_PAGE_SIZE * 2
    );
  });

  it("should set has_more if fetched rows exceed page size", async () => {
    const mockRows = Array.from({ length: NEWS_PAGE_SIZE + 1 }, (_, i) => ({
      id: i,
    }));
    mockGetRecentByCountry.mockResolvedValue(mockRows);

    const result = await newsService.getNewsFeed("usa", { page: 1 });

    expect(result.articles).toHaveLength(NEWS_PAGE_SIZE);
    expect(result.metadata.has_more).toBe(true);
  });
});
