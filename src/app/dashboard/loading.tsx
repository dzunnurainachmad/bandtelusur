import { Bone, CardSkeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Profile card skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 p-4 bg-surface rounded-xl border border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Bone className="w-14 h-14 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-40" />
            <Bone className="h-3 w-24" />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Bone className="h-8 w-24 rounded-lg" />
          <Bone className="h-8 w-16 rounded-lg" />
        </div>
      </div>

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Bone className="h-7 w-28" />
          <Bone className="h-8 w-24 rounded-lg" />
        </div>
        <Bone className="h-9 w-36 rounded-lg" />
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
