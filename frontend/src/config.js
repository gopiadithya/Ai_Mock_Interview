// Centralized API Base URL configuration
export const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  // If running locally
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000';
  }
  // Default fallback for deployed frontend if env variable is missing
  return 'http://localhost:5000';
};

export const API_BASE = getApiBase();
