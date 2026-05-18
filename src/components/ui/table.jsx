import DataTable from 'react-data-table-component';

const customStyles = {
  headRow: {
    style: {
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      borderRadius: '0.5rem 0.5rem 0 0',
      minHeight: '2.5rem',
    },
  },
  headCells: {
    style: {
      fontSize: '0.6875rem',
      fontWeight: '600',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      paddingLeft: '1rem',
      paddingRight: '1rem',
    },
  },
  rows: {
    style: {
      fontSize: '0.875rem',
      color: '#1e293b',
      cursor: 'pointer',
      borderBottom: '1px solid #f1f5f9',
      minHeight: '2.75rem',
      transition: 'background 0.1s',
    },
    highlightOnHoverStyle: {
      backgroundColor: '#eff6ff',
      borderBottomColor: '#dbeafe',
      outline: 'none',
    },
  },
  cells: {
    style: {
      paddingLeft: '1rem',
      paddingRight: '1rem',
      paddingTop: '0.5rem',
      paddingBottom: '0.5rem',
    },
  },
  pagination: {
    style: {
      fontSize: '0.8125rem',
      color: '#64748b',
      borderTop: '1px solid #e2e8f0',
      backgroundColor: '#f8fafc',
      borderRadius: '0 0 0.5rem 0.5rem',
    },
  },
  noData: {
    style: {
      padding: '3rem',
      color: '#94a3b8',
      fontSize: '0.875rem',
    },
  },
};

export default function RateTrackerTable({ items, loading, onRowClick }) {
  const columns = [
    { name: 'Item',          selector: r => r.name,          cell: r => <span title={r.name}>{r.name}</span>,          sortable: true },
    { name: 'Company',       selector: r => r.company,       cell: r => <span title={r.company}>{r.company}</span>,       sortable: true },
    { name: 'Packing',       selector: r => r.packing,       cell: r => <span title={r.packing}>{r.packing}</span>,       sortable: true },
    { name: 'Specification', selector: r => r.specification, cell: r => <span title={r.specification}>{r.specification}</span>, sortable: true },
    {
      name: 'Rate',
      selector: r => r.rate,
      cell: r => <span className="font-semibold text-slate-900 font-mono">{r.rate}</span>,
      sortable: true,
    },
    { name: 'Date',    selector: r => r.date,   cell: r => <span className="text-slate-500 text-xs">{r.date}</span>,   sortable: true },
    { name: 'Rate By', selector: r => r.rateBy, cell: r => <span className="text-slate-500">{r.rateBy}</span>, sortable: true },
  ];

  return (
    <DataTable
      columns={columns}
      data={items}
      pagination
      highlightOnHover
      pointerOnHover
      progressPending={loading}
      onRowClicked={onRowClick}
      customStyles={customStyles}
      noDataComponent={
        <div className="py-12 text-center text-slate-400 text-sm">No rates found</div>
      }
    />
  );
}
