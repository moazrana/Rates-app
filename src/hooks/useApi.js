import { useState, useCallback } from 'react';
import { apiService } from '../services/apiService';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generic API call wrapper
  const callApi = useCallback(async (apiFunction, ...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction(...args);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Specific API functions
  const getRates = useCallback(async () => {
    return callApi(apiService.getRates);
  }, [callApi]);

  const downloadTemplate = useCallback(async () => {
    return callApi(apiService.downloadTemplate);
  }, [callApi]);

  const uploadRatesFile = useCallback(async (file) => {
    return callApi(apiService.uploadRatesFile, file);
  }, [callApi]);

  const addRate = useCallback(async (rateData) => {
    return callApi(apiService.addRate, rateData);
  }, [callApi]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    clearError,
    getRates,
    downloadTemplate,
    uploadRatesFile,
    addRate,
  };
}; 