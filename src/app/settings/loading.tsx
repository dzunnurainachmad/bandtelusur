import { Bone } from '@/components/ui/Skeleton'

export default function SettingsLoading() {
  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      {/* Title */}
      <Bone className="h-8 w-48 mb-1" />
      <Bone className="h-4 w-40 mb-8" />

      <div className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <Bone className="w-20 h-20 rounded-full shrink-0" />
          <div className="space-y-1.5">
            <Bone className="h-4 w-24" />
            <Bone className="h-3 w-40" />
          </div>
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <Bone className="h-4 w-20" />
          <Bone className="h-10 w-full rounded-lg" />
        </div>

        {/* Display name */}
        <div className="space-y-1.5">
          <Bone className="h-4 w-28" />
          <Bone className="h-10 w-full rounded-lg" />
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <Bone className="h-4 w-12" />
          <Bone className="h-20 w-full rounded-lg" />
        </div>

        {/* Save button */}
        <Bone className="h-11 w-full rounded-lg" />
      </div>

      {/* Language section */}
      <div className="mt-10 pt-8 border-t border-stone-200 dark:border-stone-800">
        <Bone className="h-6 w-20 mb-4" />
        <Bone className="h-10 w-48 rounded-lg" />
      </div>
    </div>
  )
}
