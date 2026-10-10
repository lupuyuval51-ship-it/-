export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8" aria-busy="true" role="status" aria-label="loading">
      <div className="lu-skeleton h-9 w-64 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="lu-skeleton h-40 rounded-2xl border border-line" />)}
      </div>
    </div>
  );
}
