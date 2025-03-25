import './table.css';
export function Table({ children, className = "" }) {
    return (
      <table className={`table w-full border-collapse border border-gray-300 ${className}`}>
        {children}
      </table>
    );
  }
  
  export function TableHead({ children }) {
    return <thead className="bg-gray-200">{children}</thead>;
  }
  
  export function TableRow({ children }) {
    return <tr className="border-b border-gray-300">{children}</tr>;
  }
  
  export function TableHeader({ children }) {
    return <th className="p-2 text-left font-semibold border border-gray-300">{children}</th>;
  }
  
  export function TableBody({ children }) {
    return <tbody>{children}</tbody>;
  }
  
  export function TableCell({ children }) {
    return <td className="p-2 border border-gray-300">{children}</td>;
  }
  