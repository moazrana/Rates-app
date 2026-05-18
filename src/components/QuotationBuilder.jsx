import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loading } from './ui/loading';
import { useApi } from '../hooks/useApi';
import { apiService } from '../services/apiService';
import { Search, Plus, Trash2, FileText, Download, Package, ChevronUp, ChevronDown, X } from 'lucide-react';

const DEFAULT_FIRM = {
  name: 'Universal Scientific Supply Company',
  strn: '030484001596-4',
  ntn: '3004934-2',
  tfn: '9013701-9',
  bankAccountTitle: 'Universal Scientific Supply Company',
  bankName: 'Bank of Punjab',
  bankBranch: 'Anarkali Branch - Lahore',
};

const toWords = (amount) => {
  if (!amount || isNaN(amount)) return '';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
    'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };
  return `Rs. ${convert(Math.round(amount))} only.`;
};

const inp = 'w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

export default function QuotationBuilder() {
  const {
    loading, error, clearError,
    getItemsForQuotation, getItemRate, getQuotations, getQuotationById,
    createQuotation, createDeliveryChallan, generateBillAndDC,
  } = useApi();

  const [searchText, setSearchText] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const [quotationsLoading, setQuotationsLoading] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);
  const [selectedQuotationDetail, setSelectedQuotationDetail] = useState(null);
  const [quotationDetailLoading, setQuotationDetailLoading] = useState(false);
  const [expandedDetailItems, setExpandedDetailItems] = useState({});
  const [customerInfo, setCustomerInfo] = useState({ name: '', company: '', email: '', phone: '' });
  const [quotationInfo, setQuotationInfo] = useState({ quotationNumber: '', date: new Date().toLocaleDateString('en-GB') });
  const [collapsed, setCollapsed] = useState(false);
  const [challanLoading, setChallanLoading] = useState(null);
  const [deliveryChallanModal, setDeliveryChallanModal] = useState(null);
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState('');
  const [billModal, setBillModal] = useState(false);
  const [billFetching, setBillFetching] = useState(false);
  const [billCustomer, setBillCustomer] = useState({ name: '', institution: '', city: '', strn: '', ntn: '' });
  const [billFirm, setBillFirm] = useState({ ...DEFAULT_FIRM });
  const [billTransaction, setBillTransaction] = useState({ date: '', poNumber: '', poDate: '', dcNumber: '', invoiceNumber: '' });
  const [billItems, setBillItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [billGstRate, setBillGstRate] = useState(18);
  const [billAutoWords, setBillAutoWords] = useState(true);
  const [billManualWords, setBillManualWords] = useState('');
  const [billGenerating, setBillGenerating] = useState(false);

  useEffect(() => {
    const fetchQuotations = async () => {
      setQuotationsLoading(true);
      try {
        const data = await getQuotations(1, 20);
        if (data?.quotations) setQuotations(data.quotations);
      } catch (err) {
        console.error('Error fetching quotations:', err);
      } finally {
        setQuotationsLoading(false);
      }
    };
    fetchQuotations();
  }, [getQuotations]);

  const handleSearch = useCallback((searchValue) => {
    setSearchText(searchValue);
    if (window.quotationSearchTimeout) clearTimeout(window.quotationSearchTimeout);
    window.quotationSearchTimeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await getItemsForQuotation(searchValue);
        if (data?.items) setItems(data.items);
      } catch (err) {
        console.error('Error searching items:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  }, [getItemsForQuotation]);

  const addItemToQuotation = async (item) => {
    let calculatedPrice = '';
    try {
      const rateData = await getItemRate(item.itemName, item.itemType || '', item.company || '', item.packing || '');
      if (rateData?.rate > 0) calculatedPrice = (rateData.rate * 1.35).toFixed(2);
    } catch (err) {
      console.error('Error fetching rate for item:', err);
    }
    setSelectedItems(prev => [...prev, { ...item, quantity: 1, price: calculatedPrice }]);
  };

  const removeItemFromQuotation = (itemId) => setSelectedItems(prev => prev.filter(i => i.id !== itemId));
  const updateItemQuantity = (itemId, qty) => setSelectedItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: Math.max(1, parseInt(qty) || 1) } : i));
  const updateItemPrice = (itemId, price) => setSelectedItems(prev => prev.map(i => i.id === itemId ? { ...i, price } : i));

  const handleSelectQuotation = async (quotationId) => {
    if (selectedQuotationId === quotationId) { setSelectedQuotationId(null); setSelectedQuotationDetail(null); setExpandedDetailItems({}); return; }
    setSelectedQuotationId(quotationId);
    setExpandedDetailItems({});
    setQuotationDetailLoading(true);
    try {
      const data = await getQuotationById(quotationId);
      setSelectedQuotationDetail(data);
    } catch (err) {
      console.error('Error fetching quotation detail:', err);
    } finally {
      setQuotationDetailLoading(false);
    }
  };

  const handleDownloadQuotation = async (quotationId) => {
    try {
      const blob = await apiService.downloadQuotation(quotationId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `quotation-${quotationId}.xlsx`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download quotation: ' + err.message);
    }
  };

  const openDeliveryChallanModal = (quotationId) => {
    setDeliveryChallanModal(quotationId);
    setPoNumber('');
    setPoDate(new Date().toLocaleDateString('en-GB'));
  };
  const closeDeliveryChallanModal = () => { setDeliveryChallanModal(null); setPoNumber(''); setPoDate(''); };

  const handleCreateDeliveryChallan = async () => {
    if (!deliveryChallanModal) return;
    if (!poNumber.trim()) { alert('Please enter PO number'); return; }
    if (!poDate.trim()) { alert('Please enter PO date'); return; }
    setChallanLoading(deliveryChallanModal);
    try {
      const blob = await createDeliveryChallan(deliveryChallanModal, { poNumber: poNumber.trim(), poDate: poDate.trim() });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `delivery-challan-${deliveryChallanModal}.xlsx`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); window.URL.revokeObjectURL(url);
      closeDeliveryChallanModal();
    } catch (err) {
      alert('Failed to create delivery challan: ' + err.message);
    } finally {
      setChallanLoading(null);
    }
  };

  const handleCreateQuotation = async () => {
    if (selectedItems.length === 0) { alert('Please select at least one item for the quotation'); return; }
    try {
      const blob = await createQuotation({ items: selectedItems, customerInfo, quotationInfo });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `quotation-${quotationInfo.quotationNumber || 'new'}.xlsx`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      alert('Quotation created successfully!');
      const data = await getQuotations(1, 20);
      if (data?.quotations) setQuotations(data.quotations);
    } catch (err) {
      alert('Failed to create quotation: ' + err.message);
    }
  };

  const openBillModal = async (quotation) => {
    setBillFetching(true);
    setBillModal(true);
    setBillCustomer({ name: quotation.customerName || '', institution: quotation.customerCompany || '', city: quotation.customerCity || '', strn: '', ntn: '' });
    setBillTransaction({ date: quotation.date || new Date().toLocaleDateString('en-GB'), poNumber: '', poDate: '', dcNumber: '', invoiceNumber: '' });
    setBillFirm({ ...DEFAULT_FIRM });
    setBillGstRate(18);
    setBillAutoWords(true);
    setBillManualWords('');
    try {
      const data = await getQuotationById(quotation.id);
      if (data?.items?.length) {
        setBillItems(data.items.map(it => ({
          quotationItemId: it.id,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          usedFromInventory: it.usedFromInventory ?? true,
          sourceNote: it.sourceNote ?? '',
        })));
      } else {
        setBillItems([{ quotationItemId: null, description: '', quantity: 1, unitPrice: 0, usedFromInventory: true, sourceNote: '' }]);
      }
    } catch (err) {
      setBillItems([{ quotationItemId: null, description: '', quantity: 1, unitPrice: 0, usedFromInventory: true, sourceNote: '' }]);
    } finally {
      setBillFetching(false);
    }
  };

  const closeBillModal = () => setBillModal(false);
  const addBillItem = () => setBillItems(p => [...p, { quotationItemId: null, description: '', quantity: 1, unitPrice: 0, usedFromInventory: true, sourceNote: '' }]);
  const removeBillItem = (idx) => setBillItems(p => p.filter((_, i) => i !== idx));
  const updateBillItem = (idx, k, v) => setBillItems(p => p.map((it, i) => i === idx ? { ...it, [k]: v } : it));

  const billGrandExcl = billItems.reduce((s, it) => s + Number(it.quantity) * Number(it.unitPrice), 0);
  const billGrandTax = Math.round(billGrandExcl * billGstRate) / 100;
  const billGrandTotal = billGrandExcl + billGrandTax;
  const billAmountInWords = billAutoWords ? toWords(billGrandTotal) : billManualWords;

  const handleGenerateBillAndDC = async () => {
    setBillGenerating(true);
    try {
      await Promise.all(
        billItems
          .filter(it => it.quotationItemId != null)
          .map(it => apiService.updateQuotationItemInventory(it.quotationItemId, it.usedFromInventory, it.usedFromInventory ? null : it.sourceNote))
      );
      const blob = await generateBillAndDC({
        customer: billCustomer,
        firm: billFirm,
        transaction: billTransaction,
        items: billItems.map(it => ({ description: it.description, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice), sourceNote: (!it.usedFromInventory && it.sourceNote) ? it.sourceNote : null })),
        amountInWords: billAmountInWords,
        gstRate: Number(billGstRate),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `bill-dc-${billTransaction.dcNumber || 'draft'}.xlsx`;
      a.click(); URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setBillGenerating(false);
    }
  };

  /* ── Shared section header ─────────────────────────────────────────────── */
  const SectionHeader = ({ label }) => (
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4 first:mt-0">{label}</p>
  );

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Quotation Builder</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create quotations and generate delivery challans</p>
        </div>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <span className="flex-1">{error}</span>
          <button onClick={clearError} className="text-red-400 hover:text-red-600"><X size={15} /></button>
        </div>
      )}

      {!collapsed && (
        <div className="flex flex-col gap-5">
          {/* ── Column 1: Item Search ─────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Search size={15} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-slate-700">Search Items</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, type, company…"
                  value={searchText}
                  onChange={e => handleSearch(e.target.value)}
                  disabled={searchLoading}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50"
                />
              </div>

              {/* Search results */}
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-6"><Loading size="sm" text="Searching…" /></div>
                ) : items.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    {searchText ? 'No items found' : 'Start typing to search items'}
                  </div>
                ) : (
                  items.map((item) => {
                    const alreadyAdded = selectedItems.some(s => s.id === item.id);
                    return (
                      <div key={item.id} className="flex items-start gap-3 px-3 py-2.5 border-b border-slate-100 last:border-none hover:bg-slate-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-800 truncate">{item.itemName}</div>
                          <div className="text-xs text-slate-500 mt-0.5 truncate">{[item.itemType, item.company, item.packing].filter(Boolean).join(' · ')}</div>
                          {item.specifications && <div className="text-xs text-slate-400 mt-0.5 truncate">{item.specifications}</div>}
                        </div>
                        <button
                          onClick={() => addItemToQuotation(item)}
                          disabled={alreadyAdded}
                          className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${alreadyAdded ? 'bg-green-100 text-green-600 cursor-default' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                        >
                          {alreadyAdded ? '✓ Added' : <><Plus size={11} /> Add</>}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Selected ({selectedItems.length})</span>
                </div>
                {selectedItems.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    No items selected
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-800 truncate">{item.itemName}</div>
                            <div className="text-xs text-slate-500 truncate">{item.company} · {item.packing}</div>
                          </div>
                          <button onClick={() => removeItemFromQuotation(item.id)} className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Qty</div>
                            <input type="number" min="1" value={item.quantity} onChange={e => updateItemQuantity(item.id, e.target.value)}
                              className="w-full px-2 py-1 rounded border border-slate-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Price (PKR)</div>
                            <input type="number" min="0" step="0.01" value={item.price} onChange={e => updateItemPrice(item.id, e.target.value)} placeholder="0.00"
                              className="w-full px-2 py-1 rounded border border-slate-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Column 2: Customer & Quotation Info ──────────────────────── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Package size={15} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-slate-700">Quotation Details</h2>
            </div>
            <div className="p-5 space-y-4">
              <SectionHeader label="Customer Information" />
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Name</label>
                    <Input value={customerInfo.name} onChange={e => setCustomerInfo(p => ({ ...p, name: e.target.value }))} placeholder="Customer name" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Company</label>
                    <Input value={customerInfo.company} onChange={e => setCustomerInfo(p => ({ ...p, company: e.target.value }))} placeholder="Company name" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Email</label>
                    <Input type="email" value={customerInfo.email} onChange={e => setCustomerInfo(p => ({ ...p, email: e.target.value }))} placeholder="customer@email.com" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Phone</label>
                    <Input type="tel" value={customerInfo.phone} onChange={e => setCustomerInfo(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" />
                  </div>
                </div>
              </div>

              <SectionHeader label="Quotation Info" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Quotation No.</label>
                  <Input value={quotationInfo.quotationNumber} onChange={e => setQuotationInfo(p => ({ ...p, quotationNumber: e.target.value }))} placeholder="Q-2025-001" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Date</label>
                  <Input value={quotationInfo.date} onChange={e => setQuotationInfo(p => ({ ...p, date: e.target.value }))} placeholder="DD-MM-YYYY" />
                </div>
              </div>

              <Button onClick={handleCreateQuotation} disabled={loading || selectedItems.length === 0} className="w-full mt-2">
                {loading ? <Loading size="sm" text="" /> : <FileText size={14} />}
                Create Quotation {selectedItems.length > 0 && `(${selectedItems.length} items)`}
              </Button>
            </div>
          </div>

          {/* ── Recent Quotations + Detail ───────────────────────────────── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <FileText size={15} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-slate-700">Recent Quotations</h2>
            </div>
            <div className="flex min-h-0">
              {/* List */}
              <div className="flex-1 overflow-y-auto p-3 max-h-[600px] border-r border-slate-100">
                {quotationsLoading ? (
                  <div className="flex items-center justify-center py-8"><Loading size="sm" text="Loading…" /></div>
                ) : quotations.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg m-2">No quotations found</div>
                ) : (
                  <div className="space-y-2">
                    {quotations.map((q) => (
                      <div key={q.id}
                        onClick={() => handleSelectQuotation(q.id)}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${selectedQuotationId === q.id ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800">{q.quotationNumber || `#${q.id}`}</div>
                            <div className="text-xs text-slate-500 mt-0.5 space-y-0.5">
                              {q.customerName && <div>{q.customerName}</div>}
                              {q.customerCompany && <div className="text-slate-400">{q.customerCompany}</div>}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs">{q.itemsCount} items</span>
                                {parseFloat(q.totalAmount) > 0 && <span className="font-medium text-slate-700">PKR {parseFloat(q.totalAmount).toFixed(0)}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <button onClick={e => { e.stopPropagation(); handleDownloadQuotation(q.id); }}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-medium transition-colors">
                              <Download size={11} /> Download
                            </button>
                            <button onClick={e => { e.stopPropagation(); openDeliveryChallanModal(q.id); }}
                              disabled={challanLoading === q.id}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors disabled:opacity-50">
                              {challanLoading === q.id ? '…' : 'DC'}
                            </button>
                            <button onClick={e => { e.stopPropagation(); openBillModal(q); }}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors">
                              Bill & DC
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detail panel */}
              <div className="w-96 overflow-y-auto p-3 max-h-[600px]">
                {!selectedQuotationId ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center px-4">
                    Click a quotation to see its items
                  </div>
                ) : quotationDetailLoading ? (
                  <div className="flex items-center justify-center py-8"><Loading size="sm" text="Loading…" /></div>
                ) : selectedQuotationDetail ? (
                  <div>
                    <div className="mb-3">
                      <div className="text-sm font-semibold text-slate-800">{selectedQuotationDetail.quotationNumber || `#${selectedQuotationDetail.id}`}</div>
                      {selectedQuotationDetail.customerName && <div className="text-xs text-slate-500 mt-0.5">{selectedQuotationDetail.customerName}</div>}
                      {selectedQuotationDetail.customerCompany && <div className="text-xs text-slate-400">{selectedQuotationDetail.customerCompany}</div>}
                    </div>
                    <div className="space-y-1">
                      {(selectedQuotationDetail.items || []).map((item, i) => {
                        const expanded = !!expandedDetailItems[item.id];
                        const hasInventoryData = item.usedFromInventory !== null && item.usedFromInventory !== undefined;
                        return (
                          <div key={item.id} className="border-b border-slate-100 last:border-none">
                            <div className="flex items-start gap-1 text-xs py-1.5">
                              <button
                                onClick={() => setExpandedDetailItems(p => ({ ...p, [item.id]: !p[item.id] }))}
                                className="text-slate-400 hover:text-slate-600 shrink-0 mt-0.5 transition-colors"
                                title="Show inventory info"
                              >
                                {expanded ? '▼' : '▶'}
                              </button>
                              <span className="text-slate-400 w-5 shrink-0">{i + 1}.</span>
                              <span className="flex-1 text-slate-700">{item.description}</span>
                              <span className="text-slate-500 shrink-0">×{item.quantity}</span>
                              {item.unitPrice > 0 && <span className="text-slate-600 font-medium shrink-0 ml-1">PKR {parseFloat(item.unitPrice).toFixed(0)}</span>}
                            </div>
                            {expanded && (
                              <div className="ml-7 mb-2 flex items-center gap-3">
                                {hasInventoryData ? (
                                  <>
                                    <label className="flex items-center gap-1.5 text-xs text-slate-500 select-none">
                                      <input type="checkbox" checked={!!item.usedFromInventory} disabled />
                                      Used from inventory
                                    </label>
                                    {!item.usedFromInventory && item.sourceNote && (
                                      <input
                                        className="rate-details-input flex-1 text-xs"
                                        value={item.sourceNote}
                                        disabled
                                        readOnly
                                      />
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">No inventory info recorded</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delivery Challan modal ──────────────────────────────────────────── */}
      {deliveryChallanModal && createPortal(
        <div className="rate-details-overlay" onClick={closeDeliveryChallanModal}>
          <div className="rate-details-modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <h3 className="rate-details-title">Delivery Challan — PO Details</h3>
            <div className="rate-details-section">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">PO Number *</label>
                  <input type="text" value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="e.g. CUI-4382" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">PO Date *</label>
                  <input type="text" value={poDate} onChange={e => setPoDate(e.target.value)} placeholder="DD-MM-YYYY" className={inp} />
                </div>
              </div>
            </div>
            <div className="rate-details-actions">
              <Button onClick={handleCreateDeliveryChallan} disabled={challanLoading || !poNumber.trim() || !poDate.trim()}>
                {challanLoading ? 'Creating…' : 'Create Delivery Challan'}
              </Button>
              <Button variant="secondary" onClick={closeDeliveryChallanModal}>Cancel</Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Bill & DC modal ─────────────────────────────────────────────────── */}
      {billModal && createPortal(
        <div className="rate-details-overlay" onClick={closeBillModal}>
          <div className="rate-details-modal" style={{ maxWidth: '980px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 className="rate-details-title">Bill & DC Generator</h3>

            {billFetching ? (
              <div className="flex items-center justify-center py-12"><Loading size="md" text="Loading quotation…" /></div>
            ) : (
              <>
                {/* Customer */}
                <div className="rate-details-section">
                  <div className="rate-details-subtitle">Customer</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className="text-xs text-slate-400">Contact Name</label>
                      <input className={inp} value={billCustomer.name} onChange={e => setBillCustomer(p => ({ ...p, name: e.target.value }))} placeholder="Dr. Naima Amin" /></div>
                    <div className="col-span-2"><label className="text-xs text-slate-400">Institution</label>
                      <input className={inp} value={billCustomer.institution} onChange={e => setBillCustomer(p => ({ ...p, institution: e.target.value }))} placeholder="COMSATS University..." /></div>
                    <div><label className="text-xs text-slate-400">City</label>
                      <input className={inp} value={billCustomer.city} onChange={e => setBillCustomer(p => ({ ...p, city: e.target.value }))} placeholder="LAHORE" /></div>
                    <div><label className="text-xs text-slate-400">STRN</label>
                      <input className={inp} value={billCustomer.strn} onChange={e => setBillCustomer(p => ({ ...p, strn: e.target.value }))} /></div>
                    <div><label className="text-xs text-slate-400">NTN</label>
                      <input className={inp} value={billCustomer.ntn} onChange={e => setBillCustomer(p => ({ ...p, ntn: e.target.value }))} /></div>
                  </div>
                </div>

                {/* Transaction */}
                <div className="rate-details-section">
                  <div className="rate-details-subtitle">Transaction</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className="text-xs text-slate-400">Date</label>
                      <input className={inp} value={billTransaction.date} onChange={e => setBillTransaction(p => ({ ...p, date: e.target.value }))} placeholder="14/11/25" /></div>
                    <div><label className="text-xs text-slate-400">PO Number</label>
                      <input className={inp} value={billTransaction.poNumber} onChange={e => setBillTransaction(p => ({ ...p, poNumber: e.target.value }))} placeholder="CUI-4382" /></div>
                    <div><label className="text-xs text-slate-400">PO Date</label>
                      <input className={inp} value={billTransaction.poDate} onChange={e => setBillTransaction(p => ({ ...p, poDate: e.target.value }))} placeholder="14-11-2025" /></div>
                    <div><label className="text-xs text-slate-400">DC Number</label>
                      <input className={inp} value={billTransaction.dcNumber} onChange={e => setBillTransaction(p => ({ ...p, dcNumber: e.target.value }))} placeholder="DC/USSC-173-2025" /></div>
                    <div><label className="text-xs text-slate-400">Invoice No.</label>
                      <input className={inp} value={billTransaction.invoiceNumber} onChange={e => setBillTransaction(p => ({ ...p, invoiceNumber: e.target.value }))} placeholder="USSC/173/25" /></div>
                    <div><label className="text-xs text-slate-400">GST Rate (%)</label>
                      <input className={inp} type="number" value={billGstRate} onChange={e => setBillGstRate(e.target.value)} min={0} max={100} /></div>
                  </div>
                </div>

                {/* Firm */}
                <div className="rate-details-section">
                  <div className="rate-details-subtitle">Firm (Seller)</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2"><label className="text-xs text-slate-400">Name</label>
                      <input className={inp} value={billFirm.name} onChange={e => setBillFirm(p => ({ ...p, name: e.target.value }))} /></div>
                    <div><label className="text-xs text-slate-400">STRN</label>
                      <input className={inp} value={billFirm.strn} onChange={e => setBillFirm(p => ({ ...p, strn: e.target.value }))} /></div>
                    <div><label className="text-xs text-slate-400">NTN</label>
                      <input className={inp} value={billFirm.ntn} onChange={e => setBillFirm(p => ({ ...p, ntn: e.target.value }))} /></div>
                    <div><label className="text-xs text-slate-400">TFN</label>
                      <input className={inp} value={billFirm.tfn} onChange={e => setBillFirm(p => ({ ...p, tfn: e.target.value }))} /></div>
                    <div><label className="text-xs text-slate-400">Bank Account Title</label>
                      <input className={inp} value={billFirm.bankAccountTitle} onChange={e => setBillFirm(p => ({ ...p, bankAccountTitle: e.target.value }))} /></div>
                    <div><label className="text-xs text-slate-400">Bank Name</label>
                      <input className={inp} value={billFirm.bankName} onChange={e => setBillFirm(p => ({ ...p, bankName: e.target.value }))} /></div>
                    <div><label className="text-xs text-slate-400">Bank Branch</label>
                      <input className={inp} value={billFirm.bankBranch} onChange={e => setBillFirm(p => ({ ...p, bankBranch: e.target.value }))} /></div>
                  </div>
                </div>

                {/* Items */}
                <div className="rate-details-section">
                  <div className="flex items-center justify-between mb-2">
                    <div className="rate-details-subtitle" style={{ margin: 0 }}>Items</div>
                    <button onClick={addBillItem} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                      <Plus size={12} /> Add Item
                    </button>
                  </div>
                  <div className="table-wrap">
                    <table className="bill-table">
                      <thead>
                        <tr>
                          <th className="col-num">#</th>
                          <th className="col-desc">Description</th>
                          <th className="col-qty">Qty</th>
                          <th className="col-price">Unit Price</th>
                          <th className="col-amount">Excl. GST</th>
                          <th className="col-amount">GST</th>
                          <th className="col-amount">Total</th>
                          <th className="col-remove"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {billItems.map((item, idx) => {
                          const qty = Number(item.quantity);
                          const price = Number(item.unitPrice);
                          const excl = qty * price;
                          const tax = Math.round(excl * billGstRate) / 100;
                          return (
                            <React.Fragment key={idx}>
                            <tr>
                              <td className="col-num">{idx + 1}</td>
                              <td className="col-desc">
                                <input className="rate-details-input" value={item.description}
                                  onChange={e => updateBillItem(idx, 'description', e.target.value)} placeholder="Item description" />
                              </td>
                              <td className="col-qty">
                                <input className="rate-details-input" style={{ textAlign: 'center' }} type="number" value={item.quantity}
                                  onChange={e => updateBillItem(idx, 'quantity', e.target.value)} min={1} />
                              </td>
                              <td className="col-price">
                                <input className="rate-details-input" style={{ textAlign: 'right' }} type="number" value={item.unitPrice}
                                  onChange={e => updateBillItem(idx, 'unitPrice', e.target.value)} min={0} step="0.01" />
                              </td>
                              <td className="col-amount">{excl.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="col-amount">{tax.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="col-amount">{(excl + tax).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="col-remove">
                                {billItems.length > 1 && (
                                  <button className="remove-btn" onClick={() => removeBillItem(idx)} title="Remove">✕</button>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td></td>
                              <td colSpan={7} style={{ paddingBottom: '6px' }}>
                                <div className="flex items-center gap-3">
                                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                                    <input type="checkbox" checked={!!item.usedFromInventory}
                                      onChange={e => updateBillItem(idx, 'usedFromInventory', e.target.checked)} />
                                    Used from inventory
                                  </label>
                                  {!item.usedFromInventory && (
                                    <input
                                      className="rate-details-input flex-1"
                                      placeholder="Ye item kha se li or kitne ki li"
                                      value={item.sourceNote || ''}
                                      onChange={e => updateBillItem(idx, 'sourceNote', e.target.value)}
                                    />
                                  )}
                                </div>
                              </td>
                            </tr>
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'right' }}>Grand Total</td>
                          <td className="col-amount">{billGrandExcl.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="col-amount">{billGrandTax.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="col-amount">{billGrandTotal.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Amount in Words */}
                <div className="rate-details-section">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="rate-details-subtitle" style={{ margin: 0 }}>Amount in Words</div>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer text-slate-600">
                      <input type="checkbox" checked={billAutoWords} onChange={e => setBillAutoWords(e.target.checked)} />
                      Auto-calculate
                    </label>
                  </div>
                  {billAutoWords ? (
                    <p className="text-sm text-slate-700 italic bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-200">{billAmountInWords || '—'}</p>
                  ) : (
                    <input className={inp} value={billManualWords} onChange={e => setBillManualWords(e.target.value)} placeholder="Rs. ... only." />
                  )}
                </div>

                <div className="rate-details-actions">
                  <Button onClick={handleGenerateBillAndDC} disabled={billGenerating}>
                    {billGenerating ? 'Generating…' : 'Generate Bill & DC'}
                  </Button>
                  <Button variant="secondary" onClick={closeBillModal}>Cancel</Button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
