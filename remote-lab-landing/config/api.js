// API Configuration
const config = {
  // Development URLs
  development: {
    apiBaseUrl: 'http://localhost:8000',
    frontendUrl: 'http://localhost:8080'
  },
  
  // Production URLs
  production: {
    apiBaseUrl: 'http://103.218.122.188:8000',
    frontendUrl: 'http://103.218.122.188:8080'
  }
}

// Get current environment
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev'

// Export current config based on environment
export const apiConfig = isDevelopment ? config.development : config.production

// Export individual values for convenience
export const API_BASE_URL = apiConfig.apiBaseUrl
export const FRONTEND_URL = apiConfig.frontendUrl

export default apiConfig
