import React, { useState } from "react";
import DataTable from "react-data-table-component";

export default function RateTrackerTable({ items }) {
  const columns = [
    {
      name: "Item",
      selector: (row) => row.name,
      sortable: true,
    },
    {
      name: "Company",
      selector: (row) => row.company,
      sortable: true,
    },
    {
      name: "Packing",
      selector: (row) => row.packing,
      sortable: true,
    },
    {
      name: "Specification",
      selector: (row) => row.specification,
      sortable: true,
    },
    {
      name: "Rate",
      selector: (row) => row.rate,
      sortable: true,
    },
    {
      name: "Date",
      selector: (row) => row.date,
      sortable: true,
    },
    {
      name: "Rate By",
      selector: (row) => row.rateBy,
      sortable: true,
    },
  ];

  const [filterText, setFilterText] = useState("");

  const filteredItems = items.filter((item) =>
    Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(filterText.toLowerCase())
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Search..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        className="p-2 border border-gray-300 rounded mb-4"
      />
      <DataTable
        columns={columns}
        data={filteredItems}
        pagination
        highlightOnHover
        striped
      />
    </div>
  );
}