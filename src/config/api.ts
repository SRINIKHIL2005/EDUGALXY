// API Configuration for deployment
const API_CONFIG = {
  // Use environment variable or fallback to demo/mock API
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.example.com',
  // Fallback to demo mode if no backend is available
  DEMO_MODE: !import.meta.env.VITE_API_BASE_URL,
  TIMEOUT: 10000,
};

export default API_CONFIG;
