import { dimensionsService } from "../services/dimensionsService.js";
import { RESPONSE_CODES, STATUS_MESSAGES } from "../utils/constants.js";

export const dimensionsController = {
  async getCountries(req, res) {
    const countries = await dimensionsService.getAllCountries();
    res.status(RESPONSE_CODES.OK).json({
      status: STATUS_MESSAGES.SUCCESS,
      data: countries,
    });
  },

  async getIndicators(req, res) {
    const indicators = await dimensionsService.getAllIndicators();
    res.status(RESPONSE_CODES.OK).json({
      status: STATUS_MESSAGES.SUCCESS,
      data: indicators,
    });
  },

  async getSources(req, res) {
    const sources = await dimensionsService.getAllSources();
    res.status(RESPONSE_CODES.OK).json({
      status: STATUS_MESSAGES.SUCCESS,
      data: sources,
    });
  },

  async getCurrencies(req, res) {
    const currencies = await dimensionsService.getAllCurrencies();
    res.status(RESPONSE_CODES.OK).json({
      status: STATUS_MESSAGES.SUCCESS,
      data: currencies,
    });
  },
};
