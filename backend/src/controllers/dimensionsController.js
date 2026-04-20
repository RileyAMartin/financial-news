import { dimensionsService } from "../services/dimensionsService.js";
import { RESPONSE_CODES, STATUS_MESSAGES, RESPONSE_MESSAGES } from "../utils/constants.js";
import { AppError } from "../utils/appError.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const dimensionsController = {
  async getMap(req, res, next) {
    const geoJsonPath = path.join(__dirname, "../../data/world-countries.geojson");
    res.sendFile(geoJsonPath, (err) => {
      if (err) {
        next(new AppError(
          RESPONSE_MESSAGES.MAP_DATA_UNAVAILABLE,
          RESPONSE_CODES.INTERNAL_SERVER_ERROR
        ));
      }
    });
  },

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
