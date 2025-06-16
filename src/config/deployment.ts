// Deployment configuration for Vite-based React app
export const DEPLOYMENT_CONFIG = {
  // GitHub Pages deployment
  IS_GITHUB_PAGES: true,
  BASE_PATH: '/EDUGALXY',
  
  // Build configuration
  BUILD_OUTPUT_DIR: 'docs',
  VITE_BUILD: true,
  
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
  
  // Feature flags for deployment
  FEATURES: {
    // Disable backend-dependent features if no API URL
    ENABLE_AUTH: !!import.meta.env.VITE_API_BASE_URL,
    ENABLE_AI_FEATURES: !!import.meta.env.VITE_GEMINI_API_KEY,
    ENABLE_REALTIME: !!import.meta.env.VITE_API_BASE_URL,
    DEMO_MODE: !import.meta.env.VITE_API_BASE_URL,
  }
};

// Firebase configuration for deployment
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-app-id"
};
