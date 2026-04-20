import { newsRepository } from "../repositories/newsRepository.js";
import { NEWS_PAGE_SIZE as PAGE_SIZE } from "../utils/constants.js";

export const newsService = {
  async getNewsFeed(countryCode, options = {}) {
    const { startDate = null, endDate = null, page = 1 } = options;
    const currentPage = Math.max(1, page);
    const offset = (currentPage - 1) * PAGE_SIZE;

    // Fetch one extra row to determine whether a next page exists
    const fetchLimit = PAGE_SIZE + 1;

    // If startDate and endDate are provided, then fetch news within the date range
    // Otherwise, fetch the most recent news
    let rows;
    if (startDate && endDate) {
      rows = await newsRepository.getByCountryAndDateRange(
        countryCode,
        startDate,
        endDate,
        fetchLimit,
        offset
      );
    } else {
      rows = await newsRepository.getRecentByCountry(
        countryCode,
        fetchLimit,
        offset
      );
    }

    const hasMore = rows.length > PAGE_SIZE;
    const articles = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

    return {
      articles,
      metadata: {
        country_code: countryCode.toUpperCase(),
        page: currentPage,
        page_size: PAGE_SIZE,
        has_more: hasMore,
        start_date: startDate,
        end_date: endDate,
      },
    };
  },
};
