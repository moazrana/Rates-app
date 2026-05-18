import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Check, X, User } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';
import { Card, CardContent } from '../../components/ui/card.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Loading } from '../../components/ui/loading.jsx';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../services/accountingService.js';

const emptyForm = { name: '', email: '', phone: '', address: '' };

export default function CustomersTab() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getCustomers();
      setCustomers(Array.isArray(data) ? data : data.data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await createCustomer(form);
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(c) {
    setEditId(c.id);
    setEditForm({ name: c.name, email: c.email ?? '', phone: c.phone ?? '', address: c.address ?? '' });
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: value }));
  }

  async function saveEdit(id) {
    try {
      await updateCustomer(id, editForm);
      setEditId(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this customer?')) return;
    try {
      setDeletingId(id);
      await deleteCustomer(id);
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
        <h2 className="text-base font-semibold text-slate-800">Customers</h2>
        <Button onClick={() => setShowForm(v => !v)} variant={showForm ? 'secondary' : 'primary'}>
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancel' : 'Add Customer'}
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
            <form onSubmit={handleCreate}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Name *</Label>
                  <Input name="name" value={form.name} onChange={handleFormChange} placeholder="Customer name" required />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input name="email" type="email" value={form.email} onChange={handleFormChange} placeholder="email@example.com" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input name="phone" value={form.phone} onChange={handleFormChange} placeholder="+92 300 0000000" />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input name="address" value={form.address} onChange={handleFormChange} placeholder="Street, City" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Create Customer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-10"><Loading /></div>
        ) : customers.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">No customers yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Address</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    {editId === c.id ? (
                      <>
                        <td className="px-5 py-2.5">
                          <Input name="name" value={editForm.name} onChange={handleEditChange} className="py-1" />
                        </td>
                        <td className="px-5 py-2.5">
                          <Input name="email" value={editForm.email} onChange={handleEditChange} className="py-1" />
                        </td>
                        <td className="px-5 py-2.5">
                          <Input name="phone" value={editForm.phone} onChange={handleEditChange} className="py-1" />
                        </td>
                        <td className="px-5 py-2.5">
                          <Input name="address" value={editForm.address} onChange={handleEditChange} className="py-1" />
                        </td>
                        <td className="px-5 py-2.5 text-slate-400">—</td>
                        <td className="px-5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button variant="primary" onClick={() => saveEdit(c.id)} className="py-1 px-2.5 text-xs">
                              <Check size={12} /> Save
                            </Button>
                            <Button variant="secondary" onClick={() => setEditId(null)} className="py-1 px-2.5 text-xs">
                              <X size={12} /> Cancel
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <User size={13} className="text-blue-600" />
                            </div>
                            <span className="font-medium text-slate-800">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{c.email || '—'}</td>
                        <td className="px-5 py-3 text-slate-600">{c.phone || '—'}</td>
                        <td className="px-5 py-3 text-slate-600 max-w-48 truncate">{c.address || '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {c.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button variant="ghost" onClick={() => startEdit(c)} className="py-1 px-2">
                              <Pencil size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => handleDelete(c.id)}
                              disabled={deletingId === c.id}
                              className="py-1 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
