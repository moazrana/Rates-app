import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X, ShieldAlert } from 'lucide-react';

export default function RateDetailsModal({
  selectedRow, itemDetails, detailsLoading, detailsError,
  editingItem, editItemData, types, raters,
  editingRateId, editRateData, savingRate,
  onClose, onStartEditItem, onItemChange, onSaveItem, onCancelItemEdit,
  onStartEditRate, onRateChange, onSaveRate, onCancelRateEdit,
  editingSaleRateId, editSaleRateData, savingSaleRate,
  onAddSaleRate, onStartEditSaleRate, onSaleRateChange, onSaveSaleRate, onCancelSaleRateEdit,
}) {
  const [newSaleRatePackingId, setNewSaleRatePackingId] = useState('');
  const [newSaleRateDate, setNewSaleRateDate] = useState('');
  const [newSaleRateRate, setNewSaleRateRate] = useState('');

  if (!selectedRow) return null;

  return createPortal(
    <div className="rate-details-overlay" onClick={onClose}>
      <div className="rate-details-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">{selectedRow.name || 'Item Details'}</h3>
            {itemDetails?.item?.banned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                <ShieldAlert size={11} /> Banned
              </span>
            )}
            {!editingItem && itemDetails && (
              <button className="edit-btn" onClick={onStartEditItem} title="Edit item">
                <Pencil size={11} />
              </button>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {detailsLoading && (
          <div className="text-sm text-slate-500 py-4 text-center">Loading details…</div>
        )}
        {detailsError && (
          <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-3">{detailsError}</div>
        )}

        {itemDetails && (
          <>
            {/* Item info */}
            <div className="rate-details-section">
              <div className="rate-details-subtitle">Item Information</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div className="rate-details-row">
                  <span className="rate-details-label">Name</span>
                  {editingItem ? (
                    <input type="text" className="rate-details-input" value={editItemData.name} onChange={e => onItemChange('name', e.target.value)} />
                  ) : (
                    <span className="text-sm text-slate-800">{itemDetails.item?.name}</span>
                  )}
                </div>
                <div className="rate-details-row">
                  <span className="rate-details-label">Type</span>
                  {editingItem ? (
                    <div className="flex flex-col gap-1 flex-1">
                      <select className="rate-details-input" value={editItemData.useNewType ? 'new' : editItemData.typeName}
                        onChange={e => { if (e.target.value === 'new') { onItemChange('useNewType', true); } else { onItemChange('useNewType', false); onItemChange('typeName', e.target.value); } }}>
                        <option value="">Select type</option>
                        {types && types.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                        <option value="new">+ Create new type</option>
                      </select>
                      {editItemData.useNewType && (
                        <input type="text" className="rate-details-input" placeholder="New type name" value={editItemData.newTypeName} onChange={e => onItemChange('newTypeName', e.target.value)} />
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-800">{itemDetails.item?.type?.name || '—'}</span>
                  )}
                </div>
                <div className="rate-details-row">
                  <span className="rate-details-label">Banned</span>
                  {editingItem ? (
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={!!editItemData.banned} onChange={e => onItemChange('banned', e.target.checked)} />
                      Mark as banned
                    </label>
                  ) : (
                    <span className={`text-sm ${itemDetails.item?.banned ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                      {itemDetails.item?.banned ? 'Yes' : 'No'}
                    </span>
                  )}
                </div>
              </div>
              {editingItem && (
                <div className="flex gap-2 mt-3">
                  <button className="edit-save-btn" onClick={onSaveItem}><Check size={12} /></button>
                  <button className="edit-cancel-btn" onClick={onCancelItemEdit}><X size={12} /></button>
                </div>
              )}
            </div>

            {/* Packings */}
            <div className="rate-details-section">
              <div className="rate-details-subtitle">Available Packings</div>
              {itemDetails.packings?.length > 0 ? (
                <table className="rate-details-table">
                  <thead>
                    <tr><th>Company</th><th>Packing</th><th>Specification</th></tr>
                  </thead>
                  <tbody>
                    {itemDetails.packings.map(p => (
                      <tr key={p.id}><td>{p.company}</td><td>{p.packing}</td><td>{p.specifications}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-sm text-slate-400 py-2">No packings found for this item.</div>
              )}
            </div>

            {/* Rate history */}
            <div className="rate-details-section">
              <div className="rate-details-subtitle">Purchase Rates</div>
              {itemDetails.rates?.length > 0 ? (
                <table className="rate-details-table">
                  <thead>
                    <tr><th>Date</th><th>Rate</th><th>Company</th><th>Packing</th><th>Spec</th><th>Rate By</th><th></th></tr>
                  </thead>
                  <tbody>
                    {itemDetails.rates.map(r => (
                      <tr key={r.id}>
                        <td>{editingRateId === r.id
                          ? <input type="date" className="rate-details-input" value={editRateData.date} onChange={e => onRateChange('date', e.target.value)} />
                          : r.date ? new Date(r.date).toLocaleDateString() : ''}</td>
                        <td>{editingRateId === r.id
                          ? <input type="number" className="rate-details-input" value={editRateData.rate} onChange={e => onRateChange('rate', e.target.value)} />
                          : <span className="font-semibold font-mono">{r.rate}</span>}</td>
                        <td>{editingRateId === r.id
                          ? <input type="text" className="rate-details-input" value={editRateData.company} onChange={e => onRateChange('company', e.target.value)} />
                          : r.packing?.company}</td>
                        <td>{editingRateId === r.id
                          ? <input type="text" className="rate-details-input" value={editRateData.packing} onChange={e => onRateChange('packing', e.target.value)} />
                          : r.packing?.packing}</td>
                        <td>{editingRateId === r.id
                          ? <input type="text" className="rate-details-input" value={editRateData.specifications} onChange={e => onRateChange('specifications', e.target.value)} />
                          : r.packing?.specifications}</td>
                        <td>{editingRateId === r.id
                          ? <select className="rate-details-input" value={editRateData.rateBy} onChange={e => onRateChange('rateBy', e.target.value)}>
                              <option value="">Select</option>
                              {raters && raters.map(rt => <option key={rt.id} value={rt.name}>{rt.name}</option>)}
                            </select>
                          : r.rater?.name}</td>
                        <td>
                          {editingRateId === r.id ? (
                            <div className="edit-btns-div">
                              <button className="edit-save-btn" onClick={onSaveRate} disabled={savingRate}><Check size={11} /></button>
                              <button className="edit-cancel-btn" onClick={onCancelRateEdit}><X size={11} /></button>
                            </div>
                          ) : (
                            <button className="edit-btn" onClick={() => onStartEditRate(r)}><Pencil size={11} /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-sm text-slate-400 py-2">No rates found.</div>
              )}
            </div>

            {/* Sale rates */}
            <div className="rate-details-section">
              <div className="rate-details-subtitle">Sale Rates</div>
              {(() => {
                const saleRatesWithPacking = (itemDetails.packings || []).flatMap(p =>
                  (p.saleRates || []).map(sr => ({
                    ...sr,
                    packingLabel: [p.company, p.packing].filter(Boolean).join(' – ') || `Packing #${p.id}`,
                  }))
                );
                return (
                  <>
                    {saleRatesWithPacking.length > 0 ? (
                      <table className="rate-details-table mb-4">
                        <thead>
                          <tr><th>Packing</th><th>Date</th><th>Rate</th><th></th></tr>
                        </thead>
                        <tbody>
                          {saleRatesWithPacking.map(sr => (
                            <tr key={sr.id}>
                              <td>{sr.packingLabel}</td>
                              <td>{editingSaleRateId === sr.id
                                ? <input type="date" className="rate-details-input" value={editSaleRateData?.date ?? ''} onChange={e => onSaleRateChange?.('date', e.target.value)} />
                                : sr.date ? new Date(sr.date).toLocaleDateString() : ''}</td>
                              <td>{editingSaleRateId === sr.id
                                ? <input type="number" className="rate-details-input" value={editSaleRateData?.rate ?? ''} onChange={e => onSaleRateChange?.('rate', e.target.value)} />
                                : <span className="font-semibold font-mono">{sr.rate}</span>}</td>
                              <td>{editingSaleRateId === sr.id ? (
                                <div className="edit-btns-div">
                                  <button className="edit-save-btn" onClick={onSaveSaleRate} disabled={savingSaleRate}><Check size={11} /></button>
                                  <button className="edit-cancel-btn" onClick={onCancelSaleRateEdit}><X size={11} /></button>
                                </div>
                              ) : (
                                <button className="edit-btn" onClick={() => onStartEditSaleRate?.(sr)}><Pencil size={11} /></button>
                              )}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-sm text-slate-400 py-2 mb-3">No sale rates. Add one below.</div>
                    )}

                    {/* Add sale rate */}
                    <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-slate-100">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">Packing</span>
                        <select className="rate-details-input" style={{ minWidth: '140px' }} value={newSaleRatePackingId} onChange={e => setNewSaleRatePackingId(e.target.value)}>
                          <option value="">Select packing</option>
                          {(itemDetails.packings || []).map(p => (
                            <option key={p.id} value={p.id}>{[p.company, p.packing].filter(Boolean).join(' – ') || `#${p.id}`}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">Date</span>
                        <input type="date" className="rate-details-input" value={newSaleRateDate} onChange={e => setNewSaleRateDate(e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">Rate</span>
                        <input type="number" className="rate-details-input" value={newSaleRateRate} onChange={e => setNewSaleRateRate(e.target.value)} placeholder="Rate" style={{ width: '100px' }} />
                      </div>
                      <Button
                        disabled={savingSaleRate || !newSaleRatePackingId || !newSaleRateDate || newSaleRateRate === ''}
                        onClick={() => {
                          const packingId = Number(newSaleRatePackingId);
                          const rate = Number(newSaleRateRate);
                          if (!packingId || !newSaleRateDate || isNaN(rate)) return;
                          onAddSaleRate?.(packingId, newSaleRateDate, rate);
                          setNewSaleRatePackingId(''); setNewSaleRateDate(''); setNewSaleRateRate('');
                        }}
                      >
                        Add Sale Rate
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </>
        )}

        <div className="rate-details-actions">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
