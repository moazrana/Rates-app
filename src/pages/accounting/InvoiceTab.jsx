import { useState, useEffect, useCallback } from 'react';
import { Plus, X, ChevronRight, Send, Ban, CreditCard, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';
import { Card, CardContent } from '../../components/ui/card.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Loading } from '../../components/ui/loading.jsx';
import Select from '../../components/ui/select.jsx';
import {
  getCustomers,
  getInvoices,
  getInvoice,
  createInvoice,
  postInvoice,
  cancelInvoice,
  getPayments,
  recordPayment,
} from '../../services/accountingService.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_BADGE = {
  DRAFT:     { bg: '#E0E0E0', text: '#424242' },
  SENT:      { bg: '#1565C0', text: '#fff' },
  PARTIAL:   { bg: '#E65100', text: '#fff' },
  PAID:      { bg: '#1A6B3C', text: '#fff' },
  OVERDUE:   { bg: '#C62828', text: '#fff' },
  CANCELLED: { bg: '#424242', text: '#fff' },
};

const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'];

const CAN_POST   = s => s === 'DRAFT';
const CAN_CANCEL = s => ['DRAFT', 'SENT', 'PARTIAL'].includes(s);
const CAN_PAY    = s => ['SENT', 'PARTIAL', 'OVERDUE'].includes(s);

