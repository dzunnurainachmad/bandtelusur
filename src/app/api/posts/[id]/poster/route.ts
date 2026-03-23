import { ImageResponse } from 'next/og'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Post } from '@/types'
import React from 'react'

export const runtime = 'nodejs'

function formatDate(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
  return `${date} · ${time}`
}

const e = React.createElement

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: post } = await supabaseAdmin
    .from('posts_view')
    .select('*')
    .eq('id', id)
    .single()

  if (!post) return new Response('Not found', { status: 404 })

  const { data: tags } = await supabaseAdmin
    .from('post_band_tags')
    .select('bands(name)')
    .eq('post_id', id)

  const bandNames: string[] = (tags ?? [])
    .map((t: unknown) => {
      const row = t as { bands: { name: string } | { name: string }[] | null }
      const b = Array.isArray(row.bands) ? row.bands[0] : row.bands
      return b?.name ?? ''
    })
    .filter(Boolean)

  const [fontBold, fontRegular] = await Promise.all([
    fetch('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-700-normal.woff').then(
      (r) => r.arrayBuffer()
    ),
    fetch('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-400-normal.woff').then(
      (r) => r.arrayBuffer()
    ),
  ])

  const p = post as Post
  const title = p.title
  const titleSize = title.length > 50 ? 48 : title.length > 30 ? 60 : 72
  const bodyPreview = p.body ? p.body.slice(0, 140) + (p.body.length > 140 ? '...' : '') : null
  const bandsLine = bandNames.join('  ·  ')

  const detailRow = (label: string, value: string) =>
    e('div', { style: { display: 'flex', gap: 16, alignItems: 'baseline' } },
      e('span', { style: { color: '#78716c', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', width: 90 } }, label),
      e('span', { style: { color: '#d6d3d1', fontSize: 22, fontWeight: 400 } }, value)
    )

  const tree = e('div', {
    style: {
      width: '100%',
      height: '100%',
      background: 'linear-gradient(150deg, #1c1917 0%, #0c0a09 55%, #231d15 100%)',
      display: 'flex',
      flexDirection: 'column',
      padding: '64px',
      fontFamily: 'Inter',
    },
  },
    // Top bar
    e('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 },
    },
      e('span', {
        style: {
          background: '#b45309',
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          padding: '7px 18px',
          borderRadius: 100,
          letterSpacing: '0.14em',
        },
      }, 'GIGS'),
      e('span', { style: { color: '#d97706', fontSize: 17, fontWeight: 700 } }, 'BandTelusur')
    ),
    // Title
    e('div', {
      style: { color: '#fafaf9', fontSize: titleSize, fontWeight: 700, lineHeight: 1.15, marginBottom: 28 },
    }, title),
    // Band names
    bandsLine
      ? e('div', { style: { color: '#fbbf24', fontSize: 26, fontWeight: 700, marginBottom: 24, letterSpacing: '0.02em' } }, bandsLine)
      : null,
    // Body preview
    bodyPreview
      ? e('div', { style: { color: '#57534e', fontSize: 19, lineHeight: 1.6, fontWeight: 400 } }, bodyPreview)
      : null,
    // Spacer
    e('div', { style: { flex: 1 } }),
    // Divider
    e('div', { style: { width: '100%', height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 36 } }),
    // Details
    e('div', { style: { display: 'flex', flexDirection: 'column', gap: 16 } },
      p.event_date ? detailRow('TANGGAL', formatDate(p.event_date)) : null,
      p.location   ? detailRow('LOKASI',  p.location)                 : null,
      p.ticket_price ? detailRow('TIKET', p.ticket_price)             : null,
    )
  )

  return new ImageResponse(tree, {
    width: 1080,
    height: 1080,
    fonts: [
      { name: 'Inter', data: fontBold,    weight: 700, style: 'normal' },
      { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
    ],
  })
}
