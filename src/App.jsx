import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RateTrackerTable from "./components/ui/table";
import { Label } from "@/components/ui/label";
import Select from './components/ui/select';
import { Loading, LoadingOverlay } from "@/components/ui/loading";
import { useApi } from './hooks/useApi';
import RateDetailsModal from "./components/ui/RateDetailsModal";
import { Search, Download, ChevronUp, ChevronDown, X, Upload, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';

export default function RateTracker() {
  console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
  const {
    loading, error, clearError,
    getRates, downloadTemplate, downloadFillRatesTemplate,
    uploadRatesFile, addRate, fillRatesInFile,
    downloadInventoryTemplate, uploadInventoryFile,
    getFillRatesJobStatus, downloadFillRatesResult,
    getUploadRatesJobStatus, getItemDetails,
    getRaters, getTypes, updateItem, updateItemRate,
    createSaleRate, updateSaleRate,
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
    inventoryUpload: false,
  });

  const [form, setForm] = useState({
    type: '', name: '', company: '', packing: '',
    specification: '', rate: '', date: '', rateBy: '',
  });
  const [selectedRow, setSelectedRow] = useState(null);
  const [itemDetails, setItemDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [editingRateId, setEditingRateId] = useState(null);
  const [editRateData, setEditRateData] = useState({ rate: '', packing: '', specifications: '' });
  const [savingRate, setSavingRate] = useState(false);
  const [editingSaleRateId, setEditingSaleRateId] = useState(null);
  const [editSaleRateData, setEditSaleRateData] = useState({ date: '', rate: '' });
  const [savingSaleRate, setSavingSaleRate] = useState(false);
  const [raters, setRaters] = useState([]);
  const [types, setTypes] = useState([]);
  const [editingItem, setEditingItem] = useState(false);
  const [editItemData, setEditItemData] = useState({ name: '', typeName: '', newTypeName: '', useNewType: false, banned: false });
  const [fillRatesJobId, setFillRatesJobId] = useState(null);
  const [fillRatesJobStatus, setFillRatesJobStatus] = useState(null);
  const fillRatesJobPollRef = useRef(null);
  const [uploadRatesJobId, setUploadRatesJobId] = useState(null);
  const [uploadRatesJobStatus, setUploadRatesJobStatus] = useState(null);
  const uploadRatesJobPollRef = useRef(null);
  const [uploadFileKey, setUploadFileKey] = useState(0);
  const [selectedRateByValue, setSelectedRateByValue] = useState('');
  const [selectedTypeValue, setSelectedTypeValue] = useState('');

  const rateByOptions = [
    { value: 'Shakeel Sab', label: 'Shakeel Sab' },
    { value: 'Rafaqat Sab', label: 'Rafaqat Sab' },
    { value: 'Lahore Sceitific Store', label: 'Lahore Sceitific Store' },
  ];
  const typeOptions = [
    { value: 'Chemical', label: 'Chemical' },
    { value: 'Glassware', label: 'Glassware' },
  ];

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const ratersData = await getRaters();
        if (Array.isArray(ratersData)) setRaters(ratersData);
        const typesData = await getTypes();
        if (Array.isArray(typesData)) setTypes(typesData);
      } catch (err) {
        console.error('Error fetching reference data:', err);
      }
    };
    fetchReferenceData();
  }, [getRaters, getTypes]);

  const toRow = (row, index) => ({
    id: row.id || Date.now() + index,
    itemId: row.item?.id || row.itemId || null,
    name: row.item?.name || row.name || '',
    company: row.packing?.company || row.company || '',
    packing: row.packing?.packing || row.packing || '',
    specification: row.packing?.specifications || row.specification || '',
    rate: row.rate ?? '',
    date: row.date ? new Date(row.date).toLocaleDateString() : '',
    rateBy: row.rater?.name || row.rateBy || '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const toggleCard = (name) => setCollapsedCards(prev => ({ ...prev, [name]: !prev[name] }));

  const handleSearch = async (searchValue) => {
    setSearchText(searchValue);
    try {
      const data = await getRates(searchValue);
      if (data?.items) setItems(data.items.map(toRow));
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInputChange = (e) => handleSearch(e.target.value);

  useEffect(() => {
    if (searchInputRef.current && document.activeElement === searchInputRef.current) {
      const pos = searchInputRef.current.selectionStart;
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.setSelectionRange(pos, pos);
        }
      }, 0);
    }
  }, [items, searchLoading]);

  const addItem = async () => {
    try {
      await addRate({
        type: form.type, name: form.name, company: form.company,
        packing: form.packing, specifications: form.specification,
        rate: parseFloat(form.rate) || 0, date: form.date, rater: form.rateBy,
      });
      setSuccessMessage('Rate saved successfully to database!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setItems([...items, { ...form, id: Date.now() }]);
      setForm({ type: '', name: '', company: '', packing: '', specification: '', rate: '', date: '', rateBy: '' });
      setSelectedTypeValue('');
      setSelectedRateByValue('');
      const dbData = await getRates();
      if (dbData?.items) setItems(dbData.items.map(toRow));
    } catch (err) {
      console.error('Error adding rate:', err);
      setItems([...items, { ...form, id: Date.now() }]);
      setForm({ type: '', name: '', company: '', packing: '', specification: '', rate: '', date: '', rateBy: '' });
      setSelectedTypeValue('');
      setSelectedRateByValue('');
    }
  };

  const handleTypeChange = (e) => { setSelectedTypeValue(e.target.value); setForm({ ...form, type: e.target.value }); };
  const handleRateByChange = (e) => { setSelectedRateByValue(e.target.value); setForm({ ...form, rateBy: e.target.value }); };

  useEffect(() => {
    const load = async () => {
      try {
        setInitialLoad(true);
        const data = await getRates();
        if (data?.items) setItems(data.items.map(toRow));
      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        setInitialLoad(false);
      }
    };
    load();
  }, [getRates]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';
    setUploadFileKey(k => k + 1);
    try {
      const result = await uploadRatesFile(file);
      if (result?.jobId) { setUploadRatesJobId(result.jobId); setUploadRatesJobStatus({ status: 'queued', progress: 0 }); }
    } catch (err) { console.error('Error submitting upload-rates job:', err); }
  };

  const handleFillRates = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';
    try {
      const result = await fillRatesInFile(file);
      if (result?.jobId) { setFillRatesJobId(result.jobId); setFillRatesJobStatus({ status: 'queued', progress: 0 }); }
    } catch (err) { console.error('Error submitting fill-rates job:', err); }
  };

  useEffect(() => {
    if (!fillRatesJobId) return;
    const poll = async () => {
      try {
        const status = await getFillRatesJobStatus(fillRatesJobId);
        setFillRatesJobStatus(status);
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(fillRatesJobPollRef.current);
          fillRatesJobPollRef.current = null;
        }
      } catch (err) { console.error('Error polling fill-rates job:', err); }
    };
    fillRatesJobPollRef.current = setInterval(poll, 2000);
    poll();
    return () => { if (fillRatesJobPollRef.current) clearInterval(fillRatesJobPollRef.current); };
  }, [fillRatesJobId, getFillRatesJobStatus]);

  useEffect(() => {
    if (!uploadRatesJobId) return;
    const poll = async () => {
      try {
        const status = await getUploadRatesJobStatus(uploadRatesJobId);
        setUploadRatesJobStatus(status);
        if (status.status === 'completed') {
          clearInterval(uploadRatesJobPollRef.current);
          uploadRatesJobPollRef.current = null;
          const dbData = await getRates();
          if (dbData?.items) setItems(dbData.items.map(toRow));
          setSuccessMessage(`Upload complete — ${status.returnvalue?.processedRows ?? 0} rows processed.`);
          setTimeout(() => setSuccessMessage(''), 5000);
          setUploadRatesJobId(null);
          setUploadRatesJobStatus(null);
        } else if (status.status === 'failed') {
          clearInterval(uploadRatesJobPollRef.current);
          uploadRatesJobPollRef.current = null;
        }
      } catch (err) { console.error('Error polling upload-rates job:', err); }
    };
    uploadRatesJobPollRef.current = setInterval(poll, 2000);
    poll();
    return () => { if (uploadRatesJobPollRef.current) clearInterval(uploadRatesJobPollRef.current); };
  }, [uploadRatesJobId, getUploadRatesJobStatus, getRates]);

  const handleDownloadFillRatesResult = async () => {
    try {
      const blob = await downloadFillRatesResult(fillRatesJobId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url; a.download = 'filled-rates.xlsx';
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      setFillRatesJobId(null); setFillRatesJobStatus(null);
      setSuccessMessage('File downloaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) { console.error('Error downloading fill-rates result:', err); }
  };

  const download = async (fn, filename, label) => {
    try {
      const blob = await fn();
      if (blob.size === 0) throw new Error('Downloaded file is empty');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.style.display = 'none';
      document.body.appendChild(a); a.click();
      setTimeout(() => { window.URL.revokeObjectURL(url); document.body.removeChild(a); }, 100);
      if (label) { setSuccessMessage(label); setTimeout(() => setSuccessMessage(''), 3000); }
    } catch (err) { alert(`Failed to download: ${err.message}`); }
  };

  const handleInventoryFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const result = await uploadInventoryFile(file);
      const msg = result.errors?.length
        ? `Created: ${result.created}, Skipped: ${result.skipped}. ${result.errors.slice(0, 3).join('; ')}${result.errors.length > 3 ? '...' : ''}`
        : `Inventory uploaded: ${result.created} created, ${result.skipped} skipped.`;
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error uploading inventory file:', err);
      alert(err.message || 'Failed to upload inventory file.');
    }
    event.target.value = '';
  };

  const handleRowClick = async (row) => {
    setSelectedRow(row);
    setItemDetails(null);
    setDetailsError('');
    setEditingRateId(null);
    setEditingSaleRateId(null);
    if (!row.itemId) return;
    try {
      setDetailsLoading(true);
      const details = await getItemDetails(row.itemId);
      setItemDetails(details);
    } catch (err) {
      setDetailsError(err.message || 'Failed to load item details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedRow(null); setItemDetails(null); setDetailsError('');
    setEditingRateId(null); setEditingSaleRateId(null); setEditingItem(false);
    setEditRateData({ rate: '', packing: '', specifications: '', date: '', company: '', rateBy: '' });
    setEditSaleRateData({ date: '', rate: '' });
    setEditItemData({ name: '', typeName: '', newTypeName: '', useNewType: false });
  };

  const startEditItem = () => {
    if (!itemDetails?.item) return;
    setEditingItem(true);
    setEditItemData({ name: itemDetails.item.name || '', typeName: itemDetails.item.type?.name || '', newTypeName: '', useNewType: false, banned: !!itemDetails.item.banned });
  };

  const handleItemEditChange = (field, value) => setEditItemData(prev => ({ ...prev, [field]: value }));

  const saveItemChanges = async () => {
    if (!itemDetails?.item?.id) return;
    try {
      const payload = { name: editItemData.name, typeName: editItemData.useNewType ? editItemData.newTypeName : editItemData.typeName, banned: editItemData.banned };
      const updatedItem = await updateItem(itemDetails.item.id, payload);
      setItemDetails(prev => prev ? { ...prev, item: updatedItem } : prev);
      setEditingItem(false);
      setEditItemData({ name: '', typeName: '', newTypeName: '', useNewType: false, banned: false });
    } catch (err) {
      setDetailsError(err.message || 'Failed to update item');
    }
  };

  const startEditRate = (rate) => {
    setEditingRateId(rate.id);
    setEditRateData({
      rate: rate.rate ?? '', packing: rate.packing?.packing ?? '',
      specifications: rate.packing?.specifications ?? '',
      date: rate.date ? new Date(rate.date).toISOString().split('T')[0] : '',
      company: rate.packing?.company ?? '', rateBy: rate.rater?.name ?? '',
    });
  };

  const handleRateChange = (field, value) => setEditRateData(prev => ({ ...prev, [field]: value }));

  const saveRateChanges = async () => {
    if (!editingRateId) return;
    try {
      setSavingRate(true);
      const updated = await updateItemRate(editingRateId, editRateData);
      setItemDetails(prev => {
        if (!prev) return prev;
        const updatedRates = prev.rates.map(r => r.id === updated.id ? { ...r, ...updated } : r);
        let updatedPackings = prev.packings;
        if (updated.packing) {
          const idx = updatedPackings.findIndex(p => p.id === updated.packing.id);
          if (idx !== -1) { const copy = [...updatedPackings]; copy[idx] = { ...copy[idx], ...updated.packing }; updatedPackings = copy; }
        }
        return { ...prev, rates: updatedRates, packings: updatedPackings };
      });
      setEditingRateId(null);
      setEditRateData({ rate: '', packing: '', specifications: '', date: '', company: '', rateBy: '' });
    } catch (err) {
      setDetailsError(err.message || 'Failed to save changes');
    } finally {
      setSavingRate(false);
    }
  };

  const startEditSaleRate = (sr) => {
    setEditingSaleRateId(sr.id);
    setEditSaleRateData({ date: sr.date ? new Date(sr.date).toISOString().split('T')[0] : '', rate: sr.rate ?? '' });
  };

  const handleSaleRateChange = (field, value) => setEditSaleRateData(prev => ({ ...prev, [field]: value }));

  const saveSaleRateChanges = async () => {
    if (!editingSaleRateId) return;
    try {
      setSavingSaleRate(true);
      const updated = await updateSaleRate(editingSaleRateId, editSaleRateData);
      setItemDetails(prev => {
        if (!prev?.packings) return prev;
        return { ...prev, packings: prev.packings.map(p => ({ ...p, saleRates: (p.saleRates || []).map(sr => sr.id === updated.id ? { ...sr, date: updated.date, rate: Number(updated.rate) } : sr) })) };
      });
      setEditingSaleRateId(null); setEditSaleRateData({ date: '', rate: '' });
    } catch (err) {
      setDetailsError(err.message || 'Failed to save sale rate');
    } finally {
      setSavingSaleRate(false);
    }
  };

  const handleAddSaleRate = async (packingId, date, rate) => {
    try {
      setSavingSaleRate(true);
      const created = await createSaleRate(packingId, { date, rate });
      setItemDetails(prev => {
        if (!prev?.packings) return prev;
        return { ...prev, packings: prev.packings.map(p => p.id === packingId ? { ...p, saleRates: [{ id: created.id, packingId, date: created.date, rate: Number(created.rate) }, ...(p.saleRates || [])] } : p) };
      });
    } catch (err) {
      setDetailsError(err.message || 'Failed to add sale rate');
    } finally {
      setSavingSaleRate(false);
    }
  };

  const jobBusy = (s) => s?.status === 'active' || s?.status === 'waiting' || s?.status === 'queued';

  /* ── Collapsible card helper ──────────────────────────────────────────── */
  const CollapseBtn = ({ name }) => (
    <button
      onClick={() => toggleCard(name)}
      className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
    >
      {collapsedCards[name] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
    </button>
  );

  const jobStatusBadge = (status) => {
    const map = { completed: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700', active: 'bg-blue-100 text-blue-700', queued: 'bg-amber-100 text-amber-700', waiting: 'bg-amber-100 text-amber-700' };
    return `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-slate-100 text-slate-600'}`;
  };

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Rate Tracker</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage item purchase rates across companies and packings</p>
      </div>

      {/* Top cards row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">

        {/* Add Item Rate — wide */}
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={15} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-slate-700">Add Item Rate</h2>
            </div>
            <CollapseBtn name="addRate" />
          </div>
          {!collapsedCards.addRate && (
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Item Type</Label>
                  <Select options={types.map(t => ({ value: t.name, label: t.name }))} value={selectedTypeValue} onChange={handleTypeChange} placeholder="Select Type" />
                </div>
                <div>
                  <Label>Item Name</Label>
                  <Input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Acetone" />
                </div>
                <div>
                  <Label>Company</Label>
                  <Input name="company" value={form.company} onChange={handleChange} placeholder="e.g. Sigma Aldrich" />
                </div>
                <div>
                  <Label>Packing</Label>
                  <Input name="packing" value={form.packing} onChange={handleChange} placeholder="e.g. 500ml" />
                </div>
                <div>
                  <Label>Specification</Label>
                  <Input name="specification" value={form.specification} onChange={handleChange} placeholder="e.g. AR Grade" />
                </div>
                <div>
                  <Label>Rate (PKR)</Label>
                  <Input name="rate" type="number" value={form.rate} onChange={handleChange} placeholder="0.00" />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input name="date" type="date" value={form.date} onChange={handleChange} />
                </div>
                <div>
                  <Label>Rate By</Label>
                  <Select options={raters.map(r => ({ value: r.name, label: r.name }))} value={selectedRateByValue} onChange={handleRateByChange} placeholder="Select source" />
                </div>
              </div>
              <Button className="mt-4 w-full" onClick={addItem}>Add Rate</Button>
            </CardContent>
          )}
        </Card>

        {/* Right column — upload cards */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Upload Excel */}
          <Card>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Upload size={15} className="text-blue-500" />
                <h2 className="text-sm font-semibold text-slate-700">Upload Excel</h2>
              </div>
              <CollapseBtn name="uploadFile" />
            </div>
            {!collapsedCards.uploadFile && (
              <CardContent>
                <Input key={uploadFileKey} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} disabled={jobBusy(uploadRatesJobStatus)} />
                {uploadRatesJobStatus && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className={jobStatusBadge(uploadRatesJobStatus.status)}>
                      {uploadRatesJobStatus.status}
                      {typeof uploadRatesJobStatus.progress === 'number' && uploadRatesJobStatus.progress > 0 && ` — ${uploadRatesJobStatus.progress}%`}
                    </span>
                    {uploadRatesJobStatus.status === 'failed' && (
                      <span className="text-xs text-red-600">{uploadRatesJobStatus.failedReason}</span>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Fill Rates */}
          <Card>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Download size={15} className="text-blue-500" />
                <h2 className="text-sm font-semibold text-slate-700">Fill Rates in Excel</h2>
              </div>
              <CollapseBtn name="fillRates" />
            </div>
            {!collapsedCards.fillRates && (
              <CardContent>
                <p className="text-xs text-slate-500 mb-3">Upload items Excel to auto-fill latest rates from the database.</p>
                <Input type="file" accept=".xlsx,.xls" onChange={handleFillRates} disabled={jobBusy(fillRatesJobStatus)} />
                {fillRatesJobStatus && (
                  <div className="mt-3 space-y-2">
                    <span className={jobStatusBadge(fillRatesJobStatus.status)}>
                      {fillRatesJobStatus.status}
                      {typeof fillRatesJobStatus.progress === 'number' && fillRatesJobStatus.progress > 0 && ` — ${fillRatesJobStatus.progress}%`}
                    </span>
                    {fillRatesJobStatus.status === 'completed' && fillRatesJobStatus.returnvalue && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-green-600">
                          ✓ {fillRatesJobStatus.returnvalue.filledRows}/{fillRatesJobStatus.returnvalue.processedRows} rows filled
                        </span>
                        <Button variant="secondary" onClick={handleDownloadFillRatesResult} className="text-xs py-1.5">
                          <Download size={13} /> Download filled-rates.xlsx
                        </Button>
                      </div>
                    )}
                    {fillRatesJobStatus.status === 'failed' && (
                      <span className="text-xs text-red-600">{fillRatesJobStatus.failedReason}</span>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Inventory */}
          <Card>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Upload size={15} className="text-blue-500" />
                <h2 className="text-sm font-semibold text-slate-700">Upload Inventory</h2>
              </div>
              <CollapseBtn name="inventoryUpload" />
            </div>
            {!collapsedCards.inventoryUpload && (
              <CardContent>
                <p className="text-xs text-slate-500 mb-3">Excel: Item, Company, Packing, Spec, Store, Shelf, Box, Qty.</p>
                <Input type="file" accept=".xlsx,.xls" onChange={handleInventoryFileUpload} />
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Data table card */}
      <Card>
        <div className="px-5 py-4 border-b border-slate-100">
          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={clearError} className="text-red-400 hover:text-red-600"><X size={15} /></button>
            </div>
          )}
          {successMessage && (
            <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <CheckCircle2 size={15} className="flex-shrink-0" />
              <span className="flex-1">{successMessage}</span>
              <button onClick={() => setSuccessMessage('')} className="text-green-400 hover:text-green-600"><X size={15} /></button>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-inp"
                ref={searchInputRef}
                type="text"
                placeholder="Search rates…"
                value={searchText}
                onChange={handleSearchInputChange}
                disabled={searchLoading}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="secondary" onClick={() => download(downloadTemplate, 'rate_tracker_template.xlsx')} disabled={loading || initialLoad}>
                <Download size={14} /> Template
              </Button>
              <Button variant="secondary" onClick={() => download(downloadFillRatesTemplate, 'fill-rates-template.xlsx', 'Fill Rates Template downloaded.')} disabled={loading || initialLoad}>
                <Download size={14} /> Fill Rates Template
              </Button>
              <Button variant="secondary" onClick={() => download(downloadInventoryTemplate, 'inventory_template.xlsx', 'Inventory template downloaded.')} disabled={loading || initialLoad}>
                <Download size={14} /> Inventory Template
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <LoadingOverlay isLoading={loading || initialLoad}>
          {items.length === 0 && !initialLoad ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileSpreadsheet size={40} className="text-slate-300 mb-3" />
              <h3 className="text-sm font-medium text-slate-600">No rates yet</h3>
              <p className="text-xs text-slate-400 mt-1">Upload an Excel file or add a rate manually above.</p>
            </div>
          ) : (
            <RateTrackerTable items={items} loading={searchLoading} onRowClick={handleRowClick} />
          )}
        </LoadingOverlay>
      </Card>

      {/* Rate details modal */}
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
          onCancelItemEdit={() => { setEditingItem(false); setEditItemData({ name: '', typeName: '', newTypeName: '', useNewType: false }); }}
          onStartEditRate={startEditRate}
          onRateChange={handleRateChange}
          onSaveRate={saveRateChanges}
          onCancelRateEdit={() => { setEditingRateId(null); setEditRateData({ rate: '', packing: '', specifications: '', date: '', company: '', rateBy: '' }); }}
          editingSaleRateId={editingSaleRateId}
          editSaleRateData={editSaleRateData}
          savingSaleRate={savingSaleRate}
          onAddSaleRate={handleAddSaleRate}
          onStartEditSaleRate={startEditSaleRate}
          onSaleRateChange={handleSaleRateChange}
          onSaveSaleRate={saveSaleRateChanges}
          onCancelSaleRateEdit={() => { setEditingSaleRateId(null); setEditSaleRateData({ date: '', rate: '' }); }}
        />
      )}
    </div>
  );
}
