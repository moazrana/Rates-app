import { apiClient } from '../config.js';

// API Service class to handle all API requests
class ApiService {
  // Get all rates
  async getRates(search = '') {
    try {
      const response = await apiClient.get('/rates', {
        params: { search }
      });
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

  // Download fill rates template
  async downloadFillRatesTemplate() {
    try {
      const response = await apiClient.get('/rates/fill-rates-template', {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to download fill rates template: ${error.message}`);
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

  // Fill rates in Excel file
  async fillRatesInFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post('/rates/fill-rates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fill rates in file: ${error.message}`);
    }
  }

  // Get items for quotation
  async getItemsForQuotation(search = '', page = 1, limit = 50) {
    try {
      const response = await apiClient.get('/rates/items', {
        params: { search, page, limit }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch items for quotation: ${error.message}`);
    }
  }

  // Get best rate for an item
  async getItemRate(itemName, itemType = '', company = '', packing = '') {
    try {
      const response = await apiClient.get('/rates/item-rate', {
        params: { itemName, itemType, company, packing }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch item rate: ${error.message}`);
    }
  }

  // Get full details for a specific item (packings + rate history)
  async getItemDetails(itemId) {
    try {
      const response = await apiClient.get(`/rates/item/${itemId}/details`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch item details: ${error.message}`);
    }
  }

  // Update rate details for a specific rate record
  async updateItemRate(
    rateId,
    { rate, packing, specifications, date, rateBy, company },
  ) {
    try {
      const response = await apiClient.post(`/rates/rate/${rateId}`, {
        rate,
        packing,
        specifications,
        date,
        rateBy,
        company,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update rate: ${error.message}`);
    }
  }

  // Get all raters
  async getRaters() {
    try {
      const response = await apiClient.get('/rates/raters');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch raters: ${error.message}`);
    }
  }

  // Get all item types
  async getTypes() {
    try {
      const response = await apiClient.get('/rates/types');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch types: ${error.message}`);
    }
  }

  // Update item (name, type, banned flag)
  async updateItem(itemId, { name, typeName, banned }) {
    try {
      const response = await apiClient.post(`/rates/item/${itemId}`, {
        name,
        typeName,
        banned,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update item: ${error.message}`);
    }
  }

  // Get all quotations
  async getQuotations(page = 1, limit = 20) {
    try {
      const response = await apiClient.get('/rates/quotations', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch quotations: ${error.message}`);
    }
  }

  // Download quotation by ID
  async downloadQuotation(quotationId) {
    try {
      const response = await apiClient.get(`/rates/quotation/${quotationId}/download`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to download quotation: ${error.message}`);
    }
  }

  // Create quotation
  async createQuotation(quotationData) {
    try {
      const response = await apiClient.post('/rates/quotation', quotationData, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create quotation: ${error.message}`);
    }
  }

  // Upload invoice file to FBR endpoint
  async uploadInvoice(file, description) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (description) {
        formData.append('description', description);
      }

      const response = await apiClient.post('/fbr/invoice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to upload invoice: ${error.message}`);
    }
  }

  // Download FBR invoice template
  async downloadFbrInvoiceTemplate() {
    try {
      const response = await apiClient.get('/fbr/invoice-template', {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to download FBR invoice template: ${error.message}`);
    }
  }

  // Get FBR invoice job status
  async getFbrInvoiceJobStatus(jobId) {
    try {
      const response = await apiClient.get(`/fbr/invoice-job/${jobId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get job status: ${error.message}`);
    }
  }
}

export const apiService = new ApiService(); 