function fmt(n) {
  return parseFloat(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function today() { return new Date().toISOString().slice(0, 10); }

function StatusBadge({ status }) {
  const s = STATUS_BADGE[status] ?? STATUS_BADGE.DRAFT;
  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {status}
    </span>
  );
}

// ── Empty line ────────────────────────────────────────────────────────────────
function emptyLine() {
  return { description: '', quantity: 1, unit_price: '', discount_pct: 0, cogs_amount: '' };
}

// ── Payment Form ──────────────────────────────────────────────────────────────
function PaymentForm({ invoiceId, balanceDue, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    payment_date: today(),
    amount: balanceDue > 0 ? String(balanceDue) : '',
    payment_method: 'CASH',
    reference_no: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await recordPayment({ invoice_id: invoiceId, ...form, amount: parseFloat(form.amount) });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border border-blue-200 bg-blue-50/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-slate-700">Record Payment</span>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
      </div>
      {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1.5">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Date</Label>
          <Input type="date" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} required />
        </div>
        <div>
          <Label>Amount (max {fmt(balanceDue)})</Label>
          <Input
            type="number" step="0.01" min="0.01" max={balanceDue}
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label>Method</Label>
          <Select
            value={form.payment_method}
            onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
            options={PAYMENT_METHODS.map(m => ({ value: m, label: m.replace('_', ' ') }))}
          />
        </div>
        <div>
          <Label>Reference No</Label>
          <Input value={form.reference_no} onChange={e => setForm(f => ({ ...f, reference_no: e.target.value }))} placeholder="Cheque / bank ref" />
        </div>
        <div className="col-span-2">
          <Label>Notes</Label>
          <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}><CreditCard size={13} /> {saving ? 'Saving...' : 'Record Payment'}</Button>
      </div>
    </form>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function InvoiceTab() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customer_id: '', invoice_date: today(), due_date: '', discount_amount: 0,
    tax_rate: 0, payment_terms: '', notes: '',
  });
  const [lines, setLines] = useState([emptyLine()]);
  const [saving, setSaving] = useState(false);

  // Detail panel
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [showPayForm, setShowPayForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getInvoices(1, 50, statusFilter);
      setInvoices(Array.isArray(data) ? data : data.data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadInvoices();
    getCustomers().then(d => setCustomers(Array.isArray(d) ? d : d.data ?? [])).catch(() => {});
  }, [loadInvoices]);

  async function loadDetail(id) {
    try {
      setDetailLoading(true);
      const [inv, pmts] = await Promise.all([getInvoice(id), getPayments(id)]);
      setDetail(inv);
      setPayments(Array.isArray(pmts) ? pmts : pmts.data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setDetailLoading(false);
    }
  }

  function openDetail(id) {
    setSelectedId(id);
    setDetail(null);
    setShowPayForm(false);
    loadDetail(id);
  }

  function closeDetail() {
    setSelectedId(null);
    setDetail(null);
  }

  // Line management
  function updateLine(idx, field, value) {
    setLines(ls => ls.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  }
  function addLine() { setLines(ls => [...ls, emptyLine()]); }
  function removeLine(idx) { setLines(ls => ls.filter((_, i) => i !== idx)); }

  // Derived totals
  const lineSubtotal = lines.reduce((s, l) => {
    const qty = parseFloat(l.quantity) || 0;
    const price = parseFloat(l.unit_price) || 0;
    const disc = parseFloat(l.discount_pct) || 0;
    return s + qty * price * (1 - disc / 100);
  }, 0);
  const discount = parseFloat(form.discount_amount) || 0;
  const taxRate = parseFloat(form.tax_rate) || 0;
  const taxable = lineSubtotal - discount;
  const tax = taxable * taxRate / 100;
  const total = taxable + tax;

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await createInvoice({
        ...form,
        customer_id: form.customer_id,
        discount_amount: discount,
        tax_rate: taxRate,
        line_items: lines.filter(l => l.description).map(l => ({
          description: l.description,
          quantity: parseFloat(l.quantity) || 0,
          unit_price: parseFloat(l.unit_price) || 0,
          discount_pct: parseFloat(l.discount_pct) || 0,
          cogs_amount: parseFloat(l.cogs_amount) || 0,
        })),
      });
      setShowForm(false);
      setLines([emptyLine()]);
      setForm({ customer_id: '', invoice_date: today(), due_date: '', discount_amount: 0, tax_rate: 0, payment_terms: '', notes: '' });
      await loadInvoices();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePost(id) {
    try {
      setActionLoading(true);
      await postInvoice(id);
      await Promise.all([loadInvoices(), loadDetail(id)]);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel(id) {
    if (!window.confirm('Cancel this invoice?')) return;
    try {
      setActionLoading(true);
      await cancelInvoice(id);
      await Promise.all([loadInvoices(), loadDetail(id)]);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  const customerOptions = customers.map(c => ({ value: c.id, label: c.name }));
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...['DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'].map(s => ({ value: s, label: s })),
  ];

  const balanceDue = detail ? parseFloat(detail.total_amount || 0) - parseFloat(detail.amount_paid || 0) : 0;

  return (
    <div className="flex gap-5 h-full">
      {/* Left panel */}
      <div className={`flex flex-col gap-5 ${selectedId ? 'w-1/2' : 'w-full'}`}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-slate-800 flex-1">Invoices</h2>
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            options={statusOptions}
            className="w-44"
          />
          <Button onClick={() => setShowForm(v => !v)} variant={showForm ? 'secondary' : 'primary'}>
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Cancel' : 'New Invoice'}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
            {error}
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <Card>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-5">
                {/* Header fields */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label>Customer *</Label>
                    <Select
                      value={form.customer_id}
                      onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
                      placeholder="Select customer..."
                      options={customerOptions}
                    />
                  </div>
                  <div>
                    <Label>Invoice Date *</Label>
                    <Input type="date" value={form.invoice_date} onChange={e => setForm(f => ({ ...f, invoice_date: e.target.value }))} required />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Tax Rate (%)</Label>
                    <Input type="number" min="0" step="0.01" value={form.tax_rate} onChange={e => setForm(f => ({ ...f, tax_rate: e.target.value }))} placeholder="0" />
                  </div>
                  <div>
                    <Label>Discount (flat)</Label>
                    <Input type="number" min="0" step="0.01" value={form.discount_amount} onChange={e => setForm(f => ({ ...f, discount_amount: e.target.value }))} placeholder="0.00" />
                  </div>
                  <div>
                    <Label>Payment Terms</Label>
                    <Input value={form.payment_terms} onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))} placeholder="e.g. Net 30" />
                  </div>
                  <div className="col-span-2">
                    <Label>Notes</Label>
                    <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
                  </div>
                </div>

                {/* Line items */}
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-2">Line Items</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-500 border-b border-slate-100">
                          <th className="py-2 text-left font-medium w-4/12">Description</th>
                          <th className="py-2 px-2 text-right font-medium w-1/12">Qty</th>
                          <th className="py-2 px-2 text-right font-medium w-2/12">Unit Price</th>
                          <th className="py-2 px-2 text-right font-medium w-1/12">Disc %</th>
                          <th className="py-2 px-2 text-right font-medium w-2/12">Line Total</th>
                          <th className="py-2 w-1/12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((line, idx) => {
                          const qty = parseFloat(line.quantity) || 0;
                          const price = parseFloat(line.unit_price) || 0;
                          const disc = parseFloat(line.discount_pct) || 0;
                          const lineTotal = qty * price * (1 - disc / 100);
                          return (
                            <tr key={idx} className="border-b border-slate-50">
                              <td className="py-1.5 pr-2">
                                <Input value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)} placeholder="Item description" className="py-1.5" />
                              </td>
                              <td className="py-1.5 px-2">
                                <Input type="number" min="0" step="1" value={line.quantity} onChange={e => updateLine(idx, 'quantity', e.target.value)} className="py-1.5 text-right" />
                              </td>
                              <td className="py-1.5 px-2">
                                <Input type="number" min="0" step="0.01" value={line.unit_price} onChange={e => updateLine(idx, 'unit_price', e.target.value)} placeholder="0.00" className="py-1.5 text-right" />
                              </td>
                              <td className="py-1.5 px-2">
                                <Input type="number" min="0" max="100" step="0.01" value={line.discount_pct} onChange={e => updateLine(idx, 'discount_pct', e.target.value)} placeholder="0" className="py-1.5 text-right" />
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono text-slate-700">{fmt(lineTotal)}</td>
                              <td className="py-1.5 pl-2">
                                {lines.length > 1 && (
                                  <button type="button" onClick={() => removeLine(idx)} className="text-slate-400 hover:text-red-500">
                                    <X size={14} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" onClick={addLine} className="mt-2 text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                    <Plus size={13} /> Add Line
                  </button>
                </div>

                {/* Totals summary */}
                <div className="flex justify-end">
                  <div className="text-sm space-y-1 min-w-56">
                    <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-mono">{fmt(lineSubtotal)}</span></div>
                    {discount > 0 && <div className="flex justify-between text-slate-600"><span>Discount</span><span className="font-mono">-{fmt(discount)}</span></div>}
                    {taxRate > 0 && <div className="flex justify-between text-slate-600"><span>Tax ({taxRate}%)</span><span className="font-mono">{fmt(tax)}</span></div>}
                    <div className="flex justify-between font-semibold text-slate-800 border-t border-slate-200 pt-1"><span>Total</span><span className="font-mono">{fmt(total)}</span></div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving || !form.customer_id}>
                    {saving ? 'Creating...' : 'Create Invoice'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Invoice list */}
        <Card>
          {loading ? (
            <div className="flex justify-center py-10"><Loading /></div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">No invoices found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-3 font-medium">Invoice No</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Due Date</th>
                    <th className="px-5 py-3 font-medium text-right">Total</th>
                    <th className="px-5 py-3 font-medium text-right">Paid</th>
                    <th className="px-5 py-3 font-medium text-right">Balance</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.map(inv => {
                    const balance = parseFloat(inv.total_amount || 0) - parseFloat(inv.amount_paid || 0);
                    return (
                      <tr
                        key={inv.id}
                        className={`cursor-pointer hover:bg-slate-50/70 ${selectedId === inv.id ? 'bg-blue-50/40' : ''}`}
                        onClick={() => openDetail(inv.id)}
                      >
                        <td className="px-5 py-3 font-mono text-slate-600 text-xs">{inv.invoice_no}</td>
                        <td className="px-5 py-3 text-slate-800">{inv.customer?.name || '—'}</td>
                        <td className="px-5 py-3 text-slate-600">{inv.invoice_date?.slice(0, 10)}</td>
                        <td className="px-5 py-3 text-slate-600">{inv.due_date?.slice(0, 10) || '—'}</td>
                        <td className="px-5 py-3 text-right font-mono text-slate-700">{fmt(inv.total_amount)}</td>
                        <td className="px-5 py-3 text-right font-mono text-slate-500">{fmt(inv.amount_paid)}</td>
                        <td className="px-5 py-3 text-right font-mono font-semibold text-slate-800">{fmt(balance)}</td>
                        <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                        <td className="px-5 py-3 text-right"><ChevronRight size={14} className="text-slate-400 inline" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Detail panel */}
      {selectedId && (
        <div className="w-1/2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800">Invoice Detail</h3>
            <button onClick={closeDetail} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>

          <Card className="flex-1 overflow-auto">
            {detailLoading ? (
              <div className="flex justify-center py-10"><Loading /></div>
            ) : detail ? (
              <CardContent className="space-y-5">
                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">Invoice No</span>
                    <span className="font-mono text-slate-800">{detail.invoice_no}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Status</span>
                    <StatusBadge status={detail.status} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Customer</span>
                    <span className="text-slate-800">{detail.customer?.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Date / Due</span>
                    <span className="text-slate-800">{detail.invoice_date?.slice(0, 10)} / {detail.due_date?.slice(0, 10) || '—'}</span>
                  </div>
                  {detail.payment_terms && (
                    <div>
                      <span className="text-xs text-slate-500 block">Terms</span>
                      <span className="text-slate-800">{detail.payment_terms}</span>
                    </div>
                  )}
                  {detail.notes && (
                    <div className="col-span-2">
                      <span className="text-xs text-slate-500 block">Notes</span>
                      <span className="text-slate-700">{detail.notes}</span>
                    </div>
                  )}
                </div>

                {/* Line items */}
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-2">Line Items</div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 border-b border-slate-100">
                        <th className="py-2 text-left font-medium">Description</th>
                        <th className="py-2 px-2 text-right font-medium">Qty</th>
                        <th className="py-2 px-2 text-right font-medium">Price</th>
                        <th className="py-2 px-2 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(detail.lineItems ?? []).map((li, i) => (
                        <tr key={i}>
                          <td className="py-2 pr-2 text-slate-800">
                            <div>{li.description}</div>
                            {li.packing && (
                              <div className="text-xs text-slate-400">{li.packing.item?.name} — {li.packing.packing}</div>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right text-slate-600">{li.quantity}</td>
                          <td className="py-2 px-2 text-right font-mono text-slate-600">{fmt(li.unit_price)}</td>
                          <td className="py-2 px-2 text-right font-mono font-semibold text-slate-800">{fmt(li.line_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="text-sm space-y-1 min-w-52">
                    <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-mono">{fmt(detail.subtotal)}</span></div>
                    {parseFloat(detail.discount_amount) > 0 && (
                      <div className="flex justify-between text-slate-600"><span>Discount</span><span className="font-mono">-{fmt(detail.discount_amount)}</span></div>
                    )}
                    {parseFloat(detail.tax_rate) > 0 && (
                      <div className="flex justify-between text-slate-600"><span>Tax ({detail.tax_rate}%)</span><span className="font-mono">{fmt(detail.tax_amount)}</span></div>
                    )}
                    <div className="flex justify-between font-semibold text-slate-800 border-t border-slate-200 pt-1"><span>Total</span><span className="font-mono">{fmt(detail.total_amount)}</span></div>
                    <div className="flex justify-between text-slate-500"><span>Paid</span><span className="font-mono">{fmt(detail.amount_paid)}</span></div>
                    <div className="flex justify-between font-bold text-slate-900 border-t border-slate-300 pt-1"><span>Balance Due</span><span className="font-mono">{fmt(balanceDue)}</span></div>
                  </div>
                </div>

                {/* Payment history */}
                {payments.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-2">Payment History</div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100">
                          <th className="py-1.5 text-left font-medium">Date</th>
                          <th className="py-1.5 px-2 text-left font-medium">Method</th>
                          <th className="py-1.5 px-2 text-left font-medium">Reference</th>
                          <th className="py-1.5 text-right font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p, i) => (
                          <tr key={i} className="border-b border-slate-50">
                            <td className="py-1.5 text-slate-600">{p.payment_date?.slice(0, 10)}</td>
                            <td className="py-1.5 px-2 text-slate-600">{p.payment_method?.replace('_', ' ')}</td>
                            <td className="py-1.5 px-2 text-slate-500 font-mono">{p.reference_no || '—'}</td>
                            <td className="py-1.5 text-right font-mono font-semibold text-slate-800">{fmt(p.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Payment form */}
                {showPayForm && (
                  <PaymentForm
                    invoiceId={detail.id}
                    balanceDue={balanceDue}
                    onSuccess={() => { setShowPayForm(false); loadDetail(detail.id); loadInvoices(); }}
                    onCancel={() => setShowPayForm(false)}
                  />
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  {CAN_PAY(detail.status) && !showPayForm && (
                    <Button onClick={() => setShowPayForm(true)}>
                      <CreditCard size={13} /> Record Payment
                    </Button>
                  )}
                  {CAN_POST(detail.status) && (
                    <Button variant="secondary" onClick={() => handlePost(detail.id)} disabled={actionLoading}>
                      <Send size={13} /> Post Invoice
                    </Button>
                  )}
                  {CAN_CANCEL(detail.status) && (
                    <Button variant="danger" onClick={() => handleCancel(detail.id)} disabled={actionLoading}>
                      <Ban size={13} /> Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            ) : null}
          </Card>
        </div>
      )}
    </div>
  );
}
