import { Bone, PostCardSkeleton } from '@/components/ui/Skeleton'

export default function FeedLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Bone className="h-7 w-16" />
        <Bone className="h-9 w-28 rounded-lg" />
      </div>

      {/* Tab filter */}
      <Bone className="h-10 w-full rounded-lg mb-6" />

      {/* Post cards */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
