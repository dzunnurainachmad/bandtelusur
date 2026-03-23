import { Bone } from '@/components/ui/Skeleton'

export default function NewPostLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Page title */}
      <Bone className="h-7 w-28 mb-6" />

      <div className="bg-[#fefaf4] dark:bg-[#231d15] rounded-2xl border border-stone-200 dark:border-stone-700 p-5 sm:p-6 space-y-5">
        {/* Type selector */}
        <div>
          <Bone className="h-4 w-20 mb-1.5" />
          <div className="flex gap-2">
            <Bone className="h-10 flex-1 rounded-lg" />
            <Bone className="h-10 flex-1 rounded-lg" />
          </div>
        </div>

        {/* Title */}
        <div>
          <Bone className="h-4 w-14 mb-1.5" />
          <Bone className="h-10 w-full rounded-lg" />
        </div>

        {/* Body */}
        <div>
          <Bone className="h-4 w-24 mb-1.5" />
          <Bone className="h-24 w-full rounded-lg" />
        </div>

        {/* Date + Location */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Bone className="h-4 w-32 mb-1.5" />
            <Bone className="h-10 w-full rounded-lg" />
          </div>
          <div>
            <Bone className="h-4 w-16 mb-1.5" />
            <Bone className="h-10 w-full rounded-lg" />
          </div>
        </div>

        {/* Ticket price + Ticket link */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Bone className="h-4 w-24 mb-1.5" />
            <Bone className="h-10 w-full rounded-lg" />
          </div>
          <div>
            <Bone className="h-4 w-28 mb-1.5" />
            <Bone className="h-10 w-full rounded-lg" />
          </div>
        </div>

        {/* Band tag picker */}
        <div>
          <Bone className="h-4 w-20 mb-1.5" />
          <Bone className="h-10 w-full rounded-lg" />
        </div>

        {/* Submit button */}
        <Bone className="h-11 w-full rounded-lg" />
      </div>
    </div>
  )
}
