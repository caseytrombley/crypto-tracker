// src/utils/api.js
import axios from 'axios';

// Rate limiting constants
const COINGECKO_RATE_LIMIT = 2000; // 2 seconds between requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds delay between retries

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : '/api', // Use proxy in both dev and prod
  timeout: 15000, // Increased timeout for slower networks
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-CoinGecko-Source': 'CryptoTracker',
  },
});

// Last request timestamp tracking
let lastRequestTime = 0;

// Request interceptor for rate limiting
api.interceptors.request.use(
  (config) => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < COINGECKO_RATE_LIMIT) {
      return new Promise((resolve) => {
        setTimeout(() => {
          lastRequestTime = Date.now();
          resolve(config);
        }, COINGECKO_RATE_LIMIT - timeSinceLastRequest);
      });
    }

    lastRequestTime = now;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    if (response?.status === 429) {
      if (!config.__retryCount) config.__retryCount = 0;

      if (config.__retryCount < MAX_RETRIES) {
        config.__retryCount++;
        console.warn(`Rate limit hit, retrying (${config.__retryCount}/${MAX_RETRIES}) after ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return api(config);
      }
    }

    const errorMessage = response
      ? `API Error ${response.status}: ${response.statusText}`
      : `Network Error: ${error.message}`;
    throw new Error(errorMessage);
  }
);

export default api;
