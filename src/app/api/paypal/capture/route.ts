import { NextRequest, NextResponse } from 'next/server'

// GET /api/paypal/capture?token=xxx&jobId=xxx
// PayPal redirects here after user approves payment
// We capture the payment and redirect to /success
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') // PayPal order ID
  const jobId = req.nextUrl.searchParams.get('jobId')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  if (!token || !jobId) {
    return NextResponse.redirect(`${baseUrl}/?error=missing_params`)
  }

  try {
    const accessToken = await getPayPalAccessToken()

    // Capture the payment
    const captureRes = await fetch(`${getPayPalBase()}/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!captureRes.ok) {
      const err = await captureRes.text()
      console.error('PayPal capture error:', err)
      return NextResponse.redirect(`${baseUrl}/result?jobId=${jobId}&error=payment_failed`)
    }

    const capture = await captureRes.json()

    if (capture.status !== 'COMPLETED') {
      return NextResponse.redirect(`${baseUrl}/result?jobId=${jobId}&error=payment_incomplete`)
    }

    const orderId = capture.id

    // In production: mark jobId as paid in Cloudflare KV
    // await KV.put(`paid:${jobId}`, orderId, { expirationTtl: 86400 })

    // Redirect to success page
    return NextResponse.redirect(`${baseUrl}/success?order_id=${orderId}&job_id=${jobId}`)
  } catch (err) {
    console.error('Capture error:', err)
    return NextResponse.redirect(`${baseUrl}/result?jobId=${jobId}&error=server_error`)
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
