import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RateTrackerTable from "./components/ui/table";
import { Label } from "@/components/ui/label";
import Select from './components/ui/select';
import { Loading, LoadingOverlay } from "@/components/ui/loading";
import QuotationBuilder from "./components/QuotationBuilder";
import { useApi } from './hooks/useApi';
import RateDetailsModal from "./components/ui/RateDetailsModal";
import './formStyle.css';
import './App.css';
export default function RateTracker() {
  const {
    loading,
    error,
    clearError,
    getRates,
    downloadTemplate,
    downloadFillRatesTemplate,
    uploadRatesFile,
    addRate,
    fillRatesInFile,
    uploadInvoice,
    downloadFbrInvoiceTemplate,
    getFbrInvoiceJobStatus,
    getItemDetails,
    getRaters,
    getTypes,
    updateItem,
    updateItemRate,
  } = useApi();
  const [items, setItems] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef(null);
  const [collapsedCards, setCollapsedCards] = useState({
    addRate: false,
    uploadFile: false,
    fillRates: false,
    invoiceUpload: false,
    dataTable: false,
  });
  const [form, setForm] = useState({
    type: "",
    name: "",
    company: "",
    packing: "",
    specification: "",
    rate: "",
    date: "",
    rateBy: "",
  });
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoiceFileKey, setInvoiceFileKey] = useState(0);
  const [selectedRow, setSelectedRow] = useState(null);
  const [itemDetails, setItemDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [editingRateId, setEditingRateId] = useState(null);
  const [editRateData, setEditRateData] = useState({
    rate: "",
    packing: "",
    specifications: "",
  });
  const [savingRate, setSavingRate] = useState(false);
  const [raters, setRaters] = useState([]);
  const [types, setTypes] = useState([]);
  const [editingItem, setEditingItem] = useState(false);
  const [editItemData, setEditItemData] = useState({
    name: "",
    typeName: "",
    newTypeName: "",
    useNewType: false,
    banned: false,
  });

  // Load reference data for modal (raters, types)
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const ratersData = await getRaters();
        if (Array.isArray(ratersData)) {
          setRaters(ratersData);
        }

        const typesData = await getTypes();
        if (Array.isArray(typesData)) {
          setTypes(typesData);
        }
      } catch (error) {
        console.error("Error fetching reference data:", error);
      }
    };

    fetchReferenceData();
  }, [getRaters, getTypes]);

  // Normalize backend rows to flat table-friendly shape
  const toRow = (row, index) => ({
    id: row.id || Date.now() + index,
    itemId: row.item?.id || row.itemId || null,
    name: row.item?.name || row.name || "",
    company: row.packing?.company || row.company || "",
    packing: row.packing?.packing || row.packing || "",
    specification: row.packing?.specifications || row.specification || "",
    rate: row.rate ?? "",
    date: row.date ? new Date(row.date).toLocaleDateString() : "",
    rateBy: row.rater?.name || row.rateBy || "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleCard = (cardName) => {
    setCollapsedCards(prev => ({
      ...prev,
      [cardName]: !prev[cardName]
    }));
  };

  // Debounced search function
  const handleSearch = async (searchValue) => {
    setSearchText(searchValue);
    
    // Clear existing timeout
    // if (window.searchTimeout) {
    //   clearTimeout(window.searchTimeout);
    //   const searchInp = document.getElementById('search-inp');
    //   if (searchInp) {
    //     searchInp.focus();
    //   }
    // }
    try {
      const data = await getRates(searchValue);
      if (data && data.items) {
        setItems(data.items.map(toRow));
      }
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setSearchLoading(false);
    }
    // Set new timeout for debounced search
    // window.searchTimeout = setTimeout(async () => {
    //   setSearchLoading(true);
    //   try {
    //     const data = await getRates(searchValue);
    //     if (data && data.items) {
    //       setItems(data.items.map(toRow));
    //     }
    //   } catch (err) {
    //     console.error('Error searching:', err);
    //   } finally {
    //     setSearchLoading(false);
    //   }
    // }, 500); // 500ms delay
  };

  // Handle search input focus preservation
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    handleSearch(value);
  };

  // Maintain focus on search input after state updates
  useEffect(() => {
    if (searchInputRef.current && document.activeElement === searchInputRef.current) {
      // Input was focused before the update, maintain focus
      const cursorPosition = searchInputRef.current.selectionStart;
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
      }, 0);
    }
  }, [items, searchLoading]);

  const addItem = async () => {
    try {
      // Prepare data for API call
      const rateData = {
        type: form.type,
        name: form.name,
        company: form.company,
        packing: form.packing,
        specifications: form.specification,
        rate: parseFloat(form.rate) || 0,
        date: form.date,
        rater: form.rateBy
      };

      // Save to database
      await addRate(rateData);
      
      // Show success message
      setSuccessMessage('Rate saved successfully to database!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Add to local state for immediate display
      setItems([...items, { ...form, id: Date.now() }]);
      
      // Clear form
      setForm({ type: "", name: "", company: "", packing: "", specification: "", rate: "", date: "", rateBy: "" });
      setSelectedTypeValue('');
      setSelectedRateByValue('');
      
      // Reload data from database to ensure consistency
      const dbData = await getRates();
      if (dbData && dbData.items) {
        setItems(dbData.items.map(toRow));
      }
    } catch (error) {
      console.error('Error adding rate:', error);
      // Still add to local state even if API fails
      setItems([...items, { ...form, id: Date.now() }]);
      setForm({ type: "", name: "", company: "", packing: "", specification: "", rate: "", date: "", rateBy: "" });
      setSelectedTypeValue('');
      setSelectedRateByValue('');
    }
  };

  const [selectedRateByValue, setSelectedRateByValue] = useState('');

  const rateByOptions = [
    { value: 'Shakeel Sab', label: 'Shakeel Sab' },
    { value: 'Rafaqat Sab', label: 'Rafaqat Sab' },
    { value: 'Lahore Sceitific Store', label: 'Lahore Sceitific Store' },
  ];

  const [selectedTypeValue, setSelectedTypeValue] = useState('');

  const typeOptions = [
    { value: 'Chemical', label: 'Chemical' },
    { value: 'Glassware', label: 'Glassware' },
  ];

  const handleTypeChange = (event) => {
    setSelectedTypeValue(event.target.value);
    setForm({ ...form, type: event.target.value });
  };

  const handleRateByChange = (event) => {
    setSelectedRateByValue(event.target.value);
    setForm({ ...form, rateBy: event.target.value });
  };

  // Load data automatically on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setInitialLoad(true);
        const data = await getRates();
        if (data && data.items) {
          setItems(data.items.map(toRow));
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        // Don't show error for initial load, just log it
      } finally {
        setInitialLoad(false);
      }
    };

    loadInitialData();
  }, [getRates]);

  // Function to handle Excel upload (send to backend)
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      await uploadRatesFile(file);
      // Reload data from database to ensure consistency
      const dbData = await getRates();
      if (dbData && dbData.items) {
        setItems(dbData.items.map(toRow));
      }
      setSuccessMessage('File uploaded and processed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error uploading file:', err);
    }
  };

  // Function to handle Excel file filling with rates
  const handleFillRates = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const filledFile = await fillRatesInFile(file);
      
      // Create download link for the filled file
      const url = window.URL.createObjectURL(new Blob([filledFile]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'filled-rates.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccessMessage('File filled with rates and downloaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error filling rates:', err);
    }
  };

  const handleInvoiceDescriptionChange = (event) => {
    setInvoiceDescription(event.target.value);
  };

  const handleInvoiceFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    setInvoiceFile(file || null);
  };
  const [invoiceStatuses, setInvoiceStatuses] = useState([]);
  const [validationResponse, setValidationResponse] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [retryTimer, setRetryTimer] = useState(null);
  const [fbrResponse, setFbrResponse] = useState(null);
  const jobPollIntervalRef = useRef(null);

  // Poll job status
  useEffect(() => {
    if (!jobStatus?.jobId) return;

    const pollJobStatus = async () => {
      try {
        const status = await getFbrInvoiceJobStatus(jobStatus.jobId);
        setJobStatus(status);

        // Update retry timer if job is delayed or failed
        if (status.retryDelay) {
          setRetryTimer(status.retryDelay);
        }

        // If job is completed, get the FBR response
        if (status.status === 'completed' && status.returnvalue) {
          setFbrResponse(status.returnvalue.fbrResponse);
          setInvoiceStatuses(
            status.returnvalue.fbrResponse?.data?.validationResponse?.invoiceStatuses || []
          );
          setValidationResponse(
            status.returnvalue.fbrResponse?.data?.validationResponse || null
          );
          // Stop polling
          if (jobPollIntervalRef.current) {
            clearInterval(jobPollIntervalRef.current);
            jobPollIntervalRef.current = null;
          }
        } else if (status.status === 'failed') {
          // Stop polling on failure
          if (jobPollIntervalRef.current) {
            clearInterval(jobPollIntervalRef.current);
            jobPollIntervalRef.current = null;
          }
        }
      } catch (err) {
        console.error('Error polling job status:', err);
      }
    };

    // Poll every 2 seconds
    jobPollIntervalRef.current = setInterval(pollJobStatus, 2000);
    pollJobStatus(); // Initial poll

    return () => {
      if (jobPollIntervalRef.current) {
        clearInterval(jobPollIntervalRef.current);
      }
    };
  }, [jobStatus?.jobId, getFbrInvoiceJobStatus]);

  // Countdown timer for retry
  useEffect(() => {
    if (!retryTimer || retryTimer <= 0) return;

    const timer = setInterval(() => {
      setRetryTimer((prev) => {
        if (prev <= 1000) {
          return null;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [retryTimer]);

  const formatTime = (ms) => {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const handleInvoiceUpload = async () => {
    if (!invoiceFile) {
      alert('Please select an invoice file to upload.');
      return;
    }

    try {
      // Reset previous job status
      setJobStatus(null);
      setRetryTimer(null);
      setFbrResponse(null);
      setInvoiceStatuses([]);
      setValidationResponse(null);

      const response = await uploadInvoice(invoiceFile, invoiceDescription);
      
      if (response.jobId) {
        setJobStatus({
          jobId: response.jobId,
          status: 'queued',
          attemptsMade: 0,
          maxAttempts: 3,
        });
        setSuccessMessage('Invoice uploaded successfully! FBR submission queued.');
      } else {
        setSuccessMessage('Invoice uploaded successfully!');
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
      setInvoiceDescription('');
      setInvoiceFile(null);
      setInvoiceFileKey((prev) => prev + 1);
    } catch (err) {
      console.error('Error uploading invoice:', err);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadTemplate();
      console.log('Blob size:', blob.size);
      console.log('Blob type:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rate_tracker_template.xlsx';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert(`Failed to download template: ${error.message}`);
    }
  };

  const handleDownloadFillRatesTemplate = async () => {
    try {
      const blob = await downloadFillRatesTemplate();
      console.log('Fill rates template blob size:', blob.size);
      console.log('Fill rates template blob type:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fill-rates-template.xlsx';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      setSuccessMessage('Fill Rates Template downloaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error downloading fill rates template:', error);
      alert(`Failed to download fill rates template: ${error.message}`);
    }
  };

  const handleDownloadFbrInvoiceTemplate = async () => {
    try {
      const blob = await downloadFbrInvoiceTemplate();
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fbr-invoice-template.xlsx';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      setSuccessMessage('FBR Invoice Template downloaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error downloading FBR invoice template:', error);
      alert(`Failed to download FBR invoice template: ${error.message}`);
    }
  };

  // Row click from table -> open modal and load details
  const handleRowClick = async (row) => {
    setSelectedRow(row);
    setItemDetails(null);
    setDetailsError("");
    setEditingRateId(null);

    if (!row.itemId) {
      return;
    }

    try {
      setDetailsLoading(true);
      const details = await getItemDetails(row.itemId);
      setItemDetails(details);
    } catch (error) {
      console.error("Error fetching item details:", error);
      setDetailsError(error.message || "Failed to load item details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedRow(null);
    setItemDetails(null);
    setDetailsError("");
    setEditingRateId(null);
    setEditingItem(false);
    setEditRateData({
      rate: "",
      packing: "",
      specifications: "",
      date: "",
      company: "",
      rateBy: "",
    });
    setEditItemData({
      name: "",
      typeName: "",
      newTypeName: "",
      useNewType: false,
    });
  };

  const startEditItem = () => {
    if (!itemDetails?.item) return;
    setEditingItem(true);
    setEditItemData({
      name: itemDetails.item.name || "",
      typeName: itemDetails.item.type?.name || "",
      newTypeName: "",
      useNewType: false,
      banned: !!itemDetails.item.banned,
    });
  };

  const handleItemEditChange = (field, value) => {
    setEditItemData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveItemChanges = async () => {
    if (!itemDetails?.item?.id) return;

    try {
      const payload = {
        name: editItemData.name,
        typeName: editItemData.useNewType
          ? editItemData.newTypeName
          : editItemData.typeName,
        banned: editItemData.banned,
      };

      const updatedItem = await updateItem(itemDetails.item.id, payload);

      setItemDetails((prev) =>
        prev
          ? {
              ...prev,
              item: updatedItem,
            }
          : prev,
      );

      setEditingItem(false);
      setEditItemData({
        name: "",
        typeName: "",
        newTypeName: "",
        useNewType: false,
        banned: false,
      });
    } catch (error) {
      console.error("Error updating item:", error);
      setDetailsError(error.message || "Failed to update item");
    }
  };

  const startEditRate = (rate) => {
    setEditingRateId(rate.id);
    setEditRateData({
      rate: rate.rate ?? "",
      packing: rate.packing?.packing ?? "",
      specifications: rate.packing?.specifications ?? "",
      date: rate.date
        ? new Date(rate.date).toISOString().split("T")[0]
        : "",
      company: rate.packing?.company ?? "",
      rateBy: rate.rater?.name ?? "",
    });
  };

  const handleRateChange = (field, value) => {
    setEditRateData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveRateChanges = async () => {
    if (!editingRateId) return;

    try {
      setSavingRate(true);
      const updated = await updateItemRate(editingRateId, {
        rate: editRateData.rate,
        packing: editRateData.packing,
        specifications: editRateData.specifications,
        date: editRateData.date,
        rateBy: editRateData.rateBy,
        company: editRateData.company,
      });

      setItemDetails((prev) => {
        if (!prev) return prev;

        const updatedRates = prev.rates.map((r) =>
          r.id === updated.id ? { ...r, ...updated } : r,
        );

        let updatedPackings = prev.packings;
        if (updated.packing) {
          const idx = updatedPackings.findIndex(
            (p) => p.id === updated.packing.id,
          );
          if (idx !== -1) {
            const copy = [...updatedPackings];
            copy[idx] = { ...copy[idx], ...updated.packing };
            updatedPackings = copy;
          }
        }

        return {
          ...prev,
          rates: updatedRates,
          packings: updatedPackings,
        };
      });

      setEditingRateId(null);
      setEditRateData({
        rate: "",
        packing: "",
        specifications: "",
        date: "",
        company: "",
        rateBy: "",
      });
    } catch (error) {
      console.error("Error saving rate changes:", error);
      setDetailsError(error.message || "Failed to save changes");
    } finally {
      setSavingRate(false);
    }
  };

  return (
    <div className="app-container">
      {/* Quotation Builder */}
      <QuotationBuilder />

      <div className="card-row">
        <div className="card-row-item card-row-item-wide">
          <Card className="card-gradient">
            <div className="flex justify-between items-center">
              <h2 className="form-title">Add Item Rate</h2>
              <Button 
                onClick={() => toggleCard('addRate')}
                className="button-secondary text-sm"
              >
                {collapsedCards.addRate ? '▼' : '▲'}
              </Button>
            </div>
            {!collapsedCards.addRate && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Item Type</Label>
                    <Select
                      options={typeOptions}
                      value={selectedTypeValue}
                      onChange={handleTypeChange}
                      placeholder="Select Type"
                    />
                  </div>
                  <div>
                    <Label>Item Name</Label>
                    <Input name="name" value={form.name} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Company</Label>
                    <Input name="company" value={form.company} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Packing</Label>
                    <Input name="packing" value={form.packing} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Specification</Label>
                    <Input name="specification" value={form.specification} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Rate</Label>
                    <Input name="rate" type="number" value={form.rate} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input name="date" type="date" value={form.date} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Rate By</Label>
                    <Select
                      options={rateByOptions}
                      value={selectedRateByValue}
                      onChange={handleRateByChange}
                      placeholder="Select an option"
                    />
                  </div>
                </div>
                <Button className="mt-4" onClick={addItem}>Add Rate</Button>
              </>
            )}
          </Card>
        </div>

        <div className="card-row-item">
          <Card className="card-elevated">
            <div className="flex justify-between items-center">
              <h2 className="form-title">Upload Excel File</h2>
              <Button 
                onClick={() => toggleCard('uploadFile')}
                className="button-secondary text-sm"
              >
                {collapsedCards.uploadFile ? '▼' : '▲'}
              </Button>
            </div>
            {!collapsedCards.uploadFile && (
              <Input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
            )}
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            
          </Card>

          <Card className="card-elevated" style={{ marginTop: "1.5rem" }}>
            <div className="flex justify-between items-center">
              <h2 className="form-title">Fill Rates in Excel File</h2>
              <Button 
                onClick={() => toggleCard('fillRates')}
                className="button-secondary text-sm"
              >
                {collapsedCards.fillRates ? '▼' : '▲'}
              </Button>
            </div>
            {!collapsedCards.fillRates && (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Upload an Excel file with items to automatically fill in the latest rates from the database.
                </p>
                <Input type="file" accept=".xlsx, .xls" onChange={handleFillRates} />
              </>
            )}
          </Card>
        </div>
      </div>

      <Card className="card-elevated">
        <div className="flex justify-between items-center">
          <h2 className="form-title">Upload Invoice</h2>
          <Button 
            onClick={() => toggleCard('invoiceUpload')}
            className="button-secondary text-sm"
          >
            {collapsedCards.invoiceUpload ? '▼' : '▲'}
          </Button>
        </div>
        {!collapsedCards.invoiceUpload && (
          <>
            <div className="grid gap-4 mt-4">
              <div>
                <Label>Description (optional)</Label>
                <Input
                  name="invoiceDescription"
                  value={invoiceDescription}
                  onChange={handleInvoiceDescriptionChange}
                  placeholder="Enter invoice description"
                />
              </div>
              <div>
                <Label>Invoice File</Label>
                <Input
                  key={invoiceFileKey}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                  onChange={handleInvoiceFileChange}
                />
              </div>
            </div>
            <Button className="mt-4" onClick={handleInvoiceUpload} disabled={loading}>
              {loading && <Loading size="sm" text="" />}
              Upload Invoice
            </Button>

            {/* Job Status Display */}
            {jobStatus && (
              <div className="mt-6 space-y-4">
                <Card className="card-flat mt-4">
                  <div className="text-left">
                    <Label className="invoice-heading">FBR Submission Status</Label>
                    <div className="mt-2">
                      <div className="invoice-status-text">
                        Status: <span style={{ textTransform: 'capitalize' }}>{jobStatus.status}</span>
                      </div>
                      {jobStatus.attemptsMade > 0 && (
                        <div className="invoice-error-text">
                          Job Attempt: {jobStatus.attemptsMade} / {jobStatus.maxAttempts}
                        </div>
                      )}
                      {jobStatus.retryCurrent !== undefined && jobStatus.retryMax !== undefined && jobStatus.retryCurrent > 0 && (
                        <div className="invoice-error-text" style={{ color: '#3b82f6' }}>
                          🔄 Submission Retries: {jobStatus.retryCurrent} / {jobStatus.retryMax}
                        </div>
                      )}
                      {retryTimer && retryTimer > 0 && (
                        <div className="invoice-error-text" style={{ color: '#f59e0b' }}>
                          ⏱️ Retrying in: {formatTime(retryTimer)}
                        </div>
                      )}
                      {jobStatus.failedReason && (
                        <div className="invoice-error-text" style={{ color: '#ef4444' }}>
                          Error: {jobStatus.failedReason}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* FBR Response Display */}
            {fbrResponse && (
              <div className="mt-6 space-y-4">
                <Card className="card-flat mt-4">
                  <div className="text-left">
                    <Label className="invoice-heading">FBR Response</Label>
                    <div className="mt-2">
                      {fbrResponse.ok ? (
                        <div className="invoice-status-text" style={{ color: '#22c55e' }}>
                          ✓ Submission Successful
                        </div>
                      ) : (
                        <div className="invoice-status-text" style={{ color: '#ef4444' }}>
                          ✗ Submission Failed
                        </div>
                      )}
                      {fbrResponse.data && (
                        <div className="mt-2">
                          <pre style={{ 
                            fontSize: '0.875rem', 
                            background: '#f3f4f6', 
                            padding: '0.5rem', 
                            borderRadius: '4px',
                            overflow: 'auto',
                            maxHeight: '300px'
                          }}>
                            {JSON.stringify(fbrResponse.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            )}

             <div className="mt-6 space-y-4">
              <Label className="invoice-status-text">{validationResponse?.error}</Label>
            </div>
              
            
            {invoiceStatuses?.length > 0 && (
              <div className="mt-6 space-y-4">
                <Label className="invoice-heading">Invoice Status</Label>
                {invoiceStatuses.map((status, index) => (
                  <Card key={status.id || index} className="card-flat mt-4 invoice-status-card">
                    <div className="text-left">
                      <div className="invoice-status-text">Item No {status.itemSNo}:{status.status}</div>
                      <div className="invoice-error-text">{status.error}</div>
                      <div className="invoice-error-code">{status.errorCode}</div>
                      <hr/>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      <Card className="card-flat">
        <div className="flex justify-between items-center p-6 pb-0">
          <h1 className="main-title">Rate Tracker</h1>
          <Button 
            onClick={() => toggleCard('dataTable')}
            className="button-secondary text-sm"
          >
            {collapsedCards.dataTable ? '▼' : '▲'}
          </Button>
        </div>
        {!collapsedCards.dataTable && (
          <CardContent>
            <div className="p-6">
          
          {/* Error Display */}
          {error && (
            <div className="error-message">
              <div className="flex justify-between items-center">
                <span>{error}</span>
                <button onClick={clearError} className="error-close">
                  ×
                </button>
              </div>
            </div>
          )}
          
          {/* Success Display */}
          {successMessage && (
            <div className="success-message">
              <div className="flex justify-between items-center">
                <span>{successMessage}</span>
                <button onClick={() => setSuccessMessage('')} className="error-close">
                  ×
                </button>
              </div>
            </div>
          )}
          
          <div className="button-group">
            <Button 
              onClick={handleDownloadTemplate} 
              disabled={loading || initialLoad}
              className="button-secondary"
            >
              {loading && <Loading size="sm" text="" />}
              Download Template
            </Button>
            <Button 
              onClick={handleDownloadFillRatesTemplate} 
              disabled={loading || initialLoad}
              className="button-secondary"
            >
              {loading && <Loading size="sm" text="" />}
              Download Fill Rates Template
            </Button>
            <Button 
              onClick={handleDownloadFbrInvoiceTemplate} 
              disabled={loading || initialLoad}
              className="button-secondary"
            >
              {loading && <Loading size="sm" text="" />}
              Download FBR Invoice Template
            </Button>
          </div>
          
          {/* Search Input - Always visible */}
          <div className="mb-4">
            <input
              id="search-inp"
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={handleSearchInputChange}
              className="search-input"
              disabled={searchLoading}
            />
          </div>
          
          <LoadingOverlay isLoading={loading || initialLoad}>
            {items.length === 0 && !initialLoad ? (
              <div className="empty-state">
                <h3>No Data Available</h3>
                <p>No rates have been loaded yet. Upload an Excel file to add data to the database.</p>
              </div>
            ) : (
              <RateTrackerTable 
                items={items} 
                loading={searchLoading}
                onRowClick={handleRowClick}
              />
            )}
          </LoadingOverlay>
        </div>
        </CardContent>
        )}
      </Card>
      {selectedRow && (
        <RateDetailsModal
          selectedRow={selectedRow}
          itemDetails={itemDetails}
          detailsLoading={detailsLoading}
          detailsError={detailsError}
          editingItem={editingItem}
          editItemData={editItemData}
          types={types}
          raters={raters}
          editingRateId={editingRateId}
          editRateData={editRateData}
          savingRate={savingRate}
          onClose={closeDetails}
          onStartEditItem={startEditItem}
          onItemChange={handleItemEditChange}
          onSaveItem={saveItemChanges}
          onCancelItemEdit={() => {
            setEditingItem(false);
            setEditItemData({
              name: "",
              typeName: "",
              newTypeName: "",
              useNewType: false,
            });
          }}
          onStartEditRate={startEditRate}
          onRateChange={handleRateChange}
          onSaveRate={saveRateChanges}
          onCancelRateEdit={() => {
            setEditingRateId(null);
            setEditRateData({
              rate: "",
              packing: "",
              specifications: "",
              date: "",
              company: "",
              rateBy: "",
            });
          }}
        />
      )}
    </div>
  );
}
