import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loading, LoadingOverlay } from './ui/loading';
import { useApi } from '../hooks/useApi';
import { apiService } from '../services/apiService';

export default function QuotationBuilder() {
  const { loading, error, clearError, getItemsForQuotation, getItemRate, getQuotations, createQuotation } = useApi();
  
  // State for item search and selection
  const [searchText, setSearchText] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // State for quotations list
  const [quotations, setQuotations] = useState([]);
  const [quotationsLoading, setQuotationsLoading] = useState(false);
  
  // State for customer and quotation info
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    company: '',
    email: '',
    phone: ''
  });
  
  const [quotationInfo, setQuotationInfo] = useState({
    quotationNumber: '',
    date: new Date().toLocaleDateString('en-GB')
  });
  
  const [collapsed, setCollapsed] = useState(false);

  // Fetch quotations on mount
  useEffect(() => {
    const fetchQuotations = async () => {
      setQuotationsLoading(true);
      try {
        const data = await getQuotations(1, 20);
        if (data && data.quotations) {
          setQuotations(data.quotations);
        }
      } catch (err) {
        console.error('Error fetching quotations:', err);
      } finally {
        setQuotationsLoading(false);
      }
    };
    fetchQuotations();
  }, [getQuotations]);

  // Debounced search function
  const handleSearch = useCallback((searchValue) => {
    setSearchText(searchValue);
    
    if (window.quotationSearchTimeout) {
      clearTimeout(window.quotationSearchTimeout);
    }
    
    window.quotationSearchTimeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await getItemsForQuotation(searchValue);
        if (data && data.items) {
          setItems(data.items);
        }
      } catch (err) {
        console.error('Error searching items:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  }, [getItemsForQuotation]);

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    handleSearch(value);
  };

  // Add item to quotation
  const addItemToQuotation = async (item) => {
    // Fetch the best rate for this item
    let calculatedPrice = '';
    try {
      const rateData = await getItemRate(
        item.itemName,
        item.itemType || '',
        item.company || '',
        item.packing || ''
      );
      
      if (rateData && rateData.rate > 0) {
        // Calculate price: greatest rate + 35%
        calculatedPrice = (rateData.rate * 1.35).toFixed(2);
      }
    } catch (err) {
      console.error('Error fetching rate for item:', err);
      // Continue with empty price if rate fetch fails
    }

    const itemWithQuantity = {
      ...item,
      quantity: 1,
      price: calculatedPrice // Set calculated price (rate + 35%)
    };
    setSelectedItems(prev => [...prev, itemWithQuantity]);
  };

  // Remove item from quotation
  const removeItemFromQuotation = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Update quantity for an item
  const updateItemQuantity = (itemId, quantity) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity: Math.max(1, parseInt(quantity) || 1) } : item
      )
    );
  };

  // Update price for an item
  const updateItemPrice = (itemId, price) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, price: price } : item
      )
    );
  };

  // Handle customer info change
  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  // Handle quotation info change
  const handleQuotationInfoChange = (field, value) => {
    setQuotationInfo(prev => ({ ...prev, [field]: value }));
  };

  // Create quotation
  const handleDownloadQuotation = async (quotationId) => {
    try {
      const blob = await apiService.downloadQuotation(quotationId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quotation-${quotationId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading quotation:', err);
      alert('Failed to download quotation: ' + err.message);
    }
  };

  const handleCreateQuotation = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item for the quotation');
      return;
    }

    try {
      const quotationData = {
        items: selectedItems,
        customerInfo,
        quotationInfo
      };

      const blob = await createQuotation(quotationData);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quotation-${quotationInfo.quotationNumber || 'new'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('Quotation created successfully!');
      
      // Refresh quotations list
      const data = await getQuotations(1, 20);
      if (data && data.quotations) {
        setQuotations(data.quotations);
      }
    } catch (err) {
      console.error('Error creating quotation:', err);
      alert('Failed to create quotation: ' + err.message);
    }
  };

  // Toggle card collapse
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Card className="card-flat">
      <div className="flex justify-between items-center p-6 pb-0">
        <h1 className="main-title">Quotation Builder</h1>
        <Button 
          onClick={toggleCollapse}
          className="button-secondary text-sm"
        >
          {collapsed ? '▼' : '▲'}
        </Button>
      </div>
      
      {!collapsed && (
        <CardContent>
          <div className="p-6">
            {/* Error Display */}
            {error && (
              <div className="error-message">
                <p>{error}</p>
                <Button onClick={clearError} className="button-secondary text-sm">
                  Dismiss
                </Button>
              </div>
            )}

            <div className="flex gap-6">
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Item Search and Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Search & Select Items</h3>
                
                {/* Search Input */}
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Search items by name, type, company, packing..."
                    value={searchText}
                    onChange={handleSearchInputChange}
                    className="w-full"
                    disabled={searchLoading}
                  />
                </div>

                {/* Search Results */}
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Available Items:</h4>
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <LoadingOverlay isLoading={searchLoading}>
                      {items.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          {searchText ? 'No items found' : 'Start typing to search items'}
                        </div>
                      ) : (
                        <div className="space-y-2 p-2">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                              <div className="flex-1">
                                <div className="font-medium">{item.itemName}</div>
                                <div className="text-sm text-gray-600">
                                  {item.itemType} • {item.company} • {item.packing}
                                </div>
                                {item.specifications && (
                                  <div className="text-xs text-gray-500">{item.specifications}</div>
                                )}
                              </div>
                              <Button
                                onClick={() => addItemToQuotation(item)}
                                className="button-primary text-sm"
                                disabled={selectedItems.some(selected => selected.id === item.id)}
                              >
                                {selectedItems.some(selected => selected.id === item.id) ? 'Added' : 'Add'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </LoadingOverlay>
                  </div>
                </div>

                {/* Selected Items */}
                <div>
                  <h4 className="font-medium mb-2">Selected Items ({selectedItems.length}):</h4>
                  {selectedItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 border rounded-lg">
                      No items selected
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedItems.map((item) => (
                        <div key={item.id} className="p-2 border rounded bg-blue-50">
                          <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium">{item.itemName}</div>
                            <div className="text-sm text-gray-600">
                              {item.itemType} • {item.company} • {item.packing}
                            </div>
                          </div>
                            <Button
                              onClick={() => removeItemFromQuotation(item.id)}
                              className="button-danger text-sm"
                            >
                              Remove
                            </Button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1">
                              <label className="block text-xs font-medium mb-1 text-gray-700">Quantity:</label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.id, e.target.value)}
                                className="w-full"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs font-medium mb-1 text-gray-700">Price:</label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => updateItemPrice(item.id, e.target.value)}
                                placeholder="0.00"
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Customer & Quotation Info */}
              <div style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: '1rem' }}>
                <h3 className="text-lg font-semibold mb-4">Quotation Details</h3>
                
                {/* Customer Information */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Customer Information:</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name:</label>
                      <Input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                        placeholder="Customer name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Company:</label>
                      <Input
                        type="text"
                        value={customerInfo.company}
                        onChange={(e) => handleCustomerInfoChange('company', e.target.value)}
                        placeholder="Company name"
                      />
                    </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Email:</label>
                      <Input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                        placeholder="customer@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone:</label>
                      <Input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                        placeholder="Phone number"
                      />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quotation Information */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Quotation Information:</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Quotation Number:</label>
                      <Input
                        type="text"
                        value={quotationInfo.quotationNumber}
                        onChange={(e) => handleQuotationInfoChange('quotationNumber', e.target.value)}
                        placeholder="Q-2025-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date:</label>
                      <Input
                        type="text"
                        value={quotationInfo.date}
                        onChange={(e) => handleQuotationInfoChange('date', e.target.value)}
                        placeholder="DD-MM-YYYY"
                      />
                    </div>
                  </div>
                </div>

                {/* Create Quotation Button */}
                <div className="mt-6">
                  <Button
                    onClick={handleCreateQuotation}
                    disabled={loading || selectedItems.length === 0}
                    className="button-primary w-full"
                  >
                    {loading && <Loading size="sm" text="" />}
                    Create Quotation ({selectedItems.length} items)
                  </Button>
                </div>
              </div>
              </div>

              {/* Right Side - Quotations List */}
              <div className="w-80 flex-shrink-0" style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: '1rem' }}>
                <h3 className="text-lg font-semibold mb-4">Recent Quotations</h3>
                {quotationsLoading ? (
                  <div className="text-center py-4">
                    <Loading size="sm" text="Loading..." />
                  </div>
                ) : quotations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 border rounded-lg">
                    No quotations found
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {quotations.map((quotation) => (
                      <div
                        key={quotation.id}
                        className="p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {quotation.quotationNumber || `#${quotation.id}`}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {quotation.customerName && (
                                <div>Customer: {quotation.customerName}</div>
                              )}
                              {quotation.customerCompany && (
                                <div>Company: {quotation.customerCompany}</div>
                              )}
                              <div>Items: {quotation.itemsCount}</div>
                              {quotation.totalAmount > 0 && (
                                <div>Total: {quotation.totalAmount.toFixed(2)}</div>
                              )}
                              {quotation.date && (
                                <div>Date: {quotation.date}</div>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-2">
                              Created: {new Date(quotation.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadQuotation(quotation.id);
                            }}
                            className="ml-2 text-xs px-2 py-1"
                            size="sm"
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

