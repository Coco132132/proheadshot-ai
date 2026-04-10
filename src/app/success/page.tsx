'use client'

export const runtime = 'edge'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface ImageGroups {
  professional: string[]
  clean: string[]
  corporate: string[]
}

interface JobData {
  images: ImageGroups
  selection: { professional: number; clean: number; corporate: number }
  paidTier: 'basic' | 'full' | null
}

const STYLE_LABELS = [
  { key: 'professional' as const, icon: '💼', label: 'Professional' },
  { key: 'clean' as const,        icon: '📄', label: 'Clean' },
  { key: 'corporate' as const,    icon: '🏢', label: 'Corporate' },
]

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const orderId = searchParams.get('token') // PayPal return param
  const jobId = searchParams.get('jobId')
  const tier = searchParams.get('tier') || 'basic'

  const [status, setStatus] = useState<'capturing' | 'done' | 'error'>('capturing')
  const [job, setJob] = useState<JobData | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!orderId || !jobId) { router.push('/'); return }

    const run = async () => {
      try {
        // Capture payment
        const captureRes = await fetch('/api/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, jobId, tier }),
        })
        const captureData = await captureRes.json() as { success?: boolean; error?: string }
        if (!captureData.success) {
          setErrorMsg(captureData.error || 'Payment capture failed')
          setStatus('error')
          return
        }

        // Load job data
        const resultRes = await fetch(`/api/result?jobId=${jobId}`)
        const result = await resultRes.json() as JobData
        setJob(result)
        setStatus('done')
      } catch {
        setErrorMsg('Something went wrong. Please contact support.')
        setStatus('error')
      }
    }
    run()
  }, [orderId, jobId, tier, router])

  const handleDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(url, '_blank')
    }
  }

  // Determine which images to show based on tier
  const getUnlockedImages = () => {
    if (!job) return []
    const effectiveTier = job.paidTier || tier

    if (effectiveTier === 'full' || effectiveTier === 'upgrade') {
      // All 9 images
      return STYLE_LABELS.flatMap(s =>
        job.images[s.key].map((img, idx) => ({
          url: img,
          label: `${s.icon} ${s.label}`,
          filename: `proheadshot-${s.key}-${idx + 1}.jpg`,
          isSelected: idx === job.selection[s.key],
        }))
      )
    } else {
      // Basic: 1 per style (auto-selected)
      return STYLE_LABELS.map(s => ({
        url: job.images[s.key][job.selection[s.key]],
        label: `${s.icon} ${s.label}`,
        filename: `proheadshot-${s.key}.jpg`,
        isSelected: true,
      }))
    }
  }

  if (status === 'capturing') {
    return (
      <main className="min-h-screen bg-[#0F0E0C] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-2 border-[#C9A96E]/20 border-t-[#C9A96E] animate-spin mx-auto mb-6" />
          <p className="text-[#ECD9A8] text-xl font-bold mb-2">Confirming your payment...</p>
          <p className="text-[#6E6860] text-sm">Just a moment</p>
        </div>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen bg-[#0F0E0C] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">😔</div>
          <p className="text-[#B8B0A2] text-lg mb-2">Payment issue</p>
          <p className="text-[#6E6860] text-sm mb-6">{errorMsg}</p>
          <p className="text-[#6E6860] text-xs">
            Need help?{' '}
            <a href="mailto:support@getproheadshot.com" className="text-[#C9A96E] underline">
              support@getproheadshot.com
            </a>
          </p>
        </div>
      </main>
    )
  }

  const unlockedImages = getUnlockedImages()
  const effectiveTier = job?.paidTier || tier
  const isFullTier = effectiveTier === 'full' || effectiveTier === 'upgrade'

  return (
    <main className="min-h-screen bg-[#0F0E0C] text-[#F4EFE6] px-4 py-12">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full bg-[#C9A96E]/[0.05] blur-[120px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full badge-gold text-sm mb-5">
            <span className="text-[#C9A96E]">✓</span>
            Payment confirmed
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {isFullTier ? 'All 9 HD Headshots Ready!' : 'Your 3 HD Headshots Are Ready!'} 🎉
          </h1>
          <p className="text-[#6E6860] text-sm">
            {isFullTier
              ? 'Download all 9 photos — no watermark, full HD.'
              : 'Download your best 3 photos — no watermark, full HD.'}
          </p>
        </div>

        {/* Image grid */}
        <div className={`grid gap-4 mb-8 ${isFullTier ? 'grid-cols-3' : 'grid-cols-3'}`}>
          {unlockedImages.map((img, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="relative rounded-xl overflow-hidden ring-1 ring-[#C9A96E]/30">
                <img
                  src={img.url}
                  alt={img.label}
                  className="w-full aspect-square object-cover object-top"
                />
                {img.isSelected && isFullTier && (
                  <div className="absolute top-1.5 left-1.5 bg-[#C9A96E] text-[#15120A] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    ★ Best
                  </div>
                )}
              </div>
              <p className="text-[#ECD9A8] text-xs font-semibold text-center">{img.label}</p>
              <button
                onClick={() => handleDownload(img.url, img.filename)}
                className="btn-gold py-2 rounded-lg text-xs font-bold text-[#15120A]"
              >
                ⬇ Download
              </button>
            </div>
          ))}
        </div>

        {/* Download all button */}
        <button
          onClick={() => unlockedImages.forEach((img, i) => {
            setTimeout(() => handleDownload(img.url, img.filename), i * 500)
          })}
          className="btn-gold w-full py-4 rounded-xl font-bold text-base mb-6"
        >
          ⬇ Download All {unlockedImages.length} Photos
        </button>

        {/* Upsell if basic */}
        {!isFullTier && jobId && (
          <div
            className="rounded-2xl p-5 text-center mb-8"
            style={{ background: '#1A1710', border: '1px solid rgba(201,169,110,0.2)' }}
          >
            <p className="text-[#ECD9A8] font-semibold mb-1">Want more options?</p>
            <p className="text-[#6E6860] text-sm mb-4">Unlock your remaining 6 photos for just $5</p>
            <button
              onClick={async () => {
                const res = await fetch('/api/checkout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ jobId, tier: 'upgrade' }),
                })
                const data = await res.json() as { url?: string }
                if (data.url) window.location.href = data.url
              }}
              className="btn-gold px-8 py-3 rounded-xl font-bold"
            >
              Unlock remaining 6 photos — $5
            </button>
          </div>
        )}

        {/* Tips */}
        <div className="rounded-2xl p-5 text-left mb-8 text-sm" style={{ background: '#1A1710', border: '1px solid rgba(201,169,110,0.15)' }}>
          <p className="text-[#C9A96E] font-semibold mb-3">💡 Best use for each style</p>
          <ul className="space-y-1.5 text-[#8A8070]">
            <li><span className="text-[#B8B0A2]">💼 Professional</span> — LinkedIn profile, professional networks</li>
            <li><span className="text-[#B8B0A2]">📄 Clean</span> — Resume, job applications</li>
            <li><span className="text-[#B8B0A2]">🏢 Corporate</span> — Company bio, press kit, email signature</li>
          </ul>
        </div>

        {/* Save link reminder */}
        <div className="bg-[#C9A96E]/[0.05] border border-[#C9A96E]/10 rounded-xl px-4 py-3 text-center mb-6">
          <p className="text-[#6E6860] text-xs">
            📌 <span className="text-[#C9A96E]">Save this link</span> to access your photos again within 24 hours
          </p>
        </div>

        <div className="text-center">
          <a href="/" className="text-[#6E6860] hover:text-[#C9A96E] text-sm transition-colors">
            📷 Generate another headshot →
          </a>
        </div>
      </div>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0E0C] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#C9A96E]/20 border-t-[#C9A96E] animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
