import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

// 9 demo images: 3 styles × 3 variations each
const DEMO_IMAGES = {
  professional: [
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=600&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=600&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop&crop=faces',
  ],
  clean: [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=600&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=600&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=600&fit=crop&crop=faces',
  ],
  corporate: [
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=600&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=600&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=600&fit=crop&crop=faces',
  ],
}

// Auto-select best photo (index 0 by default — can be ML-ranked later)
const DEFAULT_SELECTION = { professional: 0, clean: 0, corporate: 0 }

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kv = (getRequestContext().env as any).JOBS

    if (!kv) {
      return NextResponse.json({ error: 'Storage not available' }, { status: 500 })
    }

    const formData = await request.formData()
    // Accept either 'photo' (single) or 'photos' (multiple)
    const photo = formData.get('photo') as File | null
    const photos = formData.getAll('photos') as File[]
    const allPhotos = photos.length > 0 ? photos : (photo ? [photo] : [])

    if (allPhotos.length === 0) {
      return NextResponse.json({ error: 'No photo uploaded' }, { status: 400 })
    }

    for (const f of allPhotos) {
      if (!['image/jpeg', 'image/png'].includes(f.type)) {
        return NextResponse.json({ error: 'Invalid file type. Use JPG or PNG.' }, { status: 400 })
      }
      if (f.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large. Max 10MB per photo.' }, { status: 400 })
      }
    }

    const jobId = crypto.randomUUID()

    const jobData = {
      status: 'complete',
      images: DEMO_IMAGES,           // 9 images in 3 groups
      selection: DEFAULT_SELECTION,  // which index is auto-selected per group
      paid: false,
      paidTier: null,                // 'basic' ($9.9) or 'full' ($14.9)
      createdAt: Date.now(),
    }

    await kv.put(jobId, JSON.stringify(jobData), { expirationTtl: 86400 })

    return NextResponse.json({ jobId })
  } catch (err) {
    console.error('Generate error:', err)
    return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 })
  }
}
