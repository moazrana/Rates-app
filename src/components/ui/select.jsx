export default function Select({ options, onChange, value, placeholder, disabled, className = '' }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${className}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt, i) => (
        <option key={i} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
