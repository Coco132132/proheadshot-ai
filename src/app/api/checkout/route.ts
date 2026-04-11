import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const PRICES = {
  basic: '9.90',   // 3 photos
  full:  '14.90',  // 9 photos
  upgrade: '5.00', // upgrade from basic to full
}

// ── PayPal 凭证 ──
// 测试模式: 把 PAYPAL_MODE 改为 'sandbox' 并填入沙盒凭证
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox'  // ← 沙盒测试中

// Live
const LIVE_CLIENT_ID = 'AQsIbmo4Niy5eDz22EXCYVVkyZuKgRs83kDAiWkYfIE8-9RfZ-tKCuCzf8bB_66wpmrHpR47xOc_h9FS'
const LIVE_SECRET    = 'ENLhnV8UNx0B0z8NlQUx8guqo4OchLFF1iOerpPCe5-E2msVQu3sUFukZnK2VEY38MnArG5HlPo6Bc84'

// Sandbox
const SANDBOX_CLIENT_ID = process.env.PAYPAL_SANDBOX_CLIENT_ID || 'AUp0IDgelo6mamPmF4B2dL6UpVtTHcJ0XXUuGwKrezrundT5FcxWLvzmhF0tvqBsI19tB0EpOkPgU2OP'
const SANDBOX_SECRET    = process.env.PAYPAL_SANDBOX_SECRET    || 'ELfh8QNPH_dcE7gwNX4MDR2AtcfyNVwsL9QOZHz0Qu90AjvfMp20R1D6ghix3bmiLtIPfa3VQYb8qM7U'

const PAYPAL_CLIENT_ID = PAYPAL_MODE === 'sandbox' ? SANDBOX_CLIENT_ID : LIVE_CLIENT_ID
const PAYPAL_SECRET    = PAYPAL_MODE === 'sandbox' ? SANDBOX_SECRET    : LIVE_SECRET
const PAYPAL_BASE      = PAYPAL_MODE === 'sandbox'
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

    const body = await request.json() as { jobId?: string; tier?: 'basic' | 'full' | 'upgrade' }
    const jobId = body.jobId
    const tier = body.tier || 'basic'

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })
    }

    const price = PRICES[tier] || PRICES.basic
    const descriptions = {
      basic:   'ProHeadshot AI — Best 3 HD Headshots',
      full:    'ProHeadshot AI — All 9 HD Headshots',
      upgrade: 'ProHeadshot AI — Upgrade to All 9 Photos',
    }

    const token = await getToken()
    const origin = new URL(request.url).origin

    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `${jobId}-${tier}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: price },
          description: descriptions[tier],
          custom_id: `${jobId}:${tier}`,
        }],
        application_context: {
          brand_name: 'ProHeadshot AI',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${origin}/success?jobId=${jobId}&tier=${tier}`,
          cancel_url: `${origin}/result?jobId=${jobId}`,
        },
      }),
    })

    const order = await orderRes.json() as {
      id?: string
      links?: { rel: string; href: string }[]
    }

    if (!order.id) {
      console.error('PayPal order error:', order)
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
    }

    const approveLink = order.links?.find(l => l.rel === 'approve')?.href
    if (!approveLink) {
      return NextResponse.json({ error: 'No payment link returned' }, { status: 500 })
    }

    return NextResponse.json({ url: approveLink, orderId: order.id })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Checkout failed. Please try again.' }, { status: 500 })
  }
}
