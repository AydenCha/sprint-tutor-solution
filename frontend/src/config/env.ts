// Environment configuration
// All environment variables should be accessed through this file

export const config = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || (() => {
    // Default fallback for local development
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:8080/api';
    }
    // For production, try to infer from current domain
    console.warn('VITE_API_BASE_URL is not set. Using fallback.');
    return '/api';
  })(),

  // Email domain for registration validation
  allowedEmailDomain: import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || '@codeit.com',

  // Production domain patterns (for URL construction)
  productionDomainPattern: import.meta.env.VITE_PRODUCTION_DOMAIN_PATTERN || 'railway.app',
};

// Helper to get API base URL with proper formatting
export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    // If it's already an absolute URL, use it as is
    if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
      return envUrl;
    }
    // If it's a relative URL or domain only, make it absolute
    if (envUrl.includes(config.productionDomainPattern)) {
      return `https://${envUrl}`;
    }
    return envUrl;
  }
  return config.apiBaseUrl;
};
