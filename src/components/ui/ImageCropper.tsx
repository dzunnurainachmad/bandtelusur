'use client'

import { useEffect, useRef, useState } from 'react'
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react'

interface Props {
  src: string
  onConfirm: (file: File) => void
  onCancel: () => void
}

export function ImageCropper({ src, onConfirm, onCancel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 })
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const dragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const lastTouch = useRef<{ x: number; y: number } | null>(null)
  const lastPinchDist = useRef<number | null>(null)

  // Load natural image size
  useEffect(() => {
    const img = new Image()
    img.onload = () => setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = src
  }, [src])

  // Measure container
  useEffect(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setContainerSize({ w: rect.width, h: rect.height })
  }, [])

  // Set initial scale (cover) + center when both sizes are known
  useEffect(() => {
    if (!imgNatural.w || !containerSize.w) return
    const s = Math.max(containerSize.w / imgNatural.w, containerSize.h / imgNatural.h)
    setScale(s)
    setOffset({
      x: (containerSize.w - imgNatural.w * s) / 2,
      y: (containerSize.h - imgNatural.h * s) / 2,
    })
  }, [imgNatural, containerSize])

  function minScale() {
    if (!imgNatural.w || !containerSize.w) return 1
    return Math.max(containerSize.w / imgNatural.w, containerSize.h / imgNatural.h)
  }

  function clamp(ox: number, oy: number, s: number) {
    const imgW = imgNatural.w * s
    const imgH = imgNatural.h * s
    return {
      x: Math.min(0, Math.max(containerSize.w - imgW, ox)),
      y: Math.min(0, Math.max(containerSize.h - imgH, oy)),
    }
  }

  function applyZoom(factor: number, pivotX = containerSize.w / 2, pivotY = containerSize.h / 2) {
    const newScale = Math.max(minScale(), Math.min(5, scale * factor))
    const ratio = newScale / scale
    const newOffset = clamp(
      pivotX - (pivotX - offset.x) * ratio,
      pivotY - (pivotY - offset.y) * ratio,
      newScale,
    )
    setScale(newScale)
    setOffset(newOffset)
  }

  // Mouse
  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    lastMouse.current = { x: e.clientX, y: e.clientY }
    setOffset((prev) => clamp(prev.x + dx, prev.y + dy, scale))
  }
  function onMouseUp() { dragging.current = false }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    const rect = containerRef.current!.getBoundingClientRect()
    applyZoom(e.deltaY > 0 ? 0.92 : 1.08, e.clientX - rect.left, e.clientY - rect.top)
  }

  // Touch
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      lastPinchDist.current = null
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy)
      lastTouch.current = null
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    e.preventDefault()
    if (e.touches.length === 1 && lastTouch.current) {
      const dx = e.touches[0].clientX - lastTouch.current.x
      const dy = e.touches[0].clientY - lastTouch.current.y
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      setOffset((prev) => clamp(prev.x + dx, prev.y + dy, scale))
    } else if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      applyZoom(dist / lastPinchDist.current)
      lastPinchDist.current = dist
    }
  }

  async function handleConfirm() {
    const OUT_W = 1280
    const OUT_H = 720
    const canvas = document.createElement('canvas')
    canvas.width = OUT_W
    canvas.height = OUT_H
    const ctx = canvas.getContext('2d')!

    const img = new Image()
    img.src = src
    await new Promise<void>((res) => { img.onload = () => res() })

    // Convert container-space offset back to source-image coordinates
    const srcX = -offset.x / scale
    const srcY = -offset.y / scale
    const srcW = containerSize.w / scale
    const srcH = containerSize.h / scale

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUT_W, OUT_H)

    canvas.toBlob((blob) => {
      if (!blob) return
      onConfirm(new File([blob], 'band-photo.webp', { type: 'image/webp' }))
    }, 'image/webp', 0.88)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#fefaf4] dark:bg-[#231d15] rounded-xl sm:rounded-2xl overflow-hidden w-full max-w-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-700">
          <span className="font-semibold text-sm text-stone-900 dark:text-stone-100">Atur Foto</span>
          <button onClick={onCancel} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className="relative w-full aspect-video overflow-hidden bg-black cursor-grab active:cursor-grabbing select-none"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={() => { lastTouch.current = null; lastPinchDist.current = null }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: offset.x,
              top: offset.y,
              width: imgNatural.w * scale,
              height: imgNatural.h * scale,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 border-t border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => applyZoom(0.85)}
              className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyZoom(1.15)}
              className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs text-stone-400 dark:text-stone-500 hidden sm:block">Geser & zoom untuk mengatur</span>
          </div>
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
