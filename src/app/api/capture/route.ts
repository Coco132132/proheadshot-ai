import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'AQsIbmo4Niy5eDz22EXCYVVkyZuKgRs83kDAiWkYfIE8-9RfZ-tKCuCzf8bB_66wpmrHpR47xOc_h9FS'
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || 'ENLhnV8UNx0B0z8NlQUx8guqo4OchLFF1iOerpPCe5-E2msVQu3sUFukZnK2VEY38MnArG5HlPo6Bc84'
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'live'
const PAYPAL_BASE = PAYPAL_MODE === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com'

async function getToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json() as { access_token?: string }
  if (!data.access_token) throw new Error('Failed to get PayPal token')
  return data.access_token
}

export async function POST(request: NextRequest) {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 500 })
    }

    const body = await request.json() as { orderId?: string; jobId?: string; tier?: string }
    const { orderId, jobId, tier } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const token = await getToken()

    const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const capture = await captureRes.json() as { status?: string }

    if (capture.status !== 'COMPLETED') {
      console.error('Capture failed:', capture)
      return NextResponse.json({ error: 'Payment capture failed' }, { status: 400 })
    }

    // Update KV: mark job as paid with tier
    if (jobId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const kv = (getRequestContext().env as any).JOBS
      if (kv) {
        const raw = await kv.get(jobId)
        if (raw) {
          const data = JSON.parse(raw)
          const currentTier = data.paidTier

          // Upgrade logic: basic → full if paying again
          let newTier = tier || 'basic'
          if (currentTier === 'basic' && (tier === 'upgrade' || tier === 'full')) {
            newTier = 'full'
          }

          data.paid = true
          data.paidTier = newTier
          data.orderId = orderId
          await kv.put(jobId, JSON.stringify(data), { expirationTtl: 86400 * 7 })
        }
      }
    }

    return NextResponse.json({ success: true, orderId, tier })
  } catch (err) {
    console.error('Capture error:', err)
    return NextResponse.json({ error: 'Capture failed.' }, { status: 500 })
  }
}
