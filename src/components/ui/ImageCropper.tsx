'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Check } from 'lucide-react'

interface Props {
  src: string
  onConfirm: (file: File) => void
  onCancel: () => void
  square?: boolean
}

export function ImageCropper({ src, onConfirm, onCancel, square = false }: Props) {
  const elRef = useRef<HTMLDivElement>(null)
  const [, setTick] = useState(0)
  const rerender = () => setTick(t => t + 1)

  // Single ref for ALL mutable state — no stale closures possible
  const $ = useRef({
    imgW: 0, imgH: 0,
    scale: 1, ox: 0, oy: 0,
    dragging: false, lastX: 0, lastY: 0,
    pinchDist: 0, pinchCX: 0, pinchCY: 0,
    ready: false,
  })

  // ── Helpers: always read container size from DOM ──────────────────────
  function containerW() { return elRef.current?.offsetWidth ?? 0 }
  function containerH() { return square ? containerW() : (elRef.current?.offsetHeight ?? 0) }

  function getMinScale() {
    const w = containerW(), h = containerH(), { imgW, imgH } = $.current
    return (!w || !imgW) ? 1 : Math.max(w / imgW, h / imgH)
  }

  function clampOffset(x: number, y: number, s: number) {
    const { imgW, imgH } = $.current
    return {
      x: Math.min(0, Math.max(containerW() - imgW * s, x)),
      y: Math.min(0, Math.max(containerH() - imgH * s, y)),
    }
  }

  // ── Core actions ─────────────────────────────────────────────────────
  function doZoom(factor: number, pivotX: number, pivotY: number) {
    const c = $.current
    const ns = Math.max(getMinScale(), Math.min(5, c.scale * factor))
    const ratio = ns / c.scale
    const cl = clampOffset(
      pivotX - (pivotX - c.ox) * ratio,
      pivotY - (pivotY - c.oy) * ratio,
      ns,
    )
    c.scale = ns
    c.ox = cl.x
    c.oy = cl.y
    rerender()
  }

  function doPan(dx: number, dy: number) {
    const c = $.current
    const cl = clampOffset(c.ox + dx, c.oy + dy, c.scale)
    c.ox = cl.x
    c.oy = cl.y
    rerender()
  }

  function initialize() {
    const c = $.current
    if (c.ready) return
    const w = containerW(), h = containerH()
    if (!w || !h || !c.imgW) return
    c.ready = true
    c.scale = Math.max(w / c.imgW, h / c.imgH)
    c.ox = (w - c.imgW * c.scale) / 2
    c.oy = (h - c.imgH * c.scale) / 2
    rerender()
  }

  // ── Effects ──────────────────────────────────────────────────────────

  // Load natural image dimensions
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      $.current.imgW = img.naturalWidth
      $.current.imgH = img.naturalHeight
      initialize()
    }
    img.src = src
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  // Init fallback (container not laid out when image loaded) + re-clamp on resize
  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const c = $.current
      if (!c.ready) { initialize(); return }
      const ms = getMinScale()
      if (c.scale < ms) c.scale = ms
      const cl = clampOffset(c.ox, c.oy, c.scale)
      c.ox = cl.x
      c.oy = cl.y
      rerender()
    })
    ro.observe(el)
    return () => ro.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Wheel + touch — native listeners required for passive: false
  useEffect(() => {
    const el = elRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      doZoom(e.deltaY > 0 ? 0.97 : 1.03, e.clientX - r.left, e.clientY - r.top)
    }

    const onTouchStart = (e: TouchEvent) => {
      const c = $.current
      if (e.touches.length === 1) {
        c.dragging = true
        c.lastX = e.touches[0].clientX
        c.lastY = e.touches[0].clientY
        c.pinchDist = 0
      } else if (e.touches.length === 2) {
        c.dragging = false
        c.pinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        )
        c.pinchCX = (e.touches[0].clientX + e.touches[1].clientX) / 2
        c.pinchCY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const c = $.current
      if (e.touches.length === 1 && c.dragging) {
        const dx = e.touches[0].clientX - c.lastX
        const dy = e.touches[0].clientY - c.lastY
        c.lastX = e.touches[0].clientX
        c.lastY = e.touches[0].clientY
        doPan(dx, dy)
      } else if (e.touches.length === 2 && c.pinchDist > 0) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        )
        const ncx = (e.touches[0].clientX + e.touches[1].clientX) / 2
        const ncy = (e.touches[0].clientY + e.touches[1].clientY) / 2
        // Apply pan from center movement before zoom
        c.ox += ncx - c.pinchCX
        c.oy += ncy - c.pinchCY
        // Zoom around new pinch center
        const r = el.getBoundingClientRect()
        doZoom(dist / c.pinchDist, ncx - r.left, ncy - r.top)
        c.pinchDist = dist
        c.pinchCX = ncx
        c.pinchCY = ncy
      }
    }

    const onTouchEnd = () => {
      $.current.dragging = false
      $.current.pinchDist = 0
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Mouse handlers (React synthetic — no preventDefault needed) ──────
  const onMouseDown = (e: React.MouseEvent) => {
    $.current.dragging = true
    $.current.lastX = e.clientX
    $.current.lastY = e.clientY
  }
  const onMouseMove = (e: React.MouseEvent) => {
    const c = $.current
    if (!c.dragging) return
    const dx = e.clientX - c.lastX
    const dy = e.clientY - c.lastY
    c.lastX = e.clientX
    c.lastY = e.clientY
    doPan(dx, dy)
  }
  const onMouseUp = () => { $.current.dragging = false }

  // ── Crop + export ────────────────────────────────────────────────────
  async function handleConfirm() {
    const outW = square ? 512 : 1280
    const outH = square ? 512 : 720
    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')!

    const img = new Image()
    img.src = src
    await new Promise<void>(r => { img.onload = () => r() })

    const { scale, ox, oy } = $.current
    const w = containerW(), h = containerH()
    ctx.drawImage(img, -ox / scale, -oy / scale, w / scale, h / scale, 0, 0, outW, outH)

    canvas.toBlob(blob => {
      if (!blob) return
      onConfirm(new File([blob], 'cropped.webp', { type: 'image/webp' }))
    }, 'image/webp', 0.88)
  }

  // ── Render ───────────────────────────────────────────────────────────
  const { scale, ox, oy, imgW, imgH, ready } = $.current

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-surface rounded-xl sm:rounded-2xl overflow-hidden w-full max-w-2xl shadow-2xl">

        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-700">
          <span className="font-semibold text-sm text-stone-900 dark:text-stone-100">Atur Foto</span>
          <button onClick={onCancel} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={elRef}
          className={`relative w-full ${square ? 'aspect-square' : 'aspect-video'} overflow-hidden bg-black cursor-grab active:cursor-grabbing select-none`}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {ready && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                left: ox,
                top: oy,
                width: imgW * scale,
                height: imgH * scale,
                maxWidth: 'none',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
          )}
        </div>

        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-t border-stone-200 dark:border-stone-700">
          <span className="text-xs text-stone-400 dark:text-stone-500">Scroll untuk zoom · Geser untuk mengatur</span>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-2 bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-800 transition-colors"
          >
            <Check className="w-4 h-4" />
            Gunakan
          </button>
        </div>

      </div>
    </div>
  )
}
