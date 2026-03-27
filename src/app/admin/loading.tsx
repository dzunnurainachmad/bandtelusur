import { Bone } from '@/components/ui/Skeleton'

export default function AdminLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Bone className="h-7 w-48 mb-6" />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Bone className="h-10 w-28 rounded-lg" />
        <Bone className="h-10 w-28 rounded-lg" />
      </div>

      {/* Search */}
      <Bone className="h-10 w-full mb-4 rounded-lg" />

      {/* Table skeleton */}
      <div className="bg-surface border border-stone-200 dark:border-stone-700 rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="flex gap-4 px-4 py-3 border-b border-stone-200 dark:border-stone-700">
          <Bone className="h-4 w-1/4" />
          <Bone className="h-4 w-1/6" />
          <Bone className="h-4 w-1/6" />
          <Bone className="h-4 w-1/4" />
        </div>
        {/* Data rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-stone-100 dark:border-stone-800 last:border-0">
            <Bone className="h-4 w-1/4" />
            <Bone className="h-4 w-1/6" />
            <Bone className="h-4 w-1/6" />
            <Bone className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
