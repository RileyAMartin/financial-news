export function formatCompactNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  // Handle standard compact notation
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1, // Reduced to 1 for better readability
  }).format(Number(value));
}

export function formatCurrencyValue(value, currency) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  if (currency === "LOCAL" || !currency) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(Number(value));
  }

  try {
    // USD, EUR, GBP, JPY, CNY, etc.
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch (e) {
    // Fallback for invalid currency codes
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(Number(value));
  }
}

export function formatQuarter(dateString) {
  if (!dateString) return "-";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  
  // Q1: 0,1,2 | Q2: 3,4,5 | Q3: 6,7,8 | Q4: 9,10,11
  const quarter = Math.floor(month / 3) + 1;
  
  return `${year} Q${quarter}`;
}

export function formatPreciseNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function getCurrencyField(currency) {
  if (currency === "USD") {
    return "valueUsd";
  }

  if (currency === "EUR") {
    return "valueEur";
  }

  return "valueLocal";
}
