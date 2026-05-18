const variants = {
  primary:   'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 disabled:opacity-50',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm disabled:opacity-50',
  danger:    'bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:opacity-50',
  ghost:     'bg-transparent hover:bg-slate-100 text-slate-600 disabled:opacity-50',
  outline:   'bg-transparent hover:bg-slate-50 text-slate-700 border border-slate-200 disabled:opacity-50',
};

export function Button({ children, onClick, className = '', type = 'button', disabled, variant = 'primary' }) {
  const variantClass = variants[variant] ?? variants.primary;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 cursor-pointer disabled:cursor-not-allowed ${variantClass} ${className}`}
    >
      {children}
    </button>
  );
}
