export default function CoursesLoading() {
  return <div className="mx-auto max-w-7xl space-y-8 px-4 py-16 sm:px-6 lg:px-8" aria-label="Loading courses"><div className="h-12 w-2/3 animate-pulse rounded-lg bg-secondary" /><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-96 animate-pulse rounded-2xl bg-secondary" />)}</div></div>;
}
