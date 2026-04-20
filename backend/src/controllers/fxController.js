import { fxService } from "../services/fxService.js";
import { RESPONSE_CODES, STATUS_MESSAGES } from "../utils/constants.js";

export const fxController = {
  async getFxSeries(req, res) {
    const { currencyCode, targetCurrencies, startDate, endDate, frequency } = req.query;

    const fxData = await fxService.getFxSeries(currencyCode, {
      targetCurrencies: targetCurrencies ? targetCurrencies.split(",") : ["USD"],
      startDate,
      endDate,
      frequency,
    });

    res.status(RESPONSE_CODES.OK).json({
      status: STATUS_MESSAGES.SUCCESS,
      metadata: fxData.metadata,
      data: fxData.data,
    });
  },
};
