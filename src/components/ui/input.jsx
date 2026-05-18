export function Input({ type = 'text', name, value, onChange, placeholder = '', className = '', disabled, accept, required }) {
  if (type === 'file') {
    return (
      <input
        type="file"
        name={name}
        onChange={onChange}
        disabled={disabled}
        accept={accept}
        required={required}
        className={`ui-input-file ${className}`}
      />
    );
  }

  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      accept={accept}
      required={required}
      className={`w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 placeholder-slate-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${className}`}
    />
  );
}
