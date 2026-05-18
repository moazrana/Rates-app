import { useState, useEffect, useCallback } from 'react';
import { Plus, X, ChevronRight, RotateCcw, Send } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';
import { Card, CardContent } from '../../components/ui/card.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Loading } from '../../components/ui/loading.jsx';
import Select from '../../components/ui/select.jsx';
import {
  getAccounts,
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  postJournalEntry,
  reverseJournalEntry,
} from '../../services/accountingService.js';

const DEBIT_COLOR = '#C0392B';
const CREDIT_COLOR = '#1A6B3C';

const STATUS_STYLES = {
  DRAFT: 'bg-slate-100 text-slate-600',
  POSTED: 'bg-green-100 text-green-700',
  REVERSED: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-slate-200 text-slate-500',
};

const ENTRY_TYPES = ['MANUAL', 'INVOICE', 'PAYMENT', 'ADJUSTMENT', 'REVERSAL'];

function emptyLine() {
  return { account_id: '', debit_amount: '', credit_amount: '', description: '' };
}

function fmt(n) {
  const num = parseFloat(n) || 0;
  return num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function JournalEntryTab() {
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ entry_date: new Date().toISOString().slice(0, 10), description: '', entry_type: 'MANUAL' });
  const [lines, setLines] = useState([emptyLine(), emptyLine()]);
  const [saving, setSaving] = useState(false);

  // Detail panel
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getJournalEntries(page, 50);
      if (Array.isArray(data)) {
        setEntries(data);
        setTotal(data.length);
      } else {
        setEntries(data.data ?? []);
        setTotal(data.total ?? 0);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadEntries();
    getAccounts().then(d => setAccounts(Array.isArray(d) ? d : d.data ?? [])).catch(() => {});
  }, [loadEntries]);

  async function loadDetail(id) {
    try {
      setDetailLoading(true);
      const data = await getJournalEntry(id);
      setDetail(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setDetailLoading(false);
    }
  }

  function openDetail(id) {
    setSelectedId(id);
    setDetail(null);
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

  // Balance calculation
  const totalDebits = lines.reduce((s, l) => s + (parseFloat(l.debit_amount) || 0), 0);
  const totalCredits = lines.reduce((s, l) => s + (parseFloat(l.credit_amount) || 0), 0);
  const diff = Math.abs(totalDebits - totalCredits);
  const balanced = diff < 0.001;

  async function handleCreate(e) {
    e.preventDefault();
    if (!balanced) return;
    try {
      setSaving(true);
      await createJournalEntry({
        ...form,
        lines: lines
          .filter(l => l.account_id)
          .map((l, i) => ({
            account_id: l.account_id,
            debit_amount: parseFloat(l.debit_amount) || 0,
            credit_amount: parseFloat(l.credit_amount) || 0,
            description: l.description,
            line_order: i + 1,
          })),
      });
      setShowForm(false);
      setLines([emptyLine(), emptyLine()]);
      setForm({ entry_date: new Date().toISOString().slice(0, 10), description: '', entry_type: 'MANUAL' });
      await loadEntries();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePost(id) {
    try {
      setActionLoading(true);
      await postJournalEntry(id);
      await Promise.all([loadEntries(), loadDetail(id)]);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReverse(id) {
    if (!window.confirm('Create a reversal entry for this journal entry?')) return;
    try {
      setActionLoading(true);
      await reverseJournalEntry(id);
      closeDetail();
      await loadEntries();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  const accountOptions = accounts.map(a => ({ value: a.id, label: `${a.account_code} — ${a.account_name}` }));

  return (
    <div className="flex gap-5 h-full">
      {/* Left panel: list + create */}
      <div className={`flex flex-col gap-5 ${selectedId ? 'w-1/2' : 'w-full'}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Journal Entries</h2>
          <Button onClick={() => setShowForm(v => !v)} variant={showForm ? 'secondary' : 'primary'}>
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Cancel' : 'New Entry'}
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
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={form.entry_date}
                      onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label>Entry Type</Label>
                    <Select
                      value={form.entry_type}
                      onChange={e => setForm(f => ({ ...f, entry_type: e.target.value }))}
                      options={ENTRY_TYPES.map(t => ({ value: t, label: t }))}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Memo / description"
                    />
                  </div>
                </div>

                {/* Lines table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 border-b border-slate-100">
                        <th className="py-2 text-left font-medium w-5/12">Account</th>
                        <th className="py-2 px-2 text-right font-medium w-2/12">Debit</th>
                        <th className="py-2 px-2 text-right font-medium w-2/12">Credit</th>
                        <th className="py-2 px-2 text-left font-medium w-2/12">Memo</th>
                        <th className="py-2 w-1/12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, idx) => (
                        <tr key={idx} className="border-b border-slate-50">
                          <td className="py-1.5 pr-2">
                            <Select
                              value={line.account_id}
                              onChange={e => updateLine(idx, 'account_id', e.target.value)}
                              placeholder="Select account..."
                              options={accountOptions}
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.debit_amount}
                              onChange={e => updateLine(idx, 'debit_amount', e.target.value)}
                              placeholder="0.00"
                              className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                              style={{ color: DEBIT_COLOR }}
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.credit_amount}
                              onChange={e => updateLine(idx, 'credit_amount', e.target.value)}
                              placeholder="0.00"
                              className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                              style={{ color: CREDIT_COLOR }}
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <Input
                              value={line.description}
                              onChange={e => updateLine(idx, 'description', e.target.value)}
                              placeholder="Memo"
                              className="py-1.5"
                            />
                          </td>
                          <td className="py-1.5 pl-2">
                            {lines.length > 2 && (
                              <button type="button" onClick={() => removeLine(idx)} className="text-slate-400 hover:text-red-500">
                                <X size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between">
                  <button type="button" onClick={addLine} className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                    <Plus size={13} /> Add Line
                  </button>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500">
                      Debits: <span style={{ color: DEBIT_COLOR }} className="font-semibold">{fmt(totalDebits)}</span>
                      {' | '}Credits: <span style={{ color: CREDIT_COLOR }} className="font-semibold">{fmt(totalCredits)}</span>
                      {' | '}Diff: <span className={`font-semibold ${balanced ? 'text-green-600' : 'text-red-600'}`}>{fmt(diff)}</span>
                    </span>
                    <Button type="submit" disabled={!balanced || saving}>
                      {saving ? 'Saving...' : 'Save as Draft'}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Entries list */}
        <Card>
          {loading ? (
            <div className="flex justify-center py-10"><Loading /></div>
          ) : entries.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">No journal entries yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-3 font-medium">Ref No</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Description</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Debits</th>
                    <th className="px-5 py-3 font-medium text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {entries.map(entry => {
                    const entryDebits = (entry.lines ?? []).reduce((s, l) => s + parseFloat(l.debit_amount || 0), 0);
                    return (
                      <tr
                        key={entry.id}
                        className={`cursor-pointer hover:bg-slate-50/70 ${selectedId === entry.id ? 'bg-blue-50/40' : ''}`}
                        onClick={() => openDetail(entry.id)}
                      >
                        <td className="px-5 py-3 font-mono text-slate-600 text-xs">{entry.reference_no}</td>
                        <td className="px-5 py-3 text-slate-600">{entry.entry_date?.slice(0, 10)}</td>
                        <td className="px-5 py-3 text-slate-800 max-w-48 truncate">{entry.description || '—'}</td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{entry.entry_type}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[entry.status] ?? STATUS_STYLES.DRAFT}`}>
                            {entry.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-xs font-mono" style={{ color: DEBIT_COLOR }}>
                          {fmt(entryDebits)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <ChevronRight size={14} className="text-slate-400 inline" />
                        </td>
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
            <h3 className="text-base font-semibold text-slate-800">Entry Detail</h3>
            <button onClick={closeDetail} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          <Card className="flex-1 overflow-auto">
            {detailLoading ? (
              <div className="flex justify-center py-10"><Loading /></div>
            ) : detail ? (
              <CardContent className="space-y-5">
                {/* Meta */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">Reference</span>
                    <span className="font-mono text-slate-800">{detail.reference_no}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Date</span>
                    <span className="text-slate-800">{detail.entry_date?.slice(0, 10)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Status</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[detail.status] ?? STATUS_STYLES.DRAFT}`}>
                      {detail.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Type</span>
                    <span className="text-slate-800">{detail.entry_type}</span>
                  </div>
                  {detail.description && (
                    <div className="col-span-2">
                      <span className="text-xs text-slate-500 block">Description</span>
                      <span className="text-slate-800">{detail.description}</span>
                    </div>
                  )}
                </div>

                {/* Lines */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 border-b border-slate-100">
                        <th className="py-2 text-left font-medium">Account</th>
                        <th className="py-2 px-3 text-right font-medium">Debit</th>
                        <th className="py-2 px-3 text-right font-medium">Credit</th>
                        <th className="py-2 pl-3 text-left font-medium">Memo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(detail.lines ?? []).map((line, i) => (
                        <tr key={i}>
                          <td className="py-2 pr-3 text-slate-700">
                            <span className="font-mono text-xs text-slate-400 mr-1">{line.account?.account_code}</span>
                            {line.account?.account_name}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-xs">
                            {parseFloat(line.debit_amount) > 0
                              ? <span style={{ color: DEBIT_COLOR }}>{fmt(line.debit_amount)}</span>
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-xs">
                            {parseFloat(line.credit_amount) > 0
                              ? <span style={{ color: CREDIT_COLOR }}>{fmt(line.credit_amount)}</span>
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="py-2 pl-3 text-xs text-slate-500">{line.description || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 font-semibold text-xs">
                        <td className="py-2 text-slate-600">Totals</td>
                        <td className="py-2 px-3 text-right font-mono" style={{ color: DEBIT_COLOR }}>
                          {fmt((detail.lines ?? []).reduce((s, l) => s + parseFloat(l.debit_amount || 0), 0))}
                        </td>
                        <td className="py-2 px-3 text-right font-mono" style={{ color: CREDIT_COLOR }}>
                          {fmt((detail.lines ?? []).reduce((s, l) => s + parseFloat(l.credit_amount || 0), 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  {detail.status === 'DRAFT' && (
                    <Button onClick={() => handlePost(detail.id)} disabled={actionLoading}>
                      <Send size={13} /> Post Entry
                    </Button>
                  )}
                  {detail.status === 'POSTED' && (
                    <Button variant="secondary" onClick={() => handleReverse(detail.id)} disabled={actionLoading}>
                      <RotateCcw size={13} /> Create Reversal
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
