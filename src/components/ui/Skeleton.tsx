export function Bone({ className }: { className?: string }) {
  return <div className={`bg-stone-300 dark:bg-stone-700 rounded-lg animate-pulse ${className ?? ''}`} />
}

export function FormFieldSkeleton({ label = true, tall = false }: { label?: boolean; tall?: boolean }) {
  return (
    <div>
      {label && <Bone className="h-4 w-28 mb-1.5" />}
      <Bone className={tall ? 'h-20 w-full' : 'h-9 w-full'} />
    </div>
  )
}

export function FormSkeleton({ variant = 'submit' }: { variant?: 'submit' | 'edit' }) {
  return (
    <div className="space-y-5 bg-surface border border-stone-300 dark:border-stone-700 rounded-2xl p-4 sm:p-6">
      {/* Fill from URL — submit only */}
      {variant === 'submit' && (
        <div className="border border-dashed border-stone-300 dark:border-stone-700 rounded-xl p-4 space-y-2">
          <Bone className="h-4 w-40" />
          <Bone className="h-3 w-full" />
          <div className="flex gap-2">
            <Bone className="h-9 flex-1" />
            <Bone className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      )}

      {/* Photo area */}
      <div>
        <Bone className="h-4 w-20 mb-2" />
        <Bone className="aspect-video w-full rounded-xl" />
      </div>

      {/* Name */}
      <FormFieldSkeleton />

      {/* Bio */}
      <div>
        <div className="flex justify-between mb-1">
          <Bone className="h-4 w-28" />
          <Bone className="h-4 w-32" />
        </div>
        <Bone className="h-20 w-full" />
      </div>

      {/* Formed year */}
      <FormFieldSkeleton />

      {/* Province + City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormFieldSkeleton />
        <FormFieldSkeleton />
      </div>

      {/* Genres */}
      <div>
        <Bone className="h-4 w-16 mb-2" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Bone key={i} className="h-7 w-16 rounded-full" />
          ))}
        </div>
      </div>

      {/* WhatsApp */}
      <div>
        <Bone className="h-4 w-32 mb-1.5" />
        <div className="flex">
          <Bone className="h-9 w-14 rounded-r-none rounded-l-lg" />
          <Bone className="h-9 flex-1 rounded-l-none rounded-r-lg" />
        </div>
      </div>

      {/* Email */}
      <FormFieldSkeleton />

      {/* Social links grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <FormFieldSkeleton key={i} />
        ))}
      </div>

      {/* Checkbox */}
      <div className="flex items-center gap-3">
        <Bone className="h-4 w-4 rounded" />
        <Bone className="h-4 w-64" />
      </div>

      {/* Submit button(s) */}
      {variant === 'edit' ? (
        <>
          <div className="flex gap-3">
            <Bone className="h-10 flex-1 rounded-lg" />
            <Bone className="h-10 flex-1 rounded-lg" />
          </div>
          <div className="pt-4 border-t border-stone-300 dark:border-stone-700 flex justify-end">
            <Bone className="h-8 w-32 rounded-lg" />
          </div>
        </>
      ) : (
        <Bone className="h-10 w-full rounded-lg" />
      )}
    </div>
  )
}

export function PostCardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-stone-300 dark:border-stone-700 p-4 sm:p-5 space-y-3">
      {/* Badge + action */}
      <div className="flex items-start justify-between">
        <Bone className="h-5 w-16 rounded-full" />
        <Bone className="h-6 w-6 rounded-lg" />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Bone className="h-5 w-3/4" />
        <Bone className="h-5 w-1/2" />
      </div>

      {/* Body */}
      <div className="space-y-1.5">
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-5/6" />
        <Bone className="h-4 w-2/3" />
      </div>

      {/* Gig details */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-2">
          <Bone className="h-3.5 w-3.5 rounded shrink-0" />
          <Bone className="h-4 w-56" />
        </div>
        <div className="flex items-center gap-2">
          <Bone className="h-3.5 w-3.5 rounded shrink-0" />
          <Bone className="h-4 w-40" />
        </div>
      </div>

      {/* Band chips */}
      <div className="flex gap-1.5 pt-0.5">
        <Bone className="h-6 w-20 rounded-full" />
        <Bone className="h-6 w-24 rounded-full" />
        <Bone className="h-6 w-16 rounded-full" />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-1 border-t border-stone-100 dark:border-stone-800">
        <Bone className="w-5 h-5 rounded-full shrink-0" />
        <Bone className="h-3.5 w-28" />
        <Bone className="h-3.5 w-16 ml-auto" />
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-stone-300 dark:border-stone-700 overflow-hidden flex flex-col h-full">

      {/* ── Mobile: horizontal list row ── */}
      <div className="flex sm:hidden items-center gap-4 p-4">
        {/* Thumbnail */}
        <Bone className="w-14 h-14 shrink-0 rounded-xl" />

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <Bone className="h-4 w-2/3" />
          <Bone className="h-3 w-1/3" />
          <div className="flex gap-1 pt-0.5">
            <Bone className="h-4 w-12 rounded-full" />
            <Bone className="h-4 w-12 rounded-full" />
          </div>
        </div>

        {/* Chevron */}
        <Bone className="w-4 h-4 shrink-0 rounded" />
      </div>

      {/* ── Desktop: card layout ── */}
      <div className="hidden sm:flex flex-col flex-1">
        <Bone className="aspect-video rounded-none" />
        <div className="p-4 flex flex-col flex-1 space-y-3">
          <Bone className="h-5 w-3/4" />
          <Bone className="h-4 w-1/2" />
          <Bone className="h-4 w-full" />
          <div className="flex gap-1.5 pt-1">
            <Bone className="h-6 w-16 rounded-full" />
            <Bone className="h-6 w-16 rounded-full" />
          </div>
          <div className="flex gap-2 pt-2 mt-auto">
            <Bone className="h-8 flex-1 rounded-lg" />
            <Bone className="h-8 flex-1 rounded-lg" />
          </div>
        </div>
      </div>

    </div>
  )
}
