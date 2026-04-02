import { NextRequest, NextResponse } from 'next/server'

// POST /api/paypal/webhook
// Handles PayPal IPN/Webhook events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const eventType = body.event_type

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = body.resource
      const orderId = resource.supplementary_data?.related_ids?.order_id
      const customId = resource.custom_id // jobId stored here

      if (customId) {
        // In production: mark job as paid in Cloudflare KV
        // await KV.put(`paid:${customId}`, orderId, { expirationTtl: 86400 })
        console.log(`PayPal payment completed — jobId: ${customId}, orderId: ${orderId}`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('PayPal webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
