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

  // Upload Excel file — returns {jobId, message}
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

  // Poll upload-rates job status
  async getUploadRatesJobStatus(jobId) {
    try {
      const response = await apiClient.get(`/rates/upload/job/${jobId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get upload-rates job status: ${error.message}`);
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

  // Submit fill-rates job (returns jobId immediately)
  async fillRatesInFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post('/rates/fill-rates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data; // { jobId, message }
    } catch (error) {
      throw new Error(`Failed to submit fill-rates job: ${error.message}`);
    }
  }

  // Poll fill-rates job status
  async getFillRatesJobStatus(jobId) {
    try {
      const response = await apiClient.get(`/rates/fill-rates/job/${jobId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get fill-rates job status: ${error.message}`);
    }
  }

  // Download completed fill-rates result
  async downloadFillRatesResult(jobId) {
    try {
      const response = await apiClient.get(`/rates/fill-rates/download/${jobId}`, {
        responseType: 'blob',
        headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to download fill-rates result: ${error.message}`);
    }
  }

  // Download inventory template (inventory module)
  async downloadInventoryTemplate() {
    try {
      const response = await apiClient.get('/inventory/template', {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to download inventory template: ${error.message}`);
    }
  }

  // Upload inventory Excel file (inventory module)
  async uploadInventoryFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post('/inventory/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to upload inventory file: ${error.message}`);
    }
  }

  // List all inventory records
  async getInventory(search = '', page = 1, limit = 200) {
    try {
      const response = await apiClient.get('/inventory', { params: { search, page, limit } });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch inventory: ${error.message}`);
    }
  }

  // Search packings for the add-item combobox
  async searchInventoryPackings(search = '') {
    try {
      const response = await apiClient.get('/inventory/search-packings', { params: { search } });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to search packings: ${error.message}`);
    }
  }

  // ── Store CRUD ──────────────────────────────────────────────────────────────

  async getStores() {
    try {
      const response = await apiClient.get('/stores');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch stores: ${error.message}`);
    }
  }

  async createStore(name) {
    try {
      const response = await apiClient.post('/stores', { name });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create store: ${error.message}`);
    }
  }

  async updateStore(id, name) {
    try {
      const response = await apiClient.patch(`/stores/${id}`, { name });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update store: ${error.message}`);
    }
  }

  async deleteStore(id) {
    try {
      const response = await apiClient.delete(`/stores/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete store: ${error.message}`);
    }
  }

  async addInventoryItem(data) {
    try {
      const response = await apiClient.post('/inventory', data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to add inventory item: ${error.message}`);
    }
  }

  // Update an inventory record (qty / store / shelf / box)
  async updateInventoryItem(id, data) {
    try {
      const response = await apiClient.patch(`/inventory/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update inventory item: ${error.message}`);
    }
  }

  // Delete an inventory record
  async deleteInventoryItem(id) {
    try {
      const response = await apiClient.delete(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete inventory item: ${error.message}`);
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

  // Create sale rate for a packing
  async createSaleRate(packingId, { date, rate }) {
    try {
      const response = await apiClient.post(
        `/rates/packings/${packingId}/sale-rates`,
        { date, rate },
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create sale rate: ${error.message}`);
    }
  }

  // Update sale rate
  async updateSaleRate(saleRateId, { date, rate }) {
    try {
      const response = await apiClient.patch(
        `/rates/sale-rates/${saleRateId}`,
        { date, rate },
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update sale rate: ${error.message}`);
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

  // Get single quotation with items
  async getQuotationById(id) {
    try {
      const response = await apiClient.get(`/rates/quotation/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch quotation: ${error.message}`);
    }
  }

  async updateQuotationItemInventory(itemId, usedFromInventory, sourceNote) {
    try {
      await apiClient.patch(`/rates/quotation-item/${itemId}/inventory`, { usedFromInventory, sourceNote });
    } catch (error) {
      throw new Error(`Failed to update item inventory info: ${error.message}`);
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

  // Create delivery challan for a quotation
  async createDeliveryChallan(quotationId, challanData = {}) {
    try {
      const response = await apiClient.post(
        `/rates/quotation/${quotationId}/delivery-challan`,
        challanData,
        {
          responseType: 'blob',
          headers: {
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create delivery challan: ${error.message}`);
    }
  }

  // Get delivery challans for a quotation
  async getDeliveryChallansByQuotation(quotationId) {
    try {
      const response = await apiClient.get(
        `/rates/quotation/${quotationId}/delivery-challans`,
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch delivery challans: ${error.message}`);
    }
  }

  // Download delivery challan by ID
  async downloadDeliveryChallan(challanId) {
    try {
      const response = await apiClient.get(
        `/rates/delivery-challan/${challanId}/download`,
        {
          responseType: 'blob',
          headers: {
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to download delivery challan: ${error.message}`);
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

  // Generate Bill & DC Excel
  async generateBillAndDC(data) {
    try {
      const response = await apiClient.post('/rates/bill-and-dc', data, {
        responseType: 'blob',
        headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate Bill & DC: ${error.message}`);
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