export function CardTitle({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="mb-5 text-lg font-bold tracking-tight">
      {children}
    </h2>
  );
}
