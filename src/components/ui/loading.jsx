export function Loading({ size = 'md', text = 'Loading...' }) {
  const sizeClass = { sm: 'spinner-sm', md: 'spinner-md', lg: 'spinner-lg', xl: 'spinner-xl' }[size];

  return (
    <div className="flex items-center gap-2.5">
      <div className={`spinner ${sizeClass}`} />
      {text && <span className="text-sm text-slate-500">{text}</span>}
    </div>
  );
}

export function LoadingOverlay({ isLoading, children }) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
          <Loading size="lg" text="Loading..." />
        </div>
      )}
    </div>
  );
}
