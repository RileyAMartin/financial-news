import { useCallback, useMemo, useEffect } from "react";
import { useTerminal } from "../context/TerminalContext";
import { useDimensionsData } from "./useDimensionsData";
import { useEconomicsData } from "./useEconomicsData";
import { useNewsFeed } from "./useNewsFeed";
import { useFxData } from "./useFxData";
import { UI_CONSTANTS } from "../utils/constants";

export function useDashboardController() {
  const {
    selectedCountry,
    setSelectedCountry,
    targetCurrency,
    setTargetCurrency,
    dateRange,
    setDateRange,
  } = useTerminal();

  const {
    countries,
    indicators,
    sources,
    currencies,
    geoJson,
    loading: dimensionsLoading,
    error: dimensionsError,
  } = useDimensionsData();

  const handleCountryChange = useCallback(
    (newCountryCode) => {
      setSelectedCountry(newCountryCode);
      const newCountryDetails = countries.find((c) => c.country_code === newCountryCode);
      if (newCountryDetails?.currency_code) {
        setTargetCurrency(newCountryDetails.currency_code);
      }
    },
    [setSelectedCountry, setTargetCurrency, countries]
  );

  const {
    data: economics,
    loading: economicsLoading,
    error: economicsError,
  } = useEconomicsData(
    selectedCountry,
    dateRange.startDate,
    dateRange.endDate,
    targetCurrency
  );

  const {
    items: newsItems,
    hasMore: newsHasMore,
    loading: newsLoading,
    error: newsError,
    loadMore: loadMoreNews,
  } = useNewsFeed(selectedCountry, dateRange.startDate, dateRange.endDate);

  const selectedCountryDetails = useMemo(
    () => countries.find((country) => country.country_code === selectedCountry) || null,
    [countries, selectedCountry]
  );

  const baseCurrency = targetCurrency || UI_CONSTANTS.FX.FALLBACK_BASE_CURRENCY;
  const targetCurrencies = useMemo(() => {
    return UI_CONSTANTS.FX.MAJOR_CURRENCIES.filter((c) => c !== baseCurrency);
  }, [baseCurrency]);

  const {
    data: fxItems,
    loading: fxLoading,
    error: fxError,
  } = useFxData(baseCurrency, targetCurrencies, dateRange.startDate, dateRange.endDate, UI_CONSTANTS.FX.DEFAULT_FREQUENCY);

  useEffect(() => {
    if (countries.length === 0 || selectedCountry) {
      return;
    }
    const preferred =
      countries.find((country) => country.country_code === UI_CONSTANTS.MAP.FALLBACK_COUNTRY_CODE) ||
      countries[0];
    if (preferred) {
      handleCountryChange(preferred.country_code);
    }
  }, [countries, selectedCountry, handleCountryChange]);

  const metricEntries = useMemo(() => {
    if (!economics || !economics.data) return [];
    return economics.data.map((s) => [s.key, s]);
  }, [economics]);

  const statusError = dimensionsError || economicsError || newsError || fxError;

  return {
    state: {
      selectedCountry,
      selectedCountryDetails,
      targetCurrency,
      dateRange,
      countries,
      currencies,
      geoJson,
      metricEntries,
      baseCurrency,
      targetCurrencies,
      statusError,
      indicators,
      sources,
    },
    actions: {
      handleCountryChange,
      setDateRange,
      setTargetCurrency,
    },
    data: {
      economics: { data: economics, loading: economicsLoading, error: economicsError },
      news: { items: newsItems, hasMore: newsHasMore, loading: newsLoading, error: newsError, loadMore: loadMoreNews },
      fx: { data: fxItems, loading: fxLoading, error: fxError },
      dimensions: { loading: dimensionsLoading },
    },
  };
}