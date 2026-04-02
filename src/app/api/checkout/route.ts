import { NextRequest, NextResponse } from 'next/server'

// POST /api/checkout
// Body: { jobId }
// Returns: { url } — PayPal order approval URL
export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json()

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const accessToken = await getPayPalAccessToken()

    // Create PayPal order
    const orderRes = await fetch(`${getPayPalBase()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: '9.99',
            },
            description: 'ProHeadshot AI — HD Headshots (4 images, no watermark)',
            custom_id: jobId, // Store jobId for webhook lookup
          },
        ],
        application_context: {
          brand_name: 'ProHeadshot AI',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${baseUrl}/api/paypal/capture?jobId=${jobId}`,
          cancel_url: `${baseUrl}/result?jobId=${jobId}`,
        },
      }),
    })

    if (!orderRes.ok) {
      const err = await orderRes.text()
      console.error('PayPal order error:', err)
      return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 })
    }

    const order = await orderRes.json()

    // Find the approval URL to redirect the user
    const approvalUrl = order.links?.find(
      (link: { rel: string; href: string }) => link.rel === 'approve'
    )?.href

    if (!approvalUrl) {
      return NextResponse.json({ error: 'No approval URL from PayPal' }, { status: 500 })
    }

    return NextResponse.json({ url: approvalUrl, orderId: order.id })
  } catch (err) {
    console.error('Checkout error:', err)
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
