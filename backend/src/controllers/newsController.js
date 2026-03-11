import { newsService } from "../services/newsService.js";
import { RESPONSE_CODES, STATUS_MESSAGES } from "../utils/constants.js";

export const newsController = {
  async getCountryNewsFeed(req, res) {
    const { countryCode } = req.params;
    const { startDate, endDate, page } = req.query;

    const newsFeed = await newsService.getNewsFeed(
      countryCode,
      startDate,
      endDate,
      page
    );

    res.status(RESPONSE_CODES.OK).json({
      status: STATUS_MESSAGES.SUCCESS,
      data: newsFeed,
    });
  },
};
