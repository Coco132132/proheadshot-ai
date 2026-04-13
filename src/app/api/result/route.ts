import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

const FAL_KEY = process.env.FAL_KEY || '266f703a-7703-4f5a-a858-e9332747db5d:95ef83a0e521739bff4dbe73f2f65522'
const DEFAULT_FAL_POLL_BASE = 'fal-ai/flux/dev/image-to-image'

interface FalRequest {
  style: 'professional' | 'clean' | 'corporate'
  seed: number
  requestId: string
  done: boolean
  imageUrl?: string
  status?: string
  error?: string
  lastCheckedAt?: number
}

interface JobData {
  status: 'pending' | 'complete' | 'error'
  faceImageUrl?: string
  pollBase?: string
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
  updatedAt?: number
  debug?: {
    pollLogs?: Array<Record<string, unknown>>
    returnedImageUrls?: string[]
    [key: string]: unknown
  }
  error?: string
}

// ── Check one fal.ai queue request ──
// Kontext submits to fal-ai/flux-pro/kontext but polls via fal-ai/flux-pro
async function checkRequest(requestId: string, pollBase: string): Promise<{ done: boolean; imageUrl?: string; status?: string; error?: string; raw?: unknown }> {
  const statusRes = await fetch(`https://queue.fal.run/${pollBase}/requests/${requestId}/status`, {
    headers: { 'Authorization': `Key ${FAL_KEY}` },
  })

  if (!statusRes.ok) {
    const errText = await statusRes.text()
    return { done: false, status: 'STATUS_HTTP_ERROR', error: `status ${statusRes.status}: ${errText.slice(0, 300)}` }
  }

  const statusData = await statusRes.json() as { status?: string; logs?: unknown; [key: string]: unknown }
  const currentStatus = statusData.status || 'UNKNOWN'

  if (currentStatus === 'FAILED' || currentStatus === 'ERROR') {
    return { done: true, status: currentStatus, error: JSON.stringify(statusData).slice(0, 500), raw: statusData }
  }

  if (currentStatus !== 'COMPLETED') {
    return { done: false, status: currentStatus, raw: statusData }
  }

  const outputRes = await fetch(`https://queue.fal.run/${pollBase}/requests/${requestId}`, {
    headers: { 'Authorization': `Key ${FAL_KEY}` },
  })

  if (!outputRes.ok) {
    const errText = await outputRes.text()
    return { done: true, status: 'RESULT_HTTP_ERROR', error: `result ${outputRes.status}: ${errText.slice(0, 300)}` }
  }

  const data = await outputRes.json() as {
    images?: { url: string }[]
    image?: { url: string }
    output?: { images?: { url: string }[]; image?: { url: string } }
    detail?: unknown
    error?: unknown
    [key: string]: unknown
  }

  const imageUrl = data.images?.[0]?.url || data.image?.url || data.output?.images?.[0]?.url || data.output?.image?.url

  if (imageUrl) {
    return { done: true, status: currentStatus, imageUrl, raw: data }
  }

  const apiError = data.detail || data.error || data
  return { done: true, status: 'COMPLETED_NO_IMAGE', error: JSON.stringify(apiError).slice(0, 500), raw: data }
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
      const pollBase = job.pollBase || DEFAULT_FAL_POLL_BASE

      if (pendingRequests.length === 0) {
        // All done — shouldn't hit here but handle gracefully
      } else {
        // Check all pending in parallel
        const checks = await Promise.all(
          pendingRequests.map(async (r) => {
            const result = await checkRequest(r.requestId, pollBase)
            return { requestId: r.requestId, ...result }
          })
        )

        if (!job.debug) job.debug = {}
        if (!job.debug.pollLogs) job.debug.pollLogs = []
        if (!job.debug.returnedImageUrls) job.debug.returnedImageUrls = []

        for (const check of checks) {
          const req = job.requests.find(r => r.requestId === check.requestId)
          if (!req) continue

          req.status = check.status
          req.lastCheckedAt = Date.now()
          if (check.error) req.error = check.error

          job.debug.pollLogs.push({
            at: new Date().toISOString(),
            requestId: check.requestId,
            status: check.status,
            error: check.error,
          })

          if (check.done) {
            req.done = true
            if (check.imageUrl) {
              req.imageUrl = check.imageUrl
              job.debug.returnedImageUrls.push(check.imageUrl)
            }
          }
        }
      }

      const allDone = job.requests.every(r => r.done)
      const doneCount = job.requests.filter(r => r.done).length
      const failedCount = job.requests.filter(r => r.done && !r.imageUrl).length

      if (doneCount === 0 && Date.now() - job.createdAt > 2 * 60 * 1000) {
        job.status = 'error'
        job.error = 'Generation did not start successfully. Please try again.'
        job.updatedAt = Date.now()
        await kv.put(jobId, JSON.stringify(job), { expirationTtl: 86400 })
        return NextResponse.json(job)
      }

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
