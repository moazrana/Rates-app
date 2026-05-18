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

  const getFillRatesJobStatus = useCallback(async (jobId) => {
    try {
      return await apiService.getFillRatesJobStatus(jobId);
    } catch (err) {
      console.error('Error fetching fill-rates job status:', err);
      throw err;
    }
  }, []);

  const getUploadRatesJobStatus = useCallback(async (jobId) => {
    try {
      return await apiService.getUploadRatesJobStatus(jobId);
    } catch (err) {
      console.error('Error fetching upload-rates job status:', err);
      throw err;
    }
  }, []);

  const downloadFillRatesResult = useCallback(async (jobId) => {
    return callApi(apiService.downloadFillRatesResult, jobId);
  }, [callApi]);

  const downloadInventoryTemplate = useCallback(async () => {
    return callApi(apiService.downloadInventoryTemplate);
  }, [callApi]);

  const uploadInventoryFile = useCallback(async (file) => {
    return callApi(apiService.uploadInventoryFile, file);
  }, [callApi]);

  const getInventory = useCallback(async (search = '', page = 1, limit = 200) => {
    return callApi(apiService.getInventory, search, page, limit);
  }, [callApi]);

  const searchInventoryPackings = useCallback(async (search = '') => {
    try {
      return await apiService.searchInventoryPackings(search);
    } catch (err) {
      console.error('Error searching packings:', err);
      return [];
    }
  }, []);

  const getStores = useCallback(async () => {
    try {
      return await apiService.getStores();
    } catch (err) {
      console.error('Error fetching stores:', err);
      return [];
    }
  }, []);

  const createStore = useCallback(async (name) => {
    return callApi(apiService.createStore.bind(apiService), name);
  }, [callApi]);

  const updateStore = useCallback(async (id, name) => {
    return callApi(apiService.updateStore.bind(apiService), id, name);
  }, [callApi]);

  const deleteStore = useCallback(async (id) => {
    return callApi(apiService.deleteStore.bind(apiService), id);
  }, [callApi]);

  const addInventoryItem = useCallback(async (data) => {
    return callApi(apiService.addInventoryItem, data);
  }, [callApi]);

  const updateInventoryItem = useCallback(async (id, data) => {
    return callApi(apiService.updateInventoryItem, id, data);
  }, [callApi]);

  const deleteInventoryItem = useCallback(async (id) => {
    return callApi(apiService.deleteInventoryItem, id);
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

  const createSaleRate = useCallback(async (packingId, { date, rate }) => {
    return callApi(apiService.createSaleRate, packingId, { date, rate });
  }, [callApi]);

  const updateSaleRate = useCallback(async (saleRateId, { date, rate }) => {
    return callApi(apiService.updateSaleRate, saleRateId, { date, rate });
  }, [callApi]);

  const getQuotationById = useCallback(async (id) => {
    return callApi(apiService.getQuotationById, id);
  }, [callApi]);

  const getQuotations = useCallback(async (page = 1, limit = 20) => {
    return callApi(apiService.getQuotations, page, limit);
  }, [callApi]);

  const createQuotation = useCallback(async (quotationData) => {
    return callApi(apiService.createQuotation, quotationData);
  }, [callApi]);

  const createDeliveryChallan = useCallback(async (quotationId, challanData = {}) => {
    return callApi(apiService.createDeliveryChallan, quotationId, challanData);
  }, [callApi]);

  const getDeliveryChallansByQuotation = useCallback(async (quotationId) => {
    return callApi(apiService.getDeliveryChallansByQuotation, quotationId);
  }, [callApi]);

  const uploadInvoice = useCallback(async (file, description) => {
    return callApi(apiService.uploadInvoice, file, description);
  }, [callApi]);

  const downloadFbrInvoiceTemplate = useCallback(async () => {
    return callApi(apiService.downloadFbrInvoiceTemplate);
  }, [callApi]);

  const generateBillAndDC = useCallback(async (data) => {
    return callApi(apiService.generateBillAndDC, data);
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
    downloadInventoryTemplate,
    uploadInventoryFile,
    getInventory,
    searchInventoryPackings,
    getStores,
    createStore,
    updateStore,
    deleteStore,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getItemsForQuotation,
    getItemRate,
    getItemDetails,
    getRaters,
    getTypes,
    updateItem,
    updateItemRate,
    createSaleRate,
    updateSaleRate,
    getQuotationById,
    getQuotations,
    createQuotation,
    createDeliveryChallan,
    getDeliveryChallansByQuotation,
    uploadInvoice,
    downloadFbrInvoiceTemplate,
    getFbrInvoiceJobStatus,
    generateBillAndDC,
    getFillRatesJobStatus,
    downloadFillRatesResult,
    getUploadRatesJobStatus,
  };
}; 