export default function AdminLoading() {
  return (
    <div className="min-h-[40vh] flex flex-col gap-4 p-6" aria-busy>
      <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
      <div className="h-32 rounded-lg border border-border bg-muted/30 animate-pulse" />
    </div>
  );
}
