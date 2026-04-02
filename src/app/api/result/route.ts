import { NextRequest, NextResponse } from 'next/server'

// GET /api/result?jobId=xxx
// Returns: { images: string[], jobId: string, status: string }
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })
  }

  const ASTRIA_API_KEY = process.env.ASTRIA_API_KEY
  if (!ASTRIA_API_KEY) {
    return NextResponse.json({ error: 'API not configured' }, { status: 500 })
  }

  try {
    // Parse tuneId and promptId from jobId
    const [tuneId, promptId] = jobId.split('_')

    const res = await fetch(`https://api.astria.ai/tunes/${tuneId}/prompts/${promptId}`, {
      headers: { Authorization: `Bearer ${ASTRIA_API_KEY}` },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
    }

    const data = await res.json()

    if (data.status === 'pending' || data.status === 'processing') {
      return NextResponse.json({ status: 'pending', jobId })
    }

    if (!data.images || data.images.length === 0) {
      return NextResponse.json({ error: 'No images generated' }, { status: 500 })
    }

    // Return low-res URLs for preview (watermark added client-side)
    // In production: resize images to 400px before returning
    const images = data.images.map((img: { url: string }) => img.url)

    return NextResponse.json({
      jobId,
      status: 'complete',
      images: images.slice(0, 4),
    })
  } catch (err) {
    console.error('Result fetch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
