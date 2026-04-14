import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

const FAL_KEY = process.env.FAL_KEY
const DEFAULT_FAL_POLL_BASE = 'fal-ai/instantid'
const SEEDS = [42, 1337, 7777]
const STYLE_ORDER = ['professional', 'clean', 'corporate'] as const

interface FalRequest {
  style: 'professional' | 'clean' | 'corporate'
  seed: number
  photoIndex?: number
  sourceImageUrl?: string
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
  faceImageUrls?: string[]
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

function ensureFalKey() {
  if (!FAL_KEY) {
    throw new Error('FAL_KEY is not configured')
  }
  return FAL_KEY
}

async function checkRequest(requestId: string, pollBase: string): Promise<{ done: boolean; imageUrl?: string; status?: string; error?: string; raw?: unknown }> {
  const falKey = ensureFalKey()
  const statusRes = await fetch(`https://queue.fal.run/${pollBase}/requests/${requestId}/status`, {
    headers: { 'Authorization': `Key ${falKey}` },
  })

  if (!statusRes.ok) {
    const errText = await statusRes.text()
    return { done: false, status: 'STATUS_HTTP_ERROR', error: `status ${statusRes.status}: ${errText.slice(0, 300)}` }
  }

  const statusData = await statusRes.json() as { status?: string; [key: string]: unknown }
  const currentStatus = statusData.status || 'UNKNOWN'

  if (currentStatus === 'FAILED' || currentStatus === 'ERROR') {
    return { done: true, status: currentStatus, error: JSON.stringify(statusData).slice(0, 500), raw: statusData }
  }

  if (currentStatus !== 'COMPLETED') {
    return { done: false, status: currentStatus, raw: statusData }
  }

  const outputRes = await fetch(`https://queue.fal.run/${pollBase}/requests/${requestId}`, {
    headers: { 'Authorization': `Key ${falKey}` },
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
    ensureFalKey()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kv = (getRequestContext().env as any).JOBS
    if (!kv) return NextResponse.json({ error: 'Storage not available' }, { status: 500 })

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })

    const raw = await kv.get(jobId)
    if (!raw) return NextResponse.json({ status: 'pending', images: null })

    const job = JSON.parse(raw) as JobData

    if (job.status === 'complete' || job.status === 'error') {
      return NextResponse.json(job)
    }

    if (job.status === 'pending' && job.requests) {
      const pendingRequests = job.requests.filter(r => !r.done)
      const pollBase = job.pollBase || DEFAULT_FAL_POLL_BASE

      if (pendingRequests.length > 0) {
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

      const hasStarted = job.requests.some(r => r.status === 'IN_PROGRESS' || r.status === 'COMPLETED' || Boolean(r.imageUrl))

      if (doneCount === 0 && !hasStarted && Date.now() - job.createdAt > 8 * 60 * 1000) {
        job.status = 'error'
        job.error = 'Generation queue is taking too long to start. Please try again.'
        job.updatedAt = Date.now()
        await kv.put(jobId, JSON.stringify(job), { expirationTtl: 86400 })
        return NextResponse.json(job)
      }

      if (allDone) {
        const images: JobData['images'] = {
          professional: [],
          clean: [],
          corporate: [],
        }

        const fallbacks = {
          professional: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=600&fit=crop&crop=faces',
          clean: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=600&fit=crop&crop=faces',
          corporate: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=600&fit=crop&crop=faces',
        }

        for (const style of STYLE_ORDER) {
          const ranked = job.requests
            .filter(r => r.style === style)
            .sort((a, b) => {
              const aHasImage = a.imageUrl ? 1 : 0
              const bHasImage = b.imageUrl ? 1 : 0
              if (aHasImage !== bHasImage) return bHasImage - aHasImage

              const aPhoto = a.photoIndex ?? 999
              const bPhoto = b.photoIndex ?? 999
              if (aPhoto !== bPhoto) return aPhoto - bPhoto

              return SEEDS.indexOf(a.seed) - SEEDS.indexOf(b.seed)
            })

          const picked = ranked.filter(r => r.imageUrl).slice(0, 3).map(r => r.imageUrl as string)
          while (picked.length < 3) picked.push(fallbacks[style])
          images[style] = picked
        }

        job.status = 'complete'
        job.images = images
        job.updatedAt = Date.now()
        await kv.put(jobId, JSON.stringify(job), { expirationTtl: 86400 * 7 })
      } else {
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
    const msg = err instanceof Error ? err.message : 'Failed to load results.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
