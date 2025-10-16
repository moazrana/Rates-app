import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RateTrackerTable from "./components/ui/table";
import { Label } from "@/components/ui/label";
import Select from './components/ui/select';
import { Loading, LoadingOverlay } from "@/components/ui/loading";
import { useApi } from './hooks/useApi';
import './formStyle.css';

export default function RateTracker() {
  const { loading, error, clearError, getRates, downloadTemplate, addRate, uploadRatesFile } = useApi();
  const [items, setItems] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
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

  // Normalize backend rows to flat table-friendly shape
  const toRow = (row, index) => ({
    id: row.id || Date.now() + index,
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

  const handleLoadData = async () => {
    try {
      const data = await getRates();
      if (data && data.items) {
        setItems([...items, ...data.items.map(toRow)]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
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

  return (
    <div className="app-container">
      <Card className="card-gradient">
        <h2 className="form-title">Add Item Rate</h2>
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
      </Card>

      <Card className="card-elevated">
        <h2 className="form-title">Upload Excel File</h2>
        <Input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      </Card>

      <Card className="card-flat">
        <CardContent>
          <div className="p-6">
          <h1 className="main-title">Rate Tracker</h1>
          
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
              onClick={handleLoadData} 
              disabled={loading || initialLoad}
              className="button-primary"
            >
              {(loading || initialLoad) && <Loading size="sm" text="" />}
              {initialLoad ? 'Loading...' : 'Load More Data'}
            </Button>
            <Button 
              onClick={handleDownloadTemplate} 
              disabled={loading || initialLoad}
              className="button-secondary"
            >
              {loading && <Loading size="sm" text="" />}
              Download Template
            </Button>
          </div>
          
          <LoadingOverlay isLoading={loading || initialLoad}>
            {items.length === 0 && !initialLoad ? (
              <div className="empty-state">
                <h3>No Data Available</h3>
                <p>No rates have been loaded yet. Use the "Load More Data" button to fetch data from the database, or upload an Excel file.</p>
              </div>
            ) : (
              <RateTrackerTable items={items} />
            )}
          </LoadingOverlay>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
