import { apiClient } from '../config.js';

// API Service class to handle all API requests
class ApiService {
  // Get all rates
  async getRates() {
    try {
      const response = await apiClient.get('/rates');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch rates: ${error.message}`);
    }
  }

  // Download template
  async downloadTemplate() {
    try {
      const response = await apiClient.get('/rates/template', {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to download template: ${error.message}`);
    }
  }

  // Upload Excel file to backend for processing
  async uploadRatesFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post('/rates/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // Add single rate (if you have this endpoint)
  async addRate(rateData) {
    try {
      const response = await apiClient.post('/rates', rateData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to add rate: ${error.message}`);
    }
  }
}

export const apiService = new ApiService(); 