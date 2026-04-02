import { NextRequest, NextResponse } from 'next/server'

// GET /api/result?jobId=xxx
// Polls Replicate prediction status and returns images when ready
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })
  }

  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN
  if (!REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: 'API not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${jobId}`, {
      headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch result' }, { status: 500 })
    }

    const prediction = await res.json()

    if (prediction.status === 'starting' || prediction.status === 'processing') {
      return NextResponse.json({ status: 'pending', jobId })
    }

    if (prediction.status === 'failed') {
      return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 })
    }

    if (prediction.status === 'succeeded' && prediction.output) {
      return NextResponse.json({
        jobId,
        status: 'complete',
        images: prediction.output.slice(0, 4),
      })
    }

    return NextResponse.json({ status: 'pending', jobId })
  } catch (err) {
    console.error('Result fetch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
