export default function BuilderLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" aria-busy>
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
