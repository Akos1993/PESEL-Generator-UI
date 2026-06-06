export function GovButton({ children, variant = "primary", className = "", ...props }) {
  const baseStyles = "font-bold py-3 px-5 rounded uppercase tracking-wide text-xs flex items-center justify-center gap-3 transition-colors disabled:opacity-50";
  const variants = {
    primary: "bg-red-700 text-white hover:bg-red-800",
    secondary: "border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900",
    danger: "bg-red-700 text-white hover:bg-red-800"
  };

  return (
    <button
      {...props}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
