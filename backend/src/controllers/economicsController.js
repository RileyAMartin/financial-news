import { RESPONSE_CODES, STATUS_MESSAGES } from "../utils/constants.js";
import { economicsService } from "../services/economicsService.js";

export const economicsController = {
  async getCountryDashboard(req, res) {
    const { countryCode } = req.params;
    const { startDate, endDate } = req.query;

    const dashboardData = await economicsService.getCountryDashboard(
      countryCode,
      startDate,
      endDate
    );
    res.status(RESPONSE_CODES.OK).json({
      status: STATUS_MESSAGES.SUCCESS,
      data: dashboardData,
    });
  },
};
