export function GovHeader({ children, className = "" }) {
  return (
    <div className={`border-t-4 border-red-700 px-4 md:px-6 py-5 ${className}`}>
      {children}
    </div>
  );
}
