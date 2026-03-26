import { RESPONSE_CODES, STATUS_MESSAGES } from "../utils/constants.js";
import { economicsService } from "../services/economicsService.js";

export const economicsController = {
  async getCountryDashboard(req, res) {
    const { countryCode } = req.params;
    const { startDate, endDate, currencyCode, targetCurrency, frequency } =
      req.query;

    const dashboardData = await economicsService.getCountryDashboard(
      countryCode,
      startDate,
      endDate,
      {
        currencyCode: currencyCode || targetCurrency,
        frequency,
      }
    );
    res.status(RESPONSE_CODES.OK).json({
      status: STATUS_MESSAGES.SUCCESS,
      data: dashboardData,
    });
  },
};
