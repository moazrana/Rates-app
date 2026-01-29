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
  const getRates = useCallback(async (search = '') => {
    return callApi(apiService.getRates, search);
  }, [callApi]);

  const downloadTemplate = useCallback(async () => {
    return callApi(apiService.downloadTemplate);
  }, [callApi]);

  const downloadFillRatesTemplate = useCallback(async () => {
    return callApi(apiService.downloadFillRatesTemplate);
  }, [callApi]);

  const uploadRatesFile = useCallback(async (file) => {
    return callApi(apiService.uploadRatesFile, file);
  }, [callApi]);

  const addRate = useCallback(async (rateData) => {
    return callApi(apiService.addRate, rateData);
  }, [callApi]);

  const fillRatesInFile = useCallback(async (file) => {
    return callApi(apiService.fillRatesInFile, file);
  }, [callApi]);

  const getItemsForQuotation = useCallback(async (search = '', page = 1, limit = 50) => {
    return callApi(apiService.getItemsForQuotation, search, page, limit);
  }, [callApi]);

  const getItemRate = useCallback(async (itemName, itemType = '', company = '', packing = '') => {
    // Don't use callApi wrapper to avoid setting loading state for background rate fetches
    try {
      return await apiService.getItemRate(itemName, itemType, company, packing);
    } catch (err) {
      console.error('Error fetching item rate:', err);
      return { rate: 0 }; // Return default rate on error
    }
  }, []);

  const getItemDetails = useCallback(async (itemId) => {
    return callApi(apiService.getItemDetails, itemId);
  }, [callApi]);

  const getRaters = useCallback(async () => {
    return callApi(apiService.getRaters);
  }, [callApi]);

  const getTypes = useCallback(async () => {
    return callApi(apiService.getTypes);
  }, [callApi]);

  const updateItem = useCallback(async (itemId, payload) => {
    return callApi(apiService.updateItem, itemId, payload);
  }, [callApi]);

  const updateItemRate = useCallback(async (rateId, payload) => {
    return callApi(apiService.updateItemRate, rateId, payload);
  }, [callApi]);

  const getQuotations = useCallback(async (page = 1, limit = 20) => {
    return callApi(apiService.getQuotations, page, limit);
  }, [callApi]);

  const createQuotation = useCallback(async (quotationData) => {
    return callApi(apiService.createQuotation, quotationData);
  }, [callApi]);

  const uploadInvoice = useCallback(async (file, description) => {
    return callApi(apiService.uploadInvoice, file, description);
  }, [callApi]);

  const downloadFbrInvoiceTemplate = useCallback(async () => {
    return callApi(apiService.downloadFbrInvoiceTemplate);
  }, [callApi]);

  const getFbrInvoiceJobStatus = useCallback(async (jobId) => {
    // Don't use callApi wrapper to avoid setting loading state for polling
    try {
      return await apiService.getFbrInvoiceJobStatus(jobId);
    } catch (err) {
      console.error('Error fetching job status:', err);
      throw err;
    }
  }, []);

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
    downloadFillRatesTemplate,
    uploadRatesFile,
    addRate,
    fillRatesInFile,
    getItemsForQuotation,
    getItemRate,
    getItemDetails,
    getRaters,
    getTypes,
    updateItem,
    updateItemRate,
    getQuotations,
    createQuotation,
    uploadInvoice,
    downloadFbrInvoiceTemplate,
    getFbrInvoiceJobStatus,
  };
}; 