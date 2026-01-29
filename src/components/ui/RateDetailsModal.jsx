import React from "react";
import { Button } from "@/components/ui/button";

export default function RateDetailsModal({
  selectedRow,
  itemDetails,
  detailsLoading,
  detailsError,
  editingItem,
  editItemData,
  types,
  raters,
  editingRateId,
  editRateData,
  savingRate,
  onClose,
  onStartEditItem,
  onItemChange,
  onSaveItem,
  onCancelItemEdit,
  onStartEditRate,
  onRateChange,
  onSaveRate,
  onCancelRateEdit,
}) {
  if (!selectedRow) return null;

  return (
    <div className="rate-details-overlay" onClick={onClose}>
      <div
        className="rate-details-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="rate-details-title">
          {selectedRow.name ? `${selectedRow.name}` : ""}
          &nbsp;
          {!editingItem && (
            <Button
              size="sm"
              variant="outline"
              className="edit-btn"
              onClick={onStartEditItem}
            >
              <i
                className="fa-solid fa-pen"
                style={{ marginRight: "0.25rem" }}
              />
            </Button>
          )}
        </h3>

        {detailsLoading && (
          <div className="rate-details-row">Loading details...</div>
        )}

        {detailsError && (
          <div className="rate-details-row error-text">{detailsError}</div>
        )}

        {itemDetails && (
          <>
            {/* Basic item info */}
            <div className="rate-details-section">
              <div className="rate-details-row">
                <span className="rate-details-label">Name:</span>
                {editingItem ? (
                  <input
                    type="text"
                    className="rate-details-input"
                    value={editItemData.name}
                    onChange={(e) => onItemChange("name", e.target.value)}
                  />
                ) : (
                  <span>{itemDetails.item?.name}</span>
                )}
              </div>
              <div className="rate-details-row">
                <span className="rate-details-label">Type:</span>
                {editingItem ? (
                  <>
                    <select
                      className="rate-details-input"
                      value={
                        editItemData.useNewType ? "new" : editItemData.typeName
                      }
                      onChange={(e) => {
                        if (e.target.value === "new") {
                          onItemChange("useNewType", true);
                        } else {
                          onItemChange("useNewType", false);
                          onItemChange("typeName", e.target.value);
                        }
                      }}
                    >
                      <option value="">Select type</option>
                      {types &&
                        types.map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      <option value="new">+ Create new type</option>
                    </select>
                    {editItemData.useNewType && (
                      <input
                        type="text"
                        className="rate-details-input"
                        style={{ marginTop: "0.25rem" }}
                        placeholder="New type name"
                        value={editItemData.newTypeName}
                        onChange={(e) =>
                          onItemChange("newTypeName", e.target.value)
                        }
                      />
                    )}
                  </>
                ) : (
                  <span>{itemDetails.item?.type?.name}</span>
                )}
              </div>
              <div className="rate-details-row">
                <span className="rate-details-label">Banned:</span>
                {editingItem ? (
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="checkbox"
                      checked={!!editItemData.banned}
                      onChange={(e) => onItemChange("banned", e.target.checked)}
                    />
                    <span>Mark as banned</span>
                  </label>
                ) : (
                  <span
                    className={
                      itemDetails.item?.banned ? "rate-details-banned-flag" : ""
                    }
                  >
                    {itemDetails.item?.banned ? "Yes" : "No"}
                  </span>
                )}
              </div>
              <div className="rate-details-actions" style={{ marginTop: 0 }}>
                {editingItem && (
                  <>
                  <div className="rate-details-row"style={{width:"8%"}}>
                    

                    <div className="edit-btns-div">
                        <Button
                        size="sm"
                        variant="outline"
                        className="edit-save-btn"
                        onClick={onSaveItem}
                        >
                        <i className="fa-solid fa-check" />
                        </Button>
                        <Button
                        size="sm"
                        variant="outline"
                        className="edit-cancel-btn"
                        onClick={onCancelItemEdit}
                        style={{ marginLeft: "0.5rem" }}
                        >
                        <i className="fa-solid fa-xmark" />
                        </Button>
                    </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Packings */}
            <div className="rate-details-section">
              <h4 className="rate-details-subtitle">Available Packings</h4>
              {itemDetails.packings && itemDetails.packings.length > 0 ? (
                <table className="rate-details-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Packing</th>
                      <th>Specification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemDetails.packings.map((p) => (
                      <tr key={p.id}>
                        <td>{p.company}</td>
                        <td>{p.packing}</td>
                        <td>{p.specifications}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="rate-details-row">
                  No packings found for this item.
                </div>
              )}
            </div>

            {/* Rate history */}
            <div className="rate-details-section">
              <h4 className="rate-details-subtitle">Available Rates</h4>
              {itemDetails.rates && itemDetails.rates.length > 0 ? (
                <table className="rate-details-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Rate</th>
                      <th>Company</th>
                      <th>Packing</th>
                      <th>Specification</th>
                      <th>Rate By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemDetails.rates.map((r) => (
                      <tr key={r.id}>
                        <td>
                          {editingRateId === r.id ? (
                            <input
                              type="date"
                              className="rate-details-input"
                              value={editRateData.date}
                              onChange={(e) =>
                                onRateChange("date", e.target.value)
                              }
                            />
                          ) : r.date ? (
                            new Date(r.date).toLocaleDateString()
                          ) : (
                            ""
                          )}
                        </td>
                        <td>
                          {editingRateId === r.id ? (
                            <input
                              type="number"
                              className="rate-details-input"
                              value={editRateData.rate}
                              onChange={(e) =>
                                onRateChange("rate", e.target.value)
                              }
                            />
                          ) : (
                            r.rate
                          )}
                        </td>
                        <td>
                          {editingRateId === r.id ? (
                            <input
                              type="text"
                              className="rate-details-input"
                              value={editRateData.company}
                              onChange={(e) =>
                                onRateChange("company", e.target.value)
                              }
                            />
                          ) : (
                            r.packing?.company
                          )}
                        </td>
                        <td>
                          {editingRateId === r.id ? (
                            <input
                              type="text"
                              className="rate-details-input"
                              value={editRateData.packing}
                              onChange={(e) =>
                                onRateChange("packing", e.target.value)
                              }
                            />
                          ) : (
                            r.packing?.packing
                          )}
                        </td>
                        <td>
                          {editingRateId === r.id ? (
                            <input
                              type="text"
                              className="rate-details-input"
                              value={editRateData.specifications}
                              onChange={(e) =>
                                onRateChange("specifications", e.target.value)
                              }
                            />
                          ) : (
                            r.packing?.specifications
                          )}
                        </td>
                        <td>
                          {editingRateId === r.id ? (
                            <select
                              className="rate-details-input"
                              value={editRateData.rateBy}
                              onChange={(e) =>
                                onRateChange("rateBy", e.target.value)
                              }
                            >
                              <option value="">Select</option>
                              {raters &&
                                raters.map((rater) => (
                                  <option key={rater.id} value={rater.name}>
                                    {rater.name}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            r.rater?.name
                          )}
                        </td>
                        <td>
                          {editingRateId === r.id ? (
                            <>
                            <div className="edit-btns-div">
                              <Button
                                size="sm"
                                variant="outline"
                                className="edit-save-btn"
                                onClick={onSaveRate}
                                disabled={savingRate}
                              >
                                <i className="fa-solid fa-check" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                className="edit-cancel-btn"
                                onClick={() => onCancelRateEdit()}
                                style={{ marginLeft: "0.5rem" }}
                              >
                                <i className="fa-solid fa-xmark" />
                              </Button>
                              </div>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="edit-btn"
                              onClick={() => onStartEditRate(r)}
                            >
                              <i className="fa-solid fa-pen" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="rate-details-row">
                  No rates found for this item.
                </div>
              )}
            </div>
          </>
        )}

        <div className="rate-details-actions">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}


