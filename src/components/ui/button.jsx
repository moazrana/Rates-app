export function Button({ children, onClick, className = "", type = "button" }) {
    return (
      <button
        type={type}
        onClick={onClick}
        className={`button ${className}`}
      >
        {children}
      </button>
    );
  }
  