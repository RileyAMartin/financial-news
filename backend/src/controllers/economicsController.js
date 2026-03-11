import { RESPONSE_CODES, STATUS_MESSAGES } from "../constants/constants";
import economicsService from "../services/economicsService";

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
