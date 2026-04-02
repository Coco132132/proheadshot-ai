import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

// POST /api/webhook — Stripe webhook handler
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const jobId = session.metadata?.jobId

    if (jobId) {
      // In production: mark job as paid in Cloudflare KV
      // KV.put(`paid:${jobId}`, 'true', { expirationTtl: 86400 })
      console.log(`Payment completed for jobId: ${jobId}`)
    }
  }

  return NextResponse.json({ received: true })
}
