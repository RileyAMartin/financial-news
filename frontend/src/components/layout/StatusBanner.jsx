import React from "react";

export function StatusBanner({ type = "loading", message, isCard = false }) {
  const containerClass = isCard ? "status-card" : "status-banner";
  
  if (type === "loading") {
    return (
      <div className={`${containerClass} loading-state`} role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <span>{message || "Loading..."}</span>
      </div>
    );
  }

  if (type === "error") {
    return (
      <div className={`${containerClass} error`} role="alert">
        {message || "An error occurred."}
      </div>
    );
  }

  if (type === "empty") {
    return (
      <div className={`${containerClass} empty-state`} role="status" aria-live="polite">
        <span>{message || "No data available."}</span>
      </div>
    );
  }

  return null;
}
