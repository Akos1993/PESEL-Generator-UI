export function GovSection({ children, className = "" }) {
  return (
    <section className={`space-y-6 ${className}`}>
      {children}
    </section>
  );
}
