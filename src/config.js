import axios from 'axios';

// API Configuration
// Uses VITE_API_BASE_URL from .env file, falls back to localhost:3001
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to create full API URLs (for backward compatibility)
export const createApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
}; 