import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kv = (getRequestContext().env as any).JOBS

    if (!kv) {
      return NextResponse.json({ error: 'Storage not available' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })
    }

    const raw = await kv.get(jobId)
    if (!raw) {
      return NextResponse.json({ status: 'pending', images: null })
    }

    return NextResponse.json(JSON.parse(raw))
  } catch (err) {
    console.error('Result error:', err)
    return NextResponse.json({ error: 'Failed to load results.' }, { status: 500 })
  }
}
