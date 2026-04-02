import { NextRequest, NextResponse } from 'next/server'

// GET /api/download?order_id=xxx&job_id=xxx
// Verifies PayPal payment and returns HD download URLs
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('order_id')
  const jobId = req.nextUrl.searchParams.get('job_id')

  if (!orderId || !jobId) {
    return NextResponse.json({ error: 'Missing order_id or job_id' }, { status: 400 })
  }

  try {
    // Verify order with PayPal
    const accessToken = await getPayPalAccessToken()

    const orderRes = await fetch(`${getPayPalBase()}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!orderRes.ok) {
      return NextResponse.json({ error: 'Could not verify payment' }, { status: 403 })
    }

    const order = await orderRes.json()

    if (order.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 403 })
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

    return NextResponse.json({
      urls,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    })
  } catch (err) {
    console.error('Download error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// --- PayPal helpers ---

function getPayPalBase() {
  return process.env.PAYPAL_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(`${getPayPalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    throw new Error('Failed to get PayPal access token')
  }

  const data = await res.json()
  return data.access_token
}
