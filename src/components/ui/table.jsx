import React from "react";
import DataTable from "react-data-table-component";
import "./table.css";
export default function RateTrackerTable({ items, loading, onRowClick }) {
  const columns = [
    {
      name: "Item",
      selector: (row) => row.name,
      cell: (row) => <span title={row.name}>{row.name}</span>,
      sortable: true,
    },
    {
      name: "Company",
      selector: (row) => row.company,
      cell: (row) => <span title={row.company}>{row.company}</span>,
      sortable: true,
    },
    {
      name: "Packing",
      selector: (row) => row.packing,
      cell: (row) => <span title={row.packing}>{row.packing}</span>,
      sortable: true,
    },
    {
      name: "Specification",
      selector: (row) => row.specification,
      cell: (row) => <span title={row.specification}>{row.specification}</span>,
      sortable: true,
    },
    {
      name: "Rate",
      selector: (row) => row.rate,
      cell: (row) => <span title={String(row.rate)}>{row.rate}</span>,
      sortable: true,
    },
    {
      name: "Date",
      selector: (row) => row.date,
      cell: (row) => <span title={row.date}>{row.date}</span>,
      sortable: true,
    },
    {
      name: "Rate By",
      selector: (row) => row.rateBy,
      cell: (row) => <span title={row.rateBy}>{row.rateBy}</span>,
      sortable: true,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={items}
        pagination
        highlightOnHover
        pointerOnHover
        striped
        progressPending={loading}
        onRowClicked={onRowClick}
      />
    </>
  );
}