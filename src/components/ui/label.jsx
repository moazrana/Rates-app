export function Label({ htmlFor, children, className = '' }) {
  return (
    <label htmlFor={htmlFor} className={`block text-xs font-medium text-slate-600 mb-1.5 ${className}`}>
      {children}
    </label>
  );
}
