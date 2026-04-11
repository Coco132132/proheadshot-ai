import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

const FAL_KEY = process.env.FAL_KEY || '266f703a-7703-4f5a-a858-e9332747db5d:95ef83a0e521739bff4dbe73f2f65522'
const FAL_MODEL = 'fal-ai/flux-pro/kontext'

interface FalRequest {
  style: 'professional' | 'clean' | 'corporate'
  seed: number
  requestId: string
  done: boolean
  imageUrl?: string
}

interface JobData {
  status: 'pending' | 'complete' | 'error'
  faceImageUrl?: string
  requests?: FalRequest[]
  images?: {
    professional: string[]
    clean: string[]
    corporate: string[]
  }
  selection: { professional: number; clean: number; corporate: number }
  paid: boolean
  paidTier: 'basic' | 'full' | null
  createdAt: number
  error?: string
}

// ── Check one fal.ai queue request ──
async function checkRequest(requestId: string): Promise<{ done: boolean; imageUrl?: string }> {
  const res = await fetch(`https://queue.fal.run/${FAL_MODEL}/requests/${requestId}`, {
    headers: { 'Authorization': `Key ${FAL_KEY}` },
  })

  if (!res.ok) return { done: false }

  const data = await res.json() as {
    status?: string
    images?: { url: string }[]
    image?: { url: string }
    output?: { images?: { url: string }[] }
  }

  // Kontext / flux-pro: status=COMPLETED with images array
  if (data.status === 'COMPLETED') {
    const imageUrl = data.images?.[0]?.url || data.image?.url || data.output?.images?.[0]?.url
    return { done: true, imageUrl }
  }

  if (data.status === 'FAILED' || data.status === 'ERROR') {
    return { done: true, imageUrl: undefined }
  }

  // Still in queue or processing
  return { done: false }
}

export async function GET(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kv = (getRequestContext().env as any).JOBS
    if (!kv) return NextResponse.json({ error: 'Storage not available' }, { status: 500 })

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })

    const raw = await kv.get(jobId)
    if (!raw) return NextResponse.json({ status: 'pending', images: null })

    const job = JSON.parse(raw) as JobData

    // Already complete or errored → return as-is
    if (job.status === 'complete' || job.status === 'error') {
      return NextResponse.json(job)
    }

    // Still pending → poll fal.ai for updates
    if (job.status === 'pending' && job.requests) {
      const pendingRequests = job.requests.filter(r => !r.done)

      if (pendingRequests.length === 0) {
        // All done — shouldn't hit here but handle gracefully
      } else {
        // Check all pending in parallel
        const checks = await Promise.all(
          pendingRequests.map(async (r) => {
            const result = await checkRequest(r.requestId)
            return { requestId: r.requestId, ...result }
          })
        )

        // Update requests with results
        for (const check of checks) {
          const req = job.requests.find(r => r.requestId === check.requestId)
          if (req && check.done) {
            req.done = true
            if (check.imageUrl) req.imageUrl = check.imageUrl
          }
        }
      }

      // Check if all done
      const allDone = job.requests.every(r => r.done)

      if (allDone) {
        // Organize into style groups (3 per style, ordered by seed)
        const images: JobData['images'] = {
          professional: [],
          clean: [],
          corporate: [],
        }

        const SEEDS = [42, 1337, 7777]

        for (const style of ['professional', 'clean', 'corporate'] as const) {
          for (const seed of SEEDS) {
            const req = job.requests.find(r => r.style === style && r.seed === seed)
            // Fallback to placeholder if generation failed
            const fallbacks = {
              professional: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=600&fit=crop&crop=faces',
              clean: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=600&fit=crop&crop=faces',
              corporate: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=600&fit=crop&crop=faces',
            }
            images[style].push(req?.imageUrl || fallbacks[style])
          }
        }

        job.status = 'complete'
        job.images = images
        await kv.put(jobId, JSON.stringify(job), { expirationTtl: 86400 * 7 })
      } else {
        // Save updated progress
        const doneCount = job.requests.filter(r => r.done).length
        await kv.put(jobId, JSON.stringify(job), { expirationTtl: 86400 })

        return NextResponse.json({
          status: 'pending',
          progress: Math.round((doneCount / job.requests.length) * 100),
          doneCount,
          totalCount: job.requests.length,
        })
      }
    }

    return NextResponse.json(job)
  } catch (err) {
    console.error('Result error:', err)
    return NextResponse.json({ error: 'Failed to load results.' }, { status: 500 })
  }
}
