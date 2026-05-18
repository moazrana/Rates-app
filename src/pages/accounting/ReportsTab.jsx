import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';
import { Card, CardContent } from '../../components/ui/card.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Loading } from '../../components/ui/loading.jsx';
import Select from '../../components/ui/select.jsx';
import { getTrialBalance, getArAging, getLedger, getAccounts } from '../../services/accountingService.js';

const DEBIT_COLOR = '#C0392B';
const CREDIT_COLOR = '#1A6B3C';
const ORANGE_COLOR = '#D35400';

const SUB_TABS = ['Trial Balance', 'AR Aging', 'Account Ledger'];

const AGING_BUCKETS = ['CURRENT', '1-30', '31-60', '61-90', '90+'];

function fmt(n) {
  return parseFloat(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Trial Balance ─────────────────────────────────────────────────────────────
function TrialBalanceSection() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 7) + '-01';

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getTrialBalance(startDate, endDate);
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div>
          <Label>Start Date</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <Button onClick={load} disabled={loading}>
          {loading ? 'Loading...' : 'Generate'}
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">{error}</div>}

      {loading && <div className="flex justify-center py-10"><Loading /></div>}

      {data && !loading && (
        <Card>
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Trial Balance — {startDate} to {endDate}</span>
            {data.balanced ? (
              <span className="flex items-center gap-1.5 text-green-700 font-semibold text-sm">
                <CheckCircle size={16} /> BALANCED
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-700 font-semibold text-sm">
                <XCircle size={16} /> UNBALANCED
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-3 text-left font-medium">Code</th>
                  <th className="px-5 py-3 text-left font-medium">Account</th>
                  <th className="px-5 py-3 text-left font-medium">Type</th>
                  <th className="px-5 py-3 text-right font-medium">Debits</th>
                  <th className="px-5 py-3 text-right font-medium">Credits</th>
                  <th className="px-5 py-3 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(data.accounts ?? []).map((acct, i) => {
                  const isAbnormal = parseFloat(acct.balance) < 0;
                  return (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-5 py-2.5 font-mono text-xs text-slate-500">{acct.account_code}</td>
                      <td className="px-5 py-2.5 text-slate-800">{acct.account_name}</td>
                      <td className="px-5 py-2.5 text-xs text-slate-500">{acct.account_type}</td>
                      <td className="px-5 py-2.5 text-right font-mono text-xs" style={{ color: DEBIT_COLOR }}>
                        {fmt(acct.total_debits)}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono text-xs" style={{ color: CREDIT_COLOR }}>
                        {fmt(acct.total_credits)}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono text-xs font-semibold">
                        <span style={{ color: isAbnormal ? ORANGE_COLOR : 'inherit' }} className="flex items-center justify-end gap-1">
                          {isAbnormal && <AlertTriangle size={11} />}
                          {fmt(acct.balance)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className={`border-t-2 font-semibold text-sm ${data.balanced ? 'border-green-300' : 'border-red-300'}`}>
                <tr>
                  <td colSpan={3} className="px-5 py-3 text-slate-700">Totals</td>
                  <td className="px-5 py-3 text-right font-mono" style={{ color: DEBIT_COLOR }}>{fmt(data.totalDebits)}</td>
                  <td className="px-5 py-3 text-right font-mono" style={{ color: CREDIT_COLOR }}>{fmt(data.totalCredits)}</td>
                  <td className="px-5 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── AR Aging ──────────────────────────────────────────────────────────────────
function ArAgingSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const res = await getArAging();
      setData(Array.isArray(res) ? res : res.data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const bucketTotals = {};
  (data ?? []).forEach(row => {
    const b = row.aging_bucket ?? 'OTHER';
    bucketTotals[b] = (bucketTotals[b] ?? 0) + parseFloat(row.balance_due || 0);
  });

  const grandTotal = Object.values(bucketTotals).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-4">
      <Button onClick={load} disabled={loading}>
        {loading ? 'Loading...' : 'Load AR Aging'}
      </Button>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">{error}</div>}
      {loading && <div className="flex justify-center py-10"><Loading /></div>}

      {data && !loading && (
        <>
          {/* Bucket summary */}
          <div className="grid grid-cols-5 gap-3">
            {AGING_BUCKETS.map(bucket => (
              <Card key={bucket}>
                <CardContent className="py-3 px-4">
                  <div className="text-xs text-slate-500 mb-1">{bucket}</div>
                  <div className="font-mono font-semibold text-slate-800 text-sm">{fmt(bucketTotals[bucket] ?? 0)}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">AR Aging Detail</span>
              <span className="text-sm text-slate-500">Total Outstanding: <span className="font-semibold text-slate-800">{fmt(grandTotal)}</span></span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-100">
                    <th className="px-5 py-3 text-left font-medium">Customer</th>
                    <th className="px-5 py-3 text-left font-medium">Invoice No</th>
                    <th className="px-5 py-3 text-left font-medium">Invoice Date</th>
                    <th className="px-5 py-3 text-left font-medium">Due Date</th>
                    <th className="px-5 py-3 text-right font-medium">Balance Due</th>
                    <th className="px-5 py-3 text-right font-medium">Days Overdue</th>
                    <th className="px-5 py-3 text-left font-medium">Bucket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-5 py-2.5 text-slate-800">{row.customer}</td>
                      <td className="px-5 py-2.5 font-mono text-xs text-slate-600">{row.invoice_no}</td>
                      <td className="px-5 py-2.5 text-slate-600">{row.invoice_date?.slice(0, 10)}</td>
                      <td className="px-5 py-2.5 text-slate-600">{row.due_date?.slice(0, 10)}</td>
                      <td className="px-5 py-2.5 text-right font-mono font-semibold text-slate-800">{fmt(row.balance_due)}</td>
                      <td className="px-5 py-2.5 text-right">
                        <span className={`text-xs font-semibold ${row.days_overdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {row.days_overdue > 0 ? `+${row.days_overdue}` : row.days_overdue}
                        </span>
                      </td>
                      <td className="px-5 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          row.aging_bucket === 'CURRENT' ? 'bg-green-100 text-green-700' :
                          row.aging_bucket === '1-30' ? 'bg-yellow-100 text-yellow-700' :
                          row.aging_bucket === '31-60' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {row.aging_bucket}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ── Account Ledger ────────────────────────────────────────────────────────────
function LedgerSection() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 7) + '-01';

  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState('');
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [acctLoading, setAcctLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAccounts = useCallback(async () => {
    try {
      setAcctLoading(true);
      const res = await getAccounts();
      setAccounts(Array.isArray(res) ? res : res.data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setAcctLoading(false);
    }
  }, []);

  // Load accounts on mount
  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  async function load() {
    if (!accountId) return;
    try {
      setLoading(true);
      setError('');
      const res = await getLedger(accountId, startDate, endDate);
      setData(Array.isArray(res) ? res : res.data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Build running balance
  let runningBalance = 0;
  const rows = (data ?? []).map(row => {
    runningBalance += (parseFloat(row.debit_amount) || 0) - (parseFloat(row.credit_amount) || 0);
    return { ...row, runningBalance };
  });

  const accountOptions = accounts.map(a => ({ value: a.id, label: `${a.account_code} — ${a.account_name}` }));

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-60">
          <Label>Account</Label>
          {acctLoading ? <Loading size="sm" text="" /> : (
            <Select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              placeholder="Select account..."
              options={accountOptions}
            />
          )}
        </div>
        <div>
          <Label>Start Date</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <Button onClick={load} disabled={loading || !accountId}>
          {loading ? 'Loading...' : 'Generate Ledger'}
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">{error}</div>}
      {loading && <div className="flex justify-center py-10"><Loading /></div>}

      {data && !loading && (
        <Card>
          <div className="px-5 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-700">
              {accounts.find(a => a.id == accountId)?.account_name ?? 'Account'} Ledger — {startDate} to {endDate}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                  <th className="px-5 py-3 text-left font-medium">Reference</th>
                  <th className="px-5 py-3 text-left font-medium">Description</th>
                  <th className="px-5 py-3 text-left font-medium">Line Memo</th>
                  <th className="px-5 py-3 text-right font-medium">Debit</th>
                  <th className="px-5 py-3 text-right font-medium">Credit</th>
                  <th className="px-5 py-3 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">No entries for this period.</td>
                  </tr>
                ) : rows.map((row, i) => {
                  const isAbnormal = row.runningBalance < 0;
                  return (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-5 py-2.5 text-slate-600">{row.entry_date?.slice(0, 10)}</td>
                      <td className="px-5 py-2.5 font-mono text-xs text-slate-500">{row.reference_no}</td>
                      <td className="px-5 py-2.5 text-slate-700 max-w-40 truncate">{row.entry_description}</td>
                      <td className="px-5 py-2.5 text-slate-500 text-xs max-w-32 truncate">{row.line_description || '—'}</td>
                      <td className="px-5 py-2.5 text-right font-mono text-xs">
                        {parseFloat(row.debit_amount) > 0
                          ? <span style={{ color: DEBIT_COLOR }}>{fmt(row.debit_amount)}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono text-xs">
                        {parseFloat(row.credit_amount) > 0
                          ? <span style={{ color: CREDIT_COLOR }}>{fmt(row.credit_amount)}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono text-xs font-semibold">
                        <span style={{ color: isAbnormal ? ORANGE_COLOR : 'inherit' }} className="flex items-center justify-end gap-1">
                          {isAbnormal && <AlertTriangle size={10} />}
                          {fmt(row.runningBalance)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ReportsTab() {
  const [activeTab, setActiveTab] = useState(SUB_TABS[0]);

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-slate-800">Reports</h2>

      {/* Sub-tab bar */}
      <div className="flex gap-1 border-b border-slate-200">
        {SUB_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Trial Balance' && <TrialBalanceSection />}
      {activeTab === 'AR Aging' && <ArAgingSection />}
      {activeTab === 'Account Ledger' && <LedgerSection />}
    </div>
  );
}
