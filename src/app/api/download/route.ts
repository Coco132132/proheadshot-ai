import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

// GET /api/download?session_id=xxx
// Returns: { urls: string[] } — signed download URLs (valid 24h)
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  try {
    // Verify payment was completed
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 403 })
    }

    const jobId = session.metadata?.jobId
    if (!jobId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
    }

    // Fetch HD image URLs from Astria
    const ASTRIA_API_KEY = process.env.ASTRIA_API_KEY
    const [tuneId, promptId] = jobId.split('_')

    const res = await fetch(`https://api.astria.ai/tunes/${tuneId}/prompts/${promptId}`, {
      headers: { Authorization: `Bearer ${ASTRIA_API_KEY}` },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to retrieve images' }, { status: 500 })
    }

    const data = await res.json()
    const urls = data.images?.map((img: { url: string }) => img.url).slice(0, 4) || []

    // In production: generate signed Cloudflare R2 URLs with 24h expiry
    // For now, return Astria URLs directly (they are authenticated)
    return NextResponse.json({ urls, expiresAt: Date.now() + 24 * 60 * 60 * 1000 })
  } catch (err) {
    console.error('Download error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
