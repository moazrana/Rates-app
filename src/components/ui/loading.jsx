import React from 'react';

export const Loading = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'spinner-sm',
    md: 'spinner-md',
    lg: 'spinner-lg',
    xl: 'spinner-xl'
  };

  return (
    <div className="loading-container">
      <div className={`spinner ${sizeClasses[size]}`}></div>
      {text && <span className="loading-text">{text}</span>}
    </div>
  );
};

export const LoadingOverlay = ({ isLoading, children }) => {
  if (!isLoading) return children;

  return (
    <div className="loading-overlay">
      {children}
      <div className="loading-backdrop">
        <Loading size="lg" text="Loading..." />
      </div>
    </div>
  );
}; 