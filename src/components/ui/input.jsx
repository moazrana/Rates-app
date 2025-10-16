export function Input({ type = "text", name, value, onChange, placeholder = "", className = "" }) {
    return (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input ${className}`}
      />
    );
  }
  