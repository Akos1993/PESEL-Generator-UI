export function GovInput({ label, className = "", ...props }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
        {label}
      </label>
      <input
        {...props}
        className="w-full px-4 py-3 rounded border outline-none transition-all focus:ring-2 focus:ring-red-700/20 focus:border-red-700 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-950 dark:text-white"
      />
    </div>
  );
}
