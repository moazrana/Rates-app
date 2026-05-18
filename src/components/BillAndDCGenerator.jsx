import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';

const DEFAULT_FIRM = {
  name: 'Universal Scientific Supply Company',
  strn: '030484001596-4',
  ntn: '3004934-2',
  tfn: '9013701-9',
  bankAccountTitle: 'Universal Scientific Supply Company',
  bankName: 'Bank of Punjab',
  bankBranch: 'Anarkali Branch - Lahore',
};

const emptyItem = () => ({ description: '', quantity: 1, unitPrice: 0 });

const toWords = (amount) => {
  if (!amount || isNaN(amount)) return '';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };
  const rounded = Math.round(amount);
  return `Rs. ${convert(rounded)} only.`;
};

export default function BillAndDCGenerator({ generateBillAndDC, loading }) {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '/');

  const [customer, setCustomer] = useState({ name: '', institution: '', city: '', strn: '', ntn: '' });
  const [firm, setFirm] = useState({ ...DEFAULT_FIRM });
  const [transaction, setTransaction] = useState({ date: today, poNumber: '', poDate: '', dcNumber: '', invoiceNumber: '' });
  const [items, setItems] = useState([emptyItem()]);
  const [gstRate, setGstRate] = useState(18);
  const [autoWords, setAutoWords] = useState(true);
  const [manualWords, setManualWords] = useState('');

  const updateCustomer = (k, v) => setCustomer(p => ({ ...p, [k]: v }));
  const updateFirm = (k, v) => setFirm(p => ({ ...p, [k]: v }));
  const updateTransaction = (k, v) => setTransaction(p => ({ ...p, [k]: v }));
  const updateItem = (idx, k, v) => setItems(p => p.map((it, i) => i === idx ? { ...it, [k]: v } : it));
  const addItem = () => setItems(p => [...p, emptyItem()]);
  const removeItem = (idx) => setItems(p => p.filter((_, i) => i !== idx));

  const grandExcl = items.reduce((s, it) => s + Number(it.quantity) * Number(it.unitPrice), 0);
  const grandTax = Math.round(grandExcl * gstRate) / 100;
  const grandTotal = grandExcl + grandTax;

  const amountInWords = autoWords ? toWords(grandTotal) : manualWords;

  const handleGenerate = useCallback(async () => {
    const payload = {
      customer,
      firm,
      transaction,
      items: items.map(it => ({ ...it, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
      amountInWords,
      gstRate: Number(gstRate),
    };
    try {
      const blob = await generateBillAndDC(payload);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bill-dc-${transaction.dcNumber || 'draft'}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }, [customer, firm, transaction, items, amountInWords, gstRate, generateBillAndDC]);

  const inputCls = 'border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400';

  return (
    <div className="space-y-4 max-w-5xl mx-auto p-4">
      <h2 className="text-xl font-bold text-gray-800">Bill &amp; DC Generator</h2>

      {/* Customer Info */}
      <Card>
        <div className="px-4 pt-4 pb-1 font-semibold text-gray-700 text-base">Customer Information</div>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-gray-500">Contact Name</Label>
              <input className={inputCls} value={customer.name} onChange={e => updateCustomer('name', e.target.value)} placeholder="Dr. Naima Amin" /></div>
            <div className="col-span-2"><Label className="text-xs text-gray-500">Institution</Label>
              <input className={inputCls} value={customer.institution} onChange={e => updateCustomer('institution', e.target.value)} placeholder="COMSATS University Islamabad (CUI), Lahore Campus" /></div>
            <div><Label className="text-xs text-gray-500">City</Label>
              <input className={inputCls} value={customer.city} onChange={e => updateCustomer('city', e.target.value)} placeholder="LAHORE." /></div>
            <div><Label className="text-xs text-gray-500">Customer STRN</Label>
              <input className={inputCls} value={customer.strn} onChange={e => updateCustomer('strn', e.target.value)} placeholder="300121344316" /></div>
            <div><Label className="text-xs text-gray-500">Customer NTN</Label>
              <input className={inputCls} value={customer.ntn} onChange={e => updateCustomer('ntn', e.target.value)} placeholder="1213443-7" /></div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Info */}
      <Card>
        <div className="px-4 pt-4 pb-1 font-semibold text-gray-700 text-base">Transaction Details</div>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs text-gray-500">Date</Label>
              <input className={inputCls} value={transaction.date} onChange={e => updateTransaction('date', e.target.value)} placeholder="14/11/25" /></div>
            <div><Label className="text-xs text-gray-500">PO Number</Label>
              <input className={inputCls} value={transaction.poNumber} onChange={e => updateTransaction('poNumber', e.target.value)} placeholder="CUI-4382" /></div>
            <div><Label className="text-xs text-gray-500">PO Date</Label>
              <input className={inputCls} value={transaction.poDate} onChange={e => updateTransaction('poDate', e.target.value)} placeholder="14-11-2025" /></div>
            <div><Label className="text-xs text-gray-500">DC Number</Label>
              <input className={inputCls} value={transaction.dcNumber} onChange={e => updateTransaction('dcNumber', e.target.value)} placeholder="DC/USSC-173-2025" /></div>
            <div><Label className="text-xs text-gray-500">Sales Tax Invoice No.</Label>
              <input className={inputCls} value={transaction.invoiceNumber} onChange={e => updateTransaction('invoiceNumber', e.target.value)} placeholder="USSC/173/25" /></div>
            <div><Label className="text-xs text-gray-500">GST Rate (%)</Label>
              <input className={inputCls} type="number" value={gstRate} onChange={e => setGstRate(e.target.value)} min={0} max={100} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Firm Info */}
      <Card>
        <div className="px-4 pt-4 pb-1 font-semibold text-gray-700 text-base">Firm Information (Seller)</div>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs text-gray-500">Firm Name</Label>
              <input className={inputCls} value={firm.name} onChange={e => updateFirm('name', e.target.value)} /></div>
            <div><Label className="text-xs text-gray-500">STRN</Label>
              <input className={inputCls} value={firm.strn} onChange={e => updateFirm('strn', e.target.value)} /></div>
            <div><Label className="text-xs text-gray-500">NTN</Label>
              <input className={inputCls} value={firm.ntn} onChange={e => updateFirm('ntn', e.target.value)} /></div>
            <div><Label className="text-xs text-gray-500">TFN</Label>
              <input className={inputCls} value={firm.tfn} onChange={e => updateFirm('tfn', e.target.value)} /></div>
            <div><Label className="text-xs text-gray-500">Bank Account Title</Label>
              <input className={inputCls} value={firm.bankAccountTitle} onChange={e => updateFirm('bankAccountTitle', e.target.value)} /></div>
            <div><Label className="text-xs text-gray-500">Bank Name</Label>
              <input className={inputCls} value={firm.bankName} onChange={e => updateFirm('bankName', e.target.value)} /></div>
            <div><Label className="text-xs text-gray-500">Bank Branch</Label>
              <input className={inputCls} value={firm.bankBranch} onChange={e => updateFirm('bankBranch', e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <div className="px-4 pt-4 pb-1 flex items-center justify-between">
          <span className="font-semibold text-gray-700 text-base">Items</span>
          <Button size="sm" onClick={addItem} variant="outline">+ Add Item</Button>
        </div>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs">
                  <th className="px-2 py-1 text-left border border-gray-200 w-6">#</th>
                  <th className="px-2 py-1 text-left border border-gray-200">Description</th>
                  <th className="px-2 py-1 text-center border border-gray-200 w-20">Qty</th>
                  <th className="px-2 py-1 text-right border border-gray-200 w-28">Unit Price (excl. GST)</th>
                  <th className="px-2 py-1 text-right border border-gray-200 w-24">Total (excl.)</th>
                  <th className="px-2 py-1 text-right border border-gray-200 w-24">GST ({gstRate}%)</th>
                  <th className="px-2 py-1 text-right border border-gray-200 w-24">Total (incl.)</th>
                  <th className="px-2 py-1 border border-gray-200 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const qty = Number(item.quantity);
                  const price = Number(item.unitPrice);
                  const excl = qty * price;
                  const tax = Math.round(excl * gstRate) / 100;
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-2 py-1 border border-gray-200 text-center text-gray-500">{idx + 1}</td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input className="w-full border-0 outline-none bg-transparent text-sm" value={item.description}
                          onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Item description" />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input className="w-full border-0 outline-none bg-transparent text-sm text-center" type="number" value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', e.target.value)} min={1} />
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        <input className="w-full border-0 outline-none bg-transparent text-sm text-right" type="number" value={item.unitPrice}
                          onChange={e => updateItem(idx, 'unitPrice', e.target.value)} min={0} step="0.01" />
                      </td>
                      <td className="px-2 py-1 border border-gray-200 text-right text-gray-700">{excl.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-2 py-1 border border-gray-200 text-right text-gray-700">{tax.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-2 py-1 border border-gray-200 text-right font-medium text-gray-800">{(excl + tax).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-2 py-1 border border-gray-200 text-center">
                        {items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-xs font-bold" title="Remove item">✕</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold text-sm">
                  <td colSpan={4} className="px-2 py-2 border border-gray-200 text-right text-gray-600">Grand Total</td>
                  <td className="px-2 py-2 border border-gray-200 text-right">{grandExcl.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-2 py-2 border border-gray-200 text-right">{grandTax.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-2 py-2 border border-gray-200 text-right">{grandTotal.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="border border-gray-200"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Amount in Words */}
      <Card>
        <div className="px-4 pt-4 pb-1 font-semibold text-gray-700 text-base">Amount in Words</div>
        <CardContent>
          <div className="flex items-center gap-3 mb-2">
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input type="checkbox" checked={autoWords} onChange={e => setAutoWords(e.target.checked)} className="rounded" />
              Auto-generate
            </label>
          </div>
          {autoWords ? (
            <p className="text-sm text-gray-700 italic bg-gray-50 rounded px-3 py-2 border">{amountInWords || '—'}</p>
          ) : (
            <input className={inputCls} value={manualWords} onChange={e => setManualWords(e.target.value)} placeholder="Rs. ... only." />
          )}
        </CardContent>
      </Card>

      {/* Generate */}
      <div className="flex justify-end">
        <Button onClick={handleGenerate} disabled={loading} className="px-6">
          {loading ? 'Generating…' : 'Generate Bill & DC'}
        </Button>
      </div>
    </div>
  );
}
