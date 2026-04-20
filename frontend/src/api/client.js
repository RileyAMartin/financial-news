export async function fetchJson(endpoint, options = {}) {
  const baseUrl = import.meta.env.VITE_API_URL || "";
  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    const fallbackMessage = `Request failed (${response.status})`;
    let message = fallbackMessage;

    try {
      const json = await response.json();
      message = json?.message || fallbackMessage;
    } catch {
      // Keep fallback message when response body is empty or not JSON.
    }

    throw new Error(message);
  }

  return response.json();
}
