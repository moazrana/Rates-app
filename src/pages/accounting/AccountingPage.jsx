import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import InvoiceTab from './InvoiceTab.jsx';
import JournalEntryTab from './JournalEntryTab.jsx';
import ChartOfAccountsTab from './ChartOfAccountsTab.jsx';
import CustomersTab from './CustomersTab.jsx';
import ReportsTab from './ReportsTab.jsx';

const TABS = [
  { id: 'invoices',   label: 'Invoices',           component: InvoiceTab },
  { id: 'journal',    label: 'Journal Entries',     component: JournalEntryTab },
  { id: 'coa',        label: 'Chart of Accounts',   component: ChartOfAccountsTab },
  { id: 'customers',  label: 'Customers',           component: CustomersTab },
  { id: 'reports',    label: 'Reports',             component: ReportsTab },
];

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState('invoices');

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component ?? InvoiceTab;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <BookOpen size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 leading-tight">Accounting</h1>
            <p className="text-xs text-slate-500 leading-tight">Invoices, journal entries, chart of accounts, and reports</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-0.5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'bg-white border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        <ActiveComponent />
      </div>
    </div>
  );
}
