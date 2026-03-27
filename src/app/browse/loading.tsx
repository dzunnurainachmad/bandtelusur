import { Bone, CardSkeleton } from '@/components/ui/Skeleton'

export default function BrowseLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <Bone className="h-7 w-40 mb-4 sm:mb-6" />
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Filter sidebar skeleton */}
        <div className="w-full md:w-56 lg:w-64 shrink-0 space-y-4 bg-surface border border-stone-200 dark:border-stone-700 rounded-2xl p-4">
          <Bone className="h-5 w-20" />
          <Bone className="h-9 w-full" />
          <Bone className="h-9 w-full" />
          <Bone className="h-9 w-full" />
          <Bone className="h-px w-full" />
          <Bone className="h-5 w-36" />
          <Bone className="h-9 w-full" />
          <Bone className="h-9 w-full" />
        </div>

        {/* Cards grid skeleton */}
        <div className="flex-1 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
