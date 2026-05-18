import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, FileText, Receipt, Package, Store, BookOpen } from 'lucide-react';

const links = [
  { to: '/',            label: 'Rates',       Icon: BarChart3, end: true },
  { to: '/inventory',   label: 'Inventory',   Icon: Package },
  { to: '/stores',      label: 'Stores',      Icon: Store },
  { to: '/quotations',  label: 'Quotations',  Icon: FileText },
  { to: '/fbr',         label: 'FBR Invoice', Icon: Receipt },
  { to: '/accounting',  label: 'Accounting',  Icon: BookOpen },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-slate-900 flex flex-col">
        {/* Brand */}
        <div className="px-5 py-6 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-900/40 flex-shrink-0">
              U
            </div>
            <div>
              <div className="text-white font-semibold text-sm leading-tight">USSC</div>
              <div className="text-slate-400 text-xs leading-tight">Rate Manager</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {links.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <Icon size={16} className="flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-700/60">
          <p className="text-slate-500 text-xs">Universal Scientific</p>
          <p className="text-slate-600 text-xs">Supply Company</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
