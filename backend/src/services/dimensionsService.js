import { dimensionsRepository } from "../repositories/dimensionsRepository.js";

export const dimensionsService = {
  async getAllCountries() {
    return await dimensionsRepository.getAllCountries();
  },

  async getAllIndicators() {
    return await dimensionsRepository.getAllIndicators();
  },

  async getAllSources() {
    return await dimensionsRepository.getAllSources();
  },

  async getCountryByCode(countryCode) {
    return await dimensionsRepository.getCountryByCode(countryCode);
  },
};
