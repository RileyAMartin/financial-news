import { createContext, useContext, useState } from "react";
import PropTypes from "prop-types";

const TerminalContext = createContext();

function getInitialDateRange() {
  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 2);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export function TerminalProvider({ children }) {
  const [selectedCountry, setSelectedCountry] = useState("USA");
  const [targetCurrency, setTargetCurrency] = useState("USD");
  const [dateRange, setDateRange] = useState(getInitialDateRange);

  const value = {
    selectedCountry,
    setSelectedCountry,
    targetCurrency,
    setTargetCurrency,
    dateRange,
    setDateRange,
  };

  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  );
}

TerminalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export function useTerminal() {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error("useTerminal must be used within a TerminalProvider");
  }
  return context;
}
