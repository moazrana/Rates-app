import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loading } from '../components/ui/loading';
import { Store, Plus, Pencil, Trash2, Check, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function StorePage() {
  const { getStores, createStore, updateStore, deleteStore } = useApi();

  const [stores, setStores] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3500); };
  const showError = (msg) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 5000); };

  const load = async () => {
    setListLoading(true);
    try {
      const data = await getStores();
      setStores(data || []);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const created = await createStore(newName.trim());
      setStores(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      showSuccess(`Store "${created.name}" created.`);
    } catch (err) {
      showError(err.message || 'Failed to create store.');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (store) => { setEditingId(store.id); setEditName(store.name); };
  const cancelEdit = () => { setEditingId(null); setEditName(''); };

  const handleSave = async (id) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const updated = await updateStore(id, editName.trim());
      setStores(prev => prev.map(s => s.id === id ? updated : s).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingId(null);
      showSuccess(`Renamed to "${updated.name}".`);
    } catch (err) {
      showError(err.message || 'Failed to rename store.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete store "${name}"?\n\nInventory records linked to this store will have their store cleared.`)) return;
    try {
      await deleteStore(id);
      setStores(prev => prev.filter(s => s.id !== id));
      showSuccess(`Store "${name}" deleted.`);
    } catch (err) {
      showError(err.message || 'Failed to delete store.');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Stores</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage store locations used in inventory</p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle2 size={15} className="flex-shrink-0" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-green-400 hover:text-green-600"><X size={14} /></button>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      {/* Add store */}
      <Card className="mb-5">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Plus size={15} className="text-blue-500" />
          <h2 className="text-sm font-semibold text-slate-700">Add Store</h2>
        </div>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Store Name</Label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="e.g. Main Warehouse"
              />
            </div>
            <div className="pt-5">
              <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
                {creating ? <Loading size="sm" text="" /> : <Plus size={14} />}
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Store list */}
      <Card>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Store size={15} className="text-blue-500" />
          <h2 className="text-sm font-semibold text-slate-700">
            All Stores
            {stores.length > 0 && <span className="ml-2 text-xs font-normal text-slate-400">({stores.length})</span>}
          </h2>
        </div>

        {listLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" text="Loading stores…" />
          </div>
        ) : stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Store size={36} className="text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No stores yet</p>
            <p className="text-xs text-slate-400 mt-1">Add your first store above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {stores.map(store => (
              <li key={store.id} className="flex items-center gap-3 px-5 py-3">
                {editingId === store.id ? (
                  <>
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSave(store.id); if (e.key === 'Escape') cancelEdit(); }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleSave(store.id)}
                      disabled={saving}
                      className="edit-save-btn"
                      title="Save"
                    >
                      {saving ? <Loading size="sm" text="" /> : <Check size={13} />}
                    </button>
                    <button onClick={cancelEdit} className="edit-cancel-btn" title="Cancel">
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-slate-800 font-medium">{store.name}</span>
                    <button onClick={() => startEdit(store)} className="edit-btn" title="Rename">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(store.id, store.name)} className="edit-cancel-btn" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
