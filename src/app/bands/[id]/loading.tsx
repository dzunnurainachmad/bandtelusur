import { Bone } from '@/components/ui/Skeleton'

export default function BandDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back + action buttons */}
      <div className="flex items-center justify-between mb-6">
        <Bone className="h-4 w-20" />
        <div className="flex gap-2">
          <Bone className="h-8 w-24 rounded-lg" />
          <Bone className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        <Bone className="aspect-video rounded-none" />

        <div className="p-4 sm:p-6 space-y-5">
          {/* Title + location */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="space-y-2">
              <Bone className="h-8 w-48" />
              <Bone className="h-3 w-24" />
              <Bone className="h-4 w-36" />
              <Bone className="h-4 w-28" />
            </div>
            <div className="flex gap-2">
              <Bone className="h-9 w-24 rounded-lg" />
            </div>
          </div>

          {/* Genre badges */}
          <div className="flex gap-2">
            <Bone className="h-6 w-16 rounded-full" />
            <Bone className="h-6 w-20 rounded-full" />
            <Bone className="h-6 w-14 rounded-full" />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Bone className="h-5 w-20" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-3/4" />
          </div>

          {/* Player */}
          <Bone className="h-52 w-full rounded-xl" />

          {/* Contact */}
          <div className="space-y-2">
            <Bone className="h-5 w-40" />
            <div className="flex gap-2">
              <Bone className="h-10 w-44 rounded-lg" />
              <Bone className="h-10 w-28 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
