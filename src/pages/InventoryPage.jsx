import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApi } from '../hooks/useApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Loading } from '../components/ui/loading';
import RateDetailsModal from '../components/ui/RateDetailsModal';
import {
  Search, Plus, Pencil, Trash2, Check, X, PackageOpen, ChevronDown,
  Upload, Download, AlertCircle, CheckCircle2, ExternalLink,
} from 'lucide-react';

// ── Combobox for item/packing search ────────────────────────────────────────
function PackingCombobox({ onSelect, searchInventoryPackings }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  const search = useCallback(
    (val) => {
      setQuery(val);
      setOpen(true);
      clearTimeout(timeoutRef.current);
      if (!val.trim()) { setResults([]); return; }
      timeoutRef.current = setTimeout(async () => {
        setSearching(true);
        try {
          const data = await searchInventoryPackings(val);
          setResults(data || []);
        } finally {
          setSearching(false);
        }
      }, 350);
    },
    [searchInventoryPackings],
  );

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (item) => {
    onSelect(item);
    setQuery(`${item.itemName}${item.company ? ' — ' + item.company : ''}${item.packing ? ' / ' + item.packing : ''}`);
    setOpen(false);
    setResults([]);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={e => search(e.target.value)}
          onFocus={() => query && setOpen(true)}
          placeholder="Search items by name, company, packing…"
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); onSelect(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={13} />
          </button>
        )}
      </div>
      {open && (query.trim() || searching) && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {searching ? (
            <div className="flex items-center justify-center py-4"><Loading size="sm" text="Searching…" /></div>
          ) : results.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">No packings found</div>
          ) : (
            results.map((r) => (
              <button
                key={r.packingId}
                onMouseDown={() => pick(r)}
                className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-slate-100 last:border-none transition-colors"
              >
                <div className="text-sm font-medium text-slate-800">{r.itemName}</div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  {r.itemType && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{r.itemType}</span>}
                  {r.company && <span>{r.company}</span>}
                  {r.packing && <span>· {r.packing}</span>}
                  {r.specs && <span className="text-slate-400">· {r.specs}</span>}
                </div>
                {r.totalQty > 0 && (
                  <div className="text-xs text-green-600 mt-0.5">In stock: {r.totalQty}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── New Item modal ───────────────────────────────────────────────────────────
function NewItemModal({ onConfirm, onClose }) {
  const [form, setForm] = useState({ itemName: '', typeName: '', company: '', packingName: '', specs: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return createPortal(
    <div className="rate-details-overlay" onClick={onClose}>
      <div className="rate-details-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <h3 className="rate-details-title">Create New Item</h3>
        <div className="rate-details-section">
          <div className="space-y-3">
            <div>
              <Label>Item Name *</Label>
              <input className="rate-details-input" value={form.itemName} onChange={e => set('itemName', e.target.value)} placeholder="e.g. Acetone" />
            </div>
            <div>
              <Label>Type</Label>
              <input className="rate-details-input" value={form.typeName} onChange={e => set('typeName', e.target.value)} placeholder="e.g. Chemical" />
            </div>
            <div>
              <Label>Company</Label>
              <input className="rate-details-input" value={form.company} onChange={e => set('company', e.target.value)} placeholder="e.g. Sigma Aldrich" />
            </div>
            <div>
              <Label>Packing</Label>
              <input className="rate-details-input" value={form.packingName} onChange={e => set('packingName', e.target.value)} placeholder="e.g. 500ml" />
            </div>
            <div>
              <Label>Specification</Label>
              <input className="rate-details-input" value={form.specs} onChange={e => set('specs', e.target.value)} placeholder="e.g. AR Grade" />
            </div>
          </div>
        </div>
        <div className="rate-details-actions">
          <Button onClick={() => { if (!form.itemName.trim()) return; onConfirm(form); }} disabled={!form.itemName.trim()}>
            Create &amp; Select
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Inline-editable table row ────────────────────────────────────────────────
function InventoryRow({ row, stores, onSave, onDelete, onViewDetails }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ quantity: row.quantity, storeId: row.storeId ?? '', shelf: row.shelf, box: row.box });
  const [saving, setSaving] = useState(false);

  const startEdit = () => { setDraft({ quantity: row.quantity, storeId: row.storeId ?? '', shelf: row.shelf, box: row.box }); setEditing(true); };
  const cancel = () => setEditing(false);

  const save = async () => {
    setSaving(true);
    try { await onSave(row.id, { ...draft, storeId: draft.storeId ? Number(draft.storeId) : undefined }); setEditing(false); }
    finally { setSaving(false); }
  };

  const cellInput = (key, type = 'text', placeholder = '') => (
    <input
      type={type}
      value={draft[key]}
      onChange={e => setDraft(p => ({ ...p, [key]: e.target.value }))}
      placeholder={placeholder}
      className="w-full px-2 py-1 rounded border border-slate-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
    />
  );

  const lowStock = row.quantity <= 5;

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-slate-800">{row.itemName}</div>
        {row.itemType && <span className="text-xs text-slate-400">{row.itemType}</span>}
      </td>
      <td className="px-3 py-3 text-sm text-slate-600">{row.company || '—'}</td>
      <td className="px-3 py-3 text-sm text-slate-600">{row.packing || '—'}</td>
      <td className="px-3 py-3 text-xs text-slate-500">{row.specs || '—'}</td>
      <td className="px-3 py-3">
        {editing ? (
          <select
            value={draft.storeId}
            onChange={e => setDraft(p => ({ ...p, storeId: e.target.value }))}
            className="w-full px-2 py-1 rounded border border-slate-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">— None —</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        ) : (
          <span className="text-sm text-slate-700">{row.store || '—'}</span>
        )}
      </td>
      <td className="px-3 py-3">
        {editing ? cellInput('shelf', 'text', 'Shelf') : (
          <span className="text-sm text-slate-500">{row.shelf || '—'}</span>
        )}
      </td>
      <td className="px-3 py-3">
        {editing ? cellInput('box', 'text', 'Box') : (
          <span className="text-sm text-slate-500">{row.box || '—'}</span>
        )}
      </td>
      <td className="px-3 py-3">
        {editing ? (
          <div className="w-20">{cellInput('quantity', 'number', '0')}</div>
        ) : (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${lowStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {row.quantity}
          </span>
        )}
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <button className="edit-save-btn" onClick={save} disabled={saving} title="Save">
                {saving ? <Loading size="sm" text="" /> : <Check size={12} />}
              </button>
              <button className="edit-cancel-btn" onClick={cancel} title="Cancel"><X size={12} /></button>
            </>
          ) : (
            <>
              <button className="edit-btn" onClick={startEdit} title="Edit"><Pencil size={12} /></button>
              <button onClick={() => onViewDetails(row)} className="edit-btn" title="View item details">
                <ExternalLink size={12} />
              </button>
              <button onClick={() => onDelete(row.id)} className="edit-cancel-btn" title="Delete">
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const {
    loading, error, clearError,
    getInventory, searchInventoryPackings, getStores,
    addInventoryItem, updateInventoryItem, deleteInventoryItem,
    downloadInventoryTemplate, uploadInventoryFile,
    // For item details modal
    getItemDetails, getRaters, getTypes,
    updateItem, updateItemRate, createSaleRate, updateSaleRate,
  } = useApi();

  // ── List state ──────────────────────────────────────────────────────────
  const [inventoryItems, setInventoryItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // ── Add form state ──────────────────────────────────────────────────────
  const [selectedPacking, setSelectedPacking] = useState(null);
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [shelf, setShelf] = useState('');
  const [box, setBox] = useState('');
  const [stores, setStores] = useState([]);
  const [addFormCollapsed, setAddFormCollapsed] = useState(false);

  // ── Upload ──────────────────────────────────────────────────────────────
  const [uploadKey, setUploadKey] = useState(0);
  const [uploadCollapsed, setUploadCollapsed] = useState(true);

  // ── Feedback ────────────────────────────────────────────────────────────
  const [successMsg, setSuccessMsg] = useState('');
  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };

  // ── Item details modal state (reuses RateDetailsModal) ─────────────────
  const [detailsRow, setDetailsRow] = useState(null);
  const [itemDetails, setItemDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [raters, setRaters] = useState([]);
  const [types, setTypes] = useState([]);
  const [editingItem, setEditingItem] = useState(false);
  const [editItemData, setEditItemData] = useState({ name: '', typeName: '', newTypeName: '', useNewType: false, banned: false });
  const [editingRateId, setEditingRateId] = useState(null);
  const [editRateData, setEditRateData] = useState({ rate: '', packing: '', specifications: '', date: '', company: '', rateBy: '' });
  const [savingRate, setSavingRate] = useState(false);
  const [editingSaleRateId, setEditingSaleRateId] = useState(null);
  const [editSaleRateData, setEditSaleRateData] = useState({ date: '', rate: '' });
  const [savingSaleRate, setSavingSaleRate] = useState(false);

  // ── Load data ────────────────────────────────────────────────────────────
  const loadInventory = useCallback(async (search = searchText) => {
    setListLoading(true);
    try {
      const data = await getInventory(search, 1, 500);
      setInventoryItems(data?.items ?? []);
      setTotal(data?.total ?? 0);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setListLoading(false);
    }
  }, [getInventory, searchText]);

  useEffect(() => { loadInventory(''); }, []);

  useEffect(() => {
    getStores().then(s => setStores(s || []));
  }, [getStores]);

  useEffect(() => {
    getRaters().then(r => { if (Array.isArray(r)) setRaters(r); }).catch(() => {});
    getTypes().then(t => { if (Array.isArray(t)) setTypes(t); }).catch(() => {});
  }, [getRaters, getTypes]);

  // ── Search ───────────────────────────────────────────────────────────────
  const searchTimeout = useRef(null);
  const handleListSearch = (val) => {
    setSearchText(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => loadInventory(val), 400);
  };

  // ── Add item ─────────────────────────────────────────────────────────────
  const handleAddItem = async () => {
    if (!selectedPacking) {
      alert('Please select an item from the dropdown or create a new one.');
      return;
    }
    if (!storeId) { alert('Store is required.'); return; }

    try {
      await addInventoryItem({
        packingId: selectedPacking.packingId,
        storeId: Number(storeId),
        shelf: shelf.trim(),
        box: box.trim(),
        quantity: Number(quantity) || 1,
      });
      showSuccess('Inventory record added successfully.');
      setSelectedPacking(null);
      setStoreId(''); setShelf(''); setBox(''); setQuantity('1');
      await loadInventory();
    } catch (err) {
      console.error('Failed to add inventory:', err);
    }
  };

  const handleNewItemConfirm = async (formData) => {
    if (!storeId) { alert('Please select a Store first.'); return; }
    try {
      await addInventoryItem({
        itemName: formData.itemName,
        typeName: formData.typeName,
        company: formData.company,
        packingName: formData.packingName,
        specs: formData.specs,
        storeId: Number(storeId),
        shelf: shelf.trim(),
        box: box.trim(),
        quantity: Number(quantity) || 1,
      });
      setShowNewItemModal(false);
      showSuccess(`"${formData.itemName}" created and added to inventory.`);
      setStoreId(''); setShelf(''); setBox(''); setQuantity('1');
      await loadInventory();
    } catch (err) {
      console.error('Failed to create item:', err);
      alert(err.message || 'Failed to create item.');
    }
  };

  // ── Edit inline ──────────────────────────────────────────────────────────
  const handleSaveRow = async (id, data) => {
    const updated = await updateInventoryItem(id, data);
    setInventoryItems(prev => prev.map(r => r.id === id ? updated : r));
    showSuccess('Record updated.');
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inventory record?')) return;
    await deleteInventoryItem(id);
    setInventoryItems(prev => prev.filter(r => r.id !== id));
    showSuccess('Record deleted.');
  };

  // ── Excel upload ─────────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadInventoryFile(file);
      const msg = result.errors?.length
        ? `Created: ${result.created}, Skipped: ${result.skipped}. ${result.errors.slice(0, 3).join('; ')}${result.errors.length > 3 ? '…' : ''}`
        : `Uploaded: ${result.created} created, ${result.skipped} skipped.`;
      showSuccess(msg);
      await loadInventory();
    } catch (err) {
      alert(err.message || 'Upload failed.');
    }
    setUploadKey(k => k + 1);
    e.target.value = '';
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadInventoryTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'inventory_template.xlsx';
      a.click(); URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  // ── Item details modal ───────────────────────────────────────────────────
  const openDetails = async (row) => {
    setDetailsRow(row);
    setItemDetails(null);
    setDetailsError('');
    setEditingRateId(null);
    setEditingSaleRateId(null);
    if (!row.itemId) return;
    try {
      setDetailsLoading(true);
      const d = await getItemDetails(row.itemId);
      setItemDetails(d);
    } catch (err) {
      setDetailsError(err.message || 'Failed to load details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setDetailsRow(null); setItemDetails(null); setDetailsError('');
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

  const saveItemChanges = async () => {
    if (!itemDetails?.item?.id) return;
    try {
      const payload = { name: editItemData.name, typeName: editItemData.useNewType ? editItemData.newTypeName : editItemData.typeName, banned: editItemData.banned };
      const updatedItem = await updateItem(itemDetails.item.id, payload);
      setItemDetails(prev => prev ? { ...prev, item: updatedItem } : prev);
      setEditingItem(false);
    } catch (err) { setDetailsError(err.message || 'Failed to update item'); }
  };

  const startEditRate = (rate) => {
    setEditingRateId(rate.id);
    setEditRateData({ rate: rate.rate ?? '', packing: rate.packing?.packing ?? '', specifications: rate.packing?.specifications ?? '', date: rate.date ? new Date(rate.date).toISOString().split('T')[0] : '', company: rate.packing?.company ?? '', rateBy: rate.rater?.name ?? '' });
  };

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
    } catch (err) { setDetailsError(err.message || 'Failed to save'); }
    finally { setSavingRate(false); }
  };

  const startEditSaleRate = (sr) => {
    setEditingSaleRateId(sr.id);
    setEditSaleRateData({ date: sr.date ? new Date(sr.date).toISOString().split('T')[0] : '', rate: sr.rate ?? '' });
  };

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
    } catch (err) { setDetailsError(err.message || 'Failed to save sale rate'); }
    finally { setSavingSaleRate(false); }
  };

  const handleAddSaleRate = async (packingId, date, rate) => {
    try {
      setSavingSaleRate(true);
      const created = await createSaleRate(packingId, { date, rate });
      setItemDetails(prev => {
        if (!prev?.packings) return prev;
        return { ...prev, packings: prev.packings.map(p => p.id === packingId ? { ...p, saleRates: [{ id: created.id, packingId, date: created.date, rate: Number(created.rate) }, ...(p.saleRates || [])] } : p) };
      });
    } catch (err) { setDetailsError(err.message || 'Failed to add sale rate'); }
    finally { setSavingSaleRate(false); }
  };

  // ── Stats bar ────────────────────────────────────────────────────────────
  const lowStockCount = inventoryItems.filter(r => r.quantity <= 5).length;
  const totalQty = inventoryItems.reduce((s, r) => s + (r.quantity || 0), 0);
  const uniqueStoreCount = [...new Set(inventoryItems.map(r => r.storeId).filter(Boolean))].length;

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Inventory</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track item stock across stores, shelves, and boxes</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={clearError} className="text-red-400 hover:text-red-600"><X size={15} /></button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle2 size={15} className="flex-shrink-0" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-green-400 hover:text-green-600"><X size={15} /></button>
        </div>
      )}

      {/* Stats row */}
      {inventoryItems.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Total Records', value: total, color: 'text-slate-800' },
            { label: 'Total Units', value: totalQty.toLocaleString(), color: 'text-blue-700' },
            { label: 'Low Stock (≤5)', value: lowStockCount, color: lowStockCount > 0 ? 'text-red-600' : 'text-slate-800' },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <div className="px-5 py-4">
                <div className="text-xs text-slate-500 mb-1">{label}</div>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Item card */}
      <Card className="mb-5">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Plus size={15} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-slate-700">Add Item to Inventory</h2>
          </div>
          <button
            onClick={() => setAddFormCollapsed(c => !c)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ChevronDown size={16} className={`transition-transform ${addFormCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>
        {!addFormCollapsed && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: item search */}
              <div className="space-y-3">
                <div>
                  <Label>Item / Packing *</Label>
                  <PackingCombobox
                    onSelect={setSelectedPacking}
                    searchInventoryPackings={searchInventoryPackings}
                  />
                  <div className="mt-2">
                    <button
                      onClick={() => setShowNewItemModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                    >
                      <Plus size={11} /> Item not found? Create new item
                    </button>
                  </div>
                </div>
                {selectedPacking && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs space-y-1">
                    <div className="font-semibold text-slate-800">{selectedPacking.itemName}</div>
                    {selectedPacking.company && <div className="text-slate-500">{selectedPacking.company} · {selectedPacking.packing}</div>}
                    {selectedPacking.specs && <div className="text-slate-400">{selectedPacking.specs}</div>}
                  </div>
                )}
              </div>

              {/* Right: location + quantity */}
              <div className="space-y-3">
                <div>
                  <Label>Store *</Label>
                  <select
                    value={storeId}
                    onChange={e => setStoreId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">— Select store —</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <a href="/stores" className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block">
                    + Manage stores
                  </a>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>Quantity</Label>
                    <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="1" />
                  </div>
                  <div>
                    <Label>Shelf <span className="text-slate-400 font-normal">(opt.)</span></Label>
                    <Input value={shelf} onChange={e => setShelf(e.target.value)} placeholder="e.g. A1" />
                  </div>
                  <div>
                    <Label>Box <span className="text-slate-400 font-normal">(opt.)</span></Label>
                    <Input value={box} onChange={e => setBox(e.target.value)} placeholder="e.g. B3" />
                  </div>
                </div>
                <Button onClick={handleAddItem} disabled={loading} className="w-full mt-1">
                  {loading ? <Loading size="sm" text="" /> : <Plus size={14} />}
                  Add to Inventory
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Excel Upload card */}
      <Card className="mb-5">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Upload size={15} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-slate-700">Bulk Upload via Excel</h2>
          </div>
          <button
            onClick={() => setUploadCollapsed(c => !c)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ChevronDown size={16} className={`transition-transform ${uploadCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>
        {!uploadCollapsed && (
          <CardContent>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1">
                <Input key={uploadKey} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} disabled={loading} />
              </div>
              <Button variant="secondary" onClick={handleDownloadTemplate} disabled={loading}>
                <Download size={14} /> Template
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Inventory Table */}
      <Card>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <PackageOpen size={15} className="text-blue-500 flex-shrink-0" />
            <h2 className="text-sm font-semibold text-slate-700">
              Inventory Records
              {total > 0 && <span className="ml-2 text-xs font-normal text-slate-400">({total})</span>}
            </h2>
          </div>
          <div className="relative min-w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchText}
              onChange={e => handleListSearch(e.target.value)}
              placeholder="Filter inventory…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {listLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loading size="lg" text="Loading inventory…" />
          </div>
        ) : inventoryItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <PackageOpen size={40} className="text-slate-300 mb-3" />
            <h3 className="text-sm font-medium text-slate-600">No inventory records</h3>
            <p className="text-xs text-slate-400 mt-1">Add items using the form above or upload an Excel file.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Item', 'Company', 'Packing', 'Spec', 'Store', 'Shelf', 'Box', 'Qty', ''].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide first:pl-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map(row => (
                  <InventoryRow
                    key={row.id}
                    row={row}
                    stores={stores}
                    onSave={handleSaveRow}
                    onDelete={handleDelete}
                    onViewDetails={openDetails}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* New Item modal */}
      {showNewItemModal && (
        <NewItemModal
          onConfirm={handleNewItemConfirm}
          onClose={() => setShowNewItemModal(false)}
        />
      )}

      {/* Item Details modal (reuses RateDetailsModal) */}
      {detailsRow && (
        <RateDetailsModal
          selectedRow={detailsRow}
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
          onItemChange={(f, v) => setEditItemData(p => ({ ...p, [f]: v }))}
          onSaveItem={saveItemChanges}
          onCancelItemEdit={() => { setEditingItem(false); setEditItemData({ name: '', typeName: '', newTypeName: '', useNewType: false }); }}
          onStartEditRate={startEditRate}
          onRateChange={(f, v) => setEditRateData(p => ({ ...p, [f]: v }))}
          onSaveRate={saveRateChanges}
          onCancelRateEdit={() => { setEditingRateId(null); setEditRateData({ rate: '', packing: '', specifications: '', date: '', company: '', rateBy: '' }); }}
          editingSaleRateId={editingSaleRateId}
          editSaleRateData={editSaleRateData}
          savingSaleRate={savingSaleRate}
          onAddSaleRate={handleAddSaleRate}
          onStartEditSaleRate={startEditSaleRate}
          onSaleRateChange={(f, v) => setEditSaleRateData(p => ({ ...p, [f]: v }))}
          onSaveSaleRate={saveSaleRateChanges}
          onCancelSaleRateEdit={() => { setEditingSaleRateId(null); setEditSaleRateData({ date: '', rate: '' }); }}
        />
      )}
    </div>
  );
}
