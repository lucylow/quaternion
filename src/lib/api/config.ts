/**
 * API Configuration
 * Centralized configuration for all API endpoints and settings
 */

export const API_CONFIG = {
  // Backend API URL (can be Express server or other backend)
  GAME_API_URL: import.meta.env.VITE_GAME_API_URL || 'http://localhost:3000/api',
  
  // Supabase functions base URL
  SUPABASE_FUNCTIONS_URL: import.meta.env.VITE_SUPABASE_URL 
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
    : '',
  
  // Request settings
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Polling settings
  POLL_INTERVAL: 200, // 200ms for game state polling
  
  // Feature flags
  USE_MOCK_API: import.meta.env.VITE_USE_MOCK_API === 'true',
  ENABLE_REQUEST_LOGGING: import.meta.env.VITE_ENABLE_API_LOGGING !== 'false',
  ENABLE_ERROR_REPORTING: true,
} as const;

export type ApiConfig = typeof API_CONFIG;

