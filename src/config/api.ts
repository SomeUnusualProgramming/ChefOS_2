// API configuration - uses environment variable or falls back to proxy in dev
const getApiBaseUrl = (): string => {
  // Vite env variables must be prefixed with VITE_
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  
  if (envUrl) {
    return envUrl.replace(/\/$/, ''); // Remove trailing slash
  }
  
  // Default: use Vite proxy in dev mode
  return '';
};

export const API_BASE_URL = getApiBaseUrl();
