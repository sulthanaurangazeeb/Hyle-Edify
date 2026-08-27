export default function DashboardLoading() {
  return <div className="mx-auto max-w-6xl space-y-8 px-4 py-10" aria-label="Loading dashboard"><div className="h-9 w-64 animate-pulse rounded-lg bg-secondary" /><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl bg-secondary" />)}</div></div>;
}
