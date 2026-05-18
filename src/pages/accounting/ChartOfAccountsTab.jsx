import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Check, X } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';
import { Card, CardContent } from '../../components/ui/card.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Loading } from '../../components/ui/loading.jsx';
import Select from '../../components/ui/select.jsx';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../../services/accountingService.js';

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
const NORMAL_BALANCE_MAP = { ASSET: 'DEBIT', LIABILITY: 'CREDIT', EQUITY: 'CREDIT', REVENUE: 'CREDIT', EXPENSE: 'DEBIT' };

const TYPE_COLORS = {
  ASSET: 'bg-blue-100 text-blue-800',
  LIABILITY: 'bg-orange-100 text-orange-800',
  EQUITY: 'bg-purple-100 text-purple-800',
  REVENUE: 'bg-green-100 text-green-800',
  EXPENSE: 'bg-red-100 text-red-800',
};

const empty = { account_code: '', account_name: '', account_type: 'ASSET' };

export default function ChartOfAccountsTab() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAccounts();
      setAccounts(Array.isArray(data) ? data : data.data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = ACCOUNT_TYPES.reduce((acc, t) => {
    acc[t] = accounts.filter(a => a.account_type === t);
    return acc;
  }, {});

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await createAccount({ ...form });
      setForm(empty);
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(acct) {
    setEditId(acct.id);
    setEditForm({ account_name: acct.account_name, is_active: acct.is_active });
  }

  async function saveEdit(id) {
    try {
      await updateAccount(id, editForm);
      setEditId(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this account?')) return;
    try {
      setDeletingId(id);
      await deleteAccount(id);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Chart of Accounts</h2>
        <Button onClick={() => setShowForm(v => !v)} variant={showForm ? 'secondary' : 'primary'}>
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancel' : 'Add Account'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <Card>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-3 gap-4 items-end">
              <div>
                <Label>Account Code</Label>
                <Input
                  value={form.account_code}
                  onChange={e => setForm(f => ({ ...f, account_code: e.target.value }))}
                  placeholder="e.g. 1010"
                  required
                />
              </div>
              <div>
                <Label>Account Name</Label>
                <Input
                  value={form.account_name}
                  onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))}
                  placeholder="e.g. Cash"
                  required
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={form.account_type}
                  onChange={e => setForm(f => ({ ...f, account_type: e.target.value }))}
                  options={ACCOUNT_TYPES.map(t => ({ value: t, label: t }))}
                />
              </div>
              <div className="col-span-3 flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Accounts grouped by type */}
      {loading ? (
        <div className="flex justify-center py-10"><Loading /></div>
      ) : (
        ACCOUNT_TYPES.map(type => {
          const rows = grouped[type] ?? [];
          if (rows.length === 0) return null;
          return (
            <Card key={type}>
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${TYPE_COLORS[type]}`}>{type}</span>
                <span className="text-xs text-slate-500">{rows.length} account{rows.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                      <th className="px-5 py-2.5 font-medium">Code</th>
                      <th className="px-5 py-2.5 font-medium">Name</th>
                      <th className="px-5 py-2.5 font-medium">Normal Balance</th>
                      <th className="px-5 py-2.5 font-medium">Status</th>
                      <th className="px-5 py-2.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map(acct => (
                      <tr key={acct.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3 font-mono text-slate-600">{acct.account_code}</td>
                        <td className="px-5 py-3 text-slate-800">
                          {editId === acct.id ? (
                            <Input
                              value={editForm.account_name}
                              onChange={e => setEditForm(f => ({ ...f, account_name: e.target.value }))}
                              className="py-1"
                            />
                          ) : acct.account_name}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium ${NORMAL_BALANCE_MAP[type] === 'DEBIT' ? 'text-red-700' : 'text-green-700'}`}>
                            {NORMAL_BALANCE_MAP[type]}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {editId === acct.id ? (
                            <button
                              type="button"
                              onClick={() => setEditForm(f => ({ ...f, is_active: !f.is_active }))}
                              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${editForm.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                            >
                              {editForm.is_active ? 'Active' : 'Inactive'}
                            </button>
                          ) : (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${acct.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                              {acct.is_active ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {editId === acct.id ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button variant="primary" onClick={() => saveEdit(acct.id)} className="py-1 px-2.5 text-xs">
                                <Check size={12} /> Save
                              </Button>
                              <Button variant="secondary" onClick={() => setEditId(null)} className="py-1 px-2.5 text-xs">
                                <X size={12} /> Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button variant="ghost" onClick={() => startEdit(acct)} className="py-1 px-2">
                                <Pencil size={13} />
                              </Button>
                              {!acct.is_system && (
                                <Button
                                  variant="ghost"
                                  onClick={() => handleDelete(acct.id)}
                                  disabled={deletingId === acct.id}
                                  className="py-1 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 size={13} />
                                </Button>
                              )}
                              {acct.is_system && (
                                <span className="text-xs text-slate-400 italic">system</span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